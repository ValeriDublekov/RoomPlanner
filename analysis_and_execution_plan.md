# PROJECT REFLECTION & ATOMIC EXECUTION PLAN

## SECTION 1: Architectural & Documentation Gaps (Summary)

- **Code Health Summary:** The project has a strong macro-architecture: Zustand slices, a tool-registry-driven canvas interaction layer, a shared 2D/3D domain model, and a clean desktop/mobile shell split. The main systemic weaknesses are cross-cutting rather than local: routing is now more complex than the deployment setup assumes, hot render paths still subscribe to too much shared state, export flows mutate global UI state during async work, and undo/history is implemented with duplicated snapshot logic rather than one typed source of truth.
- **Code Health Summary:** The most important technical risks are: production routing under a non-root base path, render thrash from broad `useStore` reads in Canvas and hot hooks, and undo snapshot drift because the runtime stores more fields than the declared `HistoryEntry` type. These are architectural issues, not formatting problems.
- **Code Health Summary:** Baseline validation is not currently executable in this workspace because project-local Node binaries are unavailable. Both `npm run lint` and `npm test` fail before execution with missing `tsc` and `vitest`, so the implementation model should install dependencies before using command-based verification.
- **Spec Drift Report:** The documentation set is uneven. The AI context notes are mostly current, but the highest-level docs and user-facing docs have drifted behind the routed app shell, current keyboard shortcuts, and current store shape.

| Document | Current Accuracy | Action Required | Why |
| --- | --- | --- | --- |
| [README.md](README.md) | Mostly accurate | Retain as-is | High-level feature description still matches the product. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stale | Update to match code | It still documents an older component/file map and does not reflect `DesktopLayout`, mobile routes, the tool registry, or the current slice-based store shape. |
| [docs/AI_IMPROVEMENT_PROMPTS.md](docs/AI_IMPROVEMENT_PROMPTS.md) | Accurate | Retain as-is | This is a workflow document, not a runtime spec, and it still fits the repo. |
| [docs/DOCUMENTATION_AUDIT.md](docs/DOCUMENTATION_AUDIT.md) | Obsolete | Rewrite or delete | It references documents that are no longer present in the workspace, so it is no longer a reliable inventory. |
| [docs/FIREBASE_AUTH_SETUP.md](docs/FIREBASE_AUTH_SETUP.md) | Accurate | Retain as-is | It remains a focused operational guide with clear value. |
| [docs/TECHNICAL_DEBTS.md](docs/TECHNICAL_DEBTS.md) | Partially stale | Update | It still flags the old `useCanvasLogic` problem as unresolved even though the tool registry already exists. |
| [docs/TECHNICAL_DOCS.md](docs/TECHNICAL_DOCS.md) | Mostly accurate | Update targeted sections | Geometry guidance is still useful, but export/3D and migration descriptions no longer fully match the live implementation boundaries. |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Stale | Update | The shortcut guide is incorrect for Ortho mode and it under-documents the routed mobile viewer behavior. |
| [docs/AI_AGENT_CONTEXT/README.md](docs/AI_AGENT_CONTEXT/README.md) | Accurate | Retain as-is | It correctly positions the folder as navigation aid rather than source of truth. |
| [docs/AI_AGENT_CONTEXT/00_CHEAT_SHEET.md](docs/AI_AGENT_CONTEXT/00_CHEAT_SHEET.md) | Mostly accurate | Retain as-is | Good quick-start note; no blocking inaccuracies found. |
| [docs/AI_AGENT_CONTEXT/01_PROJECT_OVERVIEW.md](docs/AI_AGENT_CONTEXT/01_PROJECT_OVERVIEW.md) | Stale | Update | It still describes the app as effectively a single-page editor and omits the routed mobile shell. |
| [docs/AI_AGENT_CONTEXT/02_RUNTIME_FLOW.md](docs/AI_AGENT_CONTEXT/02_RUNTIME_FLOW.md) | Partially stale | Update | It blurs keyboard ownership between App and Canvas and should reflect the current top-level shortcut registration more precisely. |
| [docs/AI_AGENT_CONTEXT/03_STATE_STORE.md](docs/AI_AGENT_CONTEXT/03_STATE_STORE.md) | Stale | Update | It says the store has six slices, but the live store has seven, including the theme slice. |
| [docs/AI_AGENT_CONTEXT/04_DOMAIN_MODEL.md](docs/AI_AGENT_CONTEXT/04_DOMAIN_MODEL.md) | Partially stale | Update | It covers core entities well, but it should include beams and the actual undo snapshot shape. |
| [docs/AI_AGENT_CONTEXT/05_COMPONENT_AND_HOOK_MAP.md](docs/AI_AGENT_CONTEXT/05_COMPONENT_AND_HOOK_MAP.md) | Accurate | Retain as-is | The ownership map still matches the code well enough. |
| [docs/AI_AGENT_CONTEXT/06_EXPORT_AND_3D.md](docs/AI_AGENT_CONTEXT/06_EXPORT_AND_3D.md) | Mostly accurate | Retain now, update after export refactor | It is usable today, but it should be revised once export state handling is cleaned up. |
| [docs/AI_AGENT_CONTEXT/07_CLOUD_AND_PERSISTENCE.md](docs/AI_AGENT_CONTEXT/07_CLOUD_AND_PERSISTENCE.md) | Accurate | Retain as-is | The persistence split between browser storage and explicit save/load is documented correctly. |
| [docs/AI_AGENT_CONTEXT/08_TOOLING_AND_VALIDATION.md](docs/AI_AGENT_CONTEXT/08_TOOLING_AND_VALIDATION.md) | Stale | Update | It claims lint is only a typecheck, but the live script is `tsc --noEmit && eslint .`. |
| [docs/AI_AGENT_CONTEXT/09_HOTSPOTS_AND_EDIT_GUIDELINES.md](docs/AI_AGENT_CONTEXT/09_HOTSPOTS_AND_EDIT_GUIDELINES.md) | Accurate | Retain as-is | The hotspot guidance still matches the codebase well. |
| [docs/AI_AGENT_CONTEXT/10_CHANGE_RECIPES.md](docs/AI_AGENT_CONTEXT/10_CHANGE_RECIPES.md) | Partially stale | Update | The validation guidance around `npm run lint` is outdated. |
| [src/config/themes/README.md](src/config/themes/README.md) | Accurate | Retain as-is | The theme registration instructions match the existing theme structure. |

