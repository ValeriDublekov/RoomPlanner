import React from 'react';
import { Undo2, Download, Upload, Layout, FilePlus, RotateCcw, Grid, BookOpen, Box, Maximize, Cloud, Save, Menu, ChevronDown, Printer } from 'lucide-react';
import { useStore } from '../../store';
import { UserManualModal } from '../UserManualModal';
import { CloudLoadModal } from '../Sidebar/CloudLoadModal';
import { SaveModal } from '../Sidebar/SaveModal';

interface CanvasHeaderProps {
  onExport: () => void;
  onPrint: () => void;
  getThumbnail?: () => Promise<string | null>;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({ onExport, onPrint, getThumbnail }) => {
  const { 
    undo, 
    history, 
    saveProject,
    loadState,
    projectName,
    cloudName,
    setProjectName,
    newProject,
    resetView,
    fitToScreen,
    pixelsPerCm,
    gridVisible,
    setGridVisible,
    setShow3d,
    setPixelsPerCm,
    currentUser,
    isSaving
  } = useStore();

  const [showNewConfirm, setShowNewConfirm] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);
  const [isCloudLoadOpen, setIsCloudLoadOpen] = React.useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const [pendingThumbnail, setPendingThumbnail] = React.useState<string | null>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setIsFileMenuOpen(false);
    if (isFileMenuOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isFileMenuOpen]);

  const handleLoad = () => {
    if (currentUser) {
      setIsCloudLoadOpen(true);
    } else {
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
    }
  };

  const handleSave = async () => {
    const thumbnail = getThumbnail ? await getThumbnail() : null;
    setPendingThumbnail(thumbnail);
    
    if (currentUser) {
      const state = useStore.getState();
      if (state.projectId) {
        // Already in cloud, save directly
        saveProject(undefined, undefined, thumbnail || undefined);
      } else {
        // New project, show options
        setIsSaveModalOpen(true);
      }
    } else {
      saveProject();
    }
  };

  const handleSaveAs = async () => {
    const thumbnail = getThumbnail ? await getThumbnail() : null;
    setPendingThumbnail(thumbnail);
    if (currentUser) {
      setIsSaveModalOpen(true);
    } else {
      saveProject();
    }
  };

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Layout size={18} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none w-48 placeholder:text-slate-300"
                title={cloudName ? `Filename: ${cloudName}` : 'Scale project'}
              />
              {cloudName && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100 text-[9px] text-indigo-500 font-bold tracking-wider">
                  <Cloud size={10} className="text-indigo-400" />
                  <span className="truncate max-w-[120px]">{cloudName}</span>
                </div>
              )}
            </div>
          </div>
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
            title="Center View (0,0)"
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
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-[10px] uppercase tracking-wider"
            title="3D Preview"
          >
            <Box size={16} />
            3D View
          </button>
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={pixelsPerCm.toFixed(2)}
              onChange={(e) => setPixelsPerCm(parseFloat(e.target.value) || 1)}
              className="w-12 text-[10px] font-mono font-bold text-indigo-600 bg-transparent border-none p-0 focus:ring-0 outline-none"
              step="0.1"
            />
            <span className="text-[10px] font-mono font-bold text-indigo-400">px/cm</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
        <CloudLoadModal isOpen={isCloudLoadOpen} onClose={() => setIsCloudLoadOpen(false)} />
        <SaveModal 
          isOpen={isSaveModalOpen} 
          onClose={() => {
            setIsSaveModalOpen(false);
            setPendingThumbnail(null);
          }} 
          thumbnail={pendingThumbnail}
        />
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFileMenuOpen(!isFileMenuOpen);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider border ${
              isFileMenuOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Menu size={16} />
            File
            <ChevronDown size={14} className={`transition-transform duration-200 ${isFileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              {/* New Project */}
              <div className="px-2 pb-2 mb-2 border-b border-slate-100">
                <button
                  onClick={() => setShowNewConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
                >
                  <FilePlus size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  New Project
                </button>
                {showNewConfirm && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100 italic">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 text-center">Reset everything?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          newProject();
                          setShowNewConfirm(false);
                          setIsFileMenuOpen(false);
                        }}
                        className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setShowNewConfirm(false)}
                        className="flex-1 px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                      >
                        NO
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Load/Save Group */}
              <div className="px-2 pb-2 mb-2 border-b border-slate-100 flex flex-col gap-1">
                <button
                  onClick={handleLoad}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
                >
                  <Upload size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  Load
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  ) : (
                    currentUser ? <Cloud size={16} className="text-slate-400 group-hover:text-indigo-500" /> : <Save size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                {currentUser && (
                  <button
                    onClick={handleSaveAs}
                    disabled={isSaving}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group disabled:opacity-50"
                  >
                    <Save size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    Save As...
                  </button>
                )}
              </div>

              {/* Export/Print Group */}
              <div className="px-2 flex flex-col gap-1">
                <button
                  onClick={onExport}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
                >
                  <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  Export PNG
                </button>
                <button
                  onClick={onPrint}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
                >
                  <Printer size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  Print Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
