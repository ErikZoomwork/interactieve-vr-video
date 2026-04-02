/* ============================================================
   CONFIG.JS — Configuratie voor de interactieve VR video-ervaring
   
   Hier definieer je:
   - Welke video's er zijn
   - Welke buttons bij elke video horen
   - Waar de buttons staan en hoe ze eruitzien
   - Naar welke video elke button navigeert
   ============================================================ */

const VR_CONFIG = {

    // ===== ALGEMENE INSTELLINGEN =====
    settings: {
        // Startvideo (ID van de eerste video die wordt afgespeeld)
        startVideo: "intro",

        // Transitie-effect bij wisselen van video (in milliseconden)
        fadeTransitionMs: 800,

        // Gaze-cursor timeout: hoe lang je moet kijken om te klikken (ms)
        gazeTimeout: 2000,

        // Toon cursor altijd (true) of alleen in VR (false)
        showCursorAlways: true,

        // Automatisch de video herhalen als deze afgelopen is
        loopVideos: true,
    },

    // ===== VIDEO'S EN BUTTONS =====
    // Elke video heeft een uniek ID, een bronbestand, en een lijst buttons
    videos: {

        // ---------- VOORBEELD: Intro Video ----------
        "intro": {
            // Pad naar het videobestand (plaats in de 'videos' map)
            src: "videos/intro.mp4",

            // Optioneel: video loopen (overschrijft de standaardinstelling)
            loop: true,

            // Buttons die zichtbaar zijn tijdens deze video
            buttons: [
                {
                    // Uniek ID voor deze button
                    id: "btn-route-a",

                    // Tekst op de button
                    text: "🏠 Ga naar Route A",

                    // Naar welke video deze button navigeert
                    goTo: "route_a",

                    // Positie in 3D-ruimte (x, y, z) — relatief aan de kijker
                    position: { x: -2, y: 1.2, z: -4 },

                    // Rotatie (optioneel, richt de button naar de kijker)
                    rotation: { x: 0, y: 25, z: 0 },

                    // ===== BUTTON ONTWERP =====
                    style: {
                        // Achtergrondkleur (CSS kleurwaarde)
                        backgroundColor: "#2196F3",

                        // Tekstkleur
                        textColor: "#FFFFFF",

                        // Breedte en hoogte van de button
                        width: 2.5,
                        height: 0.6,

                        // Hoekafronding (0 = vierkant, 0.1 = licht afgerond)
                        borderRadius: 0.08,

                        // Lettergrootte
                        fontSize: 3,

                        // Optioneel: afbeelding als achtergrond (pad naar afbeelding)
                        // backgroundImage: "images/route-a-thumbnail.jpg",

                        // Optioneel: icoon afbeelding links van de tekst
                        // icon: "images/icon-home.png",

                        // Opacity (0 = onzichtbaar, 1 = volledig zichtbaar)
                        opacity: 0.95,

                        // Hover-kleur (als je ernaar kijkt/wijst)
                        hoverColor: "#1565C0",
                    }
                },
                {
                    id: "btn-route-b",
                    text: "🌲 Ga naar Route B",
                    goTo: "route_b",
                    position: { x: 2, y: 1.2, z: -4 },
                    rotation: { x: 0, y: -25, z: 0 },
                    style: {
                        backgroundColor: "#4CAF50",
                        textColor: "#FFFFFF",
                        width: 2.5,
                        height: 0.6,
                        borderRadius: 0.08,
                        fontSize: 3,
                        opacity: 0.95,
                        hoverColor: "#2E7D32",
                    }
                }
            ]
        },

        // ---------- VOORBEELD: Route A ----------
        "route_a": {
            src: "videos/route-a.mp4",
            loop: false,
            buttons: [
                {
                    id: "btn-terug-intro",
                    text: "⬅ Terug naar start",
                    goTo: "intro",
                    position: { x: 0, y: 0.8, z: -4 },
                    rotation: { x: 0, y: 0, z: 0 },
                    style: {
                        backgroundColor: "#FF9800",
                        textColor: "#FFFFFF",
                        width: 2.5,
                        height: 0.6,
                        borderRadius: 0.08,
                        fontSize: 3,
                        opacity: 0.95,
                        hoverColor: "#E65100",
                    }
                },
                {
                    id: "btn-a-naar-einde",
                    text: "➡ Ga verder",
                    goTo: "einde",
                    position: { x: 0, y: 2, z: -4 },
                    rotation: { x: 0, y: 0, z: 0 },
                    style: {
                        backgroundColor: "#9C27B0",
                        textColor: "#FFFFFF",
                        width: 2.0,
                        height: 0.6,
                        borderRadius: 0.08,
                        fontSize: 3,
                        opacity: 0.95,
                        hoverColor: "#6A1B9A",
                    }
                }
            ]
        },

        // ---------- VOORBEELD: Route B ----------
        "route_b": {
            src: "videos/route-b.mp4",
            loop: false,
            buttons: [
                {
                    id: "btn-terug-intro-b",
                    text: "⬅ Terug naar start",
                    goTo: "intro",
                    position: { x: -1.5, y: 1.2, z: -4 },
                    rotation: { x: 0, y: 15, z: 0 },
                    style: {
                        backgroundColor: "#FF9800",
                        textColor: "#FFFFFF",
                        width: 2.5,
                        height: 0.6,
                        borderRadius: 0.08,
                        fontSize: 3,
                        opacity: 0.95,
                        hoverColor: "#E65100",
                    }
                },
                {
                    id: "btn-b-naar-einde",
                    text: "➡ Ga verder",
                    goTo: "einde",
                    position: { x: 1.5, y: 1.2, z: -4 },
                    rotation: { x: 0, y: -15, z: 0 },
                    style: {
                        backgroundColor: "#9C27B0",
                        textColor: "#FFFFFF",
                        width: 2.0,
                        height: 0.6,
                        borderRadius: 0.08,
                        fontSize: 3,
                        opacity: 0.95,
                        hoverColor: "#6A1B9A",
                    }
                }
            ]
        },

        // ---------- VOORBEELD: Einde ----------
        "einde": {
            src: "videos/einde.mp4",
            loop: true,
            buttons: [
                {
                    id: "btn-opnieuw",
                    text: "🔄 Opnieuw bekijken",
                    goTo: "intro",
                    position: { x: 0, y: 1, z: -4 },
                    rotation: { x: 0, y: 0, z: 0 },
                    style: {
                        backgroundColor: "#F44336",
                        textColor: "#FFFFFF",
                        width: 2.8,
                        height: 0.7,
                        borderRadius: 0.1,
                        fontSize: 3.5,
                        opacity: 0.95,
                        hoverColor: "#B71C1C",
                    }
                }
            ]
        }
    },

    // ===== STANDAARD BUTTON STIJL =====
    // Als een button geen eigen stijl heeft, wordt deze stijl gebruikt
    defaultButtonStyle: {
        backgroundColor: "#333333",
        textColor: "#FFFFFF",
        width: 2.0,
        height: 0.5,
        borderRadius: 0.05,
        fontSize: 3,
        opacity: 0.9,
        hoverColor: "#555555",
    }
};
