# AI Agent Context

This folder contains fast-path technical notes for coding agents working on RoomPlanner.

Use this folder as a navigation and execution aid, not as the single source of truth. If a note conflicts with the code, trust the code.

## Recommended Reading Order

0. `00_CHEAT_SHEET.md`
1. `01_PROJECT_OVERVIEW.md`
2. `02_RUNTIME_FLOW.md`
3. `03_STATE_STORE.md`
4. `04_DOMAIN_MODEL.md`
5. `05_COMPONENT_AND_HOOK_MAP.md`
6. `06_EXPORT_AND_3D.md`
7. `07_CLOUD_AND_PERSISTENCE.md`
8. `08_TOOLING_AND_VALIDATION.md`
9. `09_HOTSPOTS_AND_EDIT_GUIDELINES.md`
10. `10_CHANGE_RECIPES.md`

## What This Covers

- A one-page cheat sheet for fast onboarding
- Entry points and app composition
- Zustand store shape and responsibilities
- Main domain entities and invariants
- Canvas interaction flow and 3D/export flow
- Cloud save and local persistence behavior
- Validation commands and low-risk editing strategy
- Common change recipes for frequent task types

## Snapshot Notes

- Framework: React 19 + Vite + TypeScript
- State: Zustand with persistence
- 2D canvas: Konva / react-konva
- 3D preview: Three.js + react-three-fiber + drei
- Auth and cloud save: Firebase Auth + Firestore
- Tests: Vitest

## Best First Reads By Task

- For a quick start: `00_CHEAT_SHEET.md`
- For drawing or snapping changes: `02_RUNTIME_FLOW.md`, `05_COMPONENT_AND_HOOK_MAP.md`, `09_HOTSPOTS_AND_EDIT_GUIDELINES.md`
- For store changes: `03_STATE_STORE.md`, `07_CLOUD_AND_PERSISTENCE.md`
- For export or 3D changes: `06_EXPORT_AND_3D.md`, `10_CHANGE_RECIPES.md`
- For routine implementation recipes: `10_CHANGE_RECIPES.md`
