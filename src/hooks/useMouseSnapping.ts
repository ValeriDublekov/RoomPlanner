import { useCallback } from 'react';
import { useStore } from '../store';
import { getSnappedPosition, getOrthoPoint, getSnappedFurniturePosition } from '../lib/geometry';
import { Vector2d } from '../types';

export const useMouseSnapping = (mousePos: { x: number, y: number }, isCtrlPressed: boolean, isAltPressed: boolean) => {
    const {
    scale,
    mode,
    activeLayer,
    rooms,
    furniture,
    snapToGrid,
    snapToObjects,
    snapToImage,
    edgeMap,
    backgroundPosition,
    backgroundScale,
    backgroundRotation,
    orthoMode,
    roomPoints,
    measurePoints,
    pixelsPerCm,
    pendingFurniture
  } = useStore();

  const getSnappedMousePos = useCallback((forceIgnoreGrid = false): Vector2d & { suggestedRotation?: number } => {
    let pos = { ...mousePos };
    let suggestedRotation: number | undefined = undefined;

    if (isAltPressed) return pos;

    // 1. Vector/Image/Box Snapping
    const snapThreshold = 10 / scale;
    const shouldSnapToImage = snapToImage && activeLayer === 'room';
    
    let snapped: Vector2d & { suggestedRotation?: number } = { ...pos };
    if (snapToObjects) {
      if (mode === 'place-furniture' && pendingFurniture) {
        // Advanced box-to-box/box-to-wall snapping for placement
        const snappedRes = getSnappedFurniturePosition(
          pos,
          pendingFurniture.width,
          pendingFurniture.height,
          pendingFurniture.rotation,
          rooms,
          furniture,
          15 / scale // Slightly higher threshold for box snapping
        );
        snapped = snappedRes;
        suggestedRotation = snappedRes.suggestedRotation;
      } else {
        // Standard point/edge snapping for cursor
        const lastPoint = (mode === 'draw-room' || mode === 'draw-furniture' || mode === 'draw-beam') && roomPoints.length > 0
          ? roomPoints[roomPoints.length - 1]
          : (mode === 'measure' || mode === 'dimension') && measurePoints.length > 0
            ? measurePoints[measurePoints.length - 1]
            : null;

        snapped = getSnappedPosition(
          pos, 
          rooms, 
          furniture, 
          snapThreshold, 
          shouldSnapToImage ? edgeMap : null,
          { x: backgroundPosition.x, y: backgroundPosition.y, scale: backgroundScale, rotation: backgroundRotation },
          lastPoint
        );
      }
    }
    
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
    const drawingModes = ['draw-room', 'draw-furniture', 'measure', 'dimension', 'draw-beam'];
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

    return { ...pos, suggestedRotation };
  }, [mousePos, isCtrlPressed, orthoMode, snapToGrid, snapToObjects, mode, roomPoints, measurePoints, rooms, furniture, pendingFurniture, scale, pixelsPerCm, snapToImage, edgeMap, backgroundPosition, backgroundScale, backgroundRotation]);

  return { getSnappedMousePos };
};
