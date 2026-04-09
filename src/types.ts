export interface Vector2d {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  points: Vector2d[];
}

export interface FurnitureObject {
  id: string;
  type: 'box' | 'polygon';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  points?: Vector2d[];
}

export interface DimensionObject {
  id: string;
  p1: Vector2d;
  p2: Vector2d;
}

export type AppMode = 'select' | 'draw-room' | 'draw-furniture' | 'calibrate' | 'add-box' | 'measure' | 'dimension';
export type LayerType = 'blueprint' | 'room' | 'furniture' | 'annotation';

export interface HistoryEntry {
  rooms: RoomObject[];
  furniture: FurnitureObject[];
  dimensions: DimensionObject[];
}
