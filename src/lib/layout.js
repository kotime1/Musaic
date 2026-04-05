// ─── Layout Engine ────────────────────────────────────────────────────────────

export function computeColumns(n) {
  let L = Math.floor(Math.sqrt(n));
  if (n % L !== 0) L += 1;
  return L;
}

export function computeRows(n, cols) {
  return Math.ceil(n / cols);
}

/**
 * @param {number}  n
 * @param {'grid'|'brick'} theme
 * @param {number}  canvasW
 * @param {number}  canvasH
 * @param {number}  gap
 * @param {number}  padding
 * @param {number|null} cellSizeOverride  - explicit cell size in px; null = auto-fit
 */
export function computeLayout({ n, theme, canvasW, canvasH, gap = 12, padding = 24, cellSizeOverride = null }) {
  const cols = computeColumns(n);
  const rows = computeRows(n, cols);

  const usableW = canvasW - padding * 2;
  const usableH = canvasH - padding * 2;

  let cellSize;
  if (cellSizeOverride) {
    cellSize = cellSizeOverride;
  } else {
    // Brick odd-rows are offset right by (cellSize/2 + gap/2), so effective
    // width = cols*cellSize + (cols-1)*gap + cellSize/2 + gap/2 = usableW
    // Solving: cellSize*(cols+0.5) + gap*(cols-0.5) = usableW
    const cellW = theme === 'brick'
      ? (usableW - gap * (cols - 0.5)) / (cols + 0.5)
      : (usableW - gap * (cols - 1)) / cols;
    const cellH = (usableH - gap * (rows - 1)) / rows;
    cellSize = Math.min(cellW, cellH);
  }

  // Compute total content block size for centering
  const brickExtraW = theme === 'brick' ? cellSize / 2 + gap / 2 : 0;
  const contentW = cols * cellSize + (cols - 1) * gap + brickExtraW;
  const contentH = rows * cellSize + (rows - 1) * gap;

  const offsetX = (canvasW - contentW) / 2;
  const offsetY = (canvasH - contentH) / 2;

  const cells = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    let x = offsetX + col * (cellSize + gap);
    const y = offsetY + row * (cellSize + gap);

    if (theme === 'brick' && row % 2 === 1) {
      x += cellSize / 2 + gap / 2;
    }

    cells.push({ index: i, col, row, x, y, width: cellSize, height: cellSize });
  }

  return { cells, cols, rows, cellSize };
}

export function layoutBounds({ n, theme, canvasW, canvasH, gap = 12, padding = 24 }) {
  const { cells, cellSize, rows, cols } = computeLayout({ n, theme, canvasW, canvasH, gap, padding });
  const maxX = Math.max(...cells.map(c => c.x + c.width));
  const maxY = Math.max(...cells.map(c => c.y + c.height));
  return { contentWidth: maxX + padding, contentHeight: maxY + padding, cellSize, cols, rows };
}
