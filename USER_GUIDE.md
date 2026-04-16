# RoomPlanner User Guide

Welcome to RoomPlanner! This guide will help you understand the workflow and features of the application.

## Workflow

### 1. Blueprint Layer (Optional)
*   **Upload Image**: Start by uploading a floor plan image (JPG/PNG).
*   **Calibrate**: Use the **Calibrate (C)** tool. Click two points on the image that you know the real-world distance between, then enter the distance in centimeters. This sets the scale for the entire project.
*   **Visibility**: You can toggle the visibility of the blueprint or adjust its opacity in the sidebar.

### 2. Room Layer
*   **Draw Room (R)**: Click to place corners of your room. 
    *   **Precise Input**: While drawing, you can type a number (e.g., `300`) and press **Enter** to create a segment of exactly that length (in cm) in the direction of your mouse.
    *   **Close Room**: Click the starting point or double-click to finish the room.
*   **Area Calculation**: Once a room is closed, its area in square meters (m²) is automatically calculated and displayed in the center. This is only visible while in the **Room Layer**.
*   **Add Door/Window**: Select the tool and click on any wall to place an attachment.
    *   **Flip/Mirror**: Select a door or window to see flip controls in the sidebar. You can change the hinge side or the opening direction (In/Out).
    *   **Move**: Drag doors and windows along the wall. Distances to nearest perpendicular walls will be shown.

### 3. Furniture Layer
*   **Catalog**: Use the Catalog to add standard furniture items.
*   **CAD Symbols**: Many items feature detailed CAD symbols (like pillows on beds) that scale automatically to your chosen dimensions.
*   **3D Height**: Every furniture item has a **Height (3D)** property in the sidebar. Set this to define how tall the object appears in the 3D preview (e.g., 50cm for a bed, 220cm for a wardrobe).
*   **Elevation**: Use the **Elevation** property to define the height from the floor. This is useful for wall-mounted TVs, shelves, or placing objects on top of others. In 2D, items with higher elevation are rendered on top of lower items.
*   **Manipulate**: Select an object to move, rotate, or resize it using the handles.
    *   **Ortho Snapping**: If Ortho Mode is active, rotation will snap to 90-degree increments.

### 4. Annotation Layer
*   **Measure (M)**: Click two points to see the distance between them.
*   **Dimension (D)**: Create permanent dimension lines for your plan.

### 5. 3D Preview
*   **Toggle 3D**: Click the **3D Preview (Box icon)** in the header to switch to a high-fidelity 3D view.
*   **Dollhouse View**: The 3D mode uses a "Dollhouse" perspective with walls cut at 210cm for better visibility.
*   **Wall Openings**: Doors and windows placed in 2D create real architectural openings in the 3D walls.
*   **Controls**:
    *   **Left Click**: Rotate the camera.
    *   **Right Click**: Pan the view.
    *   **Scroll**: Zoom in and out.
*   **Back to 2D**: Click the "Back to 2D" button in the 3D header to return to drafting mode.

## Navigation & Shortcuts

### General
*   **Select (V)**: Default selection tool.
*   **Pan**: Click and drag the empty canvas area to move around.
*   **Zoom**: Use the mouse wheel to zoom in and out.
*   **Undo (Ctrl+Z)**: Revert your last action.
*   **Delete (Del/Backspace)**: Remove the selected object, room, or dimension.
*   **Copy/Paste (Ctrl+C / Ctrl+V)**: Duplicate furniture items.

### Drawing Modes
*   **Ortho Mode (O)**: Toggle orthogonal snapping (locks lines to 90-degree angles). You can also hold **Ctrl** temporarily to enable this.
*   **Snap to Grid (S)**: Toggle snapping to the background grid and other objects.
*   **Snap to Image**: If enabled, the cursor will try to snap to edges found in your blueprint image.

## Saving & Loading
*   **Project Name**: Edit the project name in the top header.
*   **Cloud Save (Recommended)**: Log in with Google to save your projects to the cloud. This allows you to:
    *   Access projects from any device.
    *   Maintain multiple versions using **Save As**.
    *   Manage projects (Rename/Delete) via the **Load** menu.
*   **Local Save**: Download a `.json` file to your computer.
*   **Load**: Open a saved project from the cloud or upload a `.json` file.

---
*Tip: Use the Layers toggle in the sidebar to switch between different parts of your project. Each layer has specific tools associated with it.*
