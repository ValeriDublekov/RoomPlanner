import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, FilePlus, Upload, Cloud, Save, Download, FileCode, Box, Printer } from 'lucide-react';

interface FileMenuProps {
  onNew: () => void;
  onLoad: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
  onExportDXF: () => void;
  onExportOBJ: () => void;
  onExportGLB: () => void;
  onPrint: () => void;
  isSaving: boolean;
  currentUser: any;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  onNew,
  onLoad,
  onSave,
  onSaveAs,
  onExport,
  onExportDXF,
  onExportOBJ,
  onExportGLB,
  onPrint,
  isSaving,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider border ${
          isOpen 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
        }`}
      >
        <Menu size={16} />
        File
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
          {/* New Project */}
          <div className="px-2 pb-2 mb-2 border-b border-slate-100">
            <button
              onClick={() => handleAction(onNew)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <FilePlus size={16} className="text-slate-400 group-hover:text-indigo-500" />
              New Project
            </button>
          </div>

          {/* Load/Save Group */}
          <div className="px-2 pb-2 mb-2 border-b border-slate-100 flex flex-col gap-1">
            <button
              onClick={() => handleAction(onLoad)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <Upload size={16} className="text-slate-400 group-hover:text-indigo-500" />
              Load
            </button>
            <button
              onClick={() => handleAction(onSave)}
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
                onClick={() => handleAction(onSaveAs)}
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
              onClick={() => handleAction(onExport)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <Download size={16} className="text-slate-400 group-hover:text-indigo-500" />
              Export PNG
            </button>
            <button
              onClick={() => handleAction(onExportDXF)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <FileCode size={16} className="text-slate-400 group-hover:text-indigo-500" />
              Export DXF (2D)
            </button>
            <button
              onClick={() => handleAction(onExportOBJ)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <Box size={16} className="text-slate-400 group-hover:text-indigo-500" />
              Export OBJ (3D)
            </button>
            <button
              onClick={() => handleAction(onExportGLB)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <Box size={16} className="text-slate-400 group-hover:text-amber-500" />
              Export GLB (3D)
            </button>
            <button
              onClick={() => handleAction(onPrint)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider group"
            >
              <Printer size={16} className="text-slate-400 group-hover:text-indigo-500" />
              Print Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