## SECTION 2: Atomic Execution Plan for the Implementation Model

### Step 1: Fix Router Basename And Static-Host Compatibility
- **Target File(s):** `src/App.tsx`, `vite.config.ts`
- **Objective:** Make desktop and mobile routes resolve correctly under the production base path and on static hosting. The goal is to stop the current route tree from assuming root-hosted navigation.
- **The Gap:** The app builds with a production base of `/RoomPlanner/`, but `src/App.tsx` mounts a plain `BrowserRouter` with absolute route navigation. That is structurally unsafe for GitHub Pages direct links and refreshes, especially for `/mobile` and `/mobile/view/:projectId`.
- **The Solution (Specification):** In `src/App.tsx`, derive a router basename from `import.meta.env.BASE_URL`. Use that basename in `BrowserRouter`. Keep route definitions unchanged unless a direct-link test shows a need for `HashRouter` instead. Do not change feature behavior; only align routing with deployment.
- **Code/Text Blueprint:**
```tsx
const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

return (
  <BrowserRouter basename={basename}>
    <Routes>
      <Route path="/" element={isMobileDevice() ? <Navigate to="/mobile" replace /> : <DesktopLayout />} />
      <Route path="/mobile" element={<MobileDashboard />} />
      <Route path="/mobile/view/:projectId" element={<MobileViewer />} />
    </Routes>
  </BrowserRouter>
);
```
- **Verification Criteria:** After installing dependencies, production preview must navigate correctly at `/RoomPlanner/`, `/RoomPlanner/mobile`, and `/RoomPlanner/mobile/view/test-id` without route breakage. The desktop root route must still open the desktop shell on non-mobile devices.

