# Domain Model

## Core Types

Defined in `src/types.ts`.

### Vector2d

Basic 2D point:

- `x`
- `y`

### RoomObject

Represents a room polygon or an open room-in-progress, defined using a topology-first approach.

Important fields:

- `id`
- `vertices: Vertex[]`: The unique defining points of the room.
- `edges: Edge[]`: The connections between vertices that define boundaries.
- `isClosed`: Boolean indicating if the boundary forms a loop.
- optional floor and wall styling fields

Important assumptions:

- **Topology-First Strategy**: Stored room geometry consists of raw vertices and edges. Ordered polygon boundaries (for UI rendering and collision) are **reconstructed** at runtime using topological traversal.
- **Interior Semantics**: The reconstructed polygon represents the **interior usable area**. Walls are conceptually "outside" these boundaries.
- **Canonical Access**: Always use `getRoomVertices(room)` from `src/lib/geometry/topology.ts` to retrieve the ordered list of points. Do not assume any specific order in the `vertices` array.

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
- `wallSegmentIndex`: Index of the segment in the **ordered reconstructed boundary**.
- `positionAlongWall`: Normalized position (0 to 1) along the segment.
- `width`
- optional door swing flags and curtain/frame styling

Important assumption:

- **Index Coupling**: Attachments are strictly coupled to the **ordered boundary segment index**. Topological changes (adding/removing vertices) that shift indices must explicitly remap existing attachments to maintain spatial integrity.

### BeamAttachment

Represents a structural beam point snapped to a wall.

Important fields:

- `roomId`
- `wallIndex`: Index of the segment in the ordered reconstructed boundary.
- `t`: Normalized position (0 to 1) along the segment.

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
