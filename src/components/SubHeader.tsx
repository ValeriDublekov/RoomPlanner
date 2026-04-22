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
    <div className="min-h-[3.5rem] py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between px-4 md:px-6 z-10 gap-y-2">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editor Mode</span>
          </div>
          <div className="flex bg-slate-50/50 p-1 rounded-xl border border-slate-100 gap-1.5 min-w-[280px]">
            {(['blueprint', 'room', 'furniture'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={cn(
                  "flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  activeLayer === layer
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                {layer}
              </button>
            ))}
            <div className="w-px bg-slate-200/50 my-1 mx-0.5" />
            <button
              onClick={() => setShow3d(true)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-white/50"
            >
              3D View
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6 h-8">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <Settings2 size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</span>
          </div>
          
          <div className="flex items-center gap-5">
            <label 
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Ortho mode restricts drawing and moving to 90-degree angles. Useful for straight walls and precise alignment."
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={orthoMode}
                  onChange={(e) => setOrthoMode(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Ortho (H)</span>
            </label>

            {activeLayer === 'furniture' ? (
              <label 
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Snap furniture to walls and other objects for perfect alignment."
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={snapToObjects}
                    onChange={(e) => setSnapToObjects(e.target.checked)}
                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Snap Object (S)</span>
              </label>
            ) : (
              <label 
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Snap to the background grid for modular planning."
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Snap Grid (S)</span>
              </label>
            )}

            <label 
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Automatically show dimensions for room walls and furniture distances."
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showAutoDimensions}
                  onChange={(e) => setShowAutoDimensions(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Auto Dim</span>
            </label>

            {activeLayer === 'room' && (
              <label 
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Snap to the lines detected in the background blueprint image."
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={snapToImage}
                    onChange={(e) => setSnapToImage(e.target.checked)}
                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Snap Image</span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