### Step 2: Replace Broad Canvas Store Reads With Narrow Selectors
- **Target File(s):** `src/components/Canvas.tsx`, `src/store.ts`
- **Objective:** Reduce unnecessary Canvas re-renders by subscribing only to the state that the component actually renders or coordinates.
- **The Gap:** `src/components/Canvas.tsx` destructures a large object from `useStore` and also mixes in many imperative `useStore.getState()` reads for overlay props. That makes the main editor shell react to unrelated store mutations and obscures which state really drives rendering.
- **The Solution (Specification):** Export narrow selector helpers from `src/store.ts` or define local selector objects in `src/components/Canvas.tsx`. Split subscriptions into: viewport/render state, selection state, and overlay state. Use shallow comparison for object selectors. Remove inline `useStore.getState()` calls from render props when the values are part of the rendered output.
- **Code/Text Blueprint:**
```tsx
const canvasView = useStore(state => ({
  scale: state.scale,
  position: state.position,
  activeLayer: state.activeLayer,
  backgroundImage: state.backgroundImage,
  gridVisible: state.gridVisible,
  isReadOnly: state.isReadOnly,
}), shallow);

const canvasSelection = useStore(state => ({
  selectedId: state.selectedId,
  selectedRoomId: state.selectedRoomId,
  selectedDimensionId: state.selectedDimensionId,
}), shallow);

const overlayState = useStore(state => ({
  lastMeasurement: state.lastMeasurement,
  resetMeasurement: state.resetMeasurement,
  orthoMode: state.orthoMode,
  snapToGrid: state.snapToGrid,
  roomPoints: state.roomPoints,
  continueRoom: state.continueRoom,
  closeOpenRoom: state.closeOpenRoom,
}), shallow);
```
- **Verification Criteria:** Profiling a furniture move or room-point edit should show fewer Canvas re-renders. Behavior must remain identical: selection auto-focus, export actions, overlay updates, and viewport resize handling must still work.

### Step 3: Narrow Hot-Path Hook Subscriptions
- **Target File(s):** `src/hooks/useMouseSnapping.ts`, `src/hooks/useKeyboardShortcuts.ts`, `src/hooks/useFileOperations.ts`, `src/components/RightSidebar.tsx`
- **Objective:** Remove wide global-store subscriptions from high-frequency hooks and large property panels.
- **The Gap:** Several hot paths still call `useStore()` without selectors or with many isolated subscriptions. The most expensive cases are snapping and the sidebar, but the same pattern appears in keyboard and file-operation hooks.
- **The Solution (Specification):** In hot hooks, read only stable state with selector-based subscriptions and move event-time state reads to `useStore.getState()` inside callbacks. In `src/components/RightSidebar.tsx`, replace the many individual subscriptions with one shallow-selected slice for the visible panel state and one derived selected-entity block.
- **Code/Text Blueprint:**
```tsx
const snappingState = useStore(state => ({
  scale: state.scale,
  mode: state.mode,
  activeLayer: state.activeLayer,
  snapToGrid: state.snapToGrid,
  snapToObjects: state.snapToObjects,
  snapToImage: state.snapToImage,
  edgeMap: state.edgeMap,
  backgroundPosition: state.backgroundPosition,
  backgroundScale: state.backgroundScale,
  backgroundRotation: state.backgroundRotation,
  orthoMode: state.orthoMode,
  roomPoints: state.roomPoints,
  measurePoints: state.measurePoints,
  pixelsPerCm: state.pixelsPerCm,
  pendingFurniture: state.pendingFurniture,
  rooms: state.rooms,
  furniture: state.furniture,
}), shallow);
```
- **Verification Criteria:** Mouse movement while drawing or placing furniture must remain smooth, keyboard shortcuts must still work globally, and selecting objects must still switch the sidebar to the Properties tab.

