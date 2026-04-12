import React from 'react';
import { Undo2, Download, Upload, Layout, FilePlus, RotateCcw, Grid, BookOpen, Box, Maximize } from 'lucide-react';
import { useStore } from '../../store';
import { UserManualModal } from '../UserManualModal';

export const CanvasHeader: React.FC = () => {
  const { 
    undo, 
    history, 
    saveProject,
    loadState,
    projectName,
    setProjectName,
    newProject,
    resetView,
    fitToScreen,
    pixelsPerCm,
    gridVisible,
    setGridVisible,
    setShow3d
  } = useStore();

  const [showNewConfirm, setShowNewConfirm] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          loadState(json);
          
          // Auto-fit after load
          setTimeout(() => {
            const canvas = document.querySelector('.flex-1.relative');
            if (canvas) {
              fitToScreen(canvas.clientWidth, canvas.clientHeight);
            }
          }, 100);
        } catch (err) {
          console.error('Failed to load:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Layout size={18} />
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none w-64 placeholder:text-slate-300"
          />
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <div className="flex items-center gap-1 relative">
          {showNewConfirm ? (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 w-48 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Reset Project?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    newProject();
                    setShowNewConfirm(false);
                  }}
                  className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors uppercase tracking-wider"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowNewConfirm(false)}
                  className="flex-1 px-2 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
                >
                  No
                </button>
              </div>
            </div>
          ) : null}
          <button
            onClick={() => setShowNewConfirm(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="New Project"
          >
            <FilePlus size={18} />
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-30"
            title={`Undo (${history.length})`}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => {
              const canvas = document.querySelector('.flex-1.relative');
              if (canvas) {
                fitToScreen(canvas.clientWidth, canvas.clientHeight);
              }
            }}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="Fit to Screen"
          >
            <Maximize size={18} />
          </button>
          <button
            onClick={() => setGridVisible(!gridVisible)}
            className={`p-2 rounded-lg transition-colors ${gridVisible ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
            title="Toggle Grid"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="User Manual"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={() => setShow3d(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="3D Preview"
          >
            <Box size={18} />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale</span>
          <span className="text-[10px] font-mono font-bold text-indigo-600">
            {pixelsPerCm.toFixed(2)} px/cm
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
        <button
          onClick={handleLoad}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all uppercase tracking-wider border border-transparent hover:border-slate-200"
        >
          <Upload size={16} />
          Load
        </button>
        <button
          onClick={saveProject}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 uppercase tracking-wider"
        >
          <Download size={16} />
          Save
        </button>
      </div>
    </div>
  );
};
