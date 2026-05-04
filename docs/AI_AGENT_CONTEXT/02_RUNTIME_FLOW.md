# Runtime Flow

## App Startup

`src/App.tsx` does two important things on startup:

1. wires Firebase auth state into the Zustand store
2. registers a global undo keyboard handler

This means top-level keyboard behavior is not fully centralized in one hook.

## 2D Editor Flow

`src/components/Canvas.tsx` is the orchestration layer for the 2D editor.

It is responsible for:

- mounting header and subheader UI
- creating the Konva stage container and tracking viewport size
- connecting stage events to `useCanvasLogic`
- enabling `useKeyboardShortcuts` and clipboard paste support
- running blueprint edge detection when a background image exists
- rendering overlays, grid, and stage content

## Event Handling Path

Typical pointer flow:

1. `Canvas.tsx` passes stage events to `useCanvasLogic`
2. `useCanvasLogic.ts` resolves the current tool via `src/lib/tools/registry.ts`
3. the chosen tool handler receives the event with a `ToolContext`
4. the tool handler reads and mutates shared state through `useStore`

This tool-registry path is the main abstraction for drawing/editing modes.

## Selection Visibility Flow

`Canvas.tsx` reacts to selected entity changes and computes bounds for:

- selected furniture
- selected room
- selected dimension

Those bounds are passed to `ensureVisible`, which keeps selected content from ending up hidden behind UI panels.

## Blueprint Flow

When `backgroundImage` changes:

1. `Canvas.tsx` calls `processImageForEdges`
2. the resulting edge map is stored via `setEdgeMap`
3. snapping logic can then use the processed edge map for image-assisted tracing

## 3D Flow

3D preview is toggled by store state (`show3d`).

`ThreeDPreview.tsx`:

- reads rooms, furniture, wall settings, and attachments from the store
- builds and renders a 3D view through react-three-fiber
- supports dollhouse and first-person modes
- can export a 3D image directly from the canvas element
