import { useCallback } from 'react';
import { useStore } from '../store';
import { getSnappedPosition, getOrthoPoint } from '../lib/geometry';

export const useMouseSnapping = (mousePos: { x: number, y: number }, isCtrlPressed: boolean, isAltPressed: boolean) => {
  const {
    scale,
    mode,
    rooms,
    furniture,
    snapToGrid,
    snapToImage,
    edgeMap,
    backgroundPosition,
    backgroundScale,
    backgroundRotation,
    orthoMode,
    roomPoints,
    measurePoints,
    pixelsPerCm
  } = useStore();

  const getSnappedMousePos = useCallback((forceIgnoreGrid = false) => {
    let pos = { ...mousePos };

    if (isAltPressed) return pos;

    if (snapToGrid && !forceIgnoreGrid) {
      const snapThreshold = 10 / scale;
      const snapped = getSnappedPosition(
        pos, 
        rooms, 
        furniture, 
        snapThreshold, 
        snapToImage ? edgeMap : null,
        { x: backgroundPosition.x, y: backgroundPosition.y, scale: backgroundScale, rotation: backgroundRotation }
      );
      
      if (snapped.x !== pos.x || snapped.y !== pos.y) {
        pos = snapped;
      } else {
        const gridPx = 10 * pixelsPerCm;
        pos.x = Math.round(pos.x / gridPx) * gridPx;
        pos.y = Math.round(pos.y / gridPx) * gridPx;
      }
    }

    const isOrthoActive = orthoMode || isCtrlPressed;
    if ((mode === 'draw-room' || mode === 'draw-furniture' || mode === 'measure' || mode === 'dimension') && isOrthoActive && (roomPoints.length > 0 || measurePoints.length > 0)) {
      const lastPoint = mode === 'measure' || mode === 'dimension' ? measurePoints[0] : roomPoints[roomPoints.length - 1];
      if (lastPoint) {
        pos = getOrthoPoint(lastPoint, pos);
      }
    }

    return pos;
  }, [mousePos, isCtrlPressed, orthoMode, snapToGrid, mode, roomPoints, measurePoints, rooms, furniture, scale, pixelsPerCm, snapToImage, edgeMap, backgroundPosition, backgroundScale, backgroundRotation]);

  return { getSnappedMousePos };
};
