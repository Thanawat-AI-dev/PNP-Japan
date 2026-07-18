import { loadImageBitmap } from "./image";

/** Re-encodes the slip as WebP quality 80 before upload (spec section 5 "เก็บไฟล์สลิป"). */
export async function compressToWebp(file: File): Promise<Blob> {
  const bitmap = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/webp",
      0.8,
    );
  });
}
