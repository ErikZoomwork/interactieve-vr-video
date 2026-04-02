/* ============================================================
   VIDEO-MANAGER.JS — Beheert het laden en afspelen van VR video's
   ============================================================ */

class VideoManager {
    constructor() {
        this.currentVideoId = null;
        this.videoElements = {};
        this.videoSphere = null;
        this.isTransitioning = false;
        this._timingInterval = null;
    }

    /** Initialiseer de video manager */
    init() {
        this.videoSphere = document.getElementById("video-sphere");
        this.assetContainer = document.getElementById("asset-container");
        this.fadeSphere = document.getElementById("fade-sphere");
        this._preloadAllVideos();
    }

    /** Maak <video> elementen aan voor alle video's in de config */
    _preloadAllVideos() {
        const videos = VR_CONFIG.videos;
        for (const [id, videoData] of Object.entries(videos)) {
            const videoEl = document.createElement("video");
            videoEl.id = `video-${id}`;
            videoEl.src = videoData.src;
            videoEl.crossOrigin = "anonymous";
            videoEl.preload = videoData.sourceType === "url" ? "metadata" : "auto";
            videoEl.playsInline = true;
            videoEl.setAttribute("webkit-playsinline", "");

            const shouldLoop = videoData.loop !== undefined
                ? videoData.loop
                : VR_CONFIG.settings.loopVideos;
            videoEl.loop = shouldLoop;

            this.assetContainer.appendChild(videoEl);
            this.videoElements[id] = videoEl;
        }
    }

    /** Speel een video af op basis van ID */
    async playVideo(videoId) {
        if (this.isTransitioning) return;
        if (!VR_CONFIG.videos[videoId]) {
            console.error(`Video "${videoId}" niet gevonden in config!`);
            return;
        }

        this.isTransitioning = true;

        // Fade naar zwart
        await this._fadeOut();

        // Stop de huidige video
        if (this.currentVideoId && this.videoElements[this.currentVideoId]) {
            const currentVideo = this.videoElements[this.currentVideoId];
            currentVideo.pause();
            currentVideo.currentTime = 0;
        }

        // Stel de nieuwe video in
        const newVideo = this.videoElements[videoId];
        this.videoSphere.setAttribute("src", `#video-${videoId}`);

        // Stel projectie in (180° of 360°)
        const videoConfig = VR_CONFIG.videos[videoId];
        const projection = videoConfig.projection || "360";
        if (projection === "180") {
            this.videoSphere.setAttribute("half-sphere", "enabled", true);
            this.videoSphere.setAttribute("rotation", "0 180 0");
        } else {
            this.videoSphere.setAttribute("half-sphere", "enabled", false);
            this.videoSphere.setAttribute("rotation", "0 -90 0");
        }

        this.currentVideoId = videoId;

        // Start de video
        try {
            await newVideo.play();
        } catch (err) {
            console.warn("Autoplay geblokkeerd, gebruikersinteractie nodig:", err);
        }

        // Update de buttons
        if (window.buttonFactory) {
            window.buttonFactory.showButtonsForVideo(videoId);
        }

        // Start timing-checker voor buttons
        this._startTimingUpdates(newVideo);

        // Fade terug van zwart
        await this._fadeIn();

        this.isTransitioning = false;
        console.log(`▶ Nu aan het afspelen: ${videoId}`);
    }

    /** Fade het scherm naar zwart */
    _fadeOut() {
        return new Promise((resolve) => {
            const duration = VR_CONFIG.settings.fadeTransitionMs / 2;
            this.fadeSphere.setAttribute("animation", {
                property: "material.opacity",
                to: 1,
                dur: duration,
                easing: "easeInQuad"
            });
            setTimeout(resolve, duration);
        });
    }

    /** Fade het scherm terug van zwart */
    _fadeIn() {
        return new Promise((resolve) => {
            const duration = VR_CONFIG.settings.fadeTransitionMs / 2;
            this.fadeSphere.setAttribute("animation", {
                property: "material.opacity",
                to: 0,
                dur: duration,
                easing: "easeOutQuad"
            });
            setTimeout(resolve, duration);
        });
    }

    /** Start de timing-updates voor button-timing */
    _startTimingUpdates(videoEl) {
        // Stop vorige interval
        if (this._timingInterval) {
            clearInterval(this._timingInterval);
        }

        let videoEnded = false;

        videoEl.addEventListener("ended", () => {
            videoEnded = true;
            if (window.buttonFactory) {
                window.buttonFactory.updateTiming(
                    videoEl.currentTime,
                    videoEl.duration,
                    true
                );
            }
        }, { once: true });

        // Check timing elke 250ms
        this._timingInterval = setInterval(() => {
            if (!window.buttonFactory) return;
            if (videoEl.paused && !videoEnded) return;
            window.buttonFactory.updateTiming(
                videoEl.currentTime,
                videoEl.duration || 0,
                videoEnded
            );
        }, 250);
    }

    /** Pauzeer de huidige video */
    pause() {
        if (this.currentVideoId && this.videoElements[this.currentVideoId]) {
            this.videoElements[this.currentVideoId].pause();
        }
    }

    /** Hervat de huidige video */
    resume() {
        if (this.currentVideoId && this.videoElements[this.currentVideoId]) {
            this.videoElements[this.currentVideoId].play();
        }
    }

    /** Haal het huidige video-ID op */
    getCurrentVideoId() {
        return this.currentVideoId;
    }
}
