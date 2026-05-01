import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { FurnitureObject } from '../../types';
import { rotatePoint, scalePoints } from '../../lib/geometry';
import { migrateFurnitureMaterials } from '../../lib/materials';
import { INTERIOR_THEMES, applyThemeToFurniture } from '../../lib/themes';

export interface FurnitureSlice {
  furniture: FurnitureObject[];
  selectedId: string | null;
  selectedIds: string[];
  clipboard: FurnitureObject | null;

  addFurniture: (item: Omit<FurnitureObject, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  deleteSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

export const createFurnitureSlice: StateCreator<AppState, [], [], FurnitureSlice> = (set, get) => ({
  furniture: [],
  selectedId: null,
  selectedIds: [],
  clipboard: null,

  addFurniture: (item) => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    let newItem = migrateFurnitureMaterials({ ...item, id: Math.random().toString(36).substr(2, 9) } as FurnitureObject);
    
    // Apply active theme if one exists
    if (state.activeThemeId) {
      const theme = INTERIOR_THEMES.find(t => t.id === state.activeThemeId);
      if (theme) {
        newItem = applyThemeToFurniture(newItem, theme);
      }
    }

    return {
      furniture: [...state.furniture, newItem],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  updateFurniture: (id, updates) => set((state) => {
    const newFurniture = state.furniture.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (f.type === 'polygon' && f.points && (updates.width !== undefined || updates.height !== undefined)) {
        const scaleX = updates.width !== undefined ? updates.width / f.width : 1;
        const scaleY = updates.height !== undefined ? updates.height / f.height : 1;
        updated.points = scalePoints(f.points, scaleX, scaleY);
      }
      return updated;
    });
    return { furniture: newFurniture };
  }),

  setSelectedId: (selectedId) => set({ 
    selectedId, 
    selectedIds: selectedId ? [selectedId] : [],
    selectedDimensionId: null,
    selectedRoomId: null,
    selectedWallIndex: null,
    selectedAttachmentId: null,
    selectedBeamId: null,
  }),
  
  setSelectedIds: (selectedIds) => set({ 
    selectedIds, 
    selectedId: selectedIds.length === 1 ? selectedIds[0] : null,
    selectedDimensionId: null,
    selectedRoomId: null,
    selectedWallIndex: null,
    selectedAttachmentId: null,
    selectedBeamId: null,
  }),
  
  groupSelected: () => set((state) => {
    if (state.selectedIds.length < 2) return state;
    const selectedItems = state.furniture.filter(f => state.selectedIds.includes(f.id));
    if (selectedItems.length < 2) return state;

    state.saveHistory();

    const vertices = selectedItems.flatMap(item => {
      const halfW = item.width / 2;
      const halfH = item.height / 2;
      const center = { x: item.x + halfW, y: item.y + halfH };
      const corners = [
        { x: -halfW, y: -halfH },
        { x: halfW, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH },
      ];
      return corners.map(c => rotatePoint(c, { x: 0, y: 0 }, item.rotation)).map(p => ({
        x: p.x + center.x,
        y: p.y + center.y
      }));
    });

    const minX = Math.min(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxX = Math.max(...vertices.map(v => v.x));
    const maxY = Math.max(...vertices.map(v => v.y));
    
    const width = maxX - minX;
    const height = maxY - minY;

    const groupChildren: FurnitureObject[] = selectedItems.map(item => ({
      ...item,
      x: item.x - minX,
      y: item.y - minY,
    }));

    const newGroup: FurnitureObject = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'group',
      name: 'Group',
      x: minX,
      y: minY,
      width,
      height,
      rotation: 0,
      children: groupChildren
    };

    const remainingFurniture = state.furniture.filter(f => !state.selectedIds.includes(f.id));
    
    return {
      furniture: [...remainingFurniture, newGroup],
      selectedIds: [newGroup.id],
      selectedId: newGroup.id
    };
  }),

  ungroupSelected: () => set((state) => {
    const group = state.furniture.find(f => f.id === state.selectedId && f.type === 'group');
    if (!group || !group.children) return state;

    state.saveHistory();

    const groupCenter = { x: group.x + group.width / 2, y: group.y + group.height / 2 };

    const newItems = group.children.map(child => {
      // Child center relative to group center
      const childCenterLocal = {
        x: child.x + child.width / 2 - group.width / 2,
        y: child.y + child.height / 2 - group.height / 2
      };
      
      // Rotate child center by group rotation
      const rotatedCenter = rotatePoint(childCenterLocal, { x: 0, y: 0 }, group.rotation);
      
      // World position of child center
      const worldCenter = {
        x: groupCenter.x + rotatedCenter.x,
        y: groupCenter.y + rotatedCenter.y
      };
      
      return {
        ...child,
        id: Math.random().toString(36).substr(2, 9),
        x: worldCenter.x - child.width / 2,
        y: worldCenter.y - child.height / 2,
        rotation: (child.rotation + group.rotation) % 360
      };
    });

    const remainingFurniture = state.furniture.filter(f => f.id !== group.id);
    
    return {
      furniture: [...remainingFurniture, ...newItems],
      selectedIds: newItems.map(n => n.id),
      selectedId: newItems.length === 1 ? newItems[0].id : null
    };
  }),

  deleteSelected: () => set((state) => {
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    
    if (state.activeLayer === 'furniture') {
      const idsToDelete = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
      if (idsToDelete.length > 0) {
        return {
          furniture: state.furniture.filter(f => !idsToDelete.includes(f.id)),
          selectedId: null,
          selectedIds: [],
          history: [...state.history, historyEntry].slice(-50)
        };
      }
      
      if (state.selectedDimensionId) {
        return {
          dimensions: state.dimensions.filter(d => d.id !== state.selectedDimensionId),
          selectedDimensionId: null,
          history: [...state.history, historyEntry].slice(-50)
        };
      }
    }

    if (state.activeLayer === 'room' && state.selectedRoomId) {
      return {
        rooms: state.rooms.filter(r => r.id !== state.selectedRoomId),
        selectedRoomId: null,
        history: [...state.history, historyEntry].slice(-50)
      };
    }

    return state;
  }),

  copySelected: () => set((state) => ({
    clipboard: state.furniture.find(f => f.id === state.selectedId) || null
  })),

  paste: () => set((state) => {
    if (!state.clipboard) return state;
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem = {
      ...state.clipboard,
      id: newId,
      x: state.clipboard.x + 20,
      y: state.clipboard.y + 20,
    };
    return {
      furniture: [...state.furniture, newItem],
      selectedId: newId,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  duplicateSelected: () => set((state) => {
    const idsToDuplicate = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
    if (idsToDuplicate.length === 0) return {};
    
    const itemsToDuplicate = state.furniture.filter(f => idsToDuplicate.includes(f.id));
    if (itemsToDuplicate.length === 0) return {};
    
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    const newItems = itemsToDuplicate.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      x: item.x + 20,
      y: item.y + 20,
    }));

    return {
      furniture: [...state.furniture, ...newItems],
      selectedIds: newItems.map(n => n.id),
      selectedId: newItems.length === 1 ? newItems[0].id : null,
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  bringToFront: (id) => set((state) => {
    const idsToMove = state.selectedIds.includes(id) ? state.selectedIds : [id];
    const itemsToMove = state.furniture.filter(f => idsToMove.includes(f.id));
    if (itemsToMove.length === 0) return {};
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    const others = state.furniture.filter(f => !idsToMove.includes(f.id));
    return {
      furniture: [...others, ...itemsToMove],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  sendToBack: (id) => set((state) => {
    const idsToMove = state.selectedIds.includes(id) ? state.selectedIds : [id];
    const itemsToMove = state.furniture.filter(f => idsToMove.includes(f.id));
    if (itemsToMove.length === 0) return {};
    const historyEntry = { rooms: state.rooms, furniture: state.furniture, dimensions: state.dimensions, wallAttachments: state.wallAttachments };
    const others = state.furniture.filter(f => !idsToMove.includes(f.id));
    return {
      furniture: [...itemsToMove, ...others],
      history: [...state.history, historyEntry].slice(-50)
    };
  }),

  bringForward: (id) => set((state) => {
    const index = state.furniture.findIndex(f => f.id === id);
    if (index === -1 || index === state.furniture.length - 1) return state;
    state.saveHistory();
    const newFurniture = [...state.furniture];
    [newFurniture[index], newFurniture[index + 1]] = [newFurniture[index + 1], newFurniture[index]];
    return { furniture: newFurniture };
  }),

  sendBackward: (id) => set((state) => {
    const index = state.furniture.findIndex(f => f.id === id);
    if (index === -1 || index === 0) return state;
    state.saveHistory();
    const newFurniture = [...state.furniture];
    [newFurniture[index], newFurniture[index - 1]] = [newFurniture[index - 1], newFurniture[index]];
    return { furniture: newFurniture };
  }),
});
