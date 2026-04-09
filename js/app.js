/* ============================================================
   APP.JS — Hoofdlogica voor de interactieve VR video-applicatie
   ============================================================ */

// Laad config: probeer eerst config.json (gedeeld), dan localStorage (lokaal), dan config.js (standaard)
let _configLoaded = false;

async function _loadSharedConfig() {
    try {
        const resp = await fetch('config.json?t=' + Date.now());
        if (resp.ok) {
            const parsed = await resp.json();
            Object.assign(VR_CONFIG, parsed);
            console.log("Config geladen vanuit config.json (gedeeld)");
            _configLoaded = true;
            return;
        }
    } catch (e) {
        // config.json niet beschikbaar, geen probleem
    }

    // Fallback: localStorage
    const saved = localStorage.getItem("vr_editor_config");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(VR_CONFIG, parsed);
            console.log("Config geladen vanuit editor (localStorage)");
            _configLoaded = true;
        } catch (e) {
            console.warn("Kon editor-config niet laden:", e);
        }
    }
}

// Globale instanties
window.videoManager = new VideoManager();
window.buttonFactory = new ButtonFactory();

/** Start de VR-ervaring */
async function startExperience() {
    // Laad gedeelde config voordat we beginnen
    await _loadSharedConfig();

    const startScreen = document.getElementById("start-screen");
    const vrScene = document.getElementById("vr-scene");

    // Verberg startscherm, toon VR scene
    startScreen.style.display = "none";
    vrScene.style.display = "block";

    // Pas instellingen toe op de scene
    _applySettings();

    // Initialiseer managers
    window.videoManager.init();
    window.buttonFactory.init();

    // Wacht tot A-Frame klaar is en start de eerste video
    const scene = document.getElementById("vr-scene");
    if (scene.hasLoaded) {
        _beginPlayback();
    } else {
        scene.addEventListener("loaded", _beginPlayback);
    }
}

/** Pas project-instellingen toe op de A-Frame scene */
function _applySettings() {
    const s = VR_CONFIG.settings;
    const inputMethod = s.inputMethod || "all";

    // Gaze cursor
    const gazeCursor = document.getElementById("gaze-cursor");
    const gazeEnabled = inputMethod === "all" || inputMethod.includes("gaze");
    if (gazeCursor) {
        if (gazeEnabled) {
            const timeout = s.gazeTimeout || 2000;
            gazeCursor.setAttribute("cursor", `fuse: true; fuseTimeout: ${timeout}; rayOrigin: mouse`);
            gazeCursor.setAttribute("visible", s.showCursorAlways !== false);
            // Update fusing-animatie duur zodat die overeenkomt met gazeTimeout
            gazeCursor.setAttribute("animation__fusing", `property: scale; startEvents: fusing; easing: easeInCubic; dur: ${timeout}; from: 1 1 1; to: 0.1 0.1 0.1`);
        } else {
            gazeCursor.setAttribute("cursor", "fuse: false; rayOrigin: mouse");
            gazeCursor.setAttribute("raycaster", "objects: .clickable; far: 20");
            gazeCursor.setAttribute("visible", false);
        }
    }

    // Controllers (laser-controls)
    const leftHand = document.getElementById("left-hand");
    const rightHand = document.getElementById("right-hand");
    const controllersEnabled = inputMethod === "all" || inputMethod.includes("controllers");
    if (leftHand) leftHand.setAttribute("raycaster", controllersEnabled ? "objects: .clickable; far: 20" : "objects: .nothing");
    if (rightHand) rightHand.setAttribute("raycaster", controllersEnabled ? "objects: .clickable; far: 20" : "objects: .nothing");

    // Hand tracking
    const leftHandTracking = document.getElementById("left-hand-tracking");
    const rightHandTracking = document.getElementById("right-hand-tracking");
    const handsEnabled = inputMethod === "all" || inputMethod.includes("hands");
    if (leftHandTracking) leftHandTracking.setAttribute("raycaster", handsEnabled ? "objects: .clickable; far: 20; lineColor: #4FC3F7; lineOpacity: 0.5" : "objects: .nothing");
    if (rightHandTracking) rightHandTracking.setAttribute("raycaster", handsEnabled ? "objects: .clickable; far: 20; lineColor: #4FC3F7; lineOpacity: 0.5" : "objects: .nothing");

    console.log(`⚙️ Instellingen toegepast: invoer=${inputMethod}, gaze=${gazeEnabled ? s.gazeTimeout + 'ms' : 'uit'}, fade=${s.fadeTransitionMs}ms`);
}

/** Begin met afspelen — toon eerst lobby */
function _beginPlayback() {
    window.buttonFactory.showLobby();
}

// ===== Keyboard shortcuts (voor testen op desktop) =====
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case " ":
            // Spatiebalk: pauzeer/hervat
            const video = window.videoManager;
            if (!video.getCurrentVideoId()) return;
            const el = video.videoElements[video.getCurrentVideoId()];
            if (el.paused) {
                video.resume();
            } else {
                video.pause();
            }
            break;
    }
});

// ===== Log beschikbare video's bij het laden =====
console.log("=== Interactieve VR Video ===");
console.log("Beschikbare video's:", Object.keys(VR_CONFIG.videos).join(", "));
console.log("Startvideo:", VR_CONFIG.settings.startVideo);
