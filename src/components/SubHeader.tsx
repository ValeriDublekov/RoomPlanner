import React from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { MousePointer2, Pencil, Square, Ruler, DoorOpen, Layout, Circle, Layers, Settings2 } from 'lucide-react';

export const SubHeader: React.FC = () => {
  const { 
    activeLayer, 
    setActiveLayer,
    orthoMode,
    setOrthoMode,
    snapToGrid,
    setSnapToGrid,
    snapToObjects,
    setSnapToObjects,
    snapToImage,
    setSnapToImage,
    wallThickness,
    setWallThickness,
    setShow3d,
    showAutoDimensions,
    setShowAutoDimensions
  } = useStore();

  return (
    <div className="min-h-[3rem] py-1 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between px-4 md:px-6 z-10 gap-y-2">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 mr-1">
          <Layers size={14} className="text-slate-400" />
          <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layers</span>
        </div>
        <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl gap-1">
          {(['blueprint', 'room', 'furniture'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeLayer === layer
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {layer}
            </button>
          ))}
          <button
            onClick={() => setShow3d(true)}
            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-white/50"
          >
            3D View
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</span>
          </div>
          
          <div className="flex items-center gap-4">
            <label 
              className="flex items-center gap-2 cursor-pointer group"
              title="Ortho mode restricts drawing and moving to 90-degree angles. Useful for straight walls and precise alignment."
            >
              <input
                type="checkbox"
                checked={orthoMode}
                onChange={(e) => setOrthoMode(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900">Ortho (H)</span>
            </label>

            {activeLayer === 'furniture' ? (
              <label 
                className="flex items-center gap-2 cursor-pointer group"
                title="Snap furniture to walls and other objects for perfect alignment."
              >
                <input
                  type="checkbox"
                  checked={snapToObjects}
                  onChange={(e) => setSnapToObjects(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900">Snap Object (S)</span>
              </label>
            ) : (
              <label 
                className="flex items-center gap-2 cursor-pointer group"
                title="Snap to the background grid for modular planning."
              >
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900">Snap Grid (S)</span>
              </label>
            )}

            <label 
              className="flex items-center gap-2 cursor-pointer group"
              title="Automatically show dimensions for room walls and furniture distances."
            >
              <input
                type="checkbox"
                checked={showAutoDimensions}
                onChange={(e) => setShowAutoDimensions(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900">Auto Dim</span>
            </label>

            {activeLayer === 'room' && (
              <label 
                className="flex items-center gap-2 cursor-pointer group"
                title="Snap to the lines detected in the background blueprint image."
              >
                <input
                  type="checkbox"
                  checked={snapToImage}
                  onChange={(e) => setSnapToImage(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-slate-900">Snap Image</span>
              </label>
            )}
          </div>
        </div>

        {activeLayer === 'room' && (
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wall Thickness</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={wallThickness}
                onChange={(e) => setWallThickness(parseInt(e.target.value))}
                className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] font-mono font-bold text-indigo-600 w-8">{wallThickness}cm</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
