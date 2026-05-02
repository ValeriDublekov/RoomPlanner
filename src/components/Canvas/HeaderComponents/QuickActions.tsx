import React from 'react';
import { Upload, Cloud, Save } from 'lucide-react';

interface QuickActionsProps {
  onLoad: () => void;
  onSave: () => void;
  isSaving: boolean;
  currentUser: any;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onLoad, onSave, isSaving, currentUser }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
      <button
        onClick={onLoad}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider"
        title="Quick Load"
      >
        <Upload size={14} className="text-slate-400" />
        <span className="hidden sm:inline">Load</span>
      </button>
      <button
        onClick={onSave}
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
  );
};