### Step 4: Create A Typed Undo Snapshot And Remove History Drift
- **Target File(s):** `src/types.ts`, `src/store/slices/projectSlice.ts`, `src/store/slices/roomSlice.ts`, `src/store/slices/furnitureSlice.ts`, `src/store/slices/dimensionSlice.ts`
- **Objective:** Make undo/history behavior deterministic and type-safe across all slices.
- **The Gap:** The declared `HistoryEntry` type in `src/types.ts` only covers rooms, furniture, and dimensions, but live history snapshots also store wall attachments and beams through `as any`. Some actions also mix `saveHistory()` calls with inline history pushes, which makes undo semantics brittle and hard to audit.
- **The Solution (Specification):** Replace the current `HistoryEntry` contract with an explicit undo snapshot type that matches the actual runtime shape. Implement one shared snapshot builder and use it consistently. Any mutation path must either call the helper once or compose through a centralized history-aware action, never both.
- **Code/Text Blueprint:**
```ts
export interface UndoSnapshot {
  rooms: RoomObject[];
  furniture: FurnitureObject[];
  dimensions: DimensionObject[];
  wallAttachments: WallAttachment[];
  beams: BeamObject[];
}

const buildUndoSnapshot = (state: AppState): UndoSnapshot => ({
  rooms: state.rooms,
  furniture: state.furniture,
  dimensions: state.dimensions,
  wallAttachments: state.wallAttachments,
  beams: state.beams,
});
```
- **Verification Criteria:** Undo must restore beams and wall attachments along with rooms, furniture, and dimensions. TypeScript must no longer require `as any` for history snapshots. No action should append duplicate history entries.

### Step 5: Make 2D Export Flows Transactional
- **Target File(s):** `src/hooks/useCanvasExport.ts`, `src/store/slices/uiSlice.ts`
- **Objective:** De-duplicate export logic and prevent export-time UI state mutations from clobbering later user interactions.
- **The Gap:** PNG export, print, and thumbnail generation all repeat the same pattern: capture selection and grid state, clear them, await async work, then restore. That repeated sequence is easy to drift and can restore stale state over user changes.
- **The Solution (Specification):** Introduce one export transaction helper inside `src/hooks/useCanvasExport.ts` and, if needed, a transient `isExporting` flag in `src/store/slices/uiSlice.ts`. The helper must capture the temporary export state once, apply the temporary clear state once, use `try/finally`, and restore only the exact fields it changed.
- **Code/Text Blueprint:**
```ts
const withTemporaryExportState = async <T>(run: () => Promise<T>): Promise<T> => {
  const snapshot = pickExportUiSnapshot(useStore.getState());
  applyExportUiMask();
  try {
    return await run();
  } finally {
    restoreExportUiSnapshot(snapshot);
  }
};
```
- **Verification Criteria:** PNG export, print, and thumbnail generation must still produce identical output. Grid visibility and selections must be restored after export. No duplicate export-preparation code should remain.

### Step 6: Remove Live Three.js Scene Objects From Zustand
- **Target File(s):** `src/store/slices/uiSlice.ts`, `src/components/ThreeD/ThreeDPreview.tsx`, `src/hooks/useCanvasExport.ts`
- **Objective:** Decouple runtime render objects from shared application state.
- **The Gap:** The store currently keeps `threeScene: any | null`, which is a live scene reference rather than application state. That couples export behavior to preview internals and weakens state serializability and ownership boundaries.
- **The Solution (Specification):** Remove `threeScene` and `setThreeScene` from the store. Keep the scene in a component ref inside `src/components/ThreeD/ThreeDPreview.tsx`, and have export code either generate a fresh scene from state or consume an explicit callback/ref owned by the preview component.
- **Code/Text Blueprint:**
```tsx
const sceneRef = useRef<THREE.Scene | null>(null);

useEffect(() => {
  sceneRef.current = buildSceneFromProjectState(projectState);
  return () => {
    sceneRef.current = null;
  };
}, [projectState]);
```
- **Verification Criteria:** 3D preview must still render, and OBJ/GLB export paths must still work. The store type must no longer contain a live scene reference.

