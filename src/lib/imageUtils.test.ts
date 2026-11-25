import { describe, it, expect } from 'vitest';
import {
  clampCropRect,
  computeCroppedBackgroundTransform,
  formatBytes,
  getUtf8ByteLength,
} from './imageUtils';

describe('imageUtils', () => {
  it('computes UTF-8 byte length accurately including non-ASCII characters', () => {
    expect(getUtf8ByteLength('abc')).toBe(3);
    // Cyrillic characters are 2 bytes each in UTF-8
    expect(getUtf8ByteLength('План')).toBe(8);
  });

  it('formats byte sizes cleanly', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.50 MB');
  });

  it('clamps crop rectangles within [0, 1] bounds with minimum size', () => {
    expect(clampCropRect({ x: -0.2, y: -0.1, width: 0.5, height: 0.5 })).toEqual({
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
    });

    expect(clampCropRect({ x: 0.9, y: 0.9, width: 0.3, height: 0.3 })).toEqual({
      x: 0.7,
      y: 0.7,
      width: 0.3,
      height: 0.3,
    });

    expect(clampCropRect({ x: 0.5, y: 0.5, width: 0.01, height: 0.01 }, 0.08)).toEqual({
      x: 0.5,
      y: 0.5,
      width: 0.08,
      height: 0.08,
    });
  });

  it('preserves world-space alignment when cropping and downscaling an existing blueprint', () => {
    // 2000x1000 image at (100, 50) scale 1: crop right half [0.5, 0.25, 0.5, 0.5], output 500x250
    const res = computeCroppedBackgroundTransform({
      currentTransform: { x: 100, y: 50, scale: 1, rotation: 0 },
      crop: { x: 0.5, y: 0.25, width: 0.5, height: 0.5 },
      rotationDeg: 0,
      sourceWidth: 2000,
      sourceHeight: 1000,
      outputWidth: 500,
      outputHeight: 250,
    });

    expect(res.x).toBeCloseTo(1100);
    expect(res.y).toBeCloseTo(300);
    expect(res.scale).toBeCloseTo(2);
    expect(res.rotation).toBe(0);
  });

  it('preserves world-space scale when compressing without cropping', () => {
    const res = computeCroppedBackgroundTransform({
      currentTransform: { x: 0, y: 0, scale: 1.5, rotation: 90 },
      crop: { x: 0, y: 0, width: 1, height: 1 },
      rotationDeg: 0,
      sourceWidth: 2400,
      sourceHeight: 1200,
      outputWidth: 1200,
      outputHeight: 600,
    });

    expect(res.x).toBeCloseTo(0);
    expect(res.y).toBeCloseTo(0);
    expect(res.scale).toBeCloseTo(3);
    expect(res.rotation).toBe(90);
  });
});
