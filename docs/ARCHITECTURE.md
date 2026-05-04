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
      CatalogModal.tsx    # Modal for browsing and customizing furniture items
      CloudLoadModal.tsx  # Cloud project browser with search, rename, delete
      SaveModal.tsx       # Unified saving interface (Cloud/Local)
      FileActions.tsx     # Background image controls
      PropertyEditor.tsx  # Editor for selected furniture or rooms
      ToolButton.tsx      # Reusable button for the tool navigation
    /ThreeD
      FurnitureModels.tsx # Individual 3D models for furniture types
      RoomElements.tsx    # 3D Floor and Wall Segment rendering
      ThreeDPreview.tsx   # Main 3D Canvas and scene setup
    Canvas.tsx            # Main Canvas container and event handling
    CanvasHeader.tsx      # Top bar with global actions
    RightSidebar.tsx      # Sidebar for property editing (Right side)
    Sidebar.tsx           # Sidebar for tools and file actions (Left side)
    SubHeader.tsx         # Horizontal bar for layer selection and settings
  /hooks
    useKeyboardShortcuts.ts # Extracted keyboard event logic
    useMouseSnapping.ts     # Extracted coordinate snapping logic
  /lib
    geometry.ts           # Math, geometry, and coordinate formatting utilities
    utils.ts              # UI utility functions (e.g., tailwind-merge)
  firebase.ts             # Firebase Initialization (Auth, Firestore)
  store.ts                # Zustand state management
  types.ts                # Explicit TypeScript interfaces and types
```

## Core Data Models

Defined in `src/types.ts`:

- **Vector2d**: Simple `{ x, y }` coordinate.
- **RoomObject**: A polygon representing a room, defined by an array of points.
- **FurnitureObject**: A rectangular or polygonal object with position, dimensions, rotation, and optional internal points.
- **AppMode**: Current interaction mode (`select`, `draw-room`, `draw-furniture`, `calibrate`, `add-box`, `measure`, `dimension`).
- **LayerType**: Logical layers (`blueprint`, `room`, `furniture`) used to organize rendering and interaction.
- **HistoryEntry**: A snapshot of the rooms, furniture, and dimensions for undo functionality.

## State Management (Zustand)

The global state is managed in `src/store.ts`. Key state slices include:

- **View State**: `scale`, `position` (panning), `gridVisible`, `viewport` (dynamic dimensions).
- **App Mode & Layers**: `mode`, `activeLayer` (blueprint, room, furniture).
- **Calibration**: `pixelsPerCm` (the core scale factor).
- **Data**: `rooms`, `furniture`, `dimensions`, `roomPoints` (active drawing).
- **Selection**: `selectedId`, `selectedRoomId`.
- **History**: `history` stack for undo.
- **Authentication**: `currentUser` state from Firebase Auth.

## Persistence & Cloud Integration

The application uses **Firebase** for cloud storage and authentication:

1. **Authentication:** Integrated via `firebase/auth`. Supports Google Login to identify users and secure their data.
2. **Database:** **Cloud Firestore** is used to store project JSON data.
   - **Collection:** `projects`
   - **Schema:** Defined in `firebase-blueprint.json`. Documents include `userId`, `name`, `data` (JSON-serialized project state), and `updatedAt`.
3. **Security:** Protected by **Firestore Security Rules** (`firestore.rules`) ensuring users can only access their own data.

## Rendering Optimization (Konva Stage)

The Konva Stage is organized into logical layers to optimize rendering and interaction. **User Editor Modes** map to these layers bitwise or via visibility toggles:

1. **BackgroundLayer**: Renders the blueprint image. Active tools: `select`, `calibrate`.
2. **ContentLayer**: Renders completed room polygons, wall attachments, and interactive furniture objects. 
3. **AnnotationLayer**: Internal layer for dimension lines and measurement previews. These tools are accessible within the `furniture` editor mode.
4. **InteractionLayer**: Renders active drawing elements (room points, calibration lines).

## Key Features

- **Edge-Aware Snapping**: Uses edge detection on the blueprint image to allow precise tracing of existing walls.
- **Real-Time Distances**: Furniture objects display their distance to the nearest walls while being dragged.
- **Ortho Mode**: Constrains drawing to 90-degree angles for professional architectural accuracy.
- **Multi-Layer Interaction**: Users can switch between layers to focus on specific tasks (e.g., drawing walls vs. placing furniture).
- **Project Persistence**: Full Save/Load support via JSON files.
