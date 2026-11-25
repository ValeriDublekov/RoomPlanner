import { describe, it, expect } from 'vitest';
import { calculateRackLayout } from './rackUtils';
import { createFurnitureModel } from './furnitureFactory';

describe('calculateRackLayout', () => {
  it('computes evenly spaced shelves within the given height', () => {
    const layout = calculateRackLayout(200, 5);
    expect(layout.shelfCount).toBe(5);
    expect(layout.shelfThicknessCm).toBe(3);
    expect(layout.bottomClearanceCm).toBe(5);
    expect(layout.shelfCentersCm).toHaveLength(5);
    expect(layout.pitchCm).toBeCloseTo(48, 5);
    expect(layout.clearSpacingCm).toBeCloseTo(45, 5);

    // Top shelf sits flush at the top of the rack
    const topShelfTop = layout.shelfCentersCm[4] + layout.shelfThicknessCm / 2;
    expect(topShelfTop).toBeCloseTo(200, 5);

    // Bottom shelf starts at bottomClearanceCm
    const bottomShelfBottom = layout.shelfCentersCm[0] - layout.shelfThicknessCm / 2;
    expect(bottomShelfBottom).toBeCloseTo(5, 5);
  });

  it('recalculates spacing when height or shelf count changes', () => {
    const tall4 = calculateRackLayout(200, 4);
    const short4 = calculateRackLayout(140, 4);
    expect(tall4.clearSpacingCm).toBeGreaterThan(short4.clearSpacingCm);
    expect(tall4.pitchCm).toBeCloseTo(64, 5);
    expect(tall4.clearSpacingCm).toBeCloseTo(61, 5);
  });

  it('handles a single shelf gracefully', () => {
    const single = calculateRackLayout(180, 1);
    expect(single.shelfCount).toBe(1);
    expect(single.shelfCentersCm).toHaveLength(1);
    expect(single.pitchCm).toBe(0);
    expect(single.clearSpacingCm).toBeCloseTo(177, 5);
  });

  it('clamps invalid shelf counts and tiny heights', () => {
    const clamped = calculateRackLayout(20, 0);
    expect(clamped.shelfCount).toBe(1);
    expect(clamped.shelfCentersCm).toHaveLength(1);
  });
});

describe('createFurnitureModel rack', () => {
  it('creates exact number of shelf meshes for rack', () => {
    const group = createFurnitureModel('rack', {
      width: 120,
      height: 200,
      depth: 50,
      color: '#475569',
      secondaryColor: '#d1bfae',
      shelfCount: 6,
    });
    const shelfMeshes = group.children.filter((c) => c.name.startsWith('Shelf_'));
    const postMeshes = group.children.filter((c) => c.name.startsWith('Post_'));
    expect(shelfMeshes).toHaveLength(6);
    expect(postMeshes).toHaveLength(4);
  });
});
