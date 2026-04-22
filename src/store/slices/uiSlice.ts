import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { AppMode, LayerType, EdgeMap, Vector2d, FurnitureObject } from '../../types';

export interface UISlice {
  scale: number;
  position: Vector2d;
  mode: AppMode;
  activeLayer: LayerType;
  orthoMode: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  snapToImage: boolean;
  gridVisible: boolean;
  showAutoDimensions: boolean;
  isAltPressed: boolean;
  edgeMap: EdgeMap | null;
  show3d: boolean;
  edgeMode3d: boolean;
  isDraggingWall: boolean;
  isDraggingVertex: boolean;
  pendingFurniture: Omit<FurnitureObject, 'id'> | null;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetId: string | null;
    targetType: 'furniture' | 'room' | 'dimension' | null;
  };
  
  setScale: (scale: number) => void;
  setPosition: (position: Vector2d) => void;
  setMode: (mode: AppMode) => void;
  setActiveLayer: (layer: LayerType) => void;
  setOrthoMode: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setSnapToObjects: (enabled: boolean) => void;
  setSnapToImage: (enabled: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  setShowAutoDimensions: (visible: boolean) => void;
  setIsAltPressed: (pressed: boolean) => void;
  setEdgeMap: (map: EdgeMap | null) => void;
  setShow3d: (show: boolean) => void;
  setEdgeMode3d: (enabled: boolean) => void;
  setIsDraggingWall: (isDragging: boolean) => void;
  setIsDraggingVertex: (isDragging: boolean) => void;
  setPendingFurniture: (furniture: Omit<FurnitureObject, 'id'> | null) => void;
  setContextMenu: (menu: UISlice['contextMenu']) => void;
  moveView: (dx: number, dy: number) => void;
  resetView: () => void;
  fitToScreen: (width: number, height: number) => void;
  ensureVisible: (targetBounds: { minX: number, minY: number, maxX: number, maxY: number }, viewWidth: number, viewHeight: number) => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  mode: 'select',
  activeLayer: 'furniture',
  orthoMode: true,
  snapToGrid: true,
  snapToObjects: true,
  snapToImage: true,
  gridVisible: true,
  showAutoDimensions: false,
  isAltPressed: false,
  edgeMap: null,
  show3d: false,
  edgeMode3d: false,
  isDraggingWall: false,
  isDraggingVertex: false,
  pendingFurniture: null,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null,
  },

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setMode: (mode) => set({ mode, roomPoints: [], measurePoints: [], dimensionInput: '' }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setOrthoMode: (orthoMode) => set({ orthoMode }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setSnapToObjects: (snapToObjects) => set({ snapToObjects }),
  setSnapToImage: (snapToImage) => set({ snapToImage }),
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setShowAutoDimensions: (showAutoDimensions) => set({ showAutoDimensions }),
  setIsAltPressed: (isAltPressed) => set({ isAltPressed }),
  setEdgeMap: (edgeMap) => set({ edgeMap }),
  setShow3d: (show3d) => set({ show3d }),
  setEdgeMode3d: (edgeMode3d) => set({ edgeMode3d }),
  setIsDraggingWall: (isDraggingWall) => set({ isDraggingWall }),
  setIsDraggingVertex: (isDraggingVertex) => set({ isDraggingVertex }),
  setPendingFurniture: (pendingFurniture) => set({ pendingFurniture }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  
  moveView: (dx, dy) => set((state) => ({
    position: { x: state.position.x + dx, y: state.position.y + dy }
  })),
  
  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),
  
  fitToScreen: (width, height) => {
    const { rooms, furniture } = get();
    if (rooms.length === 0 && furniture.length === 0) {
      set({ scale: 1, position: { x: 0, y: 0 } });
      return;
    }

    const allPoints = [
      ...rooms.flatMap(r => r.points),
      ...furniture.flatMap(f => [
        { x: f.x, y: f.y },
        { x: f.x + f.width, y: f.y + f.height }
      ])
    ];

    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;

    const scaleX = (width - padding * 2) / contentWidth;
    const scaleY = (height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    set({
      scale: newScale,
      position: {
        x: width / 2 - centerX * newScale,
        y: height / 2 - centerY * newScale
      }
    });
  },

  ensureVisible: (bounds, width, height) => {
    const { scale, position } = get();
    const padding = 60; // Extra padding to account for UI elements
    
    // Convert world bounds to screen bounds
    const screenMinX = bounds.minX * scale + position.x;
    const screenMinY = bounds.minY * scale + position.y;
    const screenMaxX = bounds.maxX * scale + position.x;
    const screenMaxY = bounds.maxY * scale + position.y;

    let dx = 0;
    let dy = 0;

    // Check right edge
    if (screenMaxX > width - padding) {
      dx = (width - padding) - screenMaxX;
    }
    // Check left edge (lower priority than right edge if both don't fit, but right is what user complained about)
    if (screenMinX < padding) {
      dx = padding - screenMinX;
    }
    // Check bottom edge
    if (screenMaxY > height - padding) {
      dy = (height - padding) - screenMaxY;
    }
    // Check top edge
    if (screenMinY < padding) {
      dy = padding - screenMinY;
    }

    if (dx !== 0 || dy !== 0) {
      set({
        position: {
          x: position.x + dx,
          y: position.y + dy
        }
      });
    }
  },
});
