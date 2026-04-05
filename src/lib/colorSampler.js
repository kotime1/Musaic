// ─── Color Sampler ────────────────────────────────────────────────────────────
// Samples average color from an image URL via an offscreen canvas.
// Returns an rgb string suitable for CSS background.

/**
 * Load an image (CORS-anonymous) and compute its average RGB color.
 * Returns a CSS rgb() string, e.g. "rgb(42, 18, 71)"
 */
export async function sampleAverageColor(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64; // downsample for speed
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);

      const { data } = ctx.getImageData(0, 0, size, size);
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      resolve(`rgb(${r}, ${g}, ${b})`);
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Samples average color from multiple images and blends them equally.
 * Returns a CSS rgb() string.
 */
export async function sampleBlendedColor(imageUrls) {
  const validUrls = imageUrls.filter(Boolean);
  if (validUrls.length === 0) return 'rgb(15, 15, 20)';

  const results = await Promise.allSettled(validUrls.map(sampleAverageColor));
  const colors = results
    .filter(r => r.status === 'fulfilled')
    .map(r => {
      const match = r.value.match(/\d+/g);
      return match ? match.map(Number) : null;
    })
    .filter(Boolean);

  if (colors.length === 0) return 'rgb(15, 15, 20)';

  const avg = colors.reduce(
    (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
    [0, 0, 0]
  ).map(v => Math.round(v / colors.length));

  return `rgb(${avg[0]}, ${avg[1]}, ${avg[2]})`;
}

/**
 * Darken an rgb() color by a factor (0 = black, 1 = original).
 */
export function darkenColor(rgbString, factor = 0.5) {
  const match = rgbString.match(/\d+/g);
  if (!match) return rgbString;
  const [r, g, b] = match.map(v => Math.round(Number(v) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
