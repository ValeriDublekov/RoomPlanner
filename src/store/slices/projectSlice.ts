import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { HistoryEntry, Vector2d } from '../../types';
import { rotatePoint } from '../../lib/geometry';
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export interface ProjectSlice {
  projectId: string | null;
  projectName: string;
  cloudName: string | null;
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
  saveProject: (forceOverwriteId?: string, nameOverride?: string) => Promise<void>;
  saveProjectAs: (nameOverride?: string) => Promise<void>;
  newProject: () => void;
  isSaving: boolean;
  version: number;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
  projectId: null,
  projectName: 'New Project',
  cloudName: null,
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
  isSaving: false,
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
      projectId: null, // Reset projectId when loading from a local file
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

  saveProject: async (forceOverwriteId?: string, nameOverride?: string) => {
    const state = get();
    const { currentUser } = state;

    const projectData = {
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

    const jsonString = JSON.stringify(projectData);

    // If user is logged in, save to Firestore
    if (currentUser) {
      set({ isSaving: true });
      try {
        let targetId = forceOverwriteId || state.projectId;
        const nameToSave = nameOverride || state.cloudName || state.projectName || 'Untitled Project';

        if (targetId) {
          // Update existing project
          await setDoc(doc(db, 'projects', targetId), {
            userId: currentUser.uid,
            name: nameToSave,
            data: jsonString,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          set({ 
            projectId: targetId, 
            cloudName: nameToSave 
          });
          console.log('Project updated in Firestore');
        } else {
          // New project
          const docRef = await addDoc(collection(db, 'projects'), {
            userId: currentUser.uid,
            name: nameToSave,
            data: jsonString,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
          
          set({ 
            projectId: docRef.id, 
            cloudName: nameToSave 
          });
          console.log('New project created in Firestore:', docRef.id);
        }
        set({ isSaving: false });
        return;
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        set({ isSaving: false });
      }
    }

    // Fallback or not logged in: Local download
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = nameOverride || state.projectName || 'project';
      a.download = `${downloadName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error during local save:', err);
    }
  },

  saveProjectAs: async (nameOverride?: string) => {
    // Clear projectId to force the "new project" logic in saveProject
    set({ projectId: null });
    await get().saveProject(undefined, nameOverride);
  },

  newProject: () => {
    set({
      projectId: null,
      projectName: 'New Project',
      cloudName: null,
      rooms: [],
      furniture: [],
      dimensions: [],
      wallAttachments: [],
      roomPoints: [],
      measurePoints: [],
      history: [],
      backgroundImage: null,
      selectedId: null,
      selectedIds: [],
      selectedRoomId: null,
      selectedAttachmentId: null,
      selectedDimensionId: null,
      scale: 1,
      position: { x: 0, y: 0 },
      wallThickness: 20,
      wallHeight: 250,
      backgroundVisible: true,
      backgroundOpacity: 0.5,
      backgroundPosition: { x: 0, y: 0 },
      backgroundScale: 1,
      backgroundRotation: 0,
      calibrationPoints: null,
      tempCalibrationDist: null,
      pixelsPerCm: 1,
      mode: 'select',
      activeLayer: 'furniture',
      show3d: false,
      selectedWallIndex: null,
      dimensionInput: '',
      lastMeasurement: null,
      clipboard: null,
    });
  },
});
