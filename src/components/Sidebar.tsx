import React from 'react';
import { MousePointer2, Pencil, Square, Ruler, Image as ImageIcon, Download, Upload, RotateCcw, X, Undo2 } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'draw-room', icon: Pencil, label: 'Draw Room (R)' },
  { id: 'add-box', icon: Square, label: 'Add Box (B)' },
  { id: 'draw-furniture', icon: Pencil, label: 'Draw Object (F)' },
  { id: 'calibrate', icon: Ruler, label: 'Calibrate (C)' },
] as const;

export const Sidebar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    resetView, 
    setBackgroundImage, 
    backgroundOpacity, 
    setBackgroundOpacity,
    backgroundImage,
    pixelsPerCm,
    selectedId,
    deleteSelected,
    furniture,
    updateFurniture,
    rooms,
    loadState,
    undo,
    history,
    selectedRoomId,
    deleteRoom,
    orthoMode,
    setOrthoMode,
    snapToGrid,
    setSnapToGrid,
    saveHistory
  } = useStore();

  const selectedFurniture = furniture.find(f => f.id === selectedId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const loadInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const data = {
      rooms,
      furniture,
      pixelsPerCm,
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'room-plan.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadState(json);
      } catch (err) {
        console.error('Failed to load room plan:', err);
        alert('Invalid room plan file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <div className="p-6 border-bottom border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Square size={18} />
          </div>
          RoomPlanner
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">2D Design Tool</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Tools</div>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              mode === tool.id 
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <tool.icon size={18} className={cn(
              "transition-colors",
              mode === tool.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span className="text-sm font-medium">{tool.label}</span>
          </button>
        ))}

        <div className="pt-6 pb-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Background</div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
          >
            <ImageIcon size={18} className="text-slate-400 group-hover:text-slate-600" />
            <span className="text-sm font-medium">{backgroundImage ? 'Change Image' : 'Upload Blueprint'}</span>
          </button>

          {backgroundImage && (
            <div className="px-3 py-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opacity</span>
                <span className="text-[10px] font-mono font-bold text-slate-600">{Math.round(backgroundOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={backgroundOpacity}
                onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <button 
                onClick={() => setBackgroundImage(null)}
                className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

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
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo2 size={14} />
          Undo ({history.length})
        </button>

        {selectedFurniture && (
          <div className="space-y-4 mb-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
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
              onClick={deleteSelected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
            >
              <X size={12} />
              Delete Object
            </button>
          </div>
        )}

        {selectedRoom && (
          <div className="space-y-4 mb-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Properties</div>
            <div className="text-[10px] text-slate-500">ID: {selectedRoom.id}</div>
            <button
              onClick={() => deleteRoom(selectedRoom.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
            >
              <X size={12} />
              Delete Room
            </button>
          </div>
        )}
        
        {!selectedFurniture && !selectedRoom && (
          <div className="px-2 mb-2 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibration</span>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {pixelsPerCm.toFixed(2)} px/cm
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Download size={14} />
            Save
          </button>
          <button 
            onClick={() => loadInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Upload size={14} />
            Load
          </button>
          <input
            type="file"
            ref={loadInputRef}
            onChange={handleLoad}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>
    </aside>
  );
};
