/* ============================================================
   APP.JS — Hoofdlogica voor de interactieve VR video-applicatie
   ============================================================ */

// Laad config uit localStorage als beschikbaar (vanuit de editor)
(function loadEditorConfig() {
    const saved = localStorage.getItem("vr_editor_config");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Overschrijf de config met de editor-versie
            Object.assign(VR_CONFIG, parsed);
            console.log("Config geladen vanuit editor (localStorage)");
        } catch (e) {
            console.warn("Kon editor-config niet laden:", e);
        }
    }
})();

// Globale instanties
window.videoManager = new VideoManager();
window.buttonFactory = new ButtonFactory();

/** Start de VR-ervaring */
function startExperience() {
    const startScreen = document.getElementById("start-screen");
    const vrScene = document.getElementById("vr-scene");

    // Verberg startscherm, toon VR scene
    startScreen.style.display = "none";
    vrScene.style.display = "block";

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

/** Begin met afspelen van de startvideo */
function _beginPlayback() {
    const startVideoId = VR_CONFIG.settings.startVideo;
    window.videoManager.playVideo(startVideoId);
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
