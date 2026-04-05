// ─── Layout Engine ────────────────────────────────────────────────────────────
// Given N cells, computes column count and cell positions for two themes.

/**
 * Compute column count from cell count.
 * L = floor(sqrt(N)); if N % L !== 0, L += 1
 */
export function computeColumns(n) {
  let L = Math.floor(Math.sqrt(n));
  if (n % L !== 0) L += 1;
  return L;
}

export function computeRows(n, cols) {
  return Math.ceil(n / cols);
}

/**
 * Returns an array of { col, row, x, y, width, height } for each cell.
 *
 * @param {number} n           - Total number of cells
 * @param {'grid'|'brick'}     - Layout theme
 * @param {number} canvasW     - Canvas width in px
 * @param {number} canvasH     - Canvas height in px
 * @param {number} gap         - Gap between cells in px
 * @param {number} padding     - Outer padding in px
 */
export function computeLayout({ n, theme, canvasW, canvasH, gap = 12, padding = 24 }) {
  const cols = computeColumns(n);
  const rows = computeRows(n, cols);

  const usableW = canvasW - padding * 2;
  const usableH = canvasH - padding * 2;

  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = (usableH - gap * (rows - 1)) / rows;
  const cellSize = Math.min(cellW, cellH); // keep cells square

  const cells = [];

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    let x = padding + col * (cellSize + gap);
    const y = padding + row * (cellSize + gap);

    if (theme === 'brick' && row % 2 === 1) {
      x += cellSize / 2 + gap / 2;
    }

    cells.push({ index: i, col, row, x, y, width: cellSize, height: cellSize });
  }

  return { cells, cols, rows, cellSize };
}

/**
 * Total canvas dimensions needed to contain a layout cleanly.
 * Useful for deriving layout from a fixed device size.
 */
export function layoutBounds({ n, theme, canvasW, canvasH, gap = 12, padding = 24 }) {
  const { cells, cellSize, rows, cols } = computeLayout({
    n, theme, canvasW, canvasH, gap, padding,
  });

  const maxX = Math.max(...cells.map(c => c.x + c.width));
  const maxY = Math.max(...cells.map(c => c.y + c.height));

  return {
    contentWidth: maxX + padding,
    contentHeight: maxY + padding,
    cellSize,
    cols,
    rows,
  };
}
