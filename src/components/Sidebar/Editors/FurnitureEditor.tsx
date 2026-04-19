import React from 'react';
import { X, RotateCcw, RotateCw, ArrowUpToLine, ChevronUp, ChevronDown, ArrowDownToLine } from 'lucide-react';
import { FurnitureObject } from '../../../types';
import { WOOD_COLORS } from '../../../constants';
import { cn } from '../../../lib/utils';

interface FurnitureEditorProps {
  selectedFurniture: FurnitureObject;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  deleteFurniture: () => void;
  saveHistory: () => void;
  bringToFront?: (id: string) => void;
  sendToBack?: (id: string) => void;
  bringForward?: (id: string) => void;
  sendBackward?: (id: string) => void;
}

export const FurnitureEditor: React.FC<FurnitureEditorProps> = ({
  selectedFurniture,
  pixelsPerCm,
  updateFurniture,
  deleteFurniture,
  saveHistory,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
}) => {
  return (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Object Properties</div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
        <input
          type="text"
          value={selectedFurniture.name}
          onFocus={saveHistory}
          onChange={(e) => updateFurniture(selectedFurniture.id, { name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Furniture Type</label>
        <select
          value={selectedFurniture.furnitureType || 'generic'}
          onFocus={saveHistory}
          onChange={(e) => updateFurniture(selectedFurniture.id, { furnitureType: e.target.value as any })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
        >
          <option value="generic">Generic Box</option>
          <option value="bed">Bed</option>
          <option value="desk">Desk</option>
          <option value="wardrobe">Wardrobe</option>
          <option value="dresser">Dresser</option>
          <option value="chair">Chair</option>
          <option value="shelf">Shelf / Unit</option>
          <option value="electronics">Electronics / TV</option>
          <option value="table">Table</option>
          <option value="sofa">Sofa</option>
          <option value="armchair">Armchair</option>
          <option value="nightstand">Nightstand</option>
          <option value="toilet">Toilet</option>
          <option value="bathtub">Bathtub</option>
          <option value="light">Light / Lamp</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
          <input
            type="number"
            value={Math.round(selectedFurniture.width / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { width: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Depth (cm)</label>
          <input
            type="number"
            value={Math.round(selectedFurniture.height / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { height: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Height (3D) (cm)</label>
          <input
            type="number"
            value={Math.round((selectedFurniture.height3d || 0) / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { height3d: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Elevation (cm)</label>
          <input
            type="number"
            value={Math.round((selectedFurniture.elevation || 0) / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { elevation: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {(selectedFurniture.furnitureType === 'electronics' || selectedFurniture.furnitureType === 'shelf') && (
        <div className="space-y-3 pt-2">
          {selectedFurniture.furnitureType === 'electronics' && (
            <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <input
                type="checkbox"
                checked={selectedFurniture.hideStand || false}
                onChange={(e) => updateFurniture(selectedFurniture.id, { hideStand: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wall Mounted</span>
                <span className="text-[10px] text-slate-500 font-medium">Hide stand in 3D view</span>
              </div>
            </label>
          )}

          {selectedFurniture.furnitureType === 'shelf' && (
            <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <input
                type="checkbox"
                checked={selectedFurniture.hasDoors || false}
                onChange={(e) => updateFurniture(selectedFurniture.id, { hasDoors: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">With Doors</span>
                <span className="text-[10px] text-slate-500 font-medium">Turn shelf into a cabinet</span>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Main Color / Material</label>
        <div className="flex gap-2 flex-wrap">
          {WOOD_COLORS.map(wood => (
            <button
              key={wood.id}
              onClick={() => updateFurniture(selectedFurniture.id, { color: wood.color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden",
                selectedFurniture.color === wood.color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              title={wood.name}
              style={{ backgroundColor: wood.color }}
            >
              <div className="w-full h-full opacity-20 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_40%,transparent_40%,transparent_60%,#000_60%,#000_80%,transparent_80%)] bg-[length:4px_4px]" />
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
            <button
              key={color}
              onClick={() => updateFurniture(selectedFurniture.id, { color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                selectedFurniture.color === color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedFurniture.color || '#f8fafc'} 
            onChange={(e) => updateFurniture(selectedFurniture.id, { color: e.target.value })}
            className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      {(selectedFurniture.furnitureType === 'wardrobe' || selectedFurniture.furnitureType === 'dresser' || selectedFurniture.furnitureType === 'bed' || (selectedFurniture.furnitureType === 'shelf' && selectedFurniture.hasDoors)) && (
        <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            {selectedFurniture.furnitureType === 'bed' ? 'Mattress / Pillows Color' : 'Doors / Drawers Color'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {WOOD_COLORS.map(wood => (
              <button
                key={wood.id}
                onClick={() => updateFurniture(selectedFurniture.id, { secondaryColor: wood.color })}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden",
                  selectedFurniture.secondaryColor === wood.color ? "border-indigo-500 scale-110" : "border-transparent"
                )}
                title={wood.name}
                style={{ backgroundColor: wood.color }}
              >
                <div className="w-full h-full opacity-20 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_40%,transparent_40%,transparent_60%,#000_60%,#000_80%,transparent_80%)] bg-[length:4px_4px]" />
              </button>
            ))}
            <div className="w-px h-6 bg-slate-200 mx-1" />
            {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
              <button
                key={color}
                onClick={() => updateFurniture(selectedFurniture.id, { secondaryColor: color })}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  selectedFurniture.secondaryColor === color ? "border-indigo-500 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input 
              type="color" 
              value={selectedFurniture.secondaryColor || selectedFurniture.color || '#f8fafc'} 
              onChange={(e) => updateFurniture(selectedFurniture.id, { secondaryColor: e.target.value })}
              className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
            />
            <button
              onClick={() => updateFurniture(selectedFurniture.id, { secondaryColor: undefined })}
              className="text-[9px] text-slate-400 hover:text-indigo-500 font-bold uppercase tracking-tighter ml-auto"
            >
              Same as body
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rotation</label>
          <button 
            onClick={() => { saveHistory(); updateFurniture(selectedFurniture.id, { rotation: 0 }); }}
            className="text-[9px] text-indigo-500 hover:text-indigo-600 font-bold uppercase tracking-tighter"
          >
            Reset (0°)
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={Math.round(selectedFurniture.rotation)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { rotation: parseFloat(e.target.value) || 0 })}
            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                saveHistory();
                updateFurniture(selectedFurniture.id, { rotation: (selectedFurniture.rotation - 90) % 360 });
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600 text-[10px] font-bold uppercase tracking-wider"
              title="Rotate -90°"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                saveHistory();
                updateFurniture(selectedFurniture.id, { rotation: (selectedFurniture.rotation + 90) % 360 });
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600 text-[10px] font-bold uppercase tracking-wider"
              title="Rotate +90°"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
          <input
            type="checkbox"
            checked={selectedFurniture.showLabel || false}
            onChange={(e) => updateFurniture(selectedFurniture.id, { showLabel: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Show Label</span>
            <span className="text-[10px] text-slate-500 font-medium">Always show name and dimensions</span>
          </div>
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Z-Order</label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => bringToFront?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Bring to Front"
          >
            <ArrowUpToLine size={14} />
          </button>
          <button
            onClick={() => bringForward?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Bring Forward"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => sendBackward?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Send Backward"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => sendToBack?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Send to Back"
          >
            <ArrowDownToLine size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={deleteFurniture}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete Object
      </button>
    </>
  );
};
