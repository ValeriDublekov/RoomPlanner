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

    // 1. Vector/Image Snapping
    const snapThreshold = 10 / scale;
    const snapped = getSnappedPosition(
      pos, 
      rooms, 
      furniture, 
      snapThreshold, 
      snapToImage ? edgeMap : null,
      { x: backgroundPosition.x, y: backgroundPosition.y, scale: backgroundScale, rotation: backgroundRotation }
    );
    
    let hasSnappedToVector = false;
    if (snapped.x !== pos.x || snapped.y !== pos.y) {
      pos = snapped;
      hasSnappedToVector = true;
    }

    // 2. Grid Snapping (only if not snapped to a vector/vertex)
    if (snapToGrid && !forceIgnoreGrid && !hasSnappedToVector) {
      const gridPx = 10 * pixelsPerCm;
      pos.x = Math.round(pos.x / gridPx) * gridPx;
      pos.y = Math.round(pos.y / gridPx) * gridPx;
    }

    // 3. Ortho Snapping (Highest priority for drawing/measuring)
    const isOrthoActive = orthoMode || isCtrlPressed;
    const drawingModes = ['draw-room', 'draw-furniture', 'measure', 'dimension'];
    if (drawingModes.includes(mode) && isOrthoActive) {
      const lastPoint = (mode === 'measure' || mode === 'dimension') 
        ? (measurePoints.length > 0 ? measurePoints[measurePoints.length - 1] : null)
        : (roomPoints.length > 0 ? roomPoints[roomPoints.length - 1] : null);
        
      if (lastPoint) {
        pos = getOrthoPoint(lastPoint, pos);
        
        // If grid is also on, re-snap the non-fixed coordinate to grid
        if (snapToGrid && !forceIgnoreGrid && !hasSnappedToVector) {
          const gridPx = 10 * pixelsPerCm;
          const dx = Math.abs(pos.x - lastPoint.x);
          const dy = Math.abs(pos.y - lastPoint.y);
          if (dx > dy) {
            // Horizontal line, snap x
            pos.x = Math.round(pos.x / gridPx) * gridPx;
          } else {
            // Vertical line, snap y
            pos.y = Math.round(pos.y / gridPx) * gridPx;
          }
        }
      }
    }

    return pos;
  }, [mousePos, isCtrlPressed, orthoMode, snapToGrid, mode, roomPoints, measurePoints, rooms, furniture, scale, pixelsPerCm, snapToImage, edgeMap, backgroundPosition, backgroundScale, backgroundRotation]);

  return { getSnappedMousePos };
};
