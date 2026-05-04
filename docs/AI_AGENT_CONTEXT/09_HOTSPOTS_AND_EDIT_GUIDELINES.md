# Hotspots And Edit Guidelines

## High-Risk Files

### `src/components/Canvas.tsx`

This is a coordination hub. Small changes here can affect:

- event handling
- resize behavior
- auto-fit logic
- overlays
- edge detection
- export wiring

### `src/hooks/useCanvasLogic.ts`

This file sits on the main pointer-event path. Changes here can affect all interactive modes.

### `src/store.ts`

Persistence configuration changes can silently affect reload behavior.

### `src/store/slices/projectSlice.ts`

This is a high-impact file because it combines:

- history handling
- project migrations
- local save/download
- cloud save logic

### `src/components/ThreeD/ThreeDPreview.tsx`

This file mixes UI, rendering, export, and mode-switch behavior.

## Known Technical Debt Signals

From `TECHNICAL_DEBTS.md` and current code shape:

- wall-rendering logic has existed in duplicated form across room-related components
- settings UI in `SubHeader.tsx` is a natural extraction target
- keyboard shortcut logic is split across multiple places
- export helpers mix generation and browser download effects

## Safe Edit Strategy

When making non-trivial changes, use this order:

1. identify the owning flow file
2. check the nearest slice, hook, or helper used by that flow
3. check whether tests already exist nearby
4. make the smallest change that preserves current behavior
5. run the narrowest validation immediately after the edit

## Practical Routing Hints

- selection or viewport bug: start in `Canvas.tsx`, then `uiSlice` and related helpers
- drawing-mode bug: start in `useCanvasLogic.ts`, then `src/lib/tools/*`
- snap bug: start in `useMouseSnapping.ts`, geometry helpers, and edge detection
- save/load bug: start in `projectSlice.ts`
- auth bug: start in `firebase.ts`, `authSlice.ts`, and `App.tsx`
- 3D mismatch bug: start in `threeSceneGenerator.ts`, `ThreeDPreview.tsx`, and `types.ts`

## Assumptions Agents Should Not Make

- not every state field is persisted
- not every save action goes to Firestore
- room point order is not arbitrary
- wall attachments are not independent from room geometry
- export functions are not necessarily pure
