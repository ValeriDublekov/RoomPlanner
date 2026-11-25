import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { PERSISTED_KEYS, PersistedState } from '../constants';
import { HistoryEntry, Vector2d, FurnitureObject } from '../../types';
import { rotatePoint } from '../../lib/geometry';
import { migrateFurnitureMaterials } from '../../lib/materials';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { compressDataUrl, getUtf8ByteLength } from '../../lib/imageUtils';

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
  saveProject: (
    forceOverwriteId?: string,
    nameOverride?: string,
    thumbnailOverride?: string,
    destination?: 'cloud' | 'local'
  ) => Promise<void>;
  saveProjectAs: (nameOverride?: string, thumbnailOverride?: string) => Promise<void>;
  newProject: () => void;
  isSaving: boolean;
  version: number;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
  projectId: null,
  projectName: 'New Project',
  cloudName: null,
  pixelsPerCm: 20,
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
  version: 4,

  setPixelsPerCm: (pixelsPerCm) => set({ pixelsPerCm }),
  setProjectName: (projectName) => set({ projectName }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage, backgroundVisible: true }),
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
      wallAttachments: state.wallAttachments,
      beams: state.beams
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
      beams: (previous as any).beams || state.beams,
      history: state.history.slice(0, -1),
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      selectedAttachmentId: null
    };
  }),

  loadState: (data) => {
    if (!data) return;
    
    // Support both direct data and wrapped data
    const projectData = (typeof data === 'string' ? JSON.parse(data) : data) as PersistedState;
    
    // Migration for center-based rotation (Version 2)
    const currentVersion = projectData.version || 1;
    
    const migrateFurniture = (items: any[]): any[] => {
      return items.map((f: any) => {
        const updated = { ...f };
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

    let furniture: any[] = projectData.furniture || [];
    if (currentVersion < 2) {
      furniture = migrateFurniture(furniture);
    }
    
    // Always apply semantic materials migration to ensure consistency
    furniture = furniture.map(migrateFurnitureMaterials);

    // Migration for topology (Version 4)
    let rooms = projectData.rooms || [];
    if (currentVersion < 4) {
      rooms = rooms.map((room: any) => {
        let vertices = room.vertices;
        let edges = room.edges;
        let startVertexId = room.startVertexId;

        if ((!vertices || currentVersion < 4) && (room.points || vertices)) {
          // If we are migrating from points OR fixing a broken topology migration
          const points = room.points || vertices.map((v: any) => ({ x: v.x, y: v.y }));

          vertices = points.map((p: any, i: number) => ({
            id: i.toString(),
            x: p.x,
            y: p.y
          }));
          
          startVertexId = "0";
          
          const edgeCount = room.isClosed ? vertices.length : vertices.length - 1;
          edges = [];
          for (let i = 0; i < edgeCount; i++) {
            edges.push({
              id: `${room.id}-edge-${i}`,
              startVertexId: i.toString(),
              endVertexId: ((i + 1) % vertices.length).toString()
            });
          }
        }
        const { points: _points, ...rest } = room;
        return { 
          ...rest, 
          vertices: vertices || [], 
          edges: edges || [],
          startVertexId
        };
      });
    }

    // Ensure all attachments have default curtain colors if missing
    const wallAttachments = (projectData.wallAttachments || []).map((a: any) => ({
      ...a,
      thinCurtainColor: a.thinCurtainColor || '#ffffff',
      thickCurtainColor: a.thickCurtainColor || '#f1f5f9'
    }));

    set({
      projectName: projectData.projectName || 'Loaded Project',
      pixelsPerCm: projectData.pixelsPerCm || (projectData as any).pixelsPrCm || 20, // Restore legacy default for proper scaling
      rooms,
      furniture,
      dimensions: projectData.dimensions || [],
      wallAttachments,
      beams: projectData.beams || [],
      wallThickness: projectData.wallThickness || 20,
      wallHeight: projectData.wallHeight || 250,
      backgroundImage: projectData.backgroundImage || null,
      backgroundVisible: projectData.backgroundVisible ?? true,
      backgroundPosition: projectData.backgroundPosition || { x: 0, y: 0 },
      backgroundScale: projectData.backgroundScale ?? 1,
      backgroundRotation: projectData.backgroundRotation ?? 0,
      backgroundOpacity: projectData.backgroundOpacity ?? 0.5,
      projectId: null,
      version: 4,
      history: [],
      selectedId: null,
      selectedRoomId: null,
      selectedDimensionId: null,
      selectedAttachmentId: null
    });
  },

  saveProject: async (
    forceOverwriteId?: string,
    nameOverride?: string,
    thumbnailOverride?: string,
    destination?: 'cloud' | 'local'
  ) => {
    const state = get();
    const { currentUser } = state;
    const targetDestination: 'cloud' | 'local' = destination ?? (currentUser ? 'cloud' : 'local');

    const projectData = PERSISTED_KEYS.reduce((acc, key) => {
      // @ts-expect-error - Zustand standard pattern for accessing state in actions
      acc[key] = (state as any)[key];
      return acc;
    }, { version: 4 } as PersistedState);

    let jsonString = JSON.stringify(projectData);

    // Explicit local download (or not signed in without explicit cloud request)
    if (targetDestination === 'local') {
      try {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const downloadName = (nameOverride || state.projectName || 'project').trim() || 'project';
        a.download = `${downloadName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error during local save:', err);
        throw err;
      }
      return;
    }

    // Cloud save path — never silently fall back to local download
    if (!currentUser) {
      throw new Error('You must be signed in to save to the cloud.');
    }

    set({ isSaving: true });
    let activeTargetId: string | null = null;
    try {
      // Ensure serialized JSON fits comfortably within Firestore's 1 MB document limit
      const maxJsonBytes = 940000;
      if (
        getUtf8ByteLength(jsonString) > maxJsonBytes &&
        typeof projectData.backgroundImage === 'string' &&
        projectData.backgroundImage.startsWith('data:image/')
      ) {
        const compressedBg = await compressDataUrl(projectData.backgroundImage, 1200, 0.75);
        projectData.backgroundImage = compressedBg;
        jsonString = JSON.stringify(projectData);

        if (getUtf8ByteLength(jsonString) > maxJsonBytes) {
          projectData.backgroundImage = await compressDataUrl(compressedBg, 800, 0.6);
          jsonString = JSON.stringify(projectData);
        }
      }

      const jsonBytes = getUtf8ByteLength(jsonString);
      if (jsonBytes >= 1040000) {
        throw new Error(
          'Project data exceeds the 1 MB cloud storage limit. Please use a smaller blueprint image or choose "Save to Computer".'
        );
      }

      const rawName = nameOverride || state.cloudName || state.projectName || 'Untitled Project';
      const nameToSave = rawName.trim().slice(0, 199) || 'Untitled Project';

      const savePayload: Record<string, any> = {
        userId: currentUser.uid,
        name: nameToSave,
        data: jsonString,
        updatedAt: serverTimestamp(),
      };

      if (thumbnailOverride) {
        const thumbBytes = getUtf8ByteLength(thumbnailOverride);
        if (thumbBytes < 350000 && jsonBytes + thumbBytes < 1000000) {
          savePayload.thumbnail = thumbnailOverride;
        }
      }

      if (forceOverwriteId === '__NEW__') {
        activeTargetId = null;
      } else {
        activeTargetId = forceOverwriteId || state.projectId;
      }

      // If auto-updating an existing projectId from state/localStorage, verify it still exists and belongs to this user
      if (activeTargetId && !forceOverwriteId) {
        try {
          const existingSnap = await getDoc(doc(db, 'projects', activeTargetId));
          if (existingSnap && typeof existingSnap.exists === 'function' && !existingSnap.exists()) {
            activeTargetId = null;
          }
        } catch (lookupErr: any) {
          const code = lookupErr?.code || '';
          const msg = String(lookupErr?.message || '').toLowerCase();
          if (code === 'permission-denied' || msg.includes('permission')) {
            // Stale projectId in localStorage belonging to another account — save as new doc for current user
            activeTargetId = null;
          } else {
            throw lookupErr;
          }
        }
      }

      if (activeTargetId) {
        await setDoc(doc(db, 'projects', activeTargetId), savePayload, { merge: true });
        set({
          projectId: activeTargetId,
          cloudName: nameToSave,
        });
      } else {
        savePayload.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'projects'), savePayload);
        set({
          projectId: docRef.id,
          cloudName: nameToSave,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('1 MB cloud storage limit')) {
        throw error;
      }
      handleFirestoreError(
        error,
        activeTargetId ? OperationType.UPDATE : OperationType.CREATE,
        activeTargetId ? `projects/${activeTargetId}` : 'projects'
      );
    } finally {
      set({ isSaving: false });
    }
  },

  saveProjectAs: async (nameOverride?: string, thumbnailOverride?: string) => {
    await get().saveProject('__NEW__', nameOverride, thumbnailOverride, 'cloud');
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
      beams: [],
      roomPoints: [],
      measurePoints: [],
      history: [],
      backgroundImage: null,
      selectedId: null,
      selectedIds: [],
      selectedRoomId: null,
      selectedAttachmentId: null,
      selectedBeamId: null,
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
      mode: 'draw-room',
      activeLayer: 'room',
      show3d: false,
      selectedWallIndex: null,
      dimensionInput: '',
      lastMeasurement: null,
      clipboard: null,
    });
  },
});
