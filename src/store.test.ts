import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from './store';
import { getRoomVertices } from './lib/geometry/topology';
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
    it('sets app mode and resets temporary states but preserves selection', () => {
      useStore.setState({ 
        roomPoints: [{ x: 1, y: 2 }],
        selectedId: 'some-id'
      });
      
      useStore.getState().setMode('draw-room');
      
      const state = useStore.getState();
      expect(state.mode).toBe('draw-room');
      expect(state.roomPoints).toHaveLength(0);
      // Selection should persist unless explicitly cleared
      expect(state.selectedId).toBe('some-id');
    });

    it('preserves attachment selection when switching to select mode', () => {
      const attachmentId = 'att-123';
      useStore.setState({ 
        selectedAttachmentId: attachmentId,
        mode: 'draw-room'
      });
      
      // Simulating what happened in ArchitecturalLayer or WallAttachmentItem
      useStore.getState().setMode('select');
      
      const state = useStore.getState();
      expect(state.mode).toBe('select');
      expect(state.selectedAttachmentId).toBe(attachmentId);
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
      expect(getRoomVertices(state.rooms[0])).toHaveLength(3);
      expect(state.roomPoints).toHaveLength(0);
    });

    it('synchronizes coincident vertices and walls when moving a shared wall segment', () => {
      const roomA = {
        id: 'room-a',
        vertices: [
          { id: 'va1', x: 0, y: 0 },
          { id: 'va2', x: 50, y: 0 },
          { id: 'va3', x: 50, y: 100 },
          { id: 'va4', x: 0, y: 100 },
        ],
        edges: [
          { id: 'ea1', startVertexId: 'va1', endVertexId: 'va2' },
          { id: 'ea2', startVertexId: 'va2', endVertexId: 'va3' }, // dividing wall (index 1)
          { id: 'ea3', startVertexId: 'va3', endVertexId: 'va4' },
          { id: 'ea4', startVertexId: 'va4', endVertexId: 'va1' },
        ],
        isClosed: true,
      };

      const roomB = {
        id: 'room-b',
        vertices: [
          { id: 'vb1', x: 50, y: 0 },
          { id: 'vb2', x: 100, y: 0 },
          { id: 'vb3', x: 100, y: 100 },
          { id: 'vb4', x: 50, y: 100 },
        ],
        edges: [
          { id: 'eb1', startVertexId: 'vb1', endVertexId: 'vb2' },
          { id: 'eb2', startVertexId: 'vb2', endVertexId: 'vb3' },
          { id: 'eb3', startVertexId: 'vb3', endVertexId: 'vb4' },
          { id: 'eb4', startVertexId: 'vb4', endVertexId: 'vb1' }, // dividing wall (index 3)
        ],
        isClosed: true,
      };

      useStore.setState({ rooms: [roomA, roomB] });

      // Move roomA's dividing wall segment (index 1) by delta dx=+10, dy=0
      useStore.getState().moveWallSegment('room-a', 1, { x: 10, y: 0 });

      const state = useStore.getState();
      const updatedA = state.rooms.find(r => r.id === 'room-a')!;
      const updatedB = state.rooms.find(r => r.id === 'room-b')!;

      const va2 = updatedA.vertices.find(v => v.id === 'va2')!;
      const va3 = updatedA.vertices.find(v => v.id === 'va3')!;
      expect(va2.x).toBe(60);
      expect(va3.x).toBe(60);

      // Room B's matching vertices vb1 and vb4 MUST also have moved to x=60
      const vb1 = updatedB.vertices.find(v => v.id === 'vb1')!;
      const vb4 = updatedB.vertices.find(v => v.id === 'vb4')!;
      expect(vb1.x).toBe(60);
      expect(vb4.x).toBe(60);
    });

    it('synchronizes coincident corner vertices when dragging a shared corner with updateRoomPoint', () => {
      const roomA = {
        id: 'room-a',
        vertices: [
          { id: 'va1', x: 0, y: 0 },
          { id: 'va2', x: 50, y: 0 },
          { id: 'va3', x: 50, y: 100 },
          { id: 'va4', x: 0, y: 100 },
        ],
        edges: [
          { id: 'ea1', startVertexId: 'va1', endVertexId: 'va2' },
          { id: 'ea2', startVertexId: 'va2', endVertexId: 'va3' },
          { id: 'ea3', startVertexId: 'va3', endVertexId: 'va4' },
          { id: 'ea4', startVertexId: 'va4', endVertexId: 'va1' },
        ],
        isClosed: true,
      };

      const roomB = {
        id: 'room-b',
        vertices: [
          { id: 'vb1', x: 50, y: 0 },
          { id: 'vb2', x: 100, y: 0 },
          { id: 'vb3', x: 100, y: 100 },
          { id: 'vb4', x: 50, y: 100 },
        ],
        edges: [
          { id: 'eb1', startVertexId: 'vb1', endVertexId: 'vb2' },
          { id: 'eb2', startVertexId: 'vb2', endVertexId: 'vb3' },
          { id: 'eb3', startVertexId: 'vb3', endVertexId: 'vb4' },
          { id: 'eb4', startVertexId: 'vb4', endVertexId: 'vb1' },
        ],
        isClosed: true,
      };

      useStore.setState({ rooms: [roomA, roomB] });

      // Move point index 1 of roomA (va2 at 50, 0) to (55, 5)
      useStore.getState().updateRoomPoint('room-a', 1, { x: 55, y: 5 });

      const state = useStore.getState();
      const updatedA = state.rooms.find(r => r.id === 'room-a')!;
      const updatedB = state.rooms.find(r => r.id === 'room-b')!;

      const va2 = updatedA.vertices.find(v => v.id === 'va2')!;
      expect(va2).toEqual({ id: 'va2', x: 55, y: 5 });

      // Room B's vb1 (which was at 50, 0) MUST also be updated to (55, 5)
      const vb1 = updatedB.vertices.find(v => v.id === 'vb1')!;
      expect(vb1).toEqual({ id: 'vb1', x: 55, y: 5 });
    });
  });

  describe('furnitureSlice', () => {
    it('adds furniture', () => {
      const newItem = {
        type: 'box' as const,
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
        furniture: [{ id: 'f1', name: 'Old Name', x: 0, y: 0, width: 10, height: 10, rotation: 0, type: 'box' }]
      });
      
      useStore.getState().updateFurniture('f1', { name: 'New Name' });
      
      expect(useStore.getState().furniture[0].name).toBe('New Name');
    });
  });

  describe('projectSlice', () => {
    it('undoes changes using history', () => {
      const initialRooms: any[] = [{ 
        id: 'r1', 
        vertices: [{id: 'v1', x: 0, y: 0}], 
        edges: [], 
        isClosed: true 
      }];
      useStore.setState({
        rooms: [{ 
          id: 'r2', 
          vertices: [{id: 'v2', x: 10, y: 10}], 
          edges: [], 
          isClosed: true 
        }],
        history: [{ rooms: initialRooms, furniture: [], dimensions: [] }]
      });
      
      useStore.getState().undo();
      
      expect(useStore.getState().rooms).toEqual(initialRooms);
    });

    it('saves history entry', () => {
      useStore.setState({ 
        rooms: [{ 
          id: 'r1', 
          vertices: [{id: 'v1', x: 0, y: 0}], 
          edges: [], 
          isClosed: true 
        }], 
        history: [] 
      });
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
          { id: '1', points: null, vertices: [], edges: [] }
        ]
      };
      
      const migrate = (useStore as any).persist?.getOptions?.().migrate;
      if (migrate) {
        const result = migrate(persistedState, 0);
        expect(result.rooms[0].points).toEqual([]);
      }
    });

    it('migrates version 2 rooms to version 4', () => {
      const persistedState = {
        version: 2,
        rooms: [
          { id: '1', points: [{x:0, y:0}, {x:100, y:0}, {x:100, y:100}, {x:0, y:100}], isClosed: true }
        ]
      };
      
      useStore.getState().loadState(persistedState);
      
      const state = useStore.getState();
      expect(state.version).toBe(4);
      expect(state.rooms[0].vertices).toBeDefined();
      expect(state.rooms[0].edges).toBeDefined();
      expect(state.rooms[0].vertices).toHaveLength(4);
      expect(state.rooms[0].edges).toHaveLength(4);
    });

    it('remaps wallAttachments on splitWallSegment', () => {
      const roomId = 'room-1';
      useStore.setState({
        rooms: [
          { 
            id: roomId, 
            vertices: [
              { id: 'v0', x: 0, y: 0 },
              { id: 'v1', x: 100, y: 0 },
              { id: 'v2', x: 100, y: 100 },
              { id: 'v3', x: 0, y: 100 }
            ],
            edges: [
              { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
              { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
              { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' },
              { id: 'e3', startVertexId: 'v3', endVertexId: 'v0' }
            ],
            isClosed: true 
          }
        ],
        wallAttachments: [
          { id: 'att-1', roomId, type: 'window', wallSegmentIndex: 0, positionAlongWall: 0.75, width: 20 }
        ]
      });

      // Split segment 0 (0,0)-(100,0) at (50,0).
      // Attachment at 0.75 on segment 0 becomes 0.75-0.5 = 0.25 on segment 1 (new segment).
      useStore.getState().splitWallSegment(roomId, 0, { x: 50, y: 0 });

      const state = useStore.getState();
      // SegmentIndex should be 1 now
      expect(state.wallAttachments[0].wallSegmentIndex).toBe(1);
      expect(state.wallAttachments[0].positionAlongWall).toBeCloseTo(0.5);
    });

    it('remaps wallAttachments on removeRoomVertex', () => {
      const roomId = 'room-2';
      useStore.setState({
        rooms: [
          { 
            id: roomId, 
            vertices: [
              { id: 'v0', x: 0, y: 0 },
              { id: 'v1', x: 50, y: 0 },
              { id: 'v2', x: 100, y: 0 },
              { id: 'v3', x: 100, y: 100 },
              { id: 'v4', x: 0, y: 100 }
            ],
            edges: [
              { id: 'e0', startVertexId: 'v0', endVertexId: 'v1' },
              { id: 'e1', startVertexId: 'v1', endVertexId: 'v2' },
              { id: 'e2', startVertexId: 'v2', endVertexId: 'v3' },
              { id: 'e3', startVertexId: 'v3', endVertexId: 'v4' },
              { id: 'e4', startVertexId: 'v4', endVertexId: 'v0' }
            ],
            isClosed: true 
          }
        ],
        wallAttachments: [
          { id: 'att-2', roomId, type: 'window', wallSegmentIndex: 2, positionAlongWall: 0.5, width: 20 }
        ]
      });

      // Remove vertex index 1. Segment 2 is unaffected by vertex removal, 
      // but its index might change if index < 1 was removed. 
      // Wait, let's remove index 0. Then segment 2 becomes segment 1.
      useStore.getState().removeRoomVertex(roomId, 0);

      const state = useStore.getState();
      expect(state.wallAttachments[0].wallSegmentIndex).toBe(1);
    });
  });
});
