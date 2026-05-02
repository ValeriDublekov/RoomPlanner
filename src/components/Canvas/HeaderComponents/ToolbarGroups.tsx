import React from 'react';
import { Undo2, RotateCcw, Maximize, Grid, BookOpen } from 'lucide-react';
import { useStore } from '@/src/store';

interface ToolbarGroupsProps {
  onShowManual: () => void;
}

export const ToolbarGroups: React.FC<ToolbarGroupsProps> = ({ onShowManual }) => {
  const { 
    undo, 
    history, 
    resetView, 
    fitToScreen, 
    gridVisible, 
    setGridVisible,
    pixelsPerCm,
    setPixelsPerCm,
    activeLayer
  } = useStore();

  return (
    <>
      {/* History Group */}
      <div className="flex items-center bg-slate-50/50 p-0.5 rounded-lg border border-slate-100">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="p-1.5 md:p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all disabled:opacity-20 flex-shrink-0 shadow-none hover:shadow-sm"
          title={`Undo (${history.length})`}
        >
          <Undo2 size={18} />
        </button>
      </div>

      {/* Navigation Group */}
      <div className="flex items-center bg-slate-50/50 p-0.5 rounded-lg border border-slate-100">
        <button
          onClick={resetView}
          className="p-1.5 md:p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all flex-shrink-0 shadow-none hover:shadow-sm"
          title="Reset Origin (Go to 0,0)"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={() => fitToScreen()}
          className="p-1.5 md:p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all flex-shrink-0 shadow-none hover:shadow-sm border-l border-slate-100"
          title="Fit to Screen (Center Plan)"
        >
          <Maximize size={18} />
        </button>
      </div>

      {/* View Options Group */}
      <div className="flex items-center bg-slate-50/50 p-0.5 rounded-lg border border-slate-100">
        <button
          onClick={() => setGridVisible(!gridVisible)}
          className={`p-1.5 md:p-2 rounded-md transition-all flex-shrink-0 ${gridVisible ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}`}
          title="Toggle Grid"
        >
          <Grid size={18} />
        </button>
        <button
          onClick={onShowManual}
          className="hidden sm:block p-1.5 md:p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-md transition-all flex-shrink-0 border-l border-slate-100"
          title="User Manual"
        >
          <BookOpen size={18} />
        </button>
      </div>

      {/* Scale */}
      {(activeLayer === 'room' || activeLayer === 'blueprint') && (
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 md:px-3 md:py-1 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scale</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={pixelsPerCm.toFixed(2)}
              onChange={(e) => setPixelsPerCm(parseFloat(e.target.value) || 1)}
              className="w-10 md:w-12 text-[10px] font-mono font-bold text-indigo-600 bg-transparent border-none p-0 focus:ring-0 outline-none"
              step="0.1"
            />
            <span className="text-[9px] font-mono font-bold text-indigo-400">px/cm</span>
          </div>
        </div>
      )}
    </>
  );
};
