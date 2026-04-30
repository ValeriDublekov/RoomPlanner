/**
 * Formats a distance in pixels to a human-readable string in centimeters.
 */
export const formatDistance = (pixels: number, pixelsPerCm: number): string => {
  return `${(pixels / pixelsPerCm).toFixed(1)} cm`;
};
