/* ============================================================
   BUTTON-FACTORY.JS — Maakt en beheert interactieve VR buttons
   
   Buttons worden gemaakt als A-Frame entities met:
   - Aanpasbare achtergrondkleur, tekst, grootte
   - Hover-effecten (kleurverandering bij kijken/wijzen)
   - Click-actie (navigeer naar een andere video)
   - Ondersteuning voor afbeeldingen als achtergrond
   ============================================================ */

class ButtonFactory {
    constructor() {
        this.buttonContainer = null;
        this.activeButtons = [];
        this._timedButtons = [];  // Buttons met timing-regels
    }

    /** Initialiseer de button factory */
    init() {
        this.buttonContainer = document.getElementById("button-container");
    }

    /** Verwijder alle huidige buttons */
    clearButtons() {
        while (this.buttonContainer.firstChild) {
            this.buttonContainer.removeChild(this.buttonContainer.firstChild);
        }
        this.activeButtons = [];
        this._timedButtons = [];
    }

    /** Toon buttons voor een specifieke video */
    showButtonsForVideo(videoId) {
        this.clearButtons();

        const videoConfig = VR_CONFIG.videos[videoId];
        if (!videoConfig || !videoConfig.buttons) return;

        videoConfig.buttons.forEach((btnConfig) => {
            const buttonEntity = this._createButton(btnConfig);
            const timing = btnConfig.timing || {};
            const hasTiming = timing.showAt || timing.hideAt || timing.showOnEnd;

            if (hasTiming) {
                // Start verborgen, timing bepaalt wanneer het verschijnt
                buttonEntity.setAttribute("visible", false);
                buttonEntity.setAttribute("scale", "0 0 0");
                this._timedButtons.push({ entity: buttonEntity, timing, shown: false });
            }

            this.buttonContainer.appendChild(buttonEntity);
            this.activeButtons.push(buttonEntity);
        });
    }

    /** Wordt elke frame aangeroepen — checkt of buttons getoond/verborgen moeten worden */
    updateTiming(currentTime, duration, videoEnded) {
        for (const item of this._timedButtons) {
            const t = item.timing;
            let shouldBeVisible = false;

            if (t.showOnEnd) {
                // Toon alleen als video is afgelopen
                shouldBeVisible = videoEnded;
            } else {
                const showAt = t.showAt || 0;
                const hideAt = t.hideAt || Infinity;
                shouldBeVisible = currentTime >= showAt && currentTime < hideAt;
            }

            if (shouldBeVisible && !item.shown) {
                item.entity.setAttribute("visible", true);
                item.entity.setAttribute("animation__timein", {
                    property: "scale",
                    from: "0 0 0",
                    to: "1 1 1",
                    dur: 400,
                    easing: "easeOutBack"
                });
                item.shown = true;
            } else if (!shouldBeVisible && item.shown) {
                item.entity.setAttribute("animation__timeout", {
                    property: "scale",
                    to: "0 0 0",
                    dur: 300,
                    easing: "easeInBack"
                });
                setTimeout(() => {
                    item.entity.setAttribute("visible", false);
                }, 300);
                item.shown = false;
            }
        }
    }

