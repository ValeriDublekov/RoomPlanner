# Technical Debts & Refactoring Roadmap

This document tracks known logical complexities, suboptimal implementations, and areas that require refactoring to improve maintainability and performance.

## 1. Component Bloat

### `CanvasStage.tsx` (~60 lines)
- **Status**: Resolved
- **Issue**: Handled high-level Konva Layer definitions AND complex context menu hit-detection logic.
- **Outcome**: 
    - Extracted Context Menu hit-detection into `useStageContextMenu.ts`.
    - Split Konva layers into dedicated components in `src/components/Canvas/Layers/` (`BackgroundLayer.tsx`, `ArchitecturalLayer.tsx`, `AnnotationOverlay.tsx`, `InteractionLayer.tsx`).

### `RoomItem.tsx` and `RoomEditor.tsx`
- **Status**: Medium
- **Issue**: Significant logic duplication regarding segment identification and wall rendering.
- **Refactoring Strategy**: Unify shared wall-rendering logic into a `WallSegmentRenderer` component or utility.

## 2. Large Logic Hooks

### `useCanvasLogic.ts` (~220+ lines)
- **Status**: High
- **Issue**: Handles almost every global mouse interaction (click, double click, mouse down, wheel). This makes it difficult to add new modes without adding even more `if (mode === ...)` branches.
- **Refactoring Strategy**: Implement a **State Pattern** for tools. Create a registry of tool handlers that respond to standard events (onMouseDown, onClick), removing the massive switch/if logic from the hook.

## 3. Library & Geometry

### `geometry.ts` (~500+ lines)
- **Status**: Low
- **Issue**: Large file containing everything from basic distance calcs to complex Shoelace area and Edge Detection formatting.
- **Refactoring Strategy**: Split into:
    - `math.ts`: Pure mathematical primitives.
    - `collision.ts`: SAT and intersection logic.
    - `formatting.ts`: Display and unit conversion logic.

## 4. UI Consistency

### SubHeader Settings
- **Status**: Low
- **Issue**: Settings checkboxes (Ortho, Snap) are handled directly in `SubHeader.tsx`. 
- **Refactoring Strategy**: Move these into a cohesive `SettingsPanel.tsx` or handle via a single `SystemBar` component.

## 5. Viewport Logic

### Right Sidebar Overlap
- **Status**: Improved but could be better
- **Issue**: `fitToScreen` and `ensureVisible` use hardcoded offsets (60, 400) to account for the sidebar.
- **Refactoring Strategy**: Use a dynamic layout listener to detect visible drawing area dimensions instead of hardcoding sidebar widths.
