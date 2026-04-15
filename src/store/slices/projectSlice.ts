import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { HistoryEntry, Vector2d } from '../../types';
import { rotatePoint } from '../../lib/geometry';

export interface ProjectSlice {
  projectName: string;
  pixelsPerCm: number;
  backgroundImage: string | null;
  backgroundVisible: boolean;
  backgroundOpacity: number;
  backgroundPosition: Vector2d;
  backgroundScale: number;
  backgroundRotation: number;
  calibrationPoints: Vector2d[] | null;
  tempCalibrationDist: number | null;
  history: HistoryEntry[];

  setPixelsPerCm: (ratio: number) => void;
  setProjectName: (name: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundVisible: (visible: boolean) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundTransform: (transform: { x?: number, y?: number, scale?: number, rotation?: number }) => void;
  setCalibrationPoints: (points: Vector2d[] | null) => void;
  setTempCalibrationDist: (dist: number | null) => void;
  undo: () => void;
  saveHistory: () => void;
  loadState: (data: any) => void;
  saveProject: () => Promise<void>;
  newProject: () => void;
  version: number;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
  projectName: 'New Project',
  pixelsPerCm: 1,
  backgroundImage: null,
  backgroundVisible: true,
  backgroundOpacity: 0.5,
  backgroundPosition: { x: 0, y: 0 },
  backgroundScale: 1,
  backgroundRotation: 0,
  calibrationPoints: null,
  tempCalibrationDist: null,
  history: [],
  version: 2,

  setPixelsPerCm: (pixelsPerCm) => set({ pixelsPerCm }),
  setProjectName: (projectName) => set({ projectName }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundVisible: (backgroundVisible) => set({ backgroundVisible }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
  setBackgroundTransform: (transform) => set((state) => ({
    backgroundPosition: {
      x: transform.x ?? state.backgroundPosition.x,
      y: transform.y ?? state.backgroundPosition.y,
    },
    backgroundScale: transform.scale ?? state.backgroundScale,
    backgroundRotation: transform.rotation ?? state.backgroundRotation,
  })),
  setCalibrationPoints: (calibrationPoints) => set({ calibrationPoints }),
  setTempCalibrationDist: (tempCalibrationDist) => set({ tempCalibrationDist }),

  saveHistory: () => set((state) => ({
    history: [...state.history, { 
      rooms: state.rooms, 
      furniture: state.furniture, 
      dimensions: state.dimensions,
      wallAttachments: state.wallAttachments 
    } as any].slice(-50)
  })),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      rooms: previous.rooms,
      furniture: previous.furniture,
      dimensions: previous.dimensions,
      wallAttachments: (previous as any).wallAttachments || state.wallAttachments,
      history: state.history.slice(0, -1),
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      selectedAttachmentId: null
    };
  }),

  loadState: (data) => {
    if (!data) return;
    
    // Migration for center-based rotation (Version 2)
    const currentVersion = data.version || 1;
    
    const migrateFurniture = (items: any[]): any[] => {
      return items.map((f: any) => {
        let updated = { ...f };
        if (f.children) {
          updated.children = migrateFurniture(f.children);
        }
        
        if (currentVersion < 2 && f.rotation !== 0) {
          const center = rotatePoint(
            { x: f.width / 2, y: f.height / 2 },
            { x: 0, y: 0 },
            f.rotation
          );
          updated.x = f.x + center.x - f.width / 2;
          updated.y = f.y + center.y - f.height / 2;
        }
        return updated;
      });
    };

    let furniture = data.furniture || [];
    if (currentVersion < 2) {
      furniture = migrateFurniture(furniture);
    }

    // Ensure all attachments have default curtain colors if missing
    const wallAttachments = (data.wallAttachments || []).map((a: any) => ({
      ...a,
      thinCurtainColor: a.thinCurtainColor || '#ffffff',
      thickCurtainColor: a.thickCurtainColor || '#f1f5f9'
    }));

    set({
      ...data,
      furniture,
      wallAttachments,
      version: 2,
      history: [], // Clear history on load
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      selectedAttachmentId: null
    });
  },

  saveProject: async () => {
    const state = get();
    const data = {
      version: 2,
      projectName: state.projectName,
      pixelsPerCm: state.pixelsPerCm,
      rooms: state.rooms,
      furniture: state.furniture,
      dimensions: state.dimensions,
      wallAttachments: state.wallAttachments,
      wallThickness: state.wallThickness,
      wallHeight: state.wallHeight,
      backgroundImage: state.backgroundImage,
      backgroundPosition: state.backgroundPosition,
      backgroundScale: state.backgroundScale,
      backgroundRotation: state.backgroundRotation,
      backgroundOpacity: state.backgroundOpacity,
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  newProject: () => {
    if (confirm('Are you sure you want to start a new project? All unsaved changes will be lost.')) {
      set({
        projectName: 'New Project',
        rooms: [],
        furniture: [],
        dimensions: [],
        wallAttachments: [],
        roomPoints: [],
        measurePoints: [],
        history: [],
        backgroundImage: null,
        selectedId: null,
        selectedRoomId: null,
        selectedAttachmentId: null,
        selectedDimensionId: null,
        scale: 1,
        position: { x: 0, y: 0 }
      });
    }
  },
});
