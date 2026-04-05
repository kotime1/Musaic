// ─── Canvas Renderer ──────────────────────────────────────────────────────────
// Draws the wallpaper onto an HTMLCanvasElement.

import { computeLayout } from './layout.js';

/**
 * Draw the full wallpaper to a canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} config
 * @param {string}   config.backgroundColor   - CSS color string
 * @param {string}   [config.backgroundImage] - URL for custom background
 * @param {number}   config.backgroundDim     - 0–1 dimming factor
 * @param {Array}    config.cells             - [{ imageUrl, label }]
 * @param {'grid'|'brick'} config.theme
 * @param {number}   config.gap
 * @param {number}   config.padding
 * @param {number}   config.borderRadius      - px
 */
export async function renderWallpaper(canvas, config) {
  const {
    backgroundColor = 'rgb(15, 15, 20)',
    backgroundImage = null,
    backgroundDim = 0.4,
    cells = [],
    theme = 'grid',
    gap = 12,
    padding = 24,
    borderRadius = 8,
  } = config;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Background ──────────────────────────────────────────────────────────────
  if (backgroundImage) {
    const img = await loadImage(backgroundImage);
    ctx.drawImage(img, 0, 0, W, H);
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, W, H);
  }

  // Dim overlay
  if (backgroundDim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${backgroundDim})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Cell layout ─────────────────────────────────────────────────────────────
  const n = cells.length;
  const { cells: layout } = computeLayout({ n, theme, canvasW: W, canvasH: H, gap, padding });

  for (let i = 0; i < layout.length; i++) {
    const { x, y, width, height } = layout[i];
    const cell = cells[i];

    if (!cell?.imageUrl) {
      // Empty placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, x, y, width, height, borderRadius);
      ctx.fill();
      continue;
    }

    try {
      const img = await loadImage(cell.imageUrl);
      ctx.save();
      roundRect(ctx, x, y, width, height, borderRadius);
      ctx.clip();
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
    } catch {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, x, y, width, height, borderRadius);
      ctx.fill();
    }
  }
}

/**
 * Export canvas as a PNG download.
 */
export function exportAsPNG(canvas, filename = 'musaic-wallpaper.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src}`));
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
