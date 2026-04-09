import React from 'react';
import { X } from 'lucide-react';
import { FurnitureObject, RoomObject, DimensionObject } from '../../types';

interface PropertyEditorProps {
  selectedFurniture?: FurnitureObject;
  selectedRoom?: RoomObject;
  selectedDimension?: DimensionObject;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  deleteFurniture: () => void;
  deleteRoom: (id: string) => void;
  deleteDimension: (id: string) => void;
  saveHistory: () => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  selectedFurniture,
  selectedRoom,
  selectedDimension,
  pixelsPerCm,
  updateFurniture,
  deleteFurniture,
  deleteRoom,
  deleteDimension,
  saveHistory,
}) => {
  if (!selectedFurniture && !selectedRoom && !selectedDimension) return null;

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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Height (cm)</label>
              <input
                type="number"
                value={Math.round(selectedFurniture.height / pixelsPerCm)}
                onFocus={saveHistory}
                onChange={(e) => updateFurniture(selectedFurniture.id, { height: parseFloat(e.target.value) * pixelsPerCm })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
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
      ) : (
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
      )}
    </div>
  );
};
