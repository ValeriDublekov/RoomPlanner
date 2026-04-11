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
*   **Add Door/Window**: Select the tool and click on any wall to place an attachment.
    *   **Flip/Mirror**: Select a door or window to see flip controls in the sidebar. You can change the hinge side or the opening direction (In/Out).
    *   **Move**: Drag doors and windows along the wall. Distances to nearest perpendicular walls will be shown.

### 3. Furniture Layer
*   **Add Box (B)**: Quickly add a rectangular object.
*   **Draw Object (F)**: Draw custom-shaped furniture or areas.
*   **Manipulate**: Select an object to move, rotate, or resize it using the handles.
*   **Draggable**: You can click and drag any object immediately to move it.

### 4. Annotation Layer
*   **Measure (M)**: Click two points to see the distance between them.
*   **Dimension (D)**: Create permanent dimension lines for your plan.

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
*   **Save**: Downloads a `.json` file containing all your project data, including the background image.
*   **Load**: Upload a previously saved `.json` file to continue your work.

---
*Tip: Use the Layers toggle in the sidebar to switch between different parts of your project. Each layer has specific tools associated with it.*
