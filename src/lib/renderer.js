// ─── Canvas Renderer ──────────────────────────────────────────────────────────

import { computeLayout } from './layout.js';

export async function renderWallpaper(canvas, config) {
  const {
    backgroundColor = 'rgb(15, 15, 20)',
    backgroundImageUrl = null,       // fixed: was 'backgroundImage'
    backgroundDim = 0.4,
    cells = [],
    theme = 'grid',
    gap = 12,
    padding = 24,
    borderRadius = 8,                // treated as % of half-cell (0=square, 100=circle)
    cellSizeOverride = null,
  } = config;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Background ──────────────────────────────────────────────────────────────
  if (backgroundImageUrl) {
    try {
      const img = await loadImage(backgroundImageUrl);
      // cover-fit the background image
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, W, H);
  }

  // Dim overlay (applied regardless of background type)
  if (backgroundDim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${backgroundDim})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Cell layout ─────────────────────────────────────────────────────────────
  const n = cells.length;
  const { cells: layout, cellSize } = computeLayout({
    n, theme, canvasW: W, canvasH: H, gap, padding, cellSizeOverride,
  });

  // borderRadius is 0–100 representing % of half-cell → 0=square, 100=circle
  const r = Math.min((borderRadius / 100) * (cellSize / 2), cellSize / 2);

  for (let i = 0; i < layout.length; i++) {
    const { x, y, width, height } = layout[i];
    const cell = cells[i];

    if (!cell?.imageUrl) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, x, y, width, height, r);
      ctx.fill();
      continue;
    }

    try {
      const img = await loadImage(cell.imageUrl);
      ctx.save();
      roundRect(ctx, x, y, width, height, r);
      ctx.clip();
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
    } catch {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      roundRect(ctx, x, y, width, height, r);
      ctx.fill();
    }
  }
}

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
