import React from 'react';
import { X, FlipHorizontal, FlipVertical, ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown } from 'lucide-react';
import { FurnitureObject, RoomObject, DimensionObject, WallAttachment } from '../../types';
import { cn } from '../../lib/utils';

interface PropertyEditorProps {
  selectedFurniture?: FurnitureObject;
  selectedRoom?: RoomObject;
  selectedDimension?: DimensionObject;
  selectedAttachment?: WallAttachment;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  deleteFurniture: () => void;
  deleteRoom: (id: string) => void;
  deleteDimension: (id: string) => void;
  updateAttachment: (id: string, updates: Partial<WallAttachment>) => void;
  deleteAttachment: (id: string) => void;
  saveHistory: () => void;
  bringToFront?: (id: string) => void;
  sendToBack?: (id: string) => void;
  bringForward?: (id: string) => void;
  sendBackward?: (id: string) => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  selectedFurniture,
  selectedRoom,
  selectedDimension,
  selectedAttachment,
  pixelsPerCm,
  updateFurniture,
  deleteFurniture,
  deleteRoom,
  deleteDimension,
  updateAttachment,
  deleteAttachment,
  saveHistory,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
}) => {
  if (!selectedFurniture && !selectedRoom && !selectedDimension && !selectedAttachment) return null;

  return (
    <div className="space-y-4 mb-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      {selectedFurniture ? (
        <>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Object Properties</div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
            <input
              type="text"
              value={selectedFurniture.name}
              onFocus={saveHistory}
              onChange={(e) => updateFurniture(selectedFurniture.id, { name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
              <input
                type="number"
                value={Math.round(selectedFurniture.width / pixelsPerCm)}
                onFocus={saveHistory}
                onChange={(e) => updateFurniture(selectedFurniture.id, { width: parseFloat(e.target.value) * pixelsPerCm })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Depth (cm)</label>
              <input
                type="number"
                value={Math.round(selectedFurniture.height / pixelsPerCm)}
                onFocus={saveHistory}
                onChange={(e) => updateFurniture(selectedFurniture.id, { height: parseFloat(e.target.value) * pixelsPerCm })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Height (3D) (cm)</label>
            <input
              type="number"
              value={Math.round((selectedFurniture.height3d || 0) / pixelsPerCm)}
              onFocus={saveHistory}
              onChange={(e) => updateFurniture(selectedFurniture.id, { height3d: parseFloat(e.target.value) * pixelsPerCm })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Color</label>
            <div className="flex gap-2 flex-wrap">
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Z-Order</label>
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
      ) : selectedRoom ? (
        <>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Properties</div>
          <div className="text-[10px] text-slate-500">ID: {selectedRoom.id}</div>
          <button
            onClick={() => deleteRoom(selectedRoom.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
          >
            <X size={12} />
            Delete Room
          </button>
        </>
      ) : selectedDimension ? (
        <>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimension Properties</div>
          <div className="text-[10px] text-slate-500">ID: {selectedDimension!.id}</div>
          <button
            onClick={() => deleteDimension(selectedDimension!.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
          >
            <X size={12} />
            Delete Dimension
          </button>
        </>
      ) : (
        <>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedAttachment!.type === 'door' ? 'Door' : 'Window'} Properties
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
            <input
              type="number"
              value={Math.round(selectedAttachment!.width)}
              onFocus={saveHistory}
              onChange={(e) => updateAttachment(selectedAttachment!.id, { width: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                saveHistory();
                updateAttachment(selectedAttachment!.id, { flipX: !selectedAttachment!.flipX });
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                selectedAttachment!.flipX ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
              title="Flip Hinge Side"
            >
              <FlipHorizontal size={14} />
              Hinge
            </button>
            <button
              onClick={() => {
                saveHistory();
                updateAttachment(selectedAttachment!.id, { flipY: !selectedAttachment!.flipY });
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                selectedAttachment!.flipY ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
              title="Flip Opening Side (In/Out)"
            >
              <FlipVertical size={14} />
              Side
            </button>
          </div>

          <button
            onClick={() => deleteAttachment(selectedAttachment!.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
          >
            <X size={12} />
            Delete {selectedAttachment!.type === 'door' ? 'Door' : 'Window'}
          </button>
        </>
      )}
    </div>
  );
};
