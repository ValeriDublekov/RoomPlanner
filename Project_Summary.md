# Project Summary: RoomPlanner Pro

**RoomPlanner Pro** is a high-precision 2D floor planning application designed to bridge the gap between static blueprints and interactive design. It allows users to upload existing floor plans, calibrate them to real-world scales, and trace professional-grade room layouts with ease.

## Key User-Centric Features & Enhancements

*   **Blueprint-to-Vector Workflow**: Users can upload images and use our advanced **Edge-Aware Snapping** to perfectly align walls with the underlying blueprint, prioritizing intersections and corners.
*   **Individual Wall Design**: Users can select and color individual wall segments, allowing for accent walls and diverse interior finishes.
*   **Real-Time Spatial Awareness**: While moving furniture, the app displays dynamic distance markers to the nearest walls, ensuring perfect placement.
*   **Enhanced Viewport Controls**: Dedicated "Fit to Screen" (Center Plan) and "Reset Origin" tools. The centering logic now accurately calculates the visible workspace, accounting for sidebar overlays.
*   **Refined Workspace Layout**: A dual-sidebar layout with a reorganized header and sub-header. Editor modes (Blueprint, Room, Furniture, 3D) are unified in a clean horizontal switcher.
*   **Precision Tools**: Includes Ortho Mode (horizontal/vertical locking), 10cm Grid Snapping, and a dedicated Calibration tool.
*   **Area Calculation**: Automatic m² calculation for rooms using the Shoelace algorithm, displayed with a clean visual halo for readability.
*   **Cloud Project Storage**: Securely save and manage multiple projects in the cloud using **Firebase Firestore** and **Firebase Auth** (Google Login).
*   **3D Dollhouse Preview**: A high-fidelity 3D visualization mode featuring sectional wall cutaways, architectural sections, and clay-style rendering.
*   **Accurate Spatial Mapping**: Perfect 1:1 translation from 2D coordinates to 3D space, including furniture height and **elevation** (vertical placement) customization.
*   **Advanced CAD Symbols**: Furniture rendering supports complex SVG path data for detailed symbols that scale dynamically.
*   **Enhanced Accessibility**: A built-in User Manual and intuitively grouped navigation tools.

This application transforms the complex task of room planning into a streamlined, visual, and highly accurate experience.
