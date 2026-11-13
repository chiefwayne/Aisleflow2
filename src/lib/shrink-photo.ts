// Guest photos are resized in the browser before upload: full-size phone photos (often 3–8MB) are slow on
// mobile data and exceed the 1MB limit Next.js puts on a Server Action request.
const MAX_BYTES = 900 * 1024;
const ATTEMPTS = [
  { edge: 2048, quality: 0.85 },
  { edge: 1600, quality: 0.8 },
  { edge: 1280, quality: 0.75 },
];

/** A JPEG no longer than 2048px on its longest side and under ~900KB, or the original if it can't be read. */
export async function shrinkPhoto(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  try {
    for (const { edge, quality } of ATTEMPTS) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.fillStyle = '#fff'; // transparent PNG areas become white rather than black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= MAX_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
        return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
      }
    }
    return file;
  } finally {
    bitmap.close();
  }
}
