# Room Planner Concepts

## Wall Geometry
- **Reference Line**: The points defined in a `RoomObject` represent the **centerline** of the walls.
- **Thickness**: Walls have a thickness (default 20cm). This thickness is distributed equally on both sides of the centerline (10cm inside, 10cm outside).
- **Inner Face**: The actual usable surface of the wall is located at `wallThickness / 2` distance from the centerline towards the interior of the room.
- **Outer Face**: The exterior surface is at `wallThickness / 2` distance from the centerline towards the exterior.

## Furniture Snapping
- **Target**: Furniture should snap to the **Inner Face** of the walls.
- **Calculation**: 
  - Distance to centerline = `d`
  - Distance to inner face = `|d - (wallThickness / 2)|`
  - Snapping should position the furniture side exactly at `wallThickness / 2` from the centerline.

## 2D Rendering (Konva)
- **Walls**: Should be rendered as a stroke centered on the points with `strokeWidth = wallThickness`.
- **Selection**: Selection overlays should also be centered on the points.

## 3D Rendering (Three.js)
- **Walls**: Box geometries should be centered on the segments defined by the points.
- **Floor**: The floor mesh should match the polygon defined by the points (it will be partially covered by the inner half of the walls).
