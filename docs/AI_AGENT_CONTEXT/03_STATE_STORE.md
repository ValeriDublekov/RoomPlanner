# State Store

## Store Architecture

The global store is created in `src/store.ts` and composed from six slices:

- `uiSlice`
- `roomSlice`
- `furnitureSlice`
- `dimensionSlice`
- `projectSlice`
- `authSlice`

Type root:

- `AppState = UISlice & RoomSlice & FurnitureSlice & DimensionSlice & ProjectSlice & AuthSlice`

## Persistence Behavior

The store uses Zustand `persist` middleware with storage key `floor-plan-storage`.

Persisted fields include:

- project identity and name
- calibration ratio (`pixelsPerCm`)
- rooms, furniture, dimensions, wall attachments
- wall thickness and height
- background image and its transform/visibility data

Not everything is persisted. Volatile UI state should not be assumed to survive reloads.

## Migration Notes

There are two migration surfaces to understand:

1. `src/store.ts` contains persist-level migration for old room point shapes
2. `src/store/slices/projectSlice.ts` contains load-time project migration logic, including furniture rotation migration for older project versions

Agents changing persistence or load behavior should inspect both places.

## Slice Responsibilities

`authSlice.ts`

- current Firebase user
- auth loading state

`projectSlice.ts`

- project metadata
- calibration
- background image and transform
- undo history
- cloud save and local save/load behavior

`roomSlice.ts`

- room points being drawn
- existing room geometry
- room editing and selection state

`furnitureSlice.ts`

- furniture objects
- selection, grouping, paste/copy, transforms

`dimensionSlice.ts`

- dimension entities and related actions

`uiSlice.ts`

- editor mode
- viewport state and zoom/pan
- 3D toggles
- snapping settings
- context menu and miscellaneous UI state

## Store Usage Pattern

The codebase uses a mixed access style:

- selector-based reads: `useStore(state => state.foo)`
- broad direct reads: `useStore.getState()`

When editing, prefer narrow selectors for render paths and `getState()` only for imperative event handlers or helper flows that truly need it.
