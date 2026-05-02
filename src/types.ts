export interface Vector2d {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  points: Vector2d[];
  isClosed: boolean;
  floorTexture?: string;
  floorColor?: string;
  wallColors?: string[]; // Array of colors for each segment
  defaultWallColor?: string;
  materials?: {
    wallBase?: MaterialSlot;
    floorBase?: MaterialSlot;
  };
}

export type FurnitureType = 'bed' | 'desk' | 'wardrobe' | 'dresser' | 'chair' | 'shelf' | 'electronics' | 'table' | 'sofa' | 'armchair' | 'nightstand' | 'toilet' | 'bathtub' | 'light' | 'picture' | 'air-conditioner' | 'generic';

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
  children?: FurnitureObject[]; // For groups
}

export interface CatalogItem {
  id: string;
  name: string;
  furnitureType?: FurnitureType;
  category: 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Office';
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
