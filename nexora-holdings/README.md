# NEXORA HOLDINGS — Tokyo Tech Holding Site

A hyper-dynamic, cyberpunk-style website. No build step, no dependencies (fonts load from Google Fonts when online).

## Run it in VS Code
1. Unzip, then `File → Open Folder…` and pick `nexora-holdings`.
2. Install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.
   (Or just double-click `index.html` to open it in a browser.)

## Features
- Neural particle background that reacts to your mouse
- Glitch headline, rotating typed text, live Tokyo (JST) clock
- 3D tilt portfolio cards, animated counters, scroll reveals, radar HQ map
- **Drive There Virtually**: pseudo-3D neon road to Nexora Tower
  (arrow keys / WASD, Space = turbo, ESC to exit, touch buttons on mobile)
- **Zoom briefing**: booking form that downloads a calendar `.ics` and opens your Zoom link
- Command palette: `Ctrl/Cmd + K`

## Customize
- Open `main.js` and edit `CONFIG` at the top — set your real `zoomLink`.
- Company name, addresses and portfolio names are fictional placeholders in `index.html`.
- Colors live in `:root` at the top of `style.css`.

## Files
- `index.html` — structure and content
- `style.css` — styling and animation
- `main.js` — all interactivity and the driving engine
