import React from 'react';
import { Undo2, Download, Upload, Layout, FilePlus, RotateCcw, Grid, BookOpen, Box, Maximize, Cloud, Save, Menu, ChevronDown, Printer } from 'lucide-react';
import { useStore } from '../../store';
import { UserManualModal } from '../UserManualModal';
import { CloudLoadModal } from '../Sidebar/CloudLoadModal';
import { SaveModal } from '../Sidebar/SaveModal';
import { ConfirmModal } from '../Dialogs/ConfirmModal';

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
    isSaving,
    activeLayer
  } = useStore();

  const [showNewConfirm, setShowNewConfirm] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);
  const [isCloudLoadOpen, setIsCloudLoadOpen] = React.useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const [pendingThumbnail, setPendingThumbnail] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
              fitToScreen();
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
    <header className="bg-white border-b border-slate-200 flex flex-col lg:flex-row items-center justify-between px-4 z-20 shadow-sm py-2 gap-3 w-full">
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 w-full lg:w-auto">
        {/* Project Name & App Icon */}
        <div className="flex items-center gap-3 pr-2 border-r border-slate-100 hidden sm:flex">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex shrink-0 items-center justify-center text-white shadow-sm">
            <Layout size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none w-24 sm:w-28 md:w-40 placeholder:text-slate-300"
                title={cloudName ? `Filename: ${cloudName}` : 'Project name'}
              />
              {cloudName && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100/50 text-[8px] text-indigo-400 font-bold tracking-wider">
                  <Cloud size={9} />
                  <span className="truncate max-w-[60px] md:max-w-[100px]">{cloudName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
            onClick={() => setShowManual(true)}
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
      </div>


      <div className="flex items-center justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
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
        <ConfirmModal
          isOpen={showNewConfirm}
          title="New Project"
          message="This will clear your current plan and start fresh. Any unsaved changes will be lost. Are you sure?"
          confirmLabel="Reset Everything"
          cancelLabel="Cancel"
          onConfirm={() => {
            newProject();
            setShowNewConfirm(false);
            setIsFileMenuOpen(false);
          }}
          onCancel={() => setShowNewConfirm(false)}
          variant="danger"
        />

        {/* Quick Actions */}
        <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={handleLoad}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Quick Load"
          >
            <Upload size={14} className="text-slate-400" />
            <span className="hidden sm:inline">Load</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider"
            title="Quick Save"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
            ) : (
              currentUser ? <Cloud size={14} className="text-indigo-400" /> : <Save size={14} className="text-slate-400" />
            )}
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden lg:block" />
        
        {/* Main Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFileMenuOpen(!isFileMenuOpen);
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider border ${
              isFileMenuOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
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
    </header>
  );
};
