import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen } from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const manualContent = `
# RoomPlanner User Guide

Welcome to RoomPlanner! This guide will help you understand the workflow and features of the application.

## Workflow

### 1. Blueprint Layer (Optional)
*   **Upload Image**: Start by uploading a floor plan image (JPG/PNG).
*   **Calibrate**: Use the Calibrate tool (C) to set the scale. Click two points on the image and enter the real-world distance between them.
*   **Adjust**: Use the opacity and visibility toggles to help you trace over the blueprint.

### 2. Room Layer
*   **Draw Room**: Use the Draw Room tool (R) to trace the walls. 
*   **Snap to Image**: Enable this to automatically snap points to detected lines in your blueprint.
*   **Wall Thickness**: Adjust the thickness of the walls in the settings panel.
*   **Add Doors & Windows**: Click on a wall to place a door or window. You can flip their orientation or mirror them in the properties editor.

### 3. Furniture Layer
*   **Add Box**: Quickly add a rectangular object (B).
*   **Draw Object**: Create custom shapes (F) for specific furniture.
*   **Move & Rotate**: Drag objects to move them. Use the transformer handles to resize or rotate.
*   **Wall Distances**: While moving furniture, the app shows real-time distances to the nearest walls.

### 4. Annotation Layer
*   **Measure**: Use the Measure tool (M) for quick distance checks.
*   **Dimension**: Add permanent dimension lines (D) to your plan.

## Tips & Shortcuts
*   **Undo**: Ctrl+Z or use the Undo button.
*   **Snap to Grid**: Toggle (S) to align points to a 10cm grid.
*   **Ortho Mode**: Toggle (O) or hold Ctrl to draw perfectly horizontal or vertical lines.
*   **Reset View**: Click the Reset icon in the header to return to 100% zoom and center the view.
*   **Save/Load**: Save your project as a JSON file to continue later.
`;

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">User Manual</h2>
              <p className="text-xs text-slate-500 font-medium">Learn how to use RoomPlanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 prose prose-slate prose-sm max-w-none">
          <ReactMarkdown>{manualContent}</ReactMarkdown>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
