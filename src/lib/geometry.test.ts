import { describe, it, expect } from 'vitest';
import { 
  getDistance, 
  getSignedArea, 
  getOutwardNormal, 
  rotatePoint, 
  getFurnitureVertices,
  isPointInPolygon,
  checkPolygonsIntersect,
  getSnappedPosition,
  calculateArea,
  getOrthoPoint,
  formatDistance,
  scalePoints,
  getDistanceToSegment,
  checkPolygonLineIntersect,
  checkCirclePolygonIntersect,
  getSnappedFurniturePosition,
  checkCirclesIntersect,
  checkCircleLineIntersect
} from './geometry';

describe('Geometry Utilities', () => {
  describe('getDistance', () => {
    it('calculates distance between two points', () => {
      expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(getDistance({ x: 10, y: 10 }, { x: 10, y: 20 })).toBe(10);
    });

    it('returns 0 for identical points', () => {
      expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
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

    it('returns 0 for collinear points', () => {
      const line = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 }
      ];
      expect(getSignedArea(line)).toBe(0);
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

    it('returns {0,0} for zero-length edge', () => {
      const degenerate = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      const normal = getOutwardNormal(degenerate, 0);
      expect(normal).toEqual({ x: 0, y: 0 });
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
    const furniture = [
      { x: 200, y: 200, width: 50, height: 50, rotation: 0 }
    ];
    const threshold = 10;

    it('snaps to a room corner', () => {
      const pos = { x: -2, y: -2 };
      const snapped = getSnappedPosition(pos, rooms, [], threshold);
      expect(snapped.x).toBe(0);
      expect(snapped.y).toBe(0);
    });

    it('snaps to a room wall segment (edge)', () => {
      const pos = { x: 50, y: 5 };
      const snapped = getSnappedPosition(pos, rooms, [], threshold);
      expect(snapped.x).toBe(50);
      expect(snapped.y).toBe(0);
    });

    it('snaps to a furniture corner', () => {
      const pos = { x: 195, y: 195 };
      const snapped = getSnappedPosition(pos, [], furniture, threshold);
      expect(snapped.x).toBe(200);
      expect(snapped.y).toBe(200);
    });

    it('snaps to a furniture edge', () => {
      const pos = { x: 225, y: 195 };
      const snapped = getSnappedPosition(pos, [], furniture, threshold);
      expect(snapped.x).toBe(225);
      expect(snapped.y).toBe(200);
    });

    it('does not snap if beyond threshold', () => {
      const pos = { x: 50, y: 20 };
      const snapped = getSnappedPosition(pos, rooms, [], threshold);
      expect(snapped.x).toBe(50);
      expect(snapped.y).toBe(20);
    });

    it('snaps to image edges if no vector points found', () => {
      const pos = { x: 50, y: 50 };
      const edgeMap = {
        width: 10,
        height: 10,
        data: new Uint8Array(100).fill(0)
      };
      // Set an "edge" pixel at (5,5) in image space
      edgeMap.data[5 * 10 + 5] = 1;
      
      const bgTransform = {
        x: 0,
        y: 0,
        scale: 10,
        rotation: 0
      };
      
      // pos (50, 50) corresponds to img (5, 5) if scale is 10.
      // Let's move pos slightly away
      const offsetPos = { x: 52, y: 52 };
      const snapped = getSnappedPosition(offsetPos, [], [], threshold, edgeMap as any, bgTransform);
      
      // Should snap to (50, 50)
      expect(snapped.x).toBeCloseTo(50);
      expect(snapped.y).toBeCloseTo(50);
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

  describe('calculateArea', () => {
    it('calculates absolute area of a square', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      expect(calculateArea(square)).toBe(10000);
    });
  });

  describe('getOrthoPoint', () => {
    it('snaps to horizontal line if dx > dy', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 10 };
      expect(getOrthoPoint(start, end)).toEqual({ x: 100, y: 0 });
    });

    it('snaps to vertical line if dy > dx', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 10, y: 100 };
      expect(getOrthoPoint(start, end)).toEqual({ x: 0, y: 100 });
    });
  });

  describe('formatDistance', () => {
    it('formats pixels to cm string with one decimal', () => {
      expect(formatDistance(100, 2)).toBe('50.0 cm');
      expect(formatDistance(33, 10)).toBe('3.3 cm');
    });
  });

  describe('scalePoints', () => {
    it('scales points correctly', () => {
      const points = [{ x: 10, y: 20 }, { x: 5, y: 5 }];
      expect(scalePoints(points, 2, 0.5)).toEqual([{ x: 20, y: 10 }, { x: 10, y: 2.5 }]);
    });
  });

  describe('getDistanceToSegment', () => {
    const v = { x: 0, y: 0 };
    const w = { x: 100, y: 0 };

    it('returns distance to projection on segment', () => {
      const p = { x: 50, y: 50 };
      const result = getDistanceToSegment(p, v, w);
      expect(result.distance).toBe(50);
      expect(result.point).toEqual({ x: 50, y: 0 });
    });

    it('returns distance to start point if projection is before start', () => {
      const p = { x: -10, y: 10 };
      const result = getDistanceToSegment(p, v, w);
      expect(result.distance).toBeCloseTo(Math.sqrt(200));
      expect(result.point).toEqual(v);
    });

    it('returns distance to end point if projection is after end', () => {
      const p = { x: 110, y: 10 };
      const result = getDistanceToSegment(p, v, w);
      expect(result.distance).toBeCloseTo(Math.sqrt(200));
      expect(result.point).toEqual(w);
    });

    it('handles zero-length segment', () => {
      const p = { x: 10, y: 10 };
      const result = getDistanceToSegment(p, v, v);
      expect(result.distance).toBeCloseTo(Math.sqrt(200));
      expect(result.point).toEqual(v);
    });
  });

  describe('checkPolygonLineIntersect', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];

    it('returns true if line crosses polygon', () => {
      expect(checkPolygonLineIntersect(poly, { x: -50, y: 50 }, { x: 150, y: 50 })).toBe(true);
    });

    it('returns true if line is entirely inside polygon', () => {
      expect(checkPolygonLineIntersect(poly, { x: 25, y: 25 }, { x: 75, y: 75 })).toBe(true);
    });

    it('returns false if line is outside polygon', () => {
      expect(checkPolygonLineIntersect(poly, { x: 150, y: 0 }, { x: 150, y: 100 })).toBe(false);
    });
  });

  describe('checkCirclePolygonIntersect', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ];

    it('returns true if circle center is inside', () => {
      expect(checkCirclePolygonIntersect({ x: 50, y: 50 }, 10, poly)).toBe(true);
    });

    it('returns true if circle overlaps edge', () => {
      expect(checkCirclePolygonIntersect({ x: -5, y: 50 }, 10, poly)).toBe(true);
    });

    it('returns false if circle is entirely outside', () => {
      expect(checkCirclePolygonIntersect({ x: -20, y: 50 }, 10, poly)).toBe(false);
    });
  });

  describe('getSnappedFurniturePosition', () => {
    const rooms = [{
      id: 'room1',
      points: [
        { x: 0, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 500 },
        { x: 0, y: 500 }
      ]
    }];
    const furniture: any[] = [];
    const threshold = 20;

    it('snaps center-based rectangle to wall', () => {
      // Furniture at 405x, 250y, width 100, height 100
      // Right edge is at 405 + 50 = 455
      // Wall is at 500. Distance = 45. Should NOT snap if threshold is 20.
      
      const pos = { x: 445, y: 250 }; 
      // Right edge is 445 + 50 = 495. Wall is 500. Dist = 5. Snaps!
      // Offset should be +5.
      const snapped = getSnappedFurniturePosition(pos, 100, 100, 0, rooms, furniture, threshold);
      expect(snapped.x).toBe(450);
      expect(snapped.y).toBe(250);
    });
  });

  describe('checkCirclesIntersect', () => {
    it('returns true for overlapping circles', () => {
      expect(checkCirclesIntersect({ x: 0, y: 0 }, 10, { x: 15, y: 0 }, 10)).toBe(true);
    });
    it('returns false for separate circles', () => {
      expect(checkCirclesIntersect({ x: 0, y: 0 }, 5, { x: 20, y: 0 }, 5)).toBe(false);
    });
  });

  describe('checkCircleLineIntersect', () => {
    it('returns true if line passes through circle', () => {
      expect(checkCircleLineIntersect({ x: 0, y: 0 }, 10, { x: -20, y: 0 }, { x: 20, y: 0 })).toBe(true);
    });
    it('returns false if line misses circle', () => {
      expect(checkCircleLineIntersect({ x: 0, y: 0 }, 10, { x: 20, y: 20 }, { x: 40, y: 40 })).toBe(false);
    });
  });
});
