// ─── Layout Engine ────────────────────────────────────────────────────────────

export function computeRows(n, cols) {
  return Math.ceil(n / cols);
}

/**
 * @param {number}       n
 * @param {number}       columns          - user-specified column count
 * @param {'grid'|'brick'} theme
 * @param {number}       canvasW
 * @param {number}       canvasH
 * @param {number}       gap              - spacing between cells
 * @param {number}       padding          - outer margin
 * @param {number|null}  cellSizeOverride - explicit px size; null = auto-fit
 */
export function computeLayout({ n, columns, theme, canvasW, canvasH, gap = 12, padding = 24, cellSizeOverride = null }) {
  const cols = Math.max(1, Math.min(columns, n)); // clamp to [1, n]
  const rows = computeRows(n, cols);

  const usableW = canvasW - padding * 2;
  const usableH = canvasH - padding * 2;

  let cellSize;
  if (cellSizeOverride) {
    cellSize = cellSizeOverride;
  } else {
    // Brick: odd rows offset right by (cellSize/2 + gap/2)
    // Effective width = cols*cellSize + (cols-1)*gap + cellSize/2 + gap/2
    // Solving for cellSize: cellSize*(cols+0.5) = usableW - gap*(cols-0.5)
    const cellW = (theme === 'brick' && cols >= 2)
      ? (usableW - gap * (cols - 0.5)) / (cols + 0.5)
      : (usableW - gap * (cols - 1)) / cols;
    const cellH = (usableH - gap * (rows - 1)) / rows;
    cellSize = Math.min(cellW, cellH);
  }

  // Center the content block on the canvas
  const brickExtraW = (theme === 'brick' && cols >= 2) ? cellSize / 2 + gap / 2 : 0;
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

    if (theme === 'brick' && cols >= 2 && row % 2 === 1) {
      x += cellSize / 2 + gap / 2;
    }

    cells.push({ index: i, col, row, x, y, width: cellSize, height: cellSize });
  }

  return { cells, cols, rows, cellSize };
}
