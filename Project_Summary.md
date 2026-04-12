# Project Summary: RoomPlanner Pro

**RoomPlanner Pro** is a high-precision 2D floor planning application designed to bridge the gap between static blueprints and interactive design. It allows users to upload existing floor plans, calibrate them to real-world scales, and trace professional-grade room layouts with ease.

## Key User-Centric Features & Enhancements

*   **Blueprint-to-Vector Workflow**: Users can upload images and use our advanced **Edge-Aware Snapping** to perfectly align walls with the underlying blueprint, prioritizing intersections and corners.
*   **Real-Time Spatial Awareness**: While moving furniture, the app displays dynamic distance markers to the nearest walls, ensuring perfect placement and compliance with spatial constraints.
*   **Context-Aware Interface**: The UI intelligently adapts, showing specific settings like "Wall Thickness" only when relevant (e.g., in Room Layout mode), reducing visual clutter.
*   **Precision Tools**: Includes Ortho Mode (horizontal/vertical locking with 90° snapping), 10cm Grid Snapping, and a dedicated Calibration tool to ensure every centimeter in the app matches reality.
*   **Area Calculation**: Automatic m² calculation for rooms using the Shoelace algorithm, displayed with a clean visual halo for readability.
*   **3D Dollhouse Preview**: A high-fidelity 3D visualization mode using `@react-three/fiber` that features:
    *   **Dollhouse Cutaway View**: Walls are rendered at a standard 210cm height with architectural section caps for better interior visibility.
    *   **Logical Wall Openings**: Intelligent wall splitting that creates real openings for doors and windows (with semi-transparent glass).
    *   **Clay Render Aesthetic**: Professional lighting with soft shadows and matte materials for a clean, modern look.
    *   **Accurate Spatial Mapping**: Perfect 1:1 translation from 2D coordinates to 3D space, including furniture height and **elevation** (vertical placement) customization.
*   **Elevation & Layering**: Furniture now supports an `elevation` property, allowing for vertical stacking (e.g., shelves on walls). In 2D, items are automatically sorted by elevation to ensure correct visual layering.
*   **Refined Workspace Layout**: A dual-sidebar layout that separates Tools (Left) from Object Properties (Right), maximizing the drafting area and preventing UI overlap.
*   **Advanced CAD Symbols**: Furniture rendering supports complex SVG path data, allowing for detailed symbols (like beds with pillows or bathroom fixtures) that scale dynamically to user-defined dimensions.
*   **Seamless Project Management**: Integrated "New Project" workflow with safety confirmations, along with robust Save/Load capabilities using standard JSON formats.
*   **Enhanced Accessibility**: A built-in User Manual and intuitive Header-based navigation make the professional toolset accessible even to first-time users.

This application transforms the complex task of room planning into a streamlined, visual, and highly accurate experience.
