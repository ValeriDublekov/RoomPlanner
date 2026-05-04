# Component And Hook Map

## Components Worth Knowing First

### `src/components/Canvas.tsx`

Main editor shell. If a behavior touches canvas orchestration, start here.

### `src/components/Canvas/CanvasHeader.tsx`

Header-level actions:

- save/load
- export/print
- view toggles
- file menu and related modals

This file mixes UI, modal state, and some DOM-driven file operations.

### `src/components/SubHeader.tsx`

Editor mode switcher and settings row.

Contains several toggles for snapping and drafting behavior.

### `src/components/Sidebar.tsx`

Main left toolbar and auth panel.

Responsible for:

- tool buttons
- catalog open action
- blueprint image upload controls
- login/logout actions

### `src/components/RightSidebar.tsx`

Property editing and secondary controls. Also relevant for visible drawing area calculations.

### `src/components/ThreeD/ThreeDPreview.tsx`

Main 3D preview experience and image export entry point.

## Hooks Worth Knowing First

### `src/hooks/useCanvasLogic.ts`

Bridges stage events into tool handlers.

### `src/hooks/useKeyboardShortcuts.ts`

Handles keyboard-driven tool switching, deletion, grouping, movement, dimension input, and copy/paste.

### `src/hooks/useCanvasExport.ts`

Likely the main export orchestration hook for 2D and 3D related actions. Check this before changing export entry points.

### `src/hooks/useMouseSnapping.ts`

Core snapping behavior. Start here for snap bugs.

### `src/hooks/useClipboardPaste.ts`

Imperative clipboard integration for copied furniture and similar flows.

## Libraries To Inspect Before Non-Trivial Refactors

- `src/lib/geometry.ts` and `src/lib/geometry/*`
- `src/lib/tools/*`
- `src/lib/edgeDetection.ts`
- `src/lib/threeSceneGenerator.ts`
- `src/lib/furnitureFactory.ts`
