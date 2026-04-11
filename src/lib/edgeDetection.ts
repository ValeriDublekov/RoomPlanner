import { EdgeMap } from '../types';

/**
 * Processes an image to identify dark pixels (edges/walls).
 * Returns an EdgeMap containing a bitmask of dark pixels.
 */
export const processImageForEdges = (
  imageUrl: string,
  threshold: number = 100
): Promise<EdgeMap> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      const edgeData = new Uint8Array(img.width * img.height);
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple luminance check
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // If luminance is below threshold, it's a "dark" pixel (potential edge)
        if (luminance < threshold) {
          edgeData[i / 4] = 1;
        } else {
          edgeData[i / 4] = 0;
        }
      }
      
      resolve({
        data: edgeData,
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};
