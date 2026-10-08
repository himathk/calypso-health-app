export interface PreparedImage {
  /** Base64 JPEG without the data: prefix, sized for the vision model. */
  base64: string;
  mediaType: 'image/jpeg';
  /** Full-size preview for the scanner UI. */
  previewUrl: string;
  /** Tiny thumbnail stored with the log entry. */
  thumbUrl: string;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image. Try a JPEG or PNG.'));
    };
    img.src = url;
  });
}

function draw(img: HTMLImageElement, maxSide: number, square = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  if (square) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    canvas.width = canvas.height = Math.min(maxSide, side);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Downscales a photo (phones produce 12 MP+) so uploads are fast and cheap. */
export async function prepareFoodImage(file: Blob): Promise<PreparedImage> {
  const img = await loadImage(file);
  const main = draw(img, 1280).toDataURL('image/jpeg', 0.85);
  const thumb = draw(img, 160, true).toDataURL('image/jpeg', 0.7);
  return {
    base64: main.slice(main.indexOf(',') + 1),
    mediaType: 'image/jpeg',
    previewUrl: main,
    thumbUrl: thumb,
  };
}
