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
        this._registerRoundedRect();
    }

    /** Registreer een custom A-Frame component voor afgeronde rechthoeken */
    _registerRoundedRect() {
        if (AFRAME.components['rounded-rect']) return;

        AFRAME.registerComponent('rounded-rect', {
            schema: {
                width: { type: 'number', default: 2 },
                height: { type: 'number', default: 0.5 },
                radius: { type: 'number', default: 0.05 },
                color: { type: 'color', default: '#333' },
                opacity: { type: 'number', default: 1 },
            },
            init() {
                this._createMesh();
            },
            update() {
                this._createMesh();
            },
            _createMesh() {
                const { width, height, radius, color, opacity } = this.data;
                const shape = new THREE.Shape();
                const w = width / 2, h = height / 2, r = Math.min(radius, w, h);

                shape.moveTo(-w + r, -h);
                shape.lineTo(w - r, -h);
                shape.quadraticCurveTo(w, -h, w, -h + r);
                shape.lineTo(w, h - r);
                shape.quadraticCurveTo(w, h, w - r, h);
                shape.lineTo(-w + r, h);
                shape.quadraticCurveTo(-w, h, -w, h - r);
                shape.lineTo(-w, -h + r);
                shape.quadraticCurveTo(-w, -h, -w + r, -h);

                const geometry = new THREE.ShapeGeometry(shape);
                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color),
                    side: THREE.DoubleSide,
                    transparent: opacity < 1,
                    opacity: opacity
                });

                if (this.mesh) {
                    this.mesh.geometry.dispose();
                    this.mesh.material.dispose();
                }
                this.mesh = new THREE.Mesh(geometry, material);
                this.el.setObject3D('mesh', this.mesh);
                this.el.classList.add('clickable');
            },
            remove() {
                if (this.mesh) {
                    this.el.removeObject3D('mesh');
                    this.mesh.geometry.dispose();
                    this.mesh.material.dispose();
                }
            }
        });
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

    /** Ooghoogte offset — y=0 in config = ooghoogte in VR */
    static EYE_HEIGHT = 1.6;

    /** Maak een enkele button entity */
    _createButton(config) {
        const style = this._mergeStyle(config.style);

        // Hoofd-entity (groep)
        const group = document.createElement("a-entity");
        group.setAttribute("id", config.id);
        const yWorld = config.position.y + ButtonFactory.EYE_HEIGHT;
        group.setAttribute("position", `${config.position.x} ${yWorld} ${config.position.z}`);

        const rot = config.rotation || { x: 0, y: 0, z: 0 };
        group.setAttribute("rotation", `${rot.x} ${rot.y} ${rot.z}`);

        // Achtergrond: afgeronde rechthoek of afbeelding
        const panel = document.createElement("a-entity");

        if (style.backgroundImage) {
            // Afbeelding als achtergrond — gebruik a-plane
            panel.setAttribute("geometry", `primitive: plane; width: ${style.width}; height: ${style.height}`);
            panel.setAttribute("material", `src: ${style.backgroundImage}; opacity: ${style.opacity}; shader: flat; side: double`);
        } else {
            // Afgeronde rechthoek (mesh wordt via setObject3D geregistreerd voor raycasting)
            panel.setAttribute("rounded-rect", `width: ${style.width}; height: ${style.height}; radius: ${style.borderRadius}; color: ${style.backgroundColor}; opacity: ${style.opacity}`);
        }

        panel.setAttribute("class", "clickable");
        panel.setAttribute("data-goto", config.goTo || "");

        this._addHoverEffects(panel, style);
        this._addClickHandler(panel, config);
        group.appendChild(panel);

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
    _addHoverEffects(element, style, visualTarget) {
        const target = visualTarget || element;
        element.addEventListener("mouseenter", () => {
            if (target.hasAttribute("rounded-rect")) {
                target.setAttribute("rounded-rect", "color", style.hoverColor);
            } else {
                target.setAttribute("material", "color", style.hoverColor);
            }
            target.setAttribute("scale", "1.05 1.05 1.05");
        });

        element.addEventListener("mouseleave", () => {
            if (target.hasAttribute("rounded-rect")) {
                target.setAttribute("rounded-rect", "color", style.backgroundColor);
            } else {
                target.setAttribute("material", "color", style.backgroundColor);
            }
            target.setAttribute("scale", "1 1 1");
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
