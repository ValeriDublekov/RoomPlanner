# Application Architecture - RoomPlanner

## Project Structure

The application is structured into logical modules to ensure maintainability and scalability.

```
/src
  /components
    /Canvas
      DrawingLayer.tsx    # Renders the active drawing state (room points, dimension labels)
      FurnitureItem.tsx   # Renders individual furniture objects with Konva Transformer
      GridLayer.tsx       # Renders the background grid div
      RoomItem.tsx        # Renders completed room polygons
    /Sidebar
      FileActions.tsx     # Save/Load and background image controls
      PropertyEditor.tsx  # Editor for selected furniture or rooms
      SettingsPanel.tsx   # Global settings (Ortho, Snap, View Reset)
      ToolButton.tsx      # Reusable button for the tool navigation
    CalibrationModal.tsx  # Modal for setting the scale (pixels per cm)
    Canvas.tsx            # Main Canvas container, stage, and event handling
    Sidebar.tsx           # Main Sidebar container and navigation
  /lib
    geometry.ts           # Math, geometry, and coordinate formatting utilities
    utils.ts              # UI utility functions (e.g., tailwind-merge)
  store.ts                # Zustand state management
  types.ts                # Explicit TypeScript interfaces and types
```

## Core Data Models

Defined in `src/types.ts`:

- **Vector2d**: Simple `{ x, y }` coordinate.
- **RoomObject**: A polygon representing a room, defined by an array of points.
- **FurnitureObject**: A rectangular or polygonal object with position, dimensions, rotation, and optional internal points.
- **AppMode**: Current interaction mode (`select`, `draw-room`, `draw-furniture`, `calibrate`, `add-box`, `measure`, `dimension`).
- **LayerType**: Logical layers (`blueprint`, `room`, `furniture`, `annotation`) used to organize rendering and interaction.
- **HistoryEntry**: A snapshot of the rooms, furniture, and dimensions for undo functionality.

## State Management (Zustand)

The global state is managed in `src/store.ts`. Key state slices include:

- **View State**: `scale`, `position` (panning).
- **App Mode & Layers**: `mode`, `activeLayer` (blueprint, room, furniture).
- **Calibration**: `pixelsPerCm` (the core scale factor).
- **Data**: `rooms`, `furniture`, `dimensions`, `roomPoints` (active drawing).
- **Selection**: `selectedId`, `selectedRoomId`.
- **History**: `history` stack for undo.

## Rendering Optimization (Konva Stage)

The Konva Stage is organized into logical layers to optimize rendering and interaction. Tools are filtered based on the active layer to provide a cleaner UI:

1. **BackgroundLayer**: Renders the blueprint image. Active tools: `select`, `calibrate`.
2. **RoomLayer**: Renders completed room polygons. Active tools: `select`, `draw-room`.
3. **FurnitureLayer**: Renders interactive furniture objects. Active tools: `select`, `add-box`, `draw-furniture`.
4. **AnnotationLayer**: Used for dimension lines, labels, and the measurement tool preview. Active tools: `select`, `measure`, `dimension`.
5. **InteractionLayer**: Renders active drawing elements (room points, calibration lines).

## Locking Mechanism

Rooms are treated as static architectural elements once drawn. They cannot be selected, dragged, or modified using the selection tools. This ensures that the user can focus on placing furniture without accidentally moving the walls.
