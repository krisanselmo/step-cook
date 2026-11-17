const MAX_SIDE = 1600;
const QUALITY = 0.82;

/**
 * Phone photos run to several MB: resized to MAX_SIDE as JPEG before upload.
 * The original goes as is when it cannot be decoded (HEIC on most browsers)
 * or would not shrink.
 */
export const shrinkPhoto = async (file: File): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );

    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
};
