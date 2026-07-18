// Browser-side image preprocessing for slip OCR (spec section 5, step 2):
// grayscale -> contrast/Otsu binarize -> upscale if small.
// Auto-rotate is intentionally not implemented yet (needs an orientation
// model or EXIF heuristics beyond regex-based OCR) - noted as a gap.

export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

function toCanvas(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function otsuThreshold(histogram: number[], totalPixels: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let weightB = 0;
  let maxVariance = 0;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    weightB += histogram[t];
    if (weightB === 0) continue;
    const weightF = totalPixels - weightB;
    if (weightF === 0) break;

    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const variance = weightB * weightF * (meanB - meanF) ** 2;

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

/** Returns a canvas ready for QR decoding: original scale, RGBA intact. */
export function rawCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  return toCanvas(bitmap, bitmap.width, bitmap.height);
}

/** Returns a canvas ready for OCR: grayscale, Otsu-binarized, upscaled if small. */
export function preprocessForOcr(bitmap: ImageBitmap): HTMLCanvasElement {
  const MIN_DIMENSION = 1000;
  const scale = Math.max(1, MIN_DIMENSION / Math.min(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = toCanvas(bitmap, width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const gray = new Uint8ClampedArray(width * height);
  const histogram = new Array(256).fill(0);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[p] = g;
    histogram[g]++;
  }

  const threshold = otsuThreshold(histogram, width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = gray[p] > threshold ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
