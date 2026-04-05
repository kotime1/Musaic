# Musaic

Turn your Spotify listening history into a phone wallpaper. Musaic pulls your top artists or albums, arranges their artwork into a grid or brick mosaic, and exports a PNG sized for your device.

---

## Features

- **Spotify OAuth** — read-only access via PKCE (no backend needed, no data stored)
- **Two cell sources** — top albums (inferred from top tracks) or top artists
- **Time ranges** — last 4 weeks, 6 months, or all time
- **Two layout themes** — ordered grid or offset brick
- **Configurable** — cell count, gap, padding, corner radius
- **Background** — auto-sampled average color from your artwork, custom solid color, or imported image with dimming
- **Device presets** — Pixel 8 Pro, iPhone 15 Pro, or custom dimensions
- **PNG export** — full resolution, ready to set as wallpaper

---

## Getting Started

### 1. Create a Spotify app

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Under Redirect URIs, add: http://localhost:5173/callback
4. Copy your Client ID

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit .env.local:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=http://localhost:5173/callback
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
src/
  lib/
    spotify.js        # Spotify OAuth (PKCE) + API client
    layout.js         # Grid and brick layout engine
    colorSampler.js   # Average color sampling from artwork
    renderer.js       # Canvas drawing and PNG export
  hooks/
    useMusaic.js      # Central app state
  pages/
    Landing.jsx       # Login screen
    Builder.jsx       # Wallpaper editor
    Callback.jsx      # OAuth redirect handler
  styles/
    global.css
```

---

## Notes

- Top Albums is derived from your top tracks — Spotify does not expose a direct top albums endpoint. Albums are ranked by how many of your top tracks belong to them.
- Images are fetched with crossOrigin anonymous. Spotify CDN supports this, so canvas export works without taint issues.
- All tokens are stored in localStorage and never sent anywhere except Spotify's API.

---

## Roadmap

- [ ] Click-to-swap individual cells from your full top items list
- [ ] Per-cell custom image import
- [ ] Blurred artwork background option
- [ ] More layout themes
