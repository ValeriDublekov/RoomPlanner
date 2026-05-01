import { AppState } from '../store';

/**
 * Keys strictly required for persisting the project state.
 * These are used by both LocalStorage persistence and Cloud/File saving.
 */
/**
 * HOW TO ADD NEW PERSISTED FIELDS:
 * 1. Add the field key to PERSISTED_KEYS array below.
 * 2. Ensure initial values are set in the respective slices.
 * 3. If the field requires special migration logic, update the 'migrate' function in src/store.ts
 *    and potentially bump the 'version' number in persist config.
 * 
 * NOTE: PERSISTED_KEYS are used for:
 * - LocalStorage (via Zustand persist)
 * - File Export/Import
 * - Cloud database saving
 */
export const PERSISTED_KEYS = [
  'projectId',
  'projectName',
  'pixelsPerCm',
  'rooms',
  'furniture',
  'dimensions',
  'wallAttachments',
  'wallThickness',
  'wallHeight',
  'backgroundImage',
  'backgroundVisible',
  'backgroundPosition',
  'backgroundScale',
  'backgroundRotation',
  'backgroundOpacity',
  'beams',
  'activeThemeId',
] as const;

export type PersistedState = Pick<AppState, typeof PERSISTED_KEYS[number]> & {
  version?: number;
};
