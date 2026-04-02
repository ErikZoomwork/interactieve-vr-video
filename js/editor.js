/* ============================================================
   EDITOR.JS — Visuele editor voor de VR video configuratie
   ============================================================ */

const Editor = {
    // Huidige staat
    config: null,
    selectedVideoId: null,
    selectedButtonIndex: null,

    // ===== INITIALISATIE =====
    init() {
        // Laad config uit localStorage of gebruik standaard
        const saved = localStorage.getItem("vr_editor_config");
        if (saved) {
            try {
                this.config = JSON.parse(saved);
            } catch (e) {
                this.config = this._defaultConfig();
            }
        } else {
            this.config = this._defaultConfig();
        }
        this.render();
    },

    _defaultConfig() {
        return {
            settings: {
                startVideo: "",
                fadeTransitionMs: 800,
                gazeTimeout: 2000,
                showCursorAlways: true,
                loopVideos: true,
            },
            videos: {},
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
    },

    // ===== OPSLAAN =====
    save() {
        localStorage.setItem("vr_editor_config", JSON.stringify(this.config));
    },

    // ===== RENDER =====
    render() {
        this._renderVideoList();
        this._renderStartVideoSelect();
        if (this.selectedVideoId && this.config.videos[this.selectedVideoId]) {
            this._renderVideoEditor();
        } else {
            document.getElementById("video-editor").style.display = "none";
            document.getElementById("empty-state").style.display = "flex";
        }
        this.save();
    },

    // ===== VIDEO LIJST (links paneel) =====
    _renderVideoList() {
        const list = document.getElementById("video-list");
        const videos = this.config.videos;
        const keys = Object.keys(videos);

        if (keys.length === 0) {
            list.innerHTML = '<div class="empty-list">Geen video\'s toegevoegd.<br>Klik op "+ Video" om te beginnen.</div>';
            return;
        }

        list.innerHTML = keys.map(id => {
            const v = videos[id];
            const isSelected = id === this.selectedVideoId;
            const isStart = this.config.settings.startVideo === id;
            const btnCount = (v.buttons || []).length;

            return `
                <div class="video-item ${isSelected ? 'selected' : ''}" onclick="Editor.selectVideo('${id}')">
                    <div class="video-item-info">
                        <div class="video-item-title">
                            ${isStart ? '<span class="badge badge-start">START</span>' : ''}
                            ${this._escapeHtml(id)}
                        </div>
                        <div class="video-item-meta">
                            ${v.sourceType === 'url' ? '🌐 ' : '📁 '}${this._escapeHtml(v.src || 'Geen bron')} · ${btnCount} knop${btnCount !== 1 ? 'pen' : ''}
                        </div>
                    </div>
                    <button class="btn btn-small btn-ghost btn-delete" onclick="event.stopPropagation(); Editor.deleteVideo('${id}')" title="Verwijderen">🗑</button>
                </div>
            `;
        }).join('');
    },

    _renderStartVideoSelect() {
        const select = document.getElementById("setting-start-video");
        const keys = Object.keys(this.config.videos);
        select.innerHTML = keys.length === 0
            ? '<option value="">-- geen video\'s --</option>'
            : keys.map(id => `<option value="${id}" ${this.config.settings.startVideo === id ? 'selected' : ''}>${this._escapeHtml(id)}</option>`).join('');
    },

    // ===== VIDEO EDITOR (midden) =====
    _renderVideoEditor() {
        const video = this.config.videos[this.selectedVideoId];
        if (!video) return;

        document.getElementById("empty-state").style.display = "none";
        document.getElementById("video-editor").style.display = "flex";

        // Video info
        document.getElementById("input-video-id").value = this.selectedVideoId;
        document.getElementById("input-video-loop").checked = video.loop !== false;

        // Source type
        const sourceType = video.sourceType || "file";
        const radioFile = document.querySelector('input[name="source-type"][value="file"]');
        const radioUrl = document.querySelector('input[name="source-type"][value="url"]');
        if (radioFile) radioFile.checked = sourceType === "file";
        if (radioUrl) radioUrl.checked = sourceType === "url";

        const fileGroup = document.getElementById("source-file-group");
        const urlGroup = document.getElementById("source-url-group");
        if (sourceType === "url") {
            fileGroup.style.display = "none";
            urlGroup.style.display = "";
            document.getElementById("input-video-url").value = video.src || "";
            document.getElementById("input-video-src").value = "";
        } else {
            fileGroup.style.display = "";
            urlGroup.style.display = "none";
            document.getElementById("input-video-src").value = video.src || "";
            document.getElementById("input-video-url").value = "";
        }

        // Preview video
        const previewVideo = document.getElementById("preview-video");
        if (video.src) {
            previewVideo.src = video.src;
            if (sourceType === "url") previewVideo.crossOrigin = "anonymous";
            previewVideo.style.display = "block";

            // Re-render overlay once video metadata is available
            previewVideo.onloadedmetadata = () => this._renderPreviewOverlay();
        } else {
            previewVideo.removeAttribute("src");
            previewVideo.style.display = "none";
        }

        // Buttons lijst
        this._renderButtonList(video.buttons || []);

        // Update goTo selects in button editor
        this._populateGoToSelects();

        // Render button positions on video preview
        requestAnimationFrame(() => this._renderPreviewOverlay());
    },

    _renderButtonList(buttons) {
        const list = document.getElementById("button-list");

        if (buttons.length === 0) {
            list.innerHTML = '<div class="empty-list">Geen knoppen. Klik op "+ Knop toevoegen" om een knop te maken.</div>';
            return;
        }

        list.innerHTML = buttons.map((btn, index) => {
            const style = Object.assign({}, this.config.defaultButtonStyle, btn.style || {});
            const isSelected = this.selectedButtonIndex === index;
            const bgStyle = style.backgroundImage
                ? `background-image: url('${this._escapeHtml(style.backgroundImage)}'); background-size: cover;`
                : `background-color: ${style.backgroundColor};`;

            return `
                <div class="button-item ${isSelected ? 'selected' : ''}" onclick="Editor.selectButton(${index})">
                    <div class="button-item-preview" style="${bgStyle} color: ${style.textColor}; opacity: ${style.opacity};">
                        ${this._escapeHtml(btn.text || '(geen tekst)')}
                    </div>
                    <div class="button-item-info">
                        <div class="button-item-title">${this._escapeHtml(btn.text || '(geen tekst)')}</div>
                        <div class="button-item-meta">
                            → ${this._escapeHtml(btn.goTo || '?')} · Positie: ${btn.position?.x ?? 0}, ${btn.position?.y ?? 1}, ${btn.position?.z ?? -4}
                            ${btn.timing && (btn.timing.showAt || btn.timing.hideAt || btn.timing.showOnEnd) ? ` · ⏱ ${btn.timing.showOnEnd ? 'na einde' : (btn.timing.showAt ? btn.timing.showAt + 's' : '0s')}${btn.timing.hideAt ? ' - ' + btn.timing.hideAt + 's' : ''}` : ''}
                        </div>
                    </div>
                    <div class="button-item-actions">
                        <button class="btn btn-small btn-ghost" onclick="event.stopPropagation(); Editor.duplicateButton(${index})" title="Dupliceren">📋</button>
                        <button class="btn btn-small btn-ghost btn-delete" onclick="event.stopPropagation(); Editor.deleteButton(${index})" title="Verwijderen">🗑</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ===== BUTTON EDITOR (rechts paneel) =====
    _renderButtonEditor() {
        const video = this.config.videos[this.selectedVideoId];
        if (!video || this.selectedButtonIndex === null) return;

        const btn = video.buttons[this.selectedButtonIndex];
        if (!btn) return;

        const style = Object.assign({}, this.config.defaultButtonStyle, btn.style || {});

        document.getElementById("panel-button-editor").style.display = "flex";

        // Vul velden in
        document.getElementById("btn-edit-text").value = btn.text || "";
        document.getElementById("btn-edit-pos-x").value = btn.position?.x ?? 0;
        document.getElementById("btn-edit-pos-y").value = btn.position?.y ?? 1.2;
        document.getElementById("btn-edit-pos-z").value = btn.position?.z ?? -4;
        document.getElementById("btn-edit-rot-y").value = btn.rotation?.y ?? 0;

        // Kleuren
        document.getElementById("btn-edit-bgcolor").value = style.backgroundColor;
        document.getElementById("btn-edit-bgcolor-text").value = style.backgroundColor;
        document.getElementById("btn-edit-hovercolor").value = style.hoverColor;
        document.getElementById("btn-edit-hovercolor-text").value = style.hoverColor;
        document.getElementById("btn-edit-textcolor").value = style.textColor;
        document.getElementById("btn-edit-textcolor-text").value = style.textColor;

        // Afmetingen
        document.getElementById("btn-edit-width").value = style.width;
        document.getElementById("btn-edit-height").value = style.height;

        // Ranges
        document.getElementById("btn-edit-fontsize").value = style.fontSize;
        document.getElementById("btn-edit-fontsize-val").textContent = style.fontSize;
        document.getElementById("btn-edit-opacity").value = style.opacity;
        document.getElementById("btn-edit-opacity-val").textContent = style.opacity;

        // Afbeeldingen
        document.getElementById("btn-edit-bgimage").value = style.backgroundImage || "";
        document.getElementById("btn-edit-icon").value = style.icon || "";

        // Image previews
        this._updateImagePreview("btn-bgimage-preview", style.backgroundImage);
        this._updateImagePreview("btn-icon-preview", style.icon);

        // GoTo select
        this._populateGoToSelects();
        document.getElementById("btn-edit-goto").value = btn.goTo || "";

        // Timing
        const timing = btn.timing || {};
        document.getElementById("btn-edit-show-at").value = timing.showAt || "";
        document.getElementById("btn-edit-hide-at").value = timing.hideAt || "";
        document.getElementById("btn-edit-show-on-end").checked = timing.showOnEnd || false;
        this._updateTimingPreview(timing);

        // Live preview
        this._updateButtonPreview(btn, style);
    },

    _updateImagePreview(elementId, src) {
        const container = document.getElementById(elementId);
        if (src) {
            container.innerHTML = `<img src="${this._escapeHtml(src)}" alt="Preview" />`;
        } else {
            container.innerHTML = "";
        }
    },

    _updateButtonPreview(btn, style) {
        const el = document.getElementById("preview-btn");
        const bgParts = [];
        if (style.backgroundImage) {
            bgParts.push(`background-image: url('${style.backgroundImage}')`);
            bgParts.push("background-size: cover");
        } else {
            bgParts.push(`background-color: ${style.backgroundColor}`);
        }
        el.style.cssText = `
            ${bgParts.join('; ')};
            color: ${style.textColor};
            opacity: ${style.opacity};
            width: ${Math.min(style.width * 60, 280)}px;
            height: ${style.height * 60}px;
            font-size: ${style.fontSize * 4}px;
            border-radius: ${style.borderRadius * 60}px;
        `;
        el.textContent = btn.text || "(geen tekst)";
    },

    _populateGoToSelects() {
        const keys = Object.keys(this.config.videos);
        const html = '<option value="">-- kies video --</option>' +
            keys.map(id => `<option value="${id}">${this._escapeHtml(id)}</option>`).join('');

        const goToSelect = document.getElementById("btn-edit-goto");
        if (goToSelect) {
            const currentVal = goToSelect.value;
            goToSelect.innerHTML = html;
            goToSelect.value = currentVal;
        }
    },

    // ===== ACTIES: VIDEO'S =====
    addVideo() {
        // Genereer uniek ID
        let id = "video-" + (Object.keys(this.config.videos).length + 1);
        let counter = 1;
        while (this.config.videos[id]) {
            counter++;
            id = "video-" + counter;
        }

        this.config.videos[id] = {
            src: "",
            loop: true,
            buttons: []
        };

        // Als dit de eerste video is, maak het de startvideo
        if (Object.keys(this.config.videos).length === 1) {
            this.config.settings.startVideo = id;
        }

        this.selectedVideoId = id;
        this.selectedButtonIndex = null;
        this.closeButtonEditor();
        this.render();
    },

    selectVideo(id) {
        this.selectedVideoId = id;
        this.selectedButtonIndex = null;
        this.closeButtonEditor();
        this.render();
    },

    deleteVideo(id) {
        if (!confirm(`Video "${id}" verwijderen? Dit verwijdert ook alle knoppen.`)) return;

        delete this.config.videos[id];

        if (this.selectedVideoId === id) {
            this.selectedVideoId = null;
            this.selectedButtonIndex = null;
            this.closeButtonEditor();
        }

        // Update startvideo als nodig
        if (this.config.settings.startVideo === id) {
            const keys = Object.keys(this.config.videos);
            this.config.settings.startVideo = keys.length > 0 ? keys[0] : "";
        }

        this.render();
    },

    renameCurrentVideo(newId) {
        newId = newId.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
        if (!newId || newId === this.selectedVideoId) return;
        if (this.config.videos[newId]) {
            alert("Er bestaat al een video met dit ID!");
            document.getElementById("input-video-id").value = this.selectedVideoId;
            return;
        }

        // Kopieer data naar nieuw ID
        this.config.videos[newId] = this.config.videos[this.selectedVideoId];

        // Update alle goTo verwijzingen
        for (const vid of Object.values(this.config.videos)) {
            if (vid.buttons) {
                for (const btn of vid.buttons) {
                    if (btn.goTo === this.selectedVideoId) {
                        btn.goTo = newId;
                    }
                }
            }
        }

        // Update startvideo als nodig
        if (this.config.settings.startVideo === this.selectedVideoId) {
            this.config.settings.startVideo = newId;
        }

        delete this.config.videos[this.selectedVideoId];
        this.selectedVideoId = newId;
        this.render();
    },

    updateCurrentVideo(key, value) {
        if (!this.selectedVideoId) return;
        this.config.videos[this.selectedVideoId][key] = value;
        this.save();
    },

    updateSetting(key, value) {
        this.config.settings[key] = value;
        this.save();
    },

    updateSourceType(type) {
        if (!this.selectedVideoId) return;
        this.config.videos[this.selectedVideoId].sourceType = type;
        // Clear src when switching type
        this.config.videos[this.selectedVideoId].src = "";
        this.save();
        this._renderVideoEditor();
    },

    handleVideoFile(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const filename = "videos/" + file.name;
        this.updateCurrentVideo("src", filename);
        this.updateCurrentVideo("sourceType", "file");
        document.getElementById("input-video-src").value = filename;

        // Preview
        const url = URL.createObjectURL(file);
        const previewVideo = document.getElementById("preview-video");
        previewVideo.src = url;
        previewVideo.style.display = "block";
        this.save();
    },

    // ===== ACTIES: BUTTONS =====
    addButton() {
        if (!this.selectedVideoId) return;
        const video = this.config.videos[this.selectedVideoId];
        if (!video.buttons) video.buttons = [];

        const newBtn = {
            id: "btn-" + Date.now(),
            text: "Nieuwe knop",
            goTo: "",
            position: { x: 0, y: 1.2, z: -4 },
            rotation: { x: 0, y: 0, z: 0 },
            timing: {},
            style: {
                backgroundColor: "#2196F3",
                textColor: "#FFFFFF",
                width: 2.5,
                height: 0.6,
                borderRadius: 0.08,
                fontSize: 3,
                opacity: 0.95,
                hoverColor: "#1565C0",
            }
        };

        video.buttons.push(newBtn);
        this.selectedButtonIndex = video.buttons.length - 1;
        this.render();
        this._renderButtonEditor();
    },

    selectButton(index) {
        this.selectedButtonIndex = index;
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons || []);
        this._renderButtonEditor();
    },

    deleteButton(index) {
        if (!this.selectedVideoId) return;
        const video = this.config.videos[this.selectedVideoId];
        video.buttons.splice(index, 1);

        if (this.selectedButtonIndex === index) {
            this.selectedButtonIndex = null;
            this.closeButtonEditor();
        } else if (this.selectedButtonIndex > index) {
            this.selectedButtonIndex--;
        }

        this.render();
    },

    deleteCurrentButton() {
        if (this.selectedButtonIndex !== null) {
            this.deleteButton(this.selectedButtonIndex);
        }
    },

    duplicateButton(index) {
        if (!this.selectedVideoId) return;
        const video = this.config.videos[this.selectedVideoId];
        const original = video.buttons[index];
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = "btn-" + Date.now();
        copy.text = copy.text + " (kopie)";
        copy.position.x += 0.5;
        video.buttons.splice(index + 1, 0, copy);
        this.render();
    },

    updateButton(key, value) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        btn[key] = value;
        this.render();
        this._renderButtonEditor();
    },

    updateButtonPos(axis, value) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        if (!btn.position) btn.position = { x: 0, y: 1.2, z: -4 };
        btn.position[axis] = parseFloat(value) || 0;
        this.save();
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons);
        this._updateButtonPreview(btn, Object.assign({}, this.config.defaultButtonStyle, btn.style || {}));
        this._renderPreviewOverlay();
    },

    updateButtonRot(axis, value) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        if (!btn.rotation) btn.rotation = { x: 0, y: 0, z: 0 };
        btn.rotation[axis] = parseFloat(value) || 0;
        this.save();
    },

    updateButtonTiming(key, value) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        if (!btn.timing) btn.timing = {};

        if (key === 'showOnEnd') {
            btn.timing.showOnEnd = value;
        } else {
            const num = parseFloat(value);
            if (isNaN(num) || value === '') {
                delete btn.timing[key];
            } else {
                btn.timing[key] = Math.max(0, num);
            }
        }

        // Verwijder timing object als het leeg is
        if (!btn.timing.showAt && !btn.timing.hideAt && !btn.timing.showOnEnd) {
            delete btn.timing;
        }

        this.save();
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons);
        this._updateTimingPreview(btn.timing || {});
        this._renderPreviewOverlay();
    },

    _updateTimingPreview(timing) {
        const el = document.getElementById('timing-preview');
        if (!el) return;

        if (timing.showOnEnd) {
            el.innerHTML = '<div class="timing-info">⏱ Knop verschijnt <strong>nadat de video is afgelopen</strong></div>';
        } else {
            const showAt = timing.showAt || 0;
            const hideAt = timing.hideAt;
            let text = `⏱ Zichtbaar vanaf <strong>${showAt}s</strong>`;
            if (hideAt) {
                text += ` tot <strong>${hideAt}s</strong>`;
            } else {
                text += ' tot <strong>einde video</strong>';
            }
            el.innerHTML = `<div class="timing-info">${text}</div>`;
        }
    },

    updateButtonStyle(key, value) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        if (!btn.style) btn.style = {};
        btn.style[key] = value;
        this.save();

        // Sync kleurvelden
        if (key === "backgroundColor") {
            document.getElementById("btn-edit-bgcolor").value = value;
            document.getElementById("btn-edit-bgcolor-text").value = value;
        } else if (key === "hoverColor") {
            document.getElementById("btn-edit-hovercolor").value = value;
            document.getElementById("btn-edit-hovercolor-text").value = value;
        } else if (key === "textColor") {
            document.getElementById("btn-edit-textcolor").value = value;
            document.getElementById("btn-edit-textcolor-text").value = value;
        }

        // Update range labels
        if (key === "fontSize") {
            document.getElementById("btn-edit-fontsize-val").textContent = value;
        } else if (key === "opacity") {
            document.getElementById("btn-edit-opacity-val").textContent = value;
        }

        // Update image preview
        if (key === "backgroundImage") {
            this._updateImagePreview("btn-bgimage-preview", value);
        } else if (key === "icon") {
            this._updateImagePreview("btn-icon-preview", value);
        }

        // Update renders
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons);
        const style = Object.assign({}, this.config.defaultButtonStyle, btn.style || {});
        this._updateButtonPreview(btn, style);
        this._renderPreviewOverlay();
    },

    handleButtonImage(input, styleKey) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const filename = "images/" + file.name;

        if (styleKey === "backgroundImage") {
            document.getElementById("btn-edit-bgimage").value = filename;
        } else if (styleKey === "icon") {
            document.getElementById("btn-edit-icon").value = filename;
        }

        this.updateButtonStyle(styleKey, filename);
    },

    clearButtonImage(styleKey) {
        if (this.selectedButtonIndex === null) return;
        const btn = this.config.videos[this.selectedVideoId].buttons[this.selectedButtonIndex];
        if (btn.style) {
            delete btn.style[styleKey];
        }

        if (styleKey === "backgroundImage") {
            document.getElementById("btn-edit-bgimage").value = "";
            this._updateImagePreview("btn-bgimage-preview", null);
        } else if (styleKey === "icon") {
            document.getElementById("btn-edit-icon").value = "";
            this._updateImagePreview("btn-icon-preview", null);
        }

        this.save();
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons);
        const style2 = Object.assign({}, this.config.defaultButtonStyle, btn.style || {});
        this._updateButtonPreview(btn, style2);
        this._renderPreviewOverlay();
    },

    closeButtonEditor() {
        document.getElementById("panel-button-editor").style.display = "none";
        this.selectedButtonIndex = null;
    },

    // ===== IMPORT / EXPORT =====
    publishConfig() {
        const json = JSON.stringify(this.config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('config.json gedownload!\n\nPlaats dit bestand in de hoofdmap van je project en push naar GitHub:\n\n1. Kopieer config.json naar K:\\Interactieve VR Video\\\n2. git add config.json\n3. git commit -m "Update config"\n4. git push');
    },

    exportConfig() {
        const configStr = this._generateConfigJS();
        document.getElementById("modal-title").textContent = "Exporteer Config";
        document.getElementById("modal-textarea").value = configStr;
        document.getElementById("modal-action-btn").textContent = "📋 Kopieer";
        document.getElementById("modal-overlay").style.display = "flex";
        this._modalMode = "export";
    },

    importConfig() {
        document.getElementById("modal-title").textContent = "Importeer Config";
        document.getElementById("modal-textarea").value = "";
        document.getElementById("modal-textarea").placeholder = "Plak hier de inhoud van config.js...";
        document.getElementById("modal-action-btn").textContent = "📥 Importeren";
        document.getElementById("modal-overlay").style.display = "flex";
        this._modalMode = "import";
    },

    modalAction() {
        if (this._modalMode === "export") {
            const textarea = document.getElementById("modal-textarea");
            textarea.select();
            document.execCommand("copy");
            alert("Config gekopieerd naar klembord! Plak dit in js/config.js");
        } else if (this._modalMode === "import") {
            const text = document.getElementById("modal-textarea").value;
            try {
                // Probeer de config te parsen uit het JS-bestand
                const match = text.match(/const\s+VR_CONFIG\s*=\s*(\{[\s\S]*\});?\s*$/);
                if (match) {
                    const parsed = new Function("return " + match[1])();
                    this.config = parsed;
                    this.selectedVideoId = null;
                    this.selectedButtonIndex = null;
                    this.closeButtonEditor();
                    this.render();
                    this.closeModal();
                    alert("Config succesvol geïmporteerd!");
                } else {
                    // Probeer direct als JSON
                    const parsed = JSON.parse(text);
                    this.config = parsed;
                    this.selectedVideoId = null;
                    this.selectedButtonIndex = null;
                    this.closeButtonEditor();
                    this.render();
                    this.closeModal();
                    alert("Config succesvol geïmporteerd!");
                }
            } catch (e) {
                alert("Fout bij importeren: " + e.message);
            }
        }
    },

    closeModal() {
        document.getElementById("modal-overlay").style.display = "none";
    },

    _generateConfigJS() {
        const json = JSON.stringify(this.config, null, 4);
        return `const VR_CONFIG = ${json};`;
    },

    // ===== HULPFUNCTIES =====
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // ===== EXPORTEER VOOR QUEST =====

    exportForQuest() {
        const videos = this.config.videos;
        const keys = Object.keys(videos);

        if (keys.length === 0) {
            alert("Voeg eerst video's toe voordat je exporteert.");
            return;
        }

        // Toon lijst van benodigde bestanden
        const listEl = document.getElementById('export-file-list');
        listEl.innerHTML = keys.map(id => {
            const v = videos[id];
            const isUrl = v.sourceType === 'url';
            return `
                <div class="export-file-item">
                    <div class="export-file-info">
                        <strong>${this._escapeHtml(id)}</strong>
                        <span class="export-file-src">${isUrl ? '🌐 ' : '📁 '}${this._escapeHtml(v.src || '(geen bron)')}</span>
                    </div>
                    <span class="badge ${isUrl ? 'badge-url' : 'badge-file'}">${isUrl ? 'URL' : 'Lokaal bestand'}</span>
                </div>
            `;
        }).join('');

        // Reset stappen
        document.getElementById('export-step-files').style.display = '';
        document.getElementById('export-step-done').style.display = 'none';
        document.getElementById('export-overlay').style.display = 'flex';
    },

    startExport() {
        const html = this._buildExportHtml();

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vr-ervaring.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Klaar!
        document.getElementById('export-step-files').style.display = 'none';
        document.getElementById('export-step-done').style.display = '';
    },

    _buildExportHtml() {
        const config = JSON.parse(JSON.stringify(this.config));

        return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactieve VR Video</title>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"><\/script>
    <style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a1a; color: white; overflow: hidden; }
#start-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a2a3e 100%); z-index: 1000; }
.start-content { text-align: center; padding: 3rem; max-width: 600px; }
.start-content h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(90deg, #4FC3F7, #81D4FA, #B3E5FC); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.start-content p { font-size: 1.1rem; color: #b0bec5; margin-bottom: 2rem; line-height: 1.6; }
#btn-start { padding: 1rem 3rem; font-size: 1.3rem; border: none; border-radius: 50px; background: linear-gradient(90deg, #2196F3, #4FC3F7); color: white; cursor: pointer; transition: all 0.3s ease; font-weight: 600; letter-spacing: 1px; }
#btn-start:hover { transform: scale(1.05); box-shadow: 0 8px 30px rgba(33,150,243,0.4); }
    </style>
</head>
<body>
    <div id="start-screen">
        <div class="start-content">
            <h1>🎬 Interactieve VR Video</h1>
            <p>Zet je Meta Quest 3 op en klik op start om te beginnen.</p>
            <button id="btn-start" onclick="startExperience()">▶ Start VR Ervaring</button>
        </div>
    </div>

    <a-scene id="vr-scene" vr-mode-ui="enabled: true" webxr="requiredFeatures: local-floor; optionalFeatures: hand-tracking" loading-screen="enabled: false" renderer="colorManagement: true" style="display: none;">
        <a-assets id="asset-container" timeout="60000"></a-assets>
        <a-videosphere id="video-sphere" src="" rotation="0 -90 0"></a-videosphere>
        <a-entity id="camera-rig" position="0 1.6 0">
            <a-camera id="main-camera" look-controls="pointerLockEnabled: false" wasd-controls="enabled: false">
                <a-entity id="gaze-cursor" cursor="fuse: true; fuseTimeout: 2000" raycaster="objects: .clickable; far: 20" position="0 0 -1" geometry="primitive: ring; radiusInner: 0.01; radiusOuter: 0.015" material="color: white; shader: flat; opacity: 0.8" animation__click="property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.1 0.1 0.1; to: 1 1 1" animation__fusing="property: scale; startEvents: fusing; easing: easeInCubic; dur: 2000; from: 1 1 1; to: 0.1 0.1 0.1" animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 1 1 1">
                    <a-entity id="fuse-loader" geometry="primitive: ring; radiusInner: 0.018; radiusOuter: 0.025; thetaLength: 0" material="color: #4FC3F7; shader: flat; opacity: 0.9"></a-entity>
                </a-entity>
            </a-camera>
        </a-entity>
        <a-entity id="left-hand" laser-controls="hand: left" raycaster="objects: .clickable; far: 20"></a-entity>
        <a-entity id="right-hand" laser-controls="hand: right" raycaster="objects: .clickable; far: 20"></a-entity>
        <a-entity id="button-container"></a-entity>
        <a-sphere id="fade-sphere" radius="0.5" material="color: black; shader: flat; opacity: 0; side: back; transparent: true" position="0 1.6 0"></a-sphere>
    </a-scene>

<script>
// === CONFIG ===
const VR_CONFIG = ${JSON.stringify(config, null, 2)};

// === VIDEO MANAGER ===
${this._getVideoManagerSource()}

// === BUTTON FACTORY ===
${this._getButtonFactorySource()}

// === APP ===
window.videoManager = new VideoManager();
window.buttonFactory = new ButtonFactory();

function startExperience() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("vr-scene").style.display = "block";
    window.videoManager.init();
    window.buttonFactory.init();
    const scene = document.getElementById("vr-scene");
    if (scene.hasLoaded) { _beginPlayback(); }
    else { scene.addEventListener("loaded", _beginPlayback); }
}

function _beginPlayback() {
    window.videoManager.playVideo(VR_CONFIG.settings.startVideo);
}

document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
        const video = window.videoManager;
        if (!video.getCurrentVideoId()) return;
        const el = video.videoElements[video.getCurrentVideoId()];
        if (el.paused) video.resume(); else video.pause();
    }
});
<\/script>
</body>
</html>`;
    },

    _getVideoManagerSource() {
        return `class VideoManager {
    constructor() {
        this.currentVideoId = null;
        this.videoElements = {};
        this.videoSphere = null;
        this.isTransitioning = false;
        this._timingInterval = null;
    }
    init() {
        this.videoSphere = document.getElementById("video-sphere");
        this.assetContainer = document.getElementById("asset-container");
        this.fadeSphere = document.getElementById("fade-sphere");
        this._preloadAllVideos();
    }
    _preloadAllVideos() {
        const videos = VR_CONFIG.videos;
        for (const [id, videoData] of Object.entries(videos)) {
            const videoEl = document.createElement("video");
            videoEl.id = "video-" + id;
            videoEl.src = videoData.src;
            videoEl.crossOrigin = "anonymous";
            videoEl.preload = "auto";
            videoEl.playsInline = true;
            videoEl.setAttribute("webkit-playsinline", "");
            const shouldLoop = videoData.loop !== undefined ? videoData.loop : VR_CONFIG.settings.loopVideos;
            videoEl.loop = shouldLoop;
            this.assetContainer.appendChild(videoEl);
            this.videoElements[id] = videoEl;
        }
    }
    async playVideo(videoId) {
        if (this.isTransitioning) return;
        if (!VR_CONFIG.videos[videoId]) { console.error("Video niet gevonden:", videoId); return; }
        this.isTransitioning = true;
        await this._fadeOut();
        if (this.currentVideoId && this.videoElements[this.currentVideoId]) {
            const cv = this.videoElements[this.currentVideoId];
            cv.pause(); cv.currentTime = 0;
        }
        const nv = this.videoElements[videoId];
        this.videoSphere.setAttribute("src", "#video-" + videoId);
        this.currentVideoId = videoId;
        try { await nv.play(); } catch(e) { console.warn("Autoplay geblokkeerd:", e); }
        if (window.buttonFactory) window.buttonFactory.showButtonsForVideo(videoId);
        this._startTimingUpdates(nv);
        await this._fadeIn();
        this.isTransitioning = false;
    }
    _fadeOut() {
        return new Promise(r => {
            const d = VR_CONFIG.settings.fadeTransitionMs / 2;
            this.fadeSphere.setAttribute("animation", { property: "material.opacity", to: 1, dur: d, easing: "easeInQuad" });
            setTimeout(r, d);
        });
    }
    _fadeIn() {
        return new Promise(r => {
            const d = VR_CONFIG.settings.fadeTransitionMs / 2;
            this.fadeSphere.setAttribute("animation", { property: "material.opacity", to: 0, dur: d, easing: "easeOutQuad" });
            setTimeout(r, d);
        });
    }
    _startTimingUpdates(videoEl) {
        if (this._timingInterval) clearInterval(this._timingInterval);
        let ended = false;
        videoEl.addEventListener("ended", () => { ended = true; if (window.buttonFactory) window.buttonFactory.updateTiming(videoEl.currentTime, videoEl.duration, true); }, { once: true });
        this._timingInterval = setInterval(() => {
            if (!window.buttonFactory) return;
            if (videoEl.paused && !ended) return;
            window.buttonFactory.updateTiming(videoEl.currentTime, videoEl.duration || 0, ended);
        }, 250);
    }
    pause() { if (this.currentVideoId && this.videoElements[this.currentVideoId]) this.videoElements[this.currentVideoId].pause(); }
    resume() { if (this.currentVideoId && this.videoElements[this.currentVideoId]) this.videoElements[this.currentVideoId].play(); }
    getCurrentVideoId() { return this.currentVideoId; }
}`;
    },

    _getButtonFactorySource() {
        return `class ButtonFactory {
    constructor() { this.buttonContainer = null; this.activeButtons = []; this._timedButtons = []; }
    init() { this.buttonContainer = document.getElementById("button-container"); }
    clearButtons() {
        while (this.buttonContainer.firstChild) this.buttonContainer.removeChild(this.buttonContainer.firstChild);
        this.activeButtons = []; this._timedButtons = [];
    }
    showButtonsForVideo(videoId) {
        this.clearButtons();
        const vc = VR_CONFIG.videos[videoId];
        if (!vc || !vc.buttons) return;
        vc.buttons.forEach(bc => {
            const be = this._createButton(bc);
            const t = bc.timing || {};
            if (t.showAt || t.hideAt || t.showOnEnd) {
                be.setAttribute("visible", false);
                be.setAttribute("scale", "0 0 0");
                this._timedButtons.push({ entity: be, timing: t, shown: false });
            }
            this.buttonContainer.appendChild(be);
            this.activeButtons.push(be);
        });
    }
    updateTiming(ct, dur, ended) {
        for (const item of this._timedButtons) {
            const t = item.timing;
            let vis = false;
            if (t.showOnEnd) { vis = ended; }
            else { vis = ct >= (t.showAt||0) && ct < (t.hideAt||Infinity); }
            if (vis && !item.shown) {
                item.entity.setAttribute("visible", true);
                item.entity.setAttribute("animation__timein", { property: "scale", from: "0 0 0", to: "1 1 1", dur: 400, easing: "easeOutBack" });
                item.shown = true;
            } else if (!vis && item.shown) {
                item.entity.setAttribute("animation__timeout", { property: "scale", to: "0 0 0", dur: 300, easing: "easeInBack" });
                setTimeout(() => item.entity.setAttribute("visible", false), 300);
                item.shown = false;
            }
        }
    }
    _createButton(config) {
        const s = Object.assign({}, VR_CONFIG.defaultButtonStyle, config.style || {});
        const g = document.createElement("a-entity");
        g.setAttribute("id", config.id);
        g.setAttribute("position", config.position.x + " " + config.position.y + " " + config.position.z);
        const r = config.rotation || {x:0,y:0,z:0};
        g.setAttribute("rotation", r.x + " " + r.y + " " + r.z);
        const p = document.createElement("a-plane");
        p.setAttribute("width", s.width);
        p.setAttribute("height", s.height);
        p.setAttribute("material", "color: " + s.backgroundColor + "; opacity: " + s.opacity + "; shader: flat; side: double");
        p.setAttribute("class", "clickable");
        p.setAttribute("position", "0 0 0");
        if (s.backgroundImage) p.setAttribute("material", "src: " + s.backgroundImage + "; opacity: " + s.opacity + "; shader: flat; side: double");
        p.addEventListener("mouseenter", () => { p.setAttribute("material", "color", s.hoverColor); p.setAttribute("scale", "1.05 1.05 1.05"); });
        p.addEventListener("mouseleave", () => { p.setAttribute("material", "color", s.backgroundColor); p.setAttribute("scale", "1 1 1"); });
        p.addEventListener("click", () => { if (window.videoManager && config.goTo) { console.log("Navigeren naar: " + config.goTo); window.videoManager.playVideo(config.goTo); } });
        g.appendChild(p);
        if (config.text) {
            const t = document.createElement("a-text");
            t.setAttribute("value", config.text); t.setAttribute("align", "center");
            t.setAttribute("color", s.textColor); t.setAttribute("width", s.fontSize);
            t.setAttribute("position", "0 0 0.01");
            t.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
            t.setAttribute("negate", "false");
            g.appendChild(t);
        }
        if (s.icon) {
            const ic = document.createElement("a-image");
            ic.setAttribute("src", s.icon); ic.setAttribute("width", s.height * 0.6); ic.setAttribute("height", s.height * 0.6);
            ic.setAttribute("position", -(s.width/2)+0.3 + " 0 0.01");
            g.appendChild(ic);
        }
        g.setAttribute("animation__appear", { property: "scale", from: "0 0 0", to: "1 1 1", dur: 400, easing: "easeOutBack", delay: Math.random()*300 });
        return g;
    }
}`;
    },

    closeExportModal() {
        document.getElementById('export-overlay').style.display = 'none';
    },

    // ===== DRAG & DROP =====
    _initDragDrop() {
        const body = document.body;
        let dragCounter = 0;

        const dropEmpty = document.getElementById('drop-zone-empty');
        const dropVideo = document.getElementById('drop-zone-video');

        // Voorkom standaard browser drag-gedrag
        body.addEventListener('dragover', (e) => e.preventDefault());
        body.addEventListener('drop', (e) => e.preventDefault());

        // Track drag enter/leave op body-niveau
        body.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (dragCounter === 1) {
                if (dropEmpty) dropEmpty.classList.add('drag-over');
                if (dropVideo) dropVideo.classList.add('drag-over');
            }
        });

        body.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                if (dropEmpty) dropEmpty.classList.remove('drag-over');
                if (dropVideo) dropVideo.classList.remove('drag-over');
            }
        });

        // Drop op empty state → maak nieuwe video aan
        if (dropEmpty) {
            dropEmpty.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter = 0;
                dropEmpty.classList.remove('drag-over');
                if (dropVideo) dropVideo.classList.remove('drag-over');
                const files = this._getVideoFiles(e.dataTransfer);
                if (files.length > 0) this._handleDroppedFiles(files);
            });
        }

        // Drop op video preview → update huidige video
        if (dropVideo) {
            dropVideo.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter = 0;
                dropVideo.classList.remove('drag-over');
                if (dropEmpty) dropEmpty.classList.remove('drag-over');
                const files = this._getVideoFiles(e.dataTransfer);
                if (files.length > 0) {
                    if (this.selectedVideoId) {
                        // Update huidige video met eerste bestand
                        this._applyDroppedFile(files[0], this.selectedVideoId);
                        // Voeg extra bestanden toe als nieuwe video's
                        for (let i = 1; i < files.length; i++) {
                            this._handleDroppedFiles([files[i]]);
                        }
                    } else {
                        this._handleDroppedFiles(files);
                    }
                }
            });
        }

        // Drop ergens anders op body → vang op als fallback
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            if (dropEmpty) dropEmpty.classList.remove('drag-over');
            if (dropVideo) dropVideo.classList.remove('drag-over');
            const files = this._getVideoFiles(e.dataTransfer);
            if (files.length > 0) {
                if (this.selectedVideoId) {
                    this._applyDroppedFile(files[0], this.selectedVideoId);
                    for (let i = 1; i < files.length; i++) {
                        this._handleDroppedFiles([files[i]]);
                    }
                } else {
                    this._handleDroppedFiles(files);
                }
            }
        });
    },

    _getVideoFiles(dataTransfer) {
        if (!dataTransfer || !dataTransfer.files) return [];
        return Array.from(dataTransfer.files).filter(f => f.type.startsWith('video/'));
    },

    _handleDroppedFiles(files) {
        for (const file of files) {
            // Maak nieuwe video aan
            let id = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
            if (this.config.videos[id]) {
                let counter = 2;
                while (this.config.videos[`${id}-${counter}`]) counter++;
                id = `${id}-${counter}`;
            }

            this.config.videos[id] = {
                src: 'videos/' + file.name,
                sourceType: 'file',
                loop: true,
                buttons: []
            };

            if (Object.keys(this.config.videos).length === 1) {
                this.config.settings.startVideo = id;
            }

            this.selectedVideoId = id;
            this.selectedButtonIndex = null;
            this.closeButtonEditor();
        }
        this.render();
    },

    _applyDroppedFile(file, videoId) {
        const filename = 'videos/' + file.name;
        this.config.videos[videoId].src = filename;
        this.config.videos[videoId].sourceType = 'file';
        this.save();
        this._renderVideoEditor();
        this._renderVideoList();
    },

    // ===== 360° PREVIEW OVERLAY =====

    // Camera eye height in the VR scene
    _eyeHeight: 1.6,

    /**
     * Convert 3D button position to 2D percentage on equirectangular preview.
     * Returns { x: 0-100, y: 0-100 } or null if invalid.
     */
    _positionToPreview(pos) {
        const x = pos.x || 0;
        const y = pos.y || 1.2;
        const z = pos.z || -4;

        // Horizontal angle: atan2(x, -z) → 0 = straight ahead
        const theta = Math.atan2(x, -z);
        // Vertical angle relative to eye height
        const dist = Math.sqrt(x * x + z * z);
        const phi = Math.atan2(y - this._eyeHeight, dist);

        // Map to percentage (equirectangular projection)
        // theta: -π..π → 0..100%
        // phi: π/2..-π/2 → 0..100%
        const percentX = 50 + (theta / Math.PI) * 50;
        const percentY = 50 - (phi / (Math.PI / 2)) * 50;

        return { x: percentX, y: percentY };
    },

    /**
     * Convert a 2D preview percentage position back to 3D position.
     * Keeps the same distance from camera as the original Z.
     */
    _previewToPosition(percentX, percentY, originalZ) {
        const dist = Math.abs(originalZ || -4);

        // Reverse the equirectangular mapping
        const theta = ((percentX - 50) / 50) * Math.PI;
        const phi = ((50 - percentY) / 50) * (Math.PI / 2);

        // Convert back to 3D
        const newX = Math.tan(theta) * dist;
        const horizDist = Math.sqrt(dist * dist + newX * newX);
        const newY = this._eyeHeight + Math.tan(phi) * horizDist;
        const newZ = -dist;

        return {
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
            z: Math.round(newZ * 10) / 10
        };
    },

    /**
     * Calculate the angular size of a button in pixels on the preview.
     */
    _buttonSizeOnPreview(btn, style, overlayRect) {
        const dist = Math.sqrt(
            Math.pow(btn.position?.x || 0, 2) +
            Math.pow(btn.position?.z || -4, 2)
        );
        const w = style.width || 2;
        const h = style.height || 0.5;

        // Angular size in radians
        const angW = 2 * Math.atan(w / 2 / dist);
        const angH = 2 * Math.atan(h / 2 / dist);

        // Map to preview pixels
        const pxW = (angW / (2 * Math.PI)) * overlayRect.width;
        const pxH = (angH / Math.PI) * overlayRect.height;

        return {
            width: Math.max(30, pxW),
            height: Math.max(16, pxH)
        };
    },

    /**
     * Size the overlay to match the actual video content area
     * (accounting for letterboxing/pillarboxing inside the video element).
     */
    _sizeOverlayToVideo() {
        const overlay = document.getElementById('preview-overlay');
        const videoEl = document.getElementById('preview-video');
        const container = document.getElementById('preview-container');
        if (!overlay || !container) return;

        const containerRect = container.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) return;

        // No video loaded: use container with 2:1 equirectangular aspect
        if (!videoEl || videoEl.style.display === 'none' || !videoEl.videoWidth) {
            const aspect = 2;
            const cAspect = containerRect.width / containerRect.height;
            let w, h, l, t;
            if (cAspect > aspect) {
                h = containerRect.height; w = h * aspect;
                t = 0; l = (containerRect.width - w) / 2;
            } else {
                w = containerRect.width; h = w / aspect;
                l = 0; t = (containerRect.height - h) / 2;
            }
            overlay.style.left = l + 'px';
            overlay.style.top = t + 'px';
            overlay.style.width = w + 'px';
            overlay.style.height = h + 'px';
            return;
        }

        // Get video element position relative to container
        const videoRect = videoEl.getBoundingClientRect();
        const relLeft = videoRect.left - containerRect.left;
        const relTop = videoRect.top - containerRect.top;

        // Calculate content area within video element (object-fit: contain behavior)
        const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
        const elAspect = videoRect.width / videoRect.height;

        let contentW, contentH, offsetX, offsetY;
        if (elAspect > videoAspect) {
            // Element wider than content → pillarboxing
            contentH = videoRect.height;
            contentW = contentH * videoAspect;
            offsetX = (videoRect.width - contentW) / 2;
            offsetY = 0;
        } else {
            // Element taller than content → letterboxing
            contentW = videoRect.width;
            contentH = contentW / videoAspect;
            offsetX = 0;
            offsetY = (videoRect.height - contentH) / 2;
        }

        overlay.style.left = (relLeft + offsetX) + 'px';
        overlay.style.top = (relTop + offsetY) + 'px';
        overlay.style.width = contentW + 'px';
        overlay.style.height = contentH + 'px';
    },

    /**
     * Render button position indicators on the video preview overlay.
     */
    _renderPreviewOverlay() {
        const overlay = document.getElementById('preview-overlay');
        if (!overlay) return;

        const video = this.config.videos[this.selectedVideoId];
        if (!video || !video.buttons || video.buttons.length === 0) {
            overlay.innerHTML = '';
            return;
        }

        // Size the overlay to match actual video content
        this._sizeOverlayToVideo();

        const overlayRect = overlay.getBoundingClientRect();
        if (overlayRect.width === 0 || overlayRect.height === 0) return;

        let html = '';

        // FOV indicator (~90° horizontal = what Quest roughly shows)
        const fovLeft = 50 - (45 / 180) * 50; // 45° left
        const fovRight = 50 + (45 / 180) * 50; // 45° right
        html += `<div class="preview-overlay-fov" style="left: ${fovLeft}%; width: ${fovRight - fovLeft}%;"></div>`;

        // Center crosshair (camera look direction)
        html += `<div class="preview-overlay-crosshair" style="left: 50%; top: 50%;"></div>`;

        video.buttons.forEach((btn, index) => {
            const pos = this._positionToPreview(btn.position || { x: 0, y: 1.2, z: -4 });
            if (!pos) return;

            const style = Object.assign({}, this.config.defaultButtonStyle, btn.style || {});
            const size = this._buttonSizeOnPreview(btn, style, overlayRect);
            const isSelected = this.selectedButtonIndex === index;

            const bgStyle = style.backgroundImage
                ? `background-image: url('${this._escapeHtml(style.backgroundImage)}'); background-size: cover;`
                : `background-color: ${style.backgroundColor};`;

            html += `
                <div class="preview-overlay-btn ${isSelected ? 'selected' : ''}"
                     data-btn-index="${index}"
                     style="left: ${pos.x}%; top: ${pos.y}%;
                            width: ${size.width}px; height: ${size.height}px;
                            ${bgStyle} color: ${style.textColor}; opacity: ${style.opacity};"
                     onmousedown="Editor._startOverlayDrag(event, ${index})"
                     onclick="Editor.selectButton(${index})">
                    ${this._escapeHtml(btn.text || '')}
                    <span class="overlay-btn-label">${this._escapeHtml(btn.text || 'Knop ' + (index + 1))}</span>
                </div>
            `;
        });

        overlay.innerHTML = html;
    },

    // ===== OVERLAY DRAG & DROP (reposition buttons) =====
    _dragState: null,

    _startOverlayDrag(e, btnIndex) {
        e.preventDefault();
        e.stopPropagation();

        const overlay = document.getElementById('preview-overlay');
        const overlayRect = overlay.getBoundingClientRect();
        const el = e.currentTarget;

        this._dragState = {
            index: btnIndex,
            element: el,
            overlayRect: overlayRect,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startLeft: parseFloat(el.style.left),
            startTop: parseFloat(el.style.top),
            originalZ: this.config.videos[this.selectedVideoId].buttons[btnIndex].position?.z || -4,
            moved: false
        };

        el.classList.add('dragging');

        // Select this button
        this.selectedButtonIndex = btnIndex;
        this._renderButtonEditor();
        this._renderButtonList(this.config.videos[this.selectedVideoId].buttons || []);

        document.addEventListener('mousemove', this._onOverlayDrag);
        document.addEventListener('mouseup', this._onOverlayDragEnd);
    },

    _onOverlayDrag: function(e) {
        const state = Editor._dragState;
        if (!state) return;

        const dx = e.clientX - state.startMouseX;
        const dy = e.clientY - state.startMouseY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            state.moved = true;
        }

        const newPercentX = state.startLeft + (dx / state.overlayRect.width) * 100;
        const newPercentY = state.startTop + (dy / state.overlayRect.height) * 100;

        // Clamp
        const clampedX = Math.max(0, Math.min(100, newPercentX));
        const clampedY = Math.max(0, Math.min(100, newPercentY));

        state.element.style.left = clampedX + '%';
        state.element.style.top = clampedY + '%';

        state.currentX = clampedX;
        state.currentY = clampedY;
    },

    _onOverlayDragEnd: function(e) {
        const state = Editor._dragState;
        if (!state) return;

        state.element.classList.remove('dragging');

        document.removeEventListener('mousemove', Editor._onOverlayDrag);
        document.removeEventListener('mouseup', Editor._onOverlayDragEnd);

        if (state.moved && state.currentX !== undefined) {
            // Convert back to 3D position
            const newPos = Editor._previewToPosition(state.currentX, state.currentY, state.originalZ);
            const btn = Editor.config.videos[Editor.selectedVideoId].buttons[state.index];
            btn.position = newPos;

            Editor.save();

            // Update the position fields if this button is being edited
            if (Editor.selectedButtonIndex === state.index) {
                document.getElementById("btn-edit-pos-x").value = newPos.x;
                document.getElementById("btn-edit-pos-y").value = newPos.y;
                document.getElementById("btn-edit-pos-z").value = newPos.z;
            }

            Editor._renderButtonList(Editor.config.videos[Editor.selectedVideoId].buttons || []);
        }

        Editor._dragState = null;
    }
};

// ===== START =====
document.addEventListener("DOMContentLoaded", () => {
    Editor.init();
    Editor._initDragDrop();

    // Re-render overlay on resize
    window.addEventListener('resize', () => {
        if (Editor.selectedVideoId) {
            Editor._renderPreviewOverlay();
        }
    });
});
