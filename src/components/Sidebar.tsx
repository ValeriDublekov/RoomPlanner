import React from 'react';
import { MousePointer2, Pencil, Square, Ruler, Undo2 } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { ToolButton } from './Sidebar/ToolButton';
import { PropertyEditor } from './Sidebar/PropertyEditor';
import { SettingsPanel } from './Sidebar/SettingsPanel';
import { FileActions } from './Sidebar/FileActions';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'draw-room', icon: Pencil, label: 'Draw Room (R)' },
  { id: 'add-box', icon: Square, label: 'Add Box (B)' },
  { id: 'draw-furniture', icon: Pencil, label: 'Draw Object (F)' },
  { id: 'calibrate', icon: Ruler, label: 'Calibrate (C)' },
  { id: 'measure', icon: Ruler, label: 'Measure (M)' },
  { id: 'dimension', icon: Ruler, label: 'Dimension (D)' },
] as const;

export const Sidebar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    activeLayer,
    setActiveLayer,
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
    dimensions,
    selectedDimensionId,
    setSelectedDimensionId,
    deleteDimension,
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
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);

  const handleSave = () => {
    const data = {
      rooms,
      furniture,
      dimensions,
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
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        <div className="flex gap-4">
          <div className="flex flex-col bg-slate-100 p-1 rounded-xl gap-1 w-24">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1 text-center">Layer</div>
            {(['blueprint', 'room', 'furniture', 'annotation'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={cn(
                  "py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  activeLayer === layer
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {layer}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Tools</div>
            <div className="space-y-1">
              {tools
                .filter(tool => {
                  if (tool.id === 'select') return true;
                  if (activeLayer === 'blueprint') return tool.id === 'calibrate';
                  if (activeLayer === 'room') return tool.id === 'draw-room';
                  if (activeLayer === 'furniture') return tool.id === 'add-box' || tool.id === 'draw-furniture';
                  if (activeLayer === 'annotation') return tool.id === 'measure' || tool.id === 'dimension';
                  return false;
                })
                .map((tool) => (
                  <ToolButton
                    key={tool.id}
                    id={tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    isActive={mode === tool.id}
                    onClick={() => setMode(tool.id as any)}
                  />
                ))}
            </div>
          </div>
        </div>

        <SettingsPanel
          orthoMode={orthoMode}
          setOrthoMode={setOrthoMode}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          resetView={resetView}
        />
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
        <PropertyEditor
          selectedFurniture={selectedFurniture}
          selectedRoom={selectedRoom}
          selectedDimension={selectedDimension}
          pixelsPerCm={pixelsPerCm}
          updateFurniture={updateFurniture}
          deleteFurniture={deleteSelected}
          deleteRoom={deleteRoom}
          deleteDimension={deleteDimension}
          saveHistory={saveHistory}
        />
        
        {!selectedFurniture && !selectedRoom && !selectedDimension && (
          <div className="px-2 mb-2 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibration</span>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {pixelsPerCm.toFixed(2)} px/cm
            </span>
          </div>
        )}

        {activeLayer === 'blueprint' && (
          <FileActions
            onSave={handleSave}
            onLoad={handleLoad}
            onImageUpload={handleImageUpload}
            backgroundImage={backgroundImage}
            backgroundOpacity={backgroundOpacity}
            setBackgroundOpacity={setBackgroundOpacity}
            removeBackgroundImage={() => setBackgroundImage(null)}
            hideGlobalActions={true}
          />
        )}
      </div>
    </aside>
  );
};
