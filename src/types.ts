export interface Vector2d {
  x: number;
  y: number;
}

export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  startVertexId: string;
  endVertexId: string;
}

export type RailingStyle = 'glass' | 'metal-bars' | 'wooden-slats' | 'concrete';

export interface RoomObject {
  id: string;
  /**
   * Canonical room geometry defined by topology.
   * Ordered boundaries are reconstructed from these descriptors.
   */
  vertices: Vertex[];
  edges: Edge[];
  isClosed: boolean;
  startVertexId?: string; // Stable starting point for topological traversal
  floorTexture?: string;
  floorColor?: string;
  wallColors?: string[]; // Array of colors for each segment
  wallTypes?: ('wall' | 'railing')[]; // Array of types for each segment
  internalWalls?: boolean[]; // Array indicating if a segment is an internal shared wall
  railingStyles?: RailingStyle[]; // Array of railing styles for each segment
  defaultWallColor?: string;
  materials?: {
    wallBase?: MaterialSlot;
    floorBase?: MaterialSlot;
  };
}

export type FurnitureType = 'bed' | 'desk' | 'wardrobe' | 'dresser' | 'chair' | 'shelf' | 'electronics' | 'table' | 'sofa' | 'armchair' | 'nightstand' | 'toilet' | 'bathtub' | 'light' | 'picture' | 'air-conditioner' | 'rug' | 'generic' | 'decoration' | 'chest';

export interface MaterialSlot {
  source: 'theme' | 'custom';
  value: string;
}

export interface ObjectMaterials {
  woodBase?: MaterialSlot;
  woodFront?: MaterialSlot;
  textileMain?: MaterialSlot;
  textileAccent?: MaterialSlot;
}

export interface InteriorTheme {
  id: string;
  name: string;
  wallColors: {
    base: string;
    secondary: string;
    accent: string;
  };
  woodColors: {
    base: string;
    front: string;
  };
  textileColors: {
    main: string;
    secondary: string;
    accent: string;
  };
}

export interface FurnitureObject {
  id: string;
  type: 'box' | 'polygon' | 'circle' | 'group';
  furnitureType?: FurnitureType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  height3d?: number; // in px, for 3D extrusion
  elevation?: number; // in px, height from floor
  rotation: number;
  points?: Vector2d[];
  color?: string; // Legacy: fallback color
  secondaryColor?: string; // Legacy: fallback secondary
  materials?: ObjectMaterials;
  imageUrl?: string; // For pictures/posters
  svgPath?: string;
  catalogId?: string;
  hasDoors?: boolean; // For shelves/cabinets
  hideStand?: boolean; // For electronics/TV
  showLabel?: boolean; // Explicitly show name label
  drawerRows?: number;
  drawerCols?: number;
  hasHeadboard?: boolean;
  headboardHeight?: number;
  headboardTilt?: number;
  mattressWidth?: number;
  mattressDepth?: number;
  hasLaptop?: boolean;
  monitorCount?: number;
  hasPeripherals?: boolean;
  slantAngle?: number;
  slantHeight?: number;
  panelStyle?: 'slats' | 'trellis' | 'green' | 'stone' | 'plain';
  category?: 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Office' | 'Terrace';
  children?: FurnitureObject[]; // For groups
}

export interface CatalogItem {
  id: string;
  name: string;
  furnitureType?: FurnitureType;
  category: 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Office' | 'Terrace';
  type: 'rectangle' | 'circle';
  width: number; // in cm
  depth: number; // in cm
  height3d?: number; // in cm
  defaultElevation?: number; // in cm
  defaultColor: string;
  defaultHasDoors?: boolean;
  defaultImageUrl?: string;
  svgPath?: string;
}

export interface DimensionObject {
  id: string;
  p1: Vector2d;
  p2: Vector2d;
}

export interface WallSnap {
  roomId: string;
  segmentIndex: number;
  t: number;
}

export interface WallAttachment {
  id: string;
  roomId: string;
  type: 'door' | 'window';
  wallSegmentIndex: number;
  positionAlongWall: number; // 0 to 1
  width: number; // in cm
  flipX?: boolean; // For door swing side
  flipY?: boolean; // For door swing direction (inside/outside)
  curtainType?: 'none' | 'thin' | 'thick' | 'both';
  frameColor?: string;
  thinCurtainColor?: string;
  thickCurtainColor?: string;
}

/**
 * Represents a derived wall segment with its geometry faces.
 */
export interface WallGeometry {
  /** Unique ID for the wall, e.g., "room-id-wall-index" */
  id: string;
  /** ID of the room this wall belongs to */
  roomId: string;
  /** Index of the segment in the room's points array */
  segmentIndex: number;
  /** The original interior segment defined by the room points */
  referenceSegment: { p1: Vector2d; p2: Vector2d };
  /** The interior face of the wall (usually same as reference segment) */
  interiorFace: { p1: Vector2d; p2: Vector2d };
  /** The exterior face of the wall, offset by thickness */
  exteriorFace: { p1: Vector2d; p2: Vector2d };
  /** A 4-point polygon representing the wall's physical footprint */
  wallBandPolygon: Vector2d[];
  /** The outward-facing normal vector for this wall segment */
  normal: Vector2d;
  /** The thickness of the wall used for derivation */
  thickness: number;
  /** Stable ID shared between overlapping wall segments in different rooms */
  sharedWallId?: string;
  /** Indicates if this wall is internal (partition) */
  isInternal?: boolean;
}

/**
 * A read-only snapshot of all derived geometry in the plan.
 */
export interface PlanSnapshot {
  /** All derived wall records */
  walls: WallGeometry[];
  /** Stable shared wall entities */
  sharedWalls?: SharedWall[];
  /** Timestamp when the snapshot was generated */
  generatedAt: number;
}

export interface SharedWall {
  id: string;
  /** The wall segments that compose this shared wall */
  segments: Array<{ roomId: string; segmentIndex: number }>;
}

export interface BeamAttachment {
  roomId: string;
  wallIndex: number;
  t: number; // 0..1 along the wall segment
}

export interface BeamObject {
  id: string;
  p1: Vector2d;
  p2: Vector2d;
  width: number; // thickness in cm
  height: number; // height in cm
  elevation: number; // elevation from floor in cm
  color: string; // The active color
  colorType: 'manual' | 'wall' | 'ceiling';
  manualColor?: string;
  alignment: 'left' | 'right' | 'center';
  p1Attachment?: BeamAttachment;
  p2Attachment?: BeamAttachment;
}

export type AppMode = 'select' | 'draw-room' | 'draw-furniture' | 'draw-circle' | 'calibrate' | 'add-box' | 'measure' | 'dimension' | 'add-door' | 'add-window' | 'place-furniture' | 'draw-beam';
export type LayerType = 'blueprint' | 'room' | 'furniture';

export interface EdgeMap {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface HistoryEntry {
  rooms: RoomObject[];
  furniture: FurnitureObject[];
  dimensions: DimensionObject[];
}
