import React from 'react';
import { X } from 'lucide-react';
import { RoomObject } from '../../../types';
import { FLOOR_TEXTURES } from '../../../constants';
import { cn } from '../../../lib/utils';

interface RoomEditorProps {
  selectedRoom: RoomObject;
  selectedWallIndex: number | null;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
  deleteRoom: (id: string) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  selectedRoom,
  selectedWallIndex,
  updateRoom,
  deleteRoom,
}) => {
  return (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Properties</div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Floor Texture</label>
        <div className="grid grid-cols-2 gap-2">
          {FLOOR_TEXTURES.map(tex => (
            <button
              key={tex.id}
              onClick={() => updateRoom(selectedRoom.id, { floorTexture: tex.id })}
              className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-center",
                selectedRoom.floorTexture === tex.id || (!selectedRoom.floorTexture && tex.id === 'none')
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {tex.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Floor Color / Tint</label>
        <div className="flex gap-2 flex-wrap">
          {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
            <button
              key={color}
              onClick={() => updateRoom(selectedRoom.id, { floorColor: color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                (selectedRoom.floorColor || '#f1f5f9') === color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedRoom.floorColor || '#f1f5f9'} 
            onChange={(e) => updateRoom(selectedRoom.id, { floorColor: e.target.value })}
            className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Default Wall Color</label>
        <div className="flex gap-2 flex-wrap">
          {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
            <button
              key={color}
              onClick={() => updateRoom(selectedRoom.id, { defaultWallColor: color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                selectedRoom.defaultWallColor === color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedRoom.defaultWallColor || '#f8fafc'} 
            onChange={(e) => updateRoom(selectedRoom.id, { defaultWallColor: e.target.value })}
            className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      {selectedWallIndex !== null && (
        <div className="space-y-1.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Wall #{selectedWallIndex + 1} Color</label>
          <div className="flex gap-2 flex-wrap">
            {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
              <button
                key={color}
                onClick={() => {
                  const newColors = [...(selectedRoom.wallColors || [])];
                  while (newColors.length < selectedRoom.points.length) {
                    newColors.push('');
                  }
                  newColors[selectedWallIndex] = color;
                  updateRoom(selectedRoom.id, { wallColors: newColors });
                }}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  (selectedRoom.wallColors?.[selectedWallIndex] || selectedRoom.defaultWallColor || '#f8fafc') === color ? "border-indigo-500 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input 
              type="color" 
              value={selectedRoom.wallColors?.[selectedWallIndex] || selectedRoom.defaultWallColor || '#f8fafc'} 
              onChange={(e) => {
                const newColors = [...(selectedRoom.wallColors || [])];
                while (newColors.length < selectedRoom.points.length) {
                  newColors.push('');
                }
                newColors[selectedWallIndex] = e.target.value;
                updateRoom(selectedRoom.id, { wallColors: newColors });
              }}
              className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
            />
          </div>
          <p className="text-[9px] text-indigo-400 italic">This overrides the default room wall color.</p>
        </div>
      )}

      <button
        onClick={() => deleteRoom(selectedRoom.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete Room
      </button>
    </>
  );
};
