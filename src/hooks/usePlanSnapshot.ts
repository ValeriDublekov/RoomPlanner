import { useMemo } from 'react';
import { useStore } from '../store';
import { derivePlanSnapshot } from '../lib/geometry/planSnapshot';
import { PlanSnapshot } from '../types';

/**
 * A hook that provides a memoized PlanSnapshot based on the current store state.
 * This is the primary point of entry for components needing topologically derived geometry.
 */
export const usePlanSnapshot = (): PlanSnapshot => {
  const rooms = useStore(state => state.rooms);
  const wallThickness = useStore(state => state.wallThickness);
  const pixelsPerCm = useStore(state => state.pixelsPerCm);

  return useMemo(() => {
    return derivePlanSnapshot(rooms, wallThickness, pixelsPerCm);
  }, [rooms, wallThickness, pixelsPerCm]);
};
