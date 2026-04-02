# 🎬 Interactieve VR Video — Meta Quest 3

Een interactieve 360° VR video-speler voor de **Meta Quest 3**. Navigeer tussen video's met aanpasbare buttons — een soort "kies je eigen avontuur" maar dan in VR.

---

## 📁 Projectstructuur

```
Interactieve VR Video/
├── index.html              ← Hoofdpagina (open deze in de browser)
├── css/
│   └── style.css           ← Styling voor het startscherm
├── js/
│   ├── config.js           ← ⭐ HIER PAS JE ALLES AAN (video's, buttons, stijlen)
│   ├── video-manager.js    ← Beheert het laden en afspelen van video's
│   ├── button-factory.js   ← Maakt de interactieve VR buttons
│   └── app.js              ← Hoofdlogica
├── videos/                 ← Plaats hier je 360° video's
│   ├── intro.mp4
│   ├── route-a.mp4
│   ├── route-b.mp4
│   └── einde.mp4
└── images/                 ← Optioneel: afbeeldingen voor buttons
    └── (je eigen afbeeldingen)
```

---

## 🚀 Snel starten

### 1. Video's toevoegen
Plaats je 360° video's (MP4 formaat, equirectangular) in de `videos/` map.

### 2. Config aanpassen
Open `js/config.js` en pas de video's en buttons aan. Zie het voorbeeld dat er al in staat.

### 3. Webserver starten
De app moet via een webserver draaien (niet zomaar het bestand openen).

**Optie A — Python (makkelijkst):**
```bash
cd "q:\Interactieve VR Video"
python -m http.server 8080
```

**Optie B — Node.js:**
```bash
npx http-server -p 8080 --cors
```

**Optie C — VS Code extensie:**
Installeer de "Live Server" extensie en klik op "Go Live".

### 4. Op de Meta Quest 3 openen
1. Zorg dat je Quest 3 op hetzelfde Wi-Fi netwerk zit als je computer
2. Zoek het IP-adres van je computer (bijv. `ipconfig` in CMD)
3. Open de **Meta Quest Browser** op je headset
4. Ga naar: `http://JOUW-IP:8080`
5. Klik op "Start VR Ervaring"
6. Klik op het VR-bril icoontje om in VR-modus te gaan

---

## ⚙️ Config aanpassen — `js/config.js`

### Een video toevoegen

```javascript
"mijn-video": {
    src: "videos/mijn-video.mp4",
    loop: true,    // of false
    buttons: [
        // buttons hier...
    ]
}
```

### Een button toevoegen

```javascript
{
    id: "mijn-button",           // Uniek ID
    text: "Klik hier!",          // Tekst op de button (emoji's werken!)
    goTo: "andere-video",        // Naar welke video (ID uit de config)
    position: { x: 0, y: 1.5, z: -4 },  // Positie in 3D ruimte
    rotation: { x: 0, y: 0, z: 0 },     // Richting van de button
    style: {
        backgroundColor: "#2196F3",   // Achtergrondkleur
        textColor: "#FFFFFF",          // Tekstkleur
        width: 2.5,                    // Breedte
        height: 0.6,                   // Hoogte
        borderRadius: 0.08,            // Afronding
        fontSize: 3,                   // Tekstgrootte
        opacity: 0.95,                 // Doorzichtigheid (0-1)
        hoverColor: "#1565C0",         // Kleur bij hover
        // backgroundImage: "images/mijn-foto.jpg",  // Optioneel
        // icon: "images/mijn-icoon.png",             // Optioneel
    }
}
```

### Positie uitleg

De positie is in meters, relatief aan het midden van de scene:
- **x**: links/rechts (negatief = links, positief = rechts)
- **y**: boven/onder (1.6 = ooghoogte, hoger = boven je)
- **z**: voor/achter (negatief = voor je, -4 is comfortabele kijkafstand)

```
        y+  (omhoog)
        |
        |
  x- ---|--- x+  (links/rechts)
        |
        |
        y-  (omlaag)

  z- = voor je (waar je naar kijkt)
  z+ = achter je
```

---

## 🎮 Bediening

| Methode | Actie |
|---------|-------|
| **Gaze (kijken)** | Kijk 2 seconden naar een button om te klikken |
| **Quest Controller** | Wijs met de laserpointer en druk op de trigger |
| **Spatiebalk** | Pauzeer/hervat video (desktop) |

---

## 📹 Video formaat tips

- **Formaat:** MP4 met H.264 codec
- **Projectie:** Equirectangular (standaard 360° formaat)
- **Resolutie:** 4K (3840x2160) voor beste kwaliteit, 2K werkt ook
- **Stereo:** Mono (2D 360°) of Side-by-Side stereo
- **Tip:** Gebruik Handbrake of FFmpeg om video's te converteren

FFmpeg voorbeeld (comprimeren voor web):
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

---

## 🎨 Button ontwerp mogelijkheden

| Eigenschap | Wat het doet | Voorbeeld |
|---|---|---|
| `backgroundColor` | Achtergrondkleur | `"#FF5722"` |
| `textColor` | Kleur van de tekst | `"#FFFFFF"` |
| `width` | Breedte in meters | `2.5` |
| `height` | Hoogte in meters | `0.6` |
| `borderRadius` | Afronding hoeken | `0.1` |
| `fontSize` | Grootte van de tekst | `3` |
| `opacity` | Doorzichtigheid | `0.9` |
| `hoverColor` | Kleur bij hover | `"#1565C0"` |
| `backgroundImage` | Afbeelding als achtergrond | `"images/foto.jpg"` |
| `icon` | Klein icoon naast tekst | `"images/icoon.png"` |

---

## ❓ Veelgestelde vragen

**Q: De video speelt niet af op Quest?**
- Zorg dat je via een webserver serveert (niet `file://`)
- Check of de video MP4/H.264 formaat is
- Probeer een kleinere resolutie

**Q: De buttons zijn niet zichtbaar?**
- Check de `position` waarden in config.js
- Zorg dat z negatief is (voor je)
- Probeer y op 1.2-1.5 te zetten (ooghoogte)

**Q: Kan ik eigen afbeeldingen als buttons gebruiken?**
- Ja! Gebruik `backgroundImage` in de style van een button
- Plaats de afbeelding in de `images/` map

**Q: Hoe voeg ik meer keuzemomenten toe?**
- Voeg gewoon meer video's toe in `config.js`
- Elke video kan buttons hebben die naar andere video's leiden
- Je kunt een hele boomstructuur van keuzes maken!
