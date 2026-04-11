import React from 'react';
import { X } from 'lucide-react';

interface CanvasOverlaysProps {
  lastMeasurement: number | null;
  pixelsPerCm: number;
  resetMeasurement: () => void;
  dimensionInput: string;
  orthoMode: boolean;
  isCtrlPressed: boolean;
  scale: number;
  snapToGrid: boolean;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = ({
  lastMeasurement,
  pixelsPerCm,
  resetMeasurement,
  dimensionInput,
  orthoMode,
  isCtrlPressed,
  scale,
  snapToGrid
}) => {
  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
      {lastMeasurement !== null && (
        <div className="bg-rose-500 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 animate-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">Last Measurement</span>
            <button 
              onClick={resetMeasurement}
              className="hover:bg-rose-600 p-0.5 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold tracking-tighter">{(lastMeasurement / pixelsPerCm).toFixed(1)}</span>
            <span className="text-xs font-bold text-rose-200">cm</span>
          </div>
        </div>
      )}

      {dimensionInput && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Length</span>
            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(orthoMode || isCtrlPressed) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold tracking-tighter">{dimensionInput}</span>
            <span className="text-xs font-bold text-slate-500">cm</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Press Enter to confirm</div>
        </div>
      )}
      
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Canvas</div>
        <div className="text-xs font-bold text-slate-700 leading-none">
          {Math.round(scale * 100)}% Zoom
        </div>
        <div className="text-[10px] opacity-70 font-medium mt-0.5">Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'} | Snap: {snapToGrid ? 'ON' : 'OFF'}</div>
      </div>
    </div>
  );
};
