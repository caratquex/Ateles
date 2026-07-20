# Ateles 🌿🎨
> *An interactive art therapy and generative physics playground.*

Ateles is a mobile-first web application designed as an ambient, interactive art-therapy space. Users begin by drawing freeform shapes ("their ego") and transform their artwork into an interactive, physics-governed creature that reacts to touch, movement, and device acceleration.

---

## 🎨 Key Features

1. **The Canvas Dashboard (Creation):** A minimalist interface featuring multiple custom brush types (Round, Square, Line, and Stamps), variable size/opacity sliders, and a color palette manager.
2. **Interactive Physics (Shatter & Reform):** Users shake their device to "break" their drawing into dynamic physics shards. Shards reform into an interactive organism that orbits and reacts to touch.
3. **The 7 Shake Modes:**
   - **Chaos:** Standard organic breathing and swirling motions using sine wave offsets.
   - **Orbits:** Shards sort by distance and align onto non-overlapping concentric circles.
   - **Fluid (Perlin):** Particles follow a 2D Perlin Noise field, leaving smooth trailing currents.
   - **Matrix:** Freeform coordinates snap to a grid with symmetrical mirroring for a digital aesthetic.
   - **Web:** Connects nearest particles with vector lines to form a crystalline architecture.
   - **Mandala Wave:** Concentric rings of particles counter-rotate and undulate like mechanical gears.
   - **Emblem:** Sorts shards by size, placing the largest at the center and arranging others symmetrically.
4. **Procedural FM Audio Synthesis:** Integrated real-time synthesis powered by **Tone.js**. Audio behaves dynamically:
   - Volume couples with brush stroke drawing velocity.
   - Timbre/modulation shifts depending on active brush types.
   - Dissonance and chord density progressively ramp up as the user shakes the device (up to 5 levels of tension).
   - Resolves into a warm, ambient `CMaj9` chord when the creature blooms.
5. **Installable PWA (Progressive Web App):** Built-in custom Service Worker (`public/sw.js`) that caches static assets and heavy external machine learning libraries (MediaPipe, Tone.js) so the application works completely offline.
6. **Dynamic Theming:** Dynamic 60-30-10 color theme engine providing curated aesthetic templates (Japandi, Bauhaus, Candy, Cyberpunk, Nature, and Retro).

---

## 🛠️ Technical Stack

- **Framework:** Svelte (Vite)
- **Visuals & Physics:** p5.js
- **Audio:** Tone.js (via Web Audio API)
- **Computer Vision:** MediaPipe Hands (Hand tracking and gesture integration)
- **Platform:** Progressive Web App (PWA) with native mobile hardware triggers (Haptic/Vibration & DeviceMotionEvent)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd "Ateles - ver 2"
   ```
2. Install local dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📱 Mobile Setup & Fullscreen Testing
To run Ateles on a mobile device over your local network in true standalone/fullscreen mode:

1. Connect both your PC and phone to the same Wi-Fi network.
2. Run `npm run dev` and find your local IP address (e.g., `https://192.168.1.5:5173`).
3. Open Chrome on your Android device and visit the URL. 
4. **Security Override:** Since the local connection uses a self-signed HTTPS certificate, Chrome will warn you. To enable PWA installation, navigate on your mobile Chrome to:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
   Paste your local server URL into the box, change the dropdown to **Enabled**, and relaunch Chrome.
5. Tap the three-dot menu and select **"Install App"** (or **"Add to Home Screen"**). The app will build on your device, hide the browser URL bar, and launch in complete fullscreen!

---

## 📂 Project Structure
- `src/lib/audio.js` — Procedural Web Audio engine (Tone.js wrapper).
- `src/P5Canvas.svelte` — Main canvas drawing system, shard physics loops, and gesture integration.
- `src/DrawingTracker.js` — Bounding box, grid metrics, and HUD rendering logic for the drawing tracker.
- `src/Home.svelte` — Settings dashboard, theme variables, and tool overlays.
- `public/sw.js` — Custom service worker caching script for offline capabilities.
- `public/manifest.json` — PWA configuration (display, theme coloring, icons).
- `DESIGN_SYSTEM.md` — In-depth UI design system tokens and visual guidelines.
