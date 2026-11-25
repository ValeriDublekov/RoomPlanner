export interface RackLayout {
  shelfCount: number;
  shelfThicknessCm: number;
  bottomClearanceCm: number;
  shelfCentersCm: number[];
  pitchCm: number;
  clearSpacingCm: number;
}

/**
 * Calculates vertical shelf positions and spacing for a shelving rack
 * based on its total height (cm) and number of shelves.
 */
export function calculateRackLayout(heightCm: number, shelfCount = 5): RackLayout {
  const safeHeight = Math.max(10, Number.isFinite(heightCm) ? heightCm : 200);
  const count = Math.max(1, Math.min(30, Math.round(Number.isFinite(shelfCount) ? shelfCount : 5)));

  const shelfThicknessCm = Math.min(3, Math.max(0.5, safeHeight / (count * 2.5)));
  const bottomClearanceCm =
    count === 1
      ? 0
      : Math.min(5, Math.max(0, (safeHeight - count * shelfThicknessCm) * 0.15));

  if (count === 1) {
    const center = safeHeight - shelfThicknessCm / 2;
    return {
      shelfCount: 1,
      shelfThicknessCm,
      bottomClearanceCm: 0,
      shelfCentersCm: [center],
      pitchCm: 0,
      clearSpacingCm: Math.max(0, safeHeight - shelfThicknessCm),
    };
  }

  const yStart = bottomClearanceCm + shelfThicknessCm / 2;
  const yEnd = safeHeight - shelfThicknessCm / 2;
  const pitchCm = (yEnd - yStart) / (count - 1);
  const clearSpacingCm = Math.max(0, pitchCm - shelfThicknessCm);
  const shelfCentersCm = Array.from({ length: count }, (_, i) => yStart + i * pitchCm);

  return {
    shelfCount: count,
    shelfThicknessCm,
    bottomClearanceCm,
    shelfCentersCm,
    pitchCm,
    clearSpacingCm,
  };
}
