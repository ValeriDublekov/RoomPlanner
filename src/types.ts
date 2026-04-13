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
}

export interface FurnitureObject {
  id: string;
  type: 'box' | 'polygon' | 'circle' | 'group';
  furnitureType?: 'bed' | 'desk' | 'wardrobe' | 'dresser' | 'chair' | 'shelf' | 'electronics' | 'table' | 'generic';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  height3d?: number; // in px, for 3D extrusion
  elevation?: number; // in px, height from floor
  rotation: number;
  points?: Vector2d[];
  color?: string;
  secondaryColor?: string;
  svgPath?: string;
  children?: FurnitureObject[]; // For groups
}

export interface CatalogItem {
  id: string;
  name: string;
  furnitureType?: 'bed' | 'desk' | 'wardrobe' | 'dresser' | 'chair' | 'shelf' | 'electronics' | 'table' | 'generic';
  category: 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Office';
  type: 'rectangle' | 'circle';
  width: number; // in cm
  depth: number; // in cm
  height3d?: number; // in cm
  defaultElevation?: number; // in cm
  defaultColor: string;
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
}

export type AppMode = 'select' | 'draw-room' | 'draw-furniture' | 'draw-circle' | 'calibrate' | 'add-box' | 'measure' | 'dimension' | 'add-door' | 'add-window';
export type LayerType = 'blueprint' | 'room' | 'furniture' | 'annotation';

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