### Step 7: Rewrite The High-Level Architecture Documents
- **Target File(s):** `docs/ARCHITECTURE.md`, `docs/AI_AGENT_CONTEXT/01_PROJECT_OVERVIEW.md`, `docs/AI_AGENT_CONTEXT/03_STATE_STORE.md`
- **Objective:** Bring the top-level architecture narrative back in sync with the code so future changes start from the right ownership map.
- **The Gap:** These documents still describe an older component topology, an effectively single-page app, and a six-slice store. They under-document the routed mobile shell, theme slice, and the actual layout composition through `DesktopLayout`.
- **The Solution (Specification):** Rewrite the project-structure and store sections to reflect the current shell split and the actual slice list. Replace old component-path examples with the current ones. Add one short subsection that explains desktop shell versus mobile dashboard/mobile viewer.
- **Code/Text Blueprint:**
```md
## App Shells

- Desktop shell: App -> DesktopLayout -> Sidebar + Canvas + RightSidebar + optional ThreeDPreview
- Mobile shell: App -> MobileDashboard / MobileViewer
- Shared state: one persisted Zustand store with UI, room, furniture, dimension, project, auth, and theme slices
```
- **Verification Criteria:** A reader who starts from these documents should be able to find the desktop shell, mobile shell, and the seven live store slices without contradicting the code.

### Step 8: Correct Runtime, Tooling, And User-Facing Behavior Docs
- **Target File(s):** `docs/USER_GUIDE.md`, `docs/AI_AGENT_CONTEXT/02_RUNTIME_FLOW.md`, `docs/AI_AGENT_CONTEXT/08_TOOLING_AND_VALIDATION.md`, `docs/AI_AGENT_CONTEXT/10_CHANGE_RECIPES.md`
- **Objective:** Fix concrete behavioral inaccuracies that would mislead a user or a follow-up implementation agent.
- **The Gap:** The user guide documents Ortho mode on O even though `src/hooks/useKeyboardShortcuts.ts` uses H for Ortho and O for draw-circle. The runtime-flow doc is imprecise about keyboard ownership. The tooling doc misstates the lint script. The recipe doc repeats that outdated lint assumption.
- **The Solution (Specification):** Rewrite the shortcut section in `docs/USER_GUIDE.md` to match the live handler exactly. In the AI docs, explicitly state that App registers the shortcut hook globally, while Canvas handles editor orchestration and clipboard integration. Update validation notes to say that `npm run lint` runs both TypeScript and ESLint and that dependencies must be installed first.
- **Code/Text Blueprint:**
```md
### Keyboard Shortcuts

- H: toggle Ortho mode
- O: draw circle
- V: select
- R: draw room
- C: calibrate
- M: measure
- D: dimension
- S: toggle layer-specific snap behavior
```
- **Verification Criteria:** Every shortcut described in the documentation must match the key handling in `src/hooks/useKeyboardShortcuts.ts`. Validation instructions must match `package.json`.

### Step 9: Rewrite The Maintenance Docs Around Current Reality
- **Target File(s):** `docs/TECHNICAL_DEBTS.md`, `docs/DOCUMENTATION_AUDIT.md`, `docs/AI_AGENT_CONTEXT/04_DOMAIN_MODEL.md`
- **Objective:** Replace stale maintenance notes with a current backlog and a current source-of-truth map.
- **The Gap:** `docs/TECHNICAL_DEBTS.md` still lists a now-resolved `useCanvasLogic` debt as active. `docs/DOCUMENTATION_AUDIT.md` inventories files that are no longer in the repository. The domain model note should cover beams and the true undo snapshot structure.
- **The Solution (Specification):** In the debt doc, mark the tool-registry refactor as resolved and add the current high-value debts: broad Zustand subscriptions, export transaction duplication, and undo snapshot typing drift. Replace `docs/DOCUMENTATION_AUDIT.md` with a current file inventory or remove it after folding its useful guidance into the updated docs. Expand the domain model note to include `BeamObject` and the undo snapshot contract.
- **Code/Text Blueprint:**
```md
## Current High-Value Debts

1. Broad useStore subscriptions in Canvas and hot hooks
2. Export flows mutate and restore global UI state during async work
3. Undo snapshots are duplicated and under-typed
4. 3D scene ownership leaks into global store state
```
- **Verification Criteria:** The debt list must only contain active issues. The documentation audit file must reference only files that exist in the repository.

