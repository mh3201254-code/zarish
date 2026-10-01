// Compress to WebP in the browser (max 1600px, target under ~300KB)
// so the free Supabase storage tier lasts.
export async function compressToWebP(file: File, maxDim = 1600, targetBytes = 300 * 1024): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const toBlob = (q: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), "image/webp", q),
    );

  let q = 0.86;
  let blob = await toBlob(q);
  while (blob.size > targetBytes && q > 0.4) {
    q -= 0.08;
    blob = await toBlob(q);
  }
  return blob;
}
