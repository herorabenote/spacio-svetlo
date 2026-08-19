# SPACIO SVETLO — Feature-Übersicht

**Kern:** Interaktive 3D-Dunkelkammer im Browser als „begehbare" Bewerbung. Echtzeit-WebGL, alles live gerendert.

## 🎬 3D-Raum & Look
- Echtzeit-3D-Labor mit **Three.js**, filmisches Tone-Mapping (ACES), weiche Schatten, Nebel, PMREM-Reflexionen
- **Prozedurale PBR-Texturen**: dreckiger Beton, gebürsteter Stahl, verrostetes Eisen (echte Roughness-/Metalness-Maps)
- Filmkorn- + Vignetten-Overlay

## 💡 Die Lampe
- Nackte Glühbirne im Käfig, hängt von der Decke
- **Echte Pendel-Physik** — schwingt vom Deckenpunkt, Schnur schwingt mit, klingt gedämpft aus
- Ausgebrannter, **gelblich-toxischer** Birnen-Ton + Glow-Halo
- **Licht geht automatisch an beim Laden**; Birne klicken oder Leertaste = aus/an
- Beleuchtet den ganzen Raum aus der einen Quelle

## 🔦 Zwei Licht-Zustände
- **AN:** toxisch-gelbe Birne belichtet den Raum
- **AUS:** rotes Dunkelkammer-Safelight + maus-gesteuerte Taschenlampe zum Erkunden

## 🖱️ Interaktive Objekte (Raycasting)
- Hovern → glühen, klicken → **Info-Panel** mit Details
- 4 Chemie-Wannen (Entwickler/Stopp/Fixierer/Wässern) + Pinzetten, 3 Braunglas-Flaschen, 6 hängende Negative, Vergrösserer, Werkbank

## 🎧 Sound (Web-Audio, an/aus)
- Räumliches Netzbrummen, das **mit der Lampe pendelt**, Ton-Shift je nach Lichtzustand, Wassertropfen, Breaker-Klick, Flacker-Funken

## 📝 Editorial-Content (Scroll unter dem Raum)
- Eleganter **Serifen-Titel „Spacio Svetlo"** (Cormorant Garamond) über dem Beton
- **Floating Layout** — keine Trennlinien, keine Rahmen, Überschriften ohne `//`, alles fliesst
- **Vision-Intro** (Digitaler Exkurs) — was ihr im Unterwerk Selnau aufbauen wollt
- **Vier Hände** — Analog (Jakob Harder) / Archiv Systems (Robin Kordik)
- **Werk-Galerie** — 6 echte Strassenfotografien von Jakob (Hongkong / New York, auf Film)
- **Das Archiv, das bleibt** — Archiv-Konzept + Live-Index
- **Archive-Daemon-Terminal**, das live tippt
- Minimaler Footer

## ⌨️ Steuerung
- **Space / Birne** → Licht · **Maus** → umsehen / Taschenlampe · **Objekt klicken** → inspizieren · **Scrollen** → Inhalt · **Audio-Button** → Ton

## 🛠️ Technik
- Vite + Three.js, statischer Build → GitHub (`herorabenote/spacio-svetlo`), deploybar auf Render/Netlify
- Sauberer Seitentitel für Link-Vorschauen

---
*Spacio Svetlo — Unterwerk Selnau, an der Sihl, Zürich. Analog belichten, digital bewahren.*
