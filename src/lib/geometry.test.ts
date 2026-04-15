import { describe, it, expect } from 'vitest';
import { 
  getDistance, 
  getSignedArea, 
  getOutwardNormal, 
  rotatePoint, 
  getFurnitureVertices,
  isPointInPolygon,
  checkPolygonsIntersect,
  getSnappedPosition
} from './geometry';

describe('Geometry Utilities', () => {
  describe('getDistance', () => {
    it('calculates distance between two points', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getDistance({ x: 10, y: 10 }, { x: 10, y: 20 })).toBe(10);
    });
  });

  describe('getSignedArea', () => {
    it('calculates positive area for CW winding (Y-down)', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      expect(getSignedArea(square)).toBeGreaterThan(0);
    });

    it('calculates negative area for CCW winding (Y-down)', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 }
      ];
      expect(getSignedArea(square)).toBeLessThan(0);
    });
  });

  describe('rotatePoint', () => {
    it('rotates a point 90 degrees around pivot', () => {
      const pivot = { x: 0, y: 0 };
      const point = { x: 100, y: 0 };
      const rotated = rotatePoint(point, pivot, 90);
      
      // In Y-down, 90 deg CW rotation of (100, 0) is (0, 100)
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(100);
    });
  });

  describe('getFurnitureVertices', () => {
    it('calculates correct vertices for a rotated rectangle', () => {
      const furniture = {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 90
      };
      // Center is (50, 25)
      // Top-left (0,0) rotated 90 deg around (50, 25)
      // dx = -50, dy = -25
      // x' = 50 + (-50*0 - (-25)*1) = 50 + 25 = 75
      // y' = 25 + (-50*1 + (-25)*0) = 25 - 50 = -25
      const vertices = getFurnitureVertices(furniture);
      expect(vertices[0].x).toBeCloseTo(75);
      expect(vertices[0].y).toBeCloseTo(-25);
    });
  });

  describe('isPointInPolygon', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];

    it('returns true if point is inside', () => {
      expect(isPointInPolygon({ x: 50, y: 50 }, square)).toBe(true);
    });

    it('returns false if point is outside', () => {
      expect(isPointInPolygon({ x: 150, y: 50 }, square)).toBe(false);
    });
  });

  describe('getOutwardNormal', () => {
    it('calculates outward normal for a CW square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      const normal = getOutwardNormal(square, 0);
      expect(normal.x).toBeCloseTo(0);
      expect(normal.y).toBeCloseTo(-1);
    });

    it('calculates outward normal for a CCW square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 }
      ];
      // Segment 0: (0,0) to (0,100) -> Vertical left edge
      // Normal should point LEFT (negative X)
      const normal = getOutwardNormal(square, 0);
      expect(normal.x).toBeCloseTo(-1);
      expect(normal.y).toBeCloseTo(0);
    });
  });

  describe('checkPolygonsIntersect', () => {
    const poly1 = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];

    it('returns true for overlapping polygons', () => {
      const poly2 = [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 150 },
        { x: 50, y: 150 }
      ];
      expect(checkPolygonsIntersect(poly1, poly2)).toBe(true);
    });

    it('returns false for non-overlapping polygons', () => {
      const poly2 = [
        { x: 150, y: 150 },
        { x: 250, y: 150 },
        { x: 250, y: 250 },
        { x: 150, y: 250 }
      ];
      expect(checkPolygonsIntersect(poly1, poly2)).toBe(false);
    });

    it('returns true for rotated overlapping polygons', () => {
      const poly2 = [
        { x: 50, y: -50 },
        { x: 150, y: 50 },
        { x: 50, y: 150 },
        { x: -50, y: 50 }
      ];
      expect(checkPolygonsIntersect(poly1, poly2)).toBe(true);
    });
  });

  describe('getSnappedPosition', () => {
    const rooms = [{
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ]
    }];
    const furniture: any[] = [];
    const threshold = 10;

    it('snaps to a corner', () => {
      const pos = { x: -2, y: -2 };
      const snapped = getSnappedPosition(pos, rooms, furniture, threshold);
      expect(snapped.x).toBe(0);
      expect(snapped.y).toBe(0);
    });

    it('snaps to a wall segment (edge)', () => {
      const pos = { x: 50, y: 5 };
      const snapped = getSnappedPosition(pos, rooms, furniture, threshold);
      expect(snapped.x).toBe(50);
      expect(snapped.y).toBe(0);
    });

    it('does not snap if beyond threshold', () => {
      const pos = { x: 50, y: 20 };
      const snapped = getSnappedPosition(pos, rooms, furniture, threshold);
      expect(snapped.x).toBe(50);
      expect(snapped.y).toBe(20);
    });
  });
});
