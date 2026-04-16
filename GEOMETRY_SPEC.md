# Geometry & Alignment Specification

This document defines the consistent behavior for 2D and 3D geometry, alignment, and measurements in the Room Planner application to prevent regressions.

## 1. Coordinate System
- **2D Canvas:** standard Cartesian with (0,0) at top-left.
- **3D World:** Y-up. X and Z correspond to 2D X and Y.
- **Persistence:** Projects are persisted as JSON objects. For cloud-enabled environments, these are stored in **Firebase Firestore** under the `projects` collection, keyed by `userId`.
- **Scale:** Defined by `pixelsPerCm`. All internal logic should use centimeters where possible, converting to pixels only for rendering.

## 2. Room Geometry
- **Room Points:** The array of points defining a room represents the **INNER PERIMETER** (the finished face of the walls).
- **Wall Thickness:** Walls are rendered **OUTSIDE** the inner perimeter.
    - **2D Rendering:** A stroke of `wallThickness * 2` is used, and the floor fill covers the inner half.
    - **3D Rendering:** Wall segments must be offset by `wallThickness / 2` along the outward normal of the segment.
- **Winding Order:** Points are generally expected to be in a consistent order (e.g., Clockwise) to determine "inside" vs "outside" automatically.

## 3. Wall Attachments (Windows & Doors)
- **Positioning:** Defined by `positionAlongWall` (0 to 1) along the segment from `P1` to `P2`.
- **Alignment:** Attachments must align perfectly with the wall thickness.
    - They should start at the inner perimeter (the line between points) and extend **OUTWARDS** by `wallThickness`.
    - **2D Offset:** `offsetY` should be `0` (assuming +y is outside) or adjusted based on winding.
    - **3D Offset:** Same as wall segments.
- **Measurements:**
    - Automatic dimensions for attachments measure from the **outer edge** of the attachment to the **inner face** of the nearest perpendicular wall.

## 4. Furniture
- **Origin:** The `(x, y)` coordinate of a furniture item represents its **Top-Left corner** in 2D.
- **3D Alignment:** The 3D model's origin must also be its top-left corner (relative to its rotation) to ensure 2D/3D parity.
- **Snapping:**
    - Furniture snaps to the grid (default 10cm).
    - Furniture can snap to wall inner faces or other furniture edges.

## 5. Measurements & Labels
- **Room Area:** Calculated using the Shoelace formula on the inner perimeter points.
- **Wall Lengths:** Measured between the inner perimeter points.
- **Label Orientation:** All text labels (dimensions, area) must be oriented to be readable from the bottom or right of the screen (upright).

## 6. Regression Prevention
To avoid future discrepancies between 2D and 3D:
- **Single Source of Truth:** Always use `getOutwardNormal` for any wall-relative positioning.
- **Visual Tests:** When modifying `RoomItem` or `WallSegments`, verify that a window placed on a wall does not protrude into the room in either view.
- **Winding Awareness:** Ensure all polygon operations (Area, Normal, Inset) use the `getSignedArea` to detect winding order.
- **Furniture Origin:** Always use the top-left corner as the primary anchor for furniture in both 2D and 3D.

## 7. Implementation Status & Plan
- [x] **Utility:** Added `getSignedArea` and `getOutwardNormal` to `geometry.ts`.
- [x] **2D Walls:** `RoomItem` renders walls outside the inner perimeter.
- [x] **3D Walls:** `WallSegments` offsets boxes to the outside.
- [x] **2D Attachments:** `WallAttachmentItem` offsets to the outside.
- [x] **Snapping:** `getSnappedPosition` now includes wall segment snapping.
- [ ] **Verification:** Perform a full walkthrough of room creation, wall movement, and attachment placement.
