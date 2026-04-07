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
