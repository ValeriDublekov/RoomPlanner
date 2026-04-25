# Functional Specification: Room Drawing & Geometry

This document describes the current implementation of the room drawing functionality, state management, and geometric logic.

## 1. Data Structure

### Room Object (`RoomObject`)
Rooms are stored in the application state as a list of `RoomObject` entities.
- `id`: Unique identifier (string).
- `points`: An array of `Vector2d` coordinates `{x, y}` in pixels.
- `isClosed`: Boolean flag indicating if the room is a closed polygon.
- `floorTexture` / `floorColor`: Visual properties for the floor area.
- `wallColors`: Per-segment wall colors.

### Drawing State
While drawing, the system uses:
- `roomPoints`: A temporary array of points for the room currently being actively drawn.
- `mode`: Set to `draw-room` or `draw-furniture`.

---

## 2. Drawing Lifecycle

### Phase 1: Initiation
1. The user selects the **Draw Room (R)** tool.
2. `mode` becomes `draw-room`.
3. `roomPoints` is initialized as an empty array.

### Phase 2: Adding Points
1. **Mouse Interaction**: Each click on the canvas adds a point to `roomPoints`.
2. **Snapping**: The `useMouseSnapping` hook calculates a `snappedMouse` position before adding the point:
    - **Grid Snap**: Snaps to the background grid (default 10cm).
    - **Object Snap**: Snaps to existing wall corners or furniture edges.
    - **Image Snap**: Snaps to detected edges in the blueprint image (with specific junction/endpoint prioritization).
3. **Ortho Mode**: If active (or Ctrl is held), the new point is forced to be orthogonal (90°) relative to the previous point.
4. **Manual Input**: If the user types numbers while drawing, they are captured in `dimensionInput`. Pressing **Enter** adds a point at exactly that distance in the current direction.

### Phase 3: Closing/Finishing
A room can be finalized in two ways:

#### A. Closing the Polygon (Closed Room)
- **Trigger**: Clicking near the first point (`roomPoints[0]`) when at least 3 points exist.
- **Action**: `closeRoom()` is called. 
- **Processing**:
    - Filter out duplicate consecutive points.
    - Create a `RoomObject` with `isClosed: true`.
    - Clear `roomPoints`.
- **Result**: A closed polygon with a filled floor and calculated area.

#### B. Finishing as Open Path (Partial Room)
- **Trigger**: Clicking the "Finish (Partial Room)" button in the UI (visible when `roomPoints.length >= 2`).
- **Action**: `finishRoom()` is called.
- **Result**: A `RoomObject` with `isClosed: false`. Walls are rendered along the path, but no floor is generated.

### Phase 4: Modification
- **Continue Room**: An open room can be "continued" (re-opening the drawing session from its last point).
- **Close Open Room**: A partial room can be closed later through a UI button.
- **Vertex Editing**: Dragging handles in `RoomEditor` allows moving individual points.

---

## 3. Geometric Calculations

### Area Calculation
The area is calculated using the **Shoelace Formula** (Signed Area):
1. `pixels^2` area is computed from `points`.
2. Converted to `cm^2` using `pixelsPerCm` calibration.
3. Converted to `m^2` (`cm^2 / 10000`).
4. Displayed via `RoomAreaLabel`.

### Wall Generation
Walls are rendered in `RoomItem.tsx` using a `Line` component:
- **Thickness**: Controlled by `wallThicknessCm` (default 20cm).
- **Visuals**: A "sandwich" layout consisting of a thick dark stroke for structural walls and thinner colored lines for faces.
- **Normals**: `getOutwardNormal` determines the direction walls "face" for attachments.

### Validations
- A closed room requires at least 3 unique points.
- Duplicate consecutive points (distance < 0.1px) are automatically removed during the save process.

---

## 4. Known UI Hints & Shortcuts
- **Escape**: Clears current `roomPoints`.
- **Enter**: Confirms manual distance input.
- **Double-Click**: Hinted in UI as "Double-click to Close Room", but currently requires clicking the first point manually.
- **Alt**: Bypasses all snapping logic while held.
