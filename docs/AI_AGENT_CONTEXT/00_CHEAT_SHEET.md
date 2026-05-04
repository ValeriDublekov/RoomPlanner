# Cheat Sheet

## Stack

- React 19
- Vite 6
- TypeScript
- Zustand
- Konva / react-konva
- Three.js / react-three-fiber / drei
- Firebase Auth + Firestore
- Vitest

## Start Here By Change Type

- Drawing behavior: `src/components/Canvas.tsx`, `src/hooks/useCanvasLogic.ts`, `src/lib/tools/*`
- Snapping bug: `src/hooks/useMouseSnapping.ts`, `src/lib/geometry.ts`, `src/lib/edgeDetection.ts`
- Save/load bug: `src/store/slices/projectSlice.ts`, `src/store.ts`, `src/firebase.ts`
- Export bug: `src/hooks/useCanvasExport.ts`, `src/lib/dxfExport.ts`, `src/lib/objExport.ts`, `src/lib/glbExport.ts`
- 3D mismatch: `src/components/ThreeD/ThreeDPreview.tsx`, `src/lib/threeSceneGenerator.ts`, `src/types.ts`
- UI panel change: `src/components/SubHeader.tsx`, `src/components/Sidebar.tsx`, `src/components/RightSidebar.tsx`, `src/components/Canvas/CanvasHeader.tsx`

## Main Runtime Path

1. `src/App.tsx` sets layout and auth subscription
2. `src/components/Canvas.tsx` orchestrates the 2D editor
3. `src/hooks/useCanvasLogic.ts` routes pointer events
4. `src/lib/tools/registry.ts` picks the active tool handler
5. tool handlers mutate store state

## Main Store Facts

- Root store lives in `src/store.ts`
- Persisted browser state is not the same as saved project JSON
- Important save/load logic lives in `src/store/slices/projectSlice.ts`
- Broad `useStore()` reads exist; prefer narrow selectors when editing render paths

## Validation Commands

- TypeScript check: `npm run lint`
- Tests: `npm test`
- Build: `npm run build`

## High-Risk Files

- `src/components/Canvas.tsx`
- `src/hooks/useCanvasLogic.ts`
- `src/store.ts`
- `src/store/slices/projectSlice.ts`
- `src/components/ThreeD/ThreeDPreview.tsx`

## Do Not Assume

- not every state field is persisted
- not every save goes to Firestore
- room point order is arbitrary
- wall attachments are independent of room geometry
- export helpers are pure functions