### Step 10: Refresh Technical Export And Geometry Guidance
- **Target File(s):** `docs/TECHNICAL_DOCS.md`, `docs/AI_AGENT_CONTEXT/06_EXPORT_AND_3D.md`, `docs/AI_AGENT_CONTEXT/07_CLOUD_AND_PERSISTENCE.md`
- **Objective:** Keep the technical spec aligned with the post-refactor boundaries for export, 3D generation, and persistence.
- **The Gap:** The geometry content is still broadly correct, but the technical docs do not clearly document the current export transaction boundaries, scene generation ownership, and the difference between persisted browser state, explicit project save/load, and transient UI-only state.
- **The Solution (Specification):** Add a focused subsection to `docs/TECHNICAL_DOCS.md` for export-state handling and 3D scene generation ownership. Update `docs/AI_AGENT_CONTEXT/06_EXPORT_AND_3D.md` to reflect the new export transaction helper and the absence of `threeScene` in global store state. Keep `docs/AI_AGENT_CONTEXT/07_CLOUD_AND_PERSISTENCE.md` as the persistence source of truth, but add one sentence clarifying that transient UI state is intentionally excluded from saved project JSON.
- **Code/Text Blueprint:**
```md
## Export State Handling

- Export temporarily suppresses selection and grid-only UI
- Export must restore only the fields it changes
- Scene generation is derived from project state, not stored as live app state
```
- **Verification Criteria:** A developer reading these docs must be able to answer three questions correctly: where export state is handled, where 3D scenes are generated, and which data is persisted to browser storage versus project JSON.

## SECTION 3: Recommended Additional Analyses

### 1. Render Profiling Pass
- **Why:** The architectural read shows likely render thrash, but the next useful step is measurement, not more speculation.
- **Recommended Scope:** Profile `Canvas`, `RightSidebar`, `CanvasStage`, and the main overlay path during room drawing, furniture drag, and selection changes.
- **Expected Output:** A ranked list of components by commit frequency and render cost, plus a map of which store fields trigger each path.

### 2. Store Mutation And Undo Consistency Audit
- **Why:** History creation is duplicated across slices and the declared undo type does not match runtime behavior.
- **Recommended Scope:** Enumerate every action that mutates rooms, furniture, dimensions, wall attachments, beams, or view-affecting state, and mark whether it saves history, clears selection, syncs dependent entities, and preserves invariants.
- **Expected Output:** A mutation matrix showing missing history saves, duplicate saves, inconsistent selection resets, and any entity-sync gaps.

### 3. Export Correctness And Concurrency Audit
- **Why:** Export code currently mixes UI masking, async waiting, and browser download side effects.
- **Recommended Scope:** Inspect PNG, print, DXF, OBJ, and GLB paths for duplicated logic, stale state restoration risk, and differences between preview-based and generated-scene exports.
- **Expected Output:** A refactor map separating pure generation, temporary UI state masking, and download delivery.

### 4. Deployment And Routing Validation
- **Why:** The app already has desktop/mobile routes and a production base path, which is a common source of environment-only failures.
- **Recommended Scope:** Verify deep-link behavior, refresh behavior, and navigation behavior under Vite dev, production preview, and GitHub Pages hosting assumptions.
- **Expected Output:** A routing compatibility note with the exact required router mode and basename behavior.

### 5. Documentation Governance Cleanup
- **Why:** The repo now has useful docs, but there is no enforced distinction between source-of-truth specs, agent notes, and maintenance notes.
- **Recommended Scope:** Classify each markdown file as product guide, architecture spec, AI operator note, or temporary maintenance artifact. Add ownership and review cadence metadata if you want the set to stay current.
- **Expected Output:** A lightweight documentation policy and a smaller, less redundant doc surface.

## SECTION 4: Baseline Validation Notes

- `npm run lint` could not execute because `tsc` was not available in the current environment.
- `npm test` could not execute because `vitest` was not available in the current environment.
- Before executing the implementation plan, install project dependencies and re-run the baseline checks.