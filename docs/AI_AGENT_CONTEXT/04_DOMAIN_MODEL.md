# Domain Model

## Core Types

Defined in `src/types.ts`.

### Vector2d

Basic 2D point:

- `x`
- `y`

### RoomObject

Represents a room polygon or an open room-in-progress.

Important fields:

- `id`
- `points: Vector2d[]`
- `isClosed`
- optional floor and wall styling fields

Important assumption:

- most geometric room behavior derives from the `points` array order

### FurnitureObject

Represents both primitives and grouped furniture.

Important fields:

- `id`, `name`
- `type: box | polygon | circle | group`
- `x`, `y`, `width`, `height`, `rotation`
- optional `height3d`, `elevation`, `color`, `secondaryColor`
- optional `children` for grouped items

Important assumption:

- grouped items use child coordinates relative to the group's internal frame, while top-level items use world-space top-left values

### DimensionObject

Simple two-point dimension entity:

- `id`
- `p1`
- `p2`

### WallAttachment

Door/window attached to a room wall segment.

Important fields:

- `roomId`
- `type: door | window`
- `wallSegmentIndex`
- `positionAlongWall`
- `width`
- optional door swing flags and curtain/frame styling

Important assumption:

- attachments are coupled to room segment indexing, so changing point order or segment derivation can break them

## Application Modes

`AppMode` in `src/types.ts` defines editor tools such as:

- select
- draw-room
- draw-furniture
- draw-circle
- calibrate
- add-box
- measure
- dimension
- add-door
- add-window
- place-furniture

These modes map directly into tool handlers in `src/lib/tools/registry.ts`.

## Layer Model

`LayerType`:

- blueprint
- room
- furniture

Layer changes affect which tools are shown, which snapping options are relevant, and which editing actions make sense.
