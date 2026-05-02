import React from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Layers } from 'lucide-react';
import { SettingsToolbar } from './SettingsToolbar';

export const SubHeader: React.FC = () => {
  const { 
    activeLayer, 
    setActiveLayer,
    setShow3d,
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

      <SettingsToolbar />
    </div>
  );
};
