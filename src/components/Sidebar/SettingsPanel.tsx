import React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsPanelProps {
  orthoMode: boolean;
  setOrthoMode: (enabled: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (enabled: boolean) => void;
  resetView: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  orthoMode,
  setOrthoMode,
  snapToGrid,
  setSnapToGrid,
  resetView,
}) => {
  return (
    <div className="space-y-4">
      <div className="pt-4 pb-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Settings</div>
        <div className="space-y-2 px-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={orthoMode}
                onChange={(e) => setOrthoMode(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors",
                orthoMode ? "bg-indigo-600" : "bg-slate-200"
              )} />
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                orthoMode ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Ortho Mode (O)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors",
                snapToGrid ? "bg-indigo-600" : "bg-slate-200"
              )} />
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                snapToGrid ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Snap to Grid (S)</span>
          </label>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">View</div>
        <button
          onClick={resetView}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
        >
          <RotateCcw size={18} className="text-slate-400 group-hover:text-slate-600" />
          <span className="text-sm font-medium">Reset View</span>
        </button>
      </div>
    </div>
  );
};
