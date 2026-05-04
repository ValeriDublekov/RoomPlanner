# Project Overview

## Purpose

RoomPlanner is a browser-based floor-plan editor with:

- 2D drafting on a Konva canvas
- blueprint image import and calibration
- room, furniture, dimension, and wall-attachment editing
- real-time 3D preview built from the same project state
- export flows for image, DXF, OBJ, and GLB
- optional cloud save/load through Firebase

## Main Entry Points

- `src/main.tsx`: app bootstrap
- `src/App.tsx`: top-level layout and auth wiring
- `src/components/Canvas.tsx`: main 2D editor shell
- `src/components/ThreeD/ThreeDPreview.tsx`: 3D modal-like fullscreen view
- `src/store.ts`: composed Zustand store

## High-Level Layout

`App.tsx` renders:

- left `Sidebar`
- center `Canvas`
- right `RightSidebar`
- optional `ThreeDPreview`
- `CalibrationModal`

The app is effectively a single-page editor with multiple overlays and side panels rather than route-based screens.

## Core Tech Choices

- React function components
- Tailwind-based styling
- Zustand slices for all shared app state
- Konva stage for 2D drawing interactions
- Three.js scene generation from editor state for 3D output

## What Usually Changes Together

- drawing behavior: `src/components/Canvas.tsx`, `src/hooks/useCanvasLogic.ts`, `src/lib/tools/*`, relevant store slices
- editor UI: `src/components/Canvas/*`, `src/components/SubHeader.tsx`, `src/components/Sidebar/*`, `src/components/RightSidebar.tsx`
- persistence and save/load: `src/store/slices/projectSlice.ts`, `src/firebase.ts`, cloud dialogs
- exports: `src/hooks/useCanvasExport.ts`, `src/lib/dxfExport.ts`, `src/lib/objExport.ts`, `src/lib/glbExport.ts`, `src/lib/threeSceneGenerator.ts`
