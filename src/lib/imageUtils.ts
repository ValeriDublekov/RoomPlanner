/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CropRect {
  /** Normalized 0..1 from left */
  x: number;
  /** Normalized 0..1 from top */
  y: number;
  /** Normalized 0..1 width */
  width: number;
  /** Normalized 0..1 height */
  height: number;
}

export interface ImageProcessOptions {
  crop?: CropRect;
  maxDimension?: number | null;
  quality?: number;
  rotationDeg?: 0 | 90 | 180 | 270;
}

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  byteSize: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

export interface BackgroundTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CroppedTransformInput {
  currentTransform: BackgroundTransform;
  crop: CropRect;
  rotationDeg: 0 | 90 | 180 | 270;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
}

/**
 * Computes the updated canvas transform when cropping/rescaling an existing blueprint
 * so that the kept portion stays aligned at its previous world-space position and scale.
 */
export const computeCroppedBackgroundTransform = ({
  currentTransform,
  crop,
  rotationDeg,
  sourceWidth,
  sourceHeight,
  outputWidth,
}: CroppedTransformInput): BackgroundTransform => {
  if (sourceWidth <= 0 || sourceHeight <= 0 || outputWidth <= 0) {
    return currentTransform;
  }

  const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
  const rotatedWidth = isQuarterTurn ? sourceHeight : sourceWidth;
  const croppedSourceWidth = crop.width * rotatedWidth;
  const newScale = currentTransform.scale * (croppedSourceWidth / outputWidth);

  if (rotationDeg === 0) {
    const rad = (currentTransform.rotation * Math.PI) / 180;
    const localX = crop.x * sourceWidth * currentTransform.scale;
    const localY = crop.y * sourceHeight * currentTransform.scale;
    const newX =
      currentTransform.x + localX * Math.cos(rad) - localY * Math.sin(rad);
    const newY =
      currentTransform.y + localX * Math.sin(rad) + localY * Math.cos(rad);

    return {
      x: newX,
      y: newY,
      scale: newScale,
      rotation: currentTransform.rotation,
    };
  }

  return {
    x: currentTransform.x,
    y: currentTransform.y,
    scale: newScale,
    rotation: currentTransform.rotation,
  };
};

/**
 * Returns the UTF-8 byte length of a string (matching Firestore's size() calculation).
 */
export const getUtf8ByteLength = (str: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
};

/**
 * Formats byte count as human-readable KB / MB string.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Clamps a normalized CropRect so it stays strictly inside [0, 1] with a minimum size.
 */
export const clampCropRect = (rect: CropRect, minSize = 0.05): CropRect => {
  const width = Math.max(minSize, Math.min(1, rect.width));
  const height = Math.max(minSize, Math.min(1, rect.height));
  const x = Math.max(0, Math.min(1 - width, rect.x));
  const y = Math.max(0, Math.min(1 - height, rect.y));
  return { x, y, width, height };
};

/**
 * Loads an image from a data URL, optionally rotates it, crops to normalized bounds,
 * resizes to maxDimension, and encodes as JPEG.
 */
export const cropAndCompressImage = (
  dataUrl: string,
  options: ImageProcessOptions = {}
): Promise<ProcessedImageResult> => {
  const {
    crop = { x: 0, y: 0, width: 1, height: 1 },
    maxDimension = 1600,
    quality = 0.85,
    rotationDeg = 0,
  } = options;

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Image === 'undefined'
  ) {
    return Promise.resolve({
      dataUrl,
      width: 0,
      height: 0,
      byteSize: getUtf8ByteLength(dataUrl),
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= 0 || img.height <= 0) {
        reject(new Error('Invalid image dimensions'));
        return;
      }

      // Step 1: Draw rotated image if rotationDeg !== 0
      const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
      const rotatedWidth = isQuarterTurn ? img.height : img.width;
      const rotatedHeight = isQuarterTurn ? img.width : img.height;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = rotatedWidth;
      sourceCanvas.height = rotatedHeight;
      const sCtx = sourceCanvas.getContext('2d');
      if (!sCtx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(0, 0, rotatedWidth, rotatedHeight);
      sCtx.save();
      sCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      sCtx.rotate((rotationDeg * Math.PI) / 180);
      sCtx.drawImage(img, -img.width / 2, -img.height / 2);
      sCtx.restore();

      // Step 2: Compute pixel crop rect on the rotated image
      const safeCrop = clampCropRect(crop);
      const sx = Math.round(safeCrop.x * rotatedWidth);
      const sy = Math.round(safeCrop.y * rotatedHeight);
      const sw = Math.max(1, Math.round(safeCrop.width * rotatedWidth));
      const sh = Math.max(1, Math.round(safeCrop.height * rotatedHeight));

      // Step 3: Scale down to maxDimension if requested
      let outW = sw;
      let outH = sh;
      if (maxDimension && (outW > maxDimension || outH > maxDimension)) {
        if (outW > outH) {
          outH = Math.max(1, Math.round((outH * maxDimension) / outW));
          outW = maxDimension;
        } else {
          outW = Math.max(1, Math.round((outW * maxDimension) / outH));
          outH = maxDimension;
        }
      }

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outW;
      outCanvas.height = outH;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) {
        reject(new Error('Output canvas context unavailable'));
        return;
      }

      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, outW, outH);
      outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outW, outH);

      const compressed = outCanvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl: compressed,
        width: outW,
        height: outH,
        byteSize: getUtf8ByteLength(compressed),
        sourceWidth: img.width,
        sourceHeight: img.height,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
};

/**
 * Resizes and compresses an image data URL so it fits comfortably within
 * storage/Firestore size limits while preserving legibility.
 */
export const compressDataUrl = async (
  dataUrl: string,
  maxDimension: number,
  quality = 0.85
): Promise<string> => {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Image === 'undefined' ||
    !dataUrl.startsWith('data:image/')
  ) {
    return dataUrl;
  }

  try {
    const result = await cropAndCompressImage(dataUrl, {
      maxDimension,
      quality,
    });
    if (result.byteSize < getUtf8ByteLength(dataUrl)) {
      return result.dataUrl;
    }
    return dataUrl;
  } catch {
    return dataUrl;
  }
};
