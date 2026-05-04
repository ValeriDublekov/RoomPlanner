# Change Recipes

## Recipe: Change Drawing Mode Behavior

Read first:

- `src/components/Canvas.tsx`
- `src/hooks/useCanvasLogic.ts`
- `src/lib/tools/registry.ts`
- relevant handler in `src/lib/tools/*`
- relevant store slice in `src/store/slices/*`

Typical steps:

1. Find which `AppMode` owns the behavior.
2. Inspect the mapped tool handler.
3. Check whether the change belongs in the handler, the hook, or the store action.
4. Keep event-routing changes in the hook minimal.
5. Validate with the narrowest relevant test or `npm run lint`.

## Recipe: Fix A Snapping Issue

Read first:

- `src/hooks/useMouseSnapping.ts`
- `src/lib/geometry.ts`
- `src/lib/edgeDetection.ts`
- `src/types.ts`

Typical steps:

1. Determine whether the issue is grid snap, object snap, room-edge snap, or image-edge snap.
2. Check world-space versus image-space conversion.
3. Confirm thresholds and fallback order.
4. Add or extend geometry tests if the bug is computational.
5. Validate with tests first, then typecheck.

## Recipe: Change Save/Load Behavior

Read first:

- `src/store.ts`
- `src/store/slices/projectSlice.ts`
- `src/firebase.ts`
- cloud dialogs under `src/components/Sidebar/*` or `src/components/Canvas/*`

Typical steps:

1. Separate browser persistence from explicit project save/load.
2. Check both persist migration and project JSON migration.
3. Confirm whether the user is authenticated or anonymous.
4. Keep cloud and local fallback behavior aligned unless the task explicitly changes that.
5. Validate with store tests if available, then typecheck.

## Recipe: Change Export Behavior

Read first:

- `src/hooks/useCanvasExport.ts`
- `src/lib/dxfExport.ts`
- `src/lib/objExport.ts`
- `src/lib/glbExport.ts`
- `src/lib/export.test.ts`

Typical steps:

1. Identify whether the change is generation logic, filtering logic, or browser download logic.
2. Keep pure generation separate from DOM download side effects when possible.
3. Reuse the existing export tests and mocks.
4. Validate with focused tests first.

## Recipe: Change 3D Rendering

Read first:

- `src/components/ThreeD/ThreeDPreview.tsx`
- `src/components/ThreeD/RoomElements.tsx`
- `src/components/ThreeD/FurnitureModels.tsx`
- `src/lib/threeSceneGenerator.ts`
- `src/types.ts`

Typical steps:

1. Confirm whether the mismatch is in preview rendering or export scene generation.
2. Check unit conversion using `pixelsPerCm`.
3. Check group and child furniture positioning rules.
4. Validate by typecheck and by extending export/scene tests if the change is structural.

## Recipe: Change Header Or Sidebar UI

Read first:

- `src/components/Canvas/CanvasHeader.tsx`
- `src/components/SubHeader.tsx`
- `src/components/Sidebar.tsx`
- `src/components/RightSidebar.tsx`

Typical steps:

1. Decide whether the component is acting as layout, orchestration, or detailed control UI.
2. If logic and UI are mixed, prefer a small extraction instead of a full redesign.
3. Preserve current keyboard shortcuts and state transitions.
4. Validate with typecheck.

## Recipe: Change Store State Shape

Read first:

- `src/store.ts`
- affected file in `src/store/slices/*`
- `src/types.ts`
- `src/store/slices/projectSlice.ts` if persistence is involved

Typical steps:

1. Update the relevant slice type and creator.
2. Check whether the field should be persisted.
3. Check whether old saved data needs migration.
4. Inspect consumers using broad `useStore()` reads.
5. Validate with tests and `npm run lint`.