    /** Maak een enkele button entity */
    _createButton(config) {
        const style = this._mergeStyle(config.style);

        // Hoofd-entity (groep)
        const group = document.createElement("a-entity");
        group.setAttribute("id", config.id);
        group.setAttribute("position", `${config.position.x} ${config.position.y} ${config.position.z}`);

        const rot = config.rotation || { x: 0, y: 0, z: 0 };
        group.setAttribute("rotation", `${rot.x} ${rot.y} ${rot.z}`);

        // Achtergrond paneel
        const panel = document.createElement("a-rounded");
        if (!customElements.get("a-rounded")) {
            // Fallback: gebruik een gewone plane als a-rounded niet beschikbaar is
            const plane = document.createElement("a-plane");
            plane.setAttribute("width", style.width);
            plane.setAttribute("height", style.height);
            plane.setAttribute("material", `color: ${style.backgroundColor}; opacity: ${style.opacity}; shader: flat`);
            plane.setAttribute("class", "clickable");
            plane.setAttribute("data-goto", config.goTo);

            this._addHoverEffects(plane, style);
            this._addClickHandler(plane, config);

            group.appendChild(plane);
        } else {
            panel.setAttribute("width", style.width);
            panel.setAttribute("height", style.height);
            panel.setAttribute("radius", style.borderRadius);
            panel.setAttribute("color", style.backgroundColor);
            panel.setAttribute("opacity", style.opacity);
            panel.setAttribute("class", "clickable");
            panel.setAttribute("data-goto", config.goTo);

            this._addHoverEffects(panel, style);
            this._addClickHandler(panel, config);

            group.appendChild(panel);
        }

        // Gebruik een a-plane als fallback (het a-rounded component is custom)
        const bgPlane = document.createElement("a-plane");
        bgPlane.setAttribute("width", style.width);
        bgPlane.setAttribute("height", style.height);
        bgPlane.setAttribute("material", `color: ${style.backgroundColor}; opacity: ${style.opacity}; shader: flat; side: double`);
        bgPlane.setAttribute("class", "clickable");
        bgPlane.setAttribute("data-goto", config.goTo);
        bgPlane.setAttribute("position", "0 0 0");

        // Achtergrondafbeelding (optioneel)
        if (style.backgroundImage) {
            bgPlane.setAttribute("material", `src: ${style.backgroundImage}; opacity: ${style.opacity}; shader: flat; side: double`);
        }

        this._addHoverEffects(bgPlane, style);
        this._addClickHandler(bgPlane, config);

        // Verwijder het eerder toegevoegde panel, gebruik bgPlane
        while (group.firstChild) {
            group.removeChild(group.firstChild);
        }
        group.appendChild(bgPlane);

        // Tekst label
        if (config.text) {
            const text = document.createElement("a-text");
            text.setAttribute("value", config.text);
            text.setAttribute("align", "center");
            text.setAttribute("color", style.textColor);
            text.setAttribute("width", style.fontSize);
            text.setAttribute("position", "0 0 0.01");
            text.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
            group.appendChild(text);
        }

        // Optioneel: Icoon
        if (style.icon) {
            const icon = document.createElement("a-image");
            icon.setAttribute("src", style.icon);
            icon.setAttribute("width", style.height * 0.6);
            icon.setAttribute("height", style.height * 0.6);
            icon.setAttribute("position", `${-(style.width / 2) + 0.3} 0 0.01`);
            group.appendChild(icon);
        }

        // Entrance animatie
        group.setAttribute("animation__appear", {
            property: "scale",
            from: "0 0 0",
            to: "1 1 1",
            dur: 400,
            easing: "easeOutBack",
            delay: Math.random() * 300
        });

        return group;
    }

    /** Voeg hover-effecten toe aan een element */
    _addHoverEffects(element, style) {
        // Hover: kleur veranderen
        element.addEventListener("mouseenter", () => {
            element.setAttribute("material", "color", style.hoverColor);
            element.setAttribute("scale", "1.05 1.05 1.05");
        });

        element.addEventListener("mouseleave", () => {
            element.setAttribute("material", "color", style.backgroundColor);
            element.setAttribute("scale", "1 1 1");
        });
    }

    /** Voeg click-handler toe aan een element */
    _addClickHandler(element, config) {
        element.addEventListener("click", () => {
            if (window.videoManager && config.goTo) {
                console.log(`🔀 Navigeren naar: ${config.goTo}`);
                window.videoManager.playVideo(config.goTo);
            }
        });
    }

    /** Merge button stijl met standaardwaarden */
    _mergeStyle(customStyle) {
        return Object.assign({}, VR_CONFIG.defaultButtonStyle, customStyle || {});
    }
}
