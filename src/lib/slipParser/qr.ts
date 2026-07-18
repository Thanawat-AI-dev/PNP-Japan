import jsQR from "jsqr";
import { rawCanvas } from "./image";

/**
 * Reads the mini-QR commonly printed on Thai bank slips and returns its raw payload.
 * Note: this does not parse the EMVCo TLV structure into a human-readable reference
 * number (that varies by bank and would need per-bank tag mapping) - it uses the raw
 * decoded string as-is. That's still enough for exact-duplicate detection (spec
 * section 5, step 4, layer 1), since two slips for the same transaction decode to
 * the same payload.
 */
export function readQrReference(bitmap: ImageBitmap): string | null {
  const canvas = rawCanvas(bitmap);
  const ctx = canvas.getContext("2d")!;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(data, width, height);
  return result?.data ?? null;
}
