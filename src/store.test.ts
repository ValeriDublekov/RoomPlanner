import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from './store';
import { User } from 'firebase/auth';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

describe('AppState Store', () => {
  beforeEach(() => {
    // Reset store to initial state if possible, 
    // or just assume it's fresh enough for these tests.
    // Zustand persist might keep state between tests in some environments.
    useStore.setState({
      rooms: [],
      furniture: [],
      dimensions: [],
      wallAttachments: [],
      history: [],
      roomPoints: [],
      measurePoints: [],
      selectedId: null,
      selectedRoomId: null,
      currentUser: null,
      projectId: null,
      projectName: 'New Project',
    });
  });

  describe('authSlice', () => {
    it('sets current user', () => {
      const mockUser = { uid: '123', email: 'test@example.com' } as User;
      useStore.getState().setCurrentUser(mockUser);
      expect(useStore.getState().currentUser).toEqual(mockUser);
    });

    it('sets auth loading state', () => {
      useStore.getState().setIsAuthLoading(false);
      expect(useStore.getState().isAuthLoading).toBe(false);
    });
  });

  describe('uiSlice', () => {
    it('sets app mode and resets temporary states', () => {
      useStore.setState({ 
        roomPoints: [{ x: 1, y: 2 }],
        selectedId: 'some-id'
      });
      
      useStore.getState().setMode('draw-room');
      
      const state = useStore.getState();
      expect(state.mode).toBe('draw-room');
      expect(state.roomPoints).toHaveLength(0);
      expect(state.selectedId).toBeNull();
    });

    it('sets active layer and resets selection', () => {
      useStore.setState({ selectedRoomId: 'room-1' });
      useStore.getState().setActiveLayer('furniture');
      
      const state = useStore.getState();
      expect(state.activeLayer).toBe('furniture');
      expect(state.selectedRoomId).toBeNull();
    });
  });

  describe('roomSlice', () => {
    it('adds room points', () => {
      useStore.getState().addRoomPoint({ x: 10, y: 10 });
      expect(useStore.getState().roomPoints).toEqual([{ x: 10, y: 10 }]);
    });

    it('closes a room and creates a room object', () => {
      useStore.setState({
        roomPoints: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 }
        ]
      });
      
      useStore.getState().closeRoom();
      
      const state = useStore.getState();
      expect(state.rooms).toHaveLength(1);
      expect(state.rooms[0].points).toHaveLength(3);
      expect(state.roomPoints).toHaveLength(0);
    });
  });

  describe('furnitureSlice', () => {
    it('adds furniture', () => {
      const newItem = {
        type: 'rectangle' as const,
        name: 'Bed',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0
      };
      
      useStore.getState().addFurniture(newItem);
      
      const state = useStore.getState();
      expect(state.furniture).toHaveLength(1);
      expect(state.furniture[0].name).toBe('Bed');
    });

    it('updates furniture', () => {
      useStore.setState({
        furniture: [{ id: 'f1', name: 'Old Name', x: 0, y: 0, width: 10, height: 10, rotation: 0, type: 'rectangle' }]
      });
      
      useStore.getState().updateFurniture('f1', { name: 'New Name' });
      
      expect(useStore.getState().furniture[0].name).toBe('New Name');
    });
  });

  describe('projectSlice', () => {
    it('undoes changes using history', () => {
      const initialRooms = [{ id: 'r1', points: [], isClosed: true }];
      useStore.setState({
        rooms: [{ id: 'r2', points: [], isClosed: true }],
        history: [{ rooms: initialRooms, furniture: [], dimensions: [], wallAttachments: [] }]
      });
      
      useStore.getState().undo();
      
      expect(useStore.getState().rooms).toEqual(initialRooms);
    });

    it('saves history entry', () => {
      useStore.setState({ rooms: [{ id: 'r1', points: [], isClosed: true }], history: [] });
      useStore.getState().saveHistory();
      
      expect(useStore.getState().history).toHaveLength(1);
      expect(useStore.getState().history[0].rooms).toHaveLength(1);
    });
  });

  describe('dimensionSlice', () => {
    it('adds measure points and calculates distance', () => {
      useStore.getState().addMeasurePoint({ x: 0, y: 0 });
      useStore.getState().addMeasurePoint({ x: 100, y: 0 });
      
      const state = useStore.getState();
      expect(state.lastMeasurement).toBe(100);
      expect(state.measurePoints).toHaveLength(0); // Resets after second point
    });

    it('adds dimension object in dimension mode', () => {
      useStore.setState({ mode: 'dimension' });
      useStore.getState().addMeasurePoint({ x: 0, y: 0 });
      useStore.getState().addMeasurePoint({ x: 100, y: 0 });
      
      const state = useStore.getState();
      expect(state.dimensions).toHaveLength(1);
      expect(state.dimensions[0].p1).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Persistence and Migration', () => {
    it('partializes only specific fields', () => {
      const partialize = (useStore as any).persist?.getOptions?.().partialize;
      if (partialize) {
        const fullState: any = {
          projectId: 'p1',
          rooms: [],
          history: [{}], // Should be excluded
          isSaving: true, // Should be excluded
          scale: 2, // Should be excluded
        };
        const partial = partialize(fullState);
        expect(partial.projectId).toBe('p1');
        expect(partial.rooms).toEqual([]);
        expect(partial.history).toBeUndefined();
        expect(partial.isSaving).toBeUndefined();
        expect(partial.scale).toBeUndefined();
      }
    });

    it('migrates version 0 rooms correctly', () => {
      const persistedState = {
        rooms: [
          { id: '1', points: null }
        ]
      };
      
      const migrate = (useStore as any).persist?.getOptions?.().migrate;
      if (migrate) {
        const result = migrate(persistedState, 0);
        expect(result.rooms[0].points).toEqual([]);
      }
    });
  });
});
