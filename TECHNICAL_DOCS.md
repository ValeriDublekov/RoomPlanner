# Technical Documentation: Geometric & Logic Engine

This document describes the technical implementation of the geometric calculations, object transformations, collision detection, and snapping algorithms used in the application.

## 1. Coordinate Systems & Units

### 2.D Canvas (Konva)
- **Origin (0,0)**: Top-left corner of the stage.
- **Axes**: X increases to the right, Y increases downwards.
- **Units**: Pixels (px).

### 3D Preview (Three.js / R3F)
- **Origin (0,0,0)**: Center of the world.
- **Axes**: X (left/right), Y (up/down), Z (forward/backward).
- **Handedness**: Right-handed. Note that 2D Y-axis maps to 3D Z-axis.
- **Units**: Meters (usually mapped 1:1 from cm divided by 100, or directly in cm depending on scale).

### Unit Conversion
- **Pixels per Cm (`pixelsPerCm`)**: A dynamic value determined during the calibration phase.
- **Formula**: `cm = pixels / pixelsPerCm`.

---

## 2. Object Transformations

### Center-Based Positioning
All furniture objects use their **geometric center** as the pivot for rotation and the primary reference for positioning in 3D.
- **2D Storage**: `x` and `y` in the state refer to the **top-left corner** of the unrotated bounding box.
- **2D Rendering**: Konva uses `offsetX` and `offsetY` (set to `width/2` and `height/2`) to rotate around the center.
- **3D Rendering**: The position is calculated as `centerX = x + width/2` and `centerZ = y + height/2`.

### Rotations
- **Pivot**: Always the center of the object.
- **Direction**: Degrees, clockwise in 2D (due to Y-down). In 3D, this is negated to maintain visual consistency.
- **Formula**: `rotatePoint(point, pivot, angle)`
  ```typescript
  x' = pivot.x + (dx * cos(a) - dy * sin(a))
  y' = pivot.y + (dx * sin(a) + dy * cos(a))
  ```

### Groups
Groups are containers that have their own `x, y, width, height, rotation`.
- **Children Coordinates**: Stored relative to the group's **top-left corner** (0,0).
- **World Position Calculation**:
  1. Calculate child center relative to group center.
  2. Rotate that relative vector by the group's rotation.
  3. Add to the group's world center.
- **Nested Rotations**: Total rotation = `(child.rotation + group.rotation) % 360`.

---

## 3. Collision Detection

### Separating Axis Theorem (SAT)
Used for checking intersections between two oriented bounding boxes (polygons).
1. Generate axes perpendicular to every edge of both polygons.
2. Project all vertices of both polygons onto each axis.
3. If there is a gap (no overlap) on **any** axis, the objects are not colliding.
4. If overlaps occur on **all** axes, a collision is detected.

### Circle Collisions
- **Circle vs Circle**: `distance(center1, center2) < (radius1 + radius2)`.
- **Circle vs Polygon**:
  1. Check if any polygon vertex is inside the circle.
  2. Check if any polygon edge intersects the circle (distance from center to segment < radius).
  3. Check if the circle center is inside the polygon.

---

## 4. Snapping Algorithms

### Vector Snapping (Corners & Edges)
When drawing or moving points:
1. **Vertex Snap**: Check distance to all room corners and furniture corners. If `< threshold`, snap to that point.
2. **Edge Snap**: Calculate the nearest point on all wall segments using `getDistanceToSegment`.

### Image Snapping (Edge Map)
Used for snapping to lines in a background blueprint image.
1. An `EdgeMap` (Uint8Array) is generated from the blueprint using Canny-like edge detection.
2. When moving the mouse, the system searches a small radius in the Edge Map.
3. It prioritizes "junctions" (pixels with >2 neighbors) to snap to corners in the image.

### Furniture-to-Wall Snapping
When dragging furniture:
1. Identify "snap points" on the furniture (midpoints of the 4 faces).
2. For each snap point, find the nearest wall segment in any room.
3. If distance `< snapThreshold`, calculate the offset required to bring the furniture face flush with the wall.
4. Apply this offset to the furniture's position.
5. **Multi-Pass**: The system runs two passes (X and Y) to allow snapping to corners (two walls simultaneously).

---

## 5. Room & Wall Geometry

### Polygon Winding
- **Signed Area**: Calculated using the Shoelace formula.
- **Winding**: Positive = Clockwise (CW), Negative = Counter-Clockwise (CCW).
- **Importance**: Used to determine "outward" normals for walls.

### Wall Normals
Calculated to determine which way a wall "faces" (e.g., for placing windows or doors).
- For CW winding, the right-hand normal `(dy, -dx)` points outside.

---

## 6. Data Migration (Legacy Support)

Older versions of the app used top-left based rotation. Migration logic in `projectSlice.ts` handles this:
- **Detection**: If `project.version < 2`.
- **Correction**: Recursively traverses all furniture (including groups) and adjusts `x, y` coordinates so that the visual position remains the same when the pivot shifts from top-left to center.
- **Formula**: `newPos = oldPos + rotatedCenterOffset - unrotatedCenterOffset`.

### Distance Visualization
During dragging, the system calculates and displays distances to the nearest walls:
1. Midpoints of the 4 faces of the furniture are projected onto the nearest wall segments.
2. The distance is calculated using `getDistanceToSegment`.
3. These distances are rendered as dashed lines with text labels in the `CanvasOverlays` layer.

### Alt Key Behavior
- **Function**: Holding the `Alt` key bypasses the snapping logic.
- **Implementation**: Checked in `handleDragMove` before applying the `bestSnap` offset.

---

## 7. Common Debugging Patterns

- **Discrepancy between 2D and 3D**: Check if the rotation negation is applied correctly and if the Z-axis (3D) correctly maps to the Y-axis (2D).
- **Group items jumping on ungroup**: Verify the world-space calculation in `ungroupSelected` accounts for the group's rotation pivot (center).
- **Collision not triggering**: Ensure `getFurnitureVertices` is using the same center-based logic as the renderer.
