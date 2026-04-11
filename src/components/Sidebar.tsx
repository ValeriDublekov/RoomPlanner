import React, { useState } from 'react';
import { MousePointer2, Pencil, Square, Ruler, DoorOpen, Layout, Circle, BookPlus } from 'lucide-react';
import { useStore } from '../store';
import { ToolButton } from './Sidebar/ToolButton';
import { PropertyEditor } from './Sidebar/PropertyEditor';
import { FileActions } from './Sidebar/FileActions';
import { CatalogModal } from './Sidebar/CatalogModal';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'draw-room', icon: Pencil, label: 'Draw Room (R)' },
  { id: 'add-box', icon: Square, label: 'Add Box (B)' },
  { id: 'draw-circle', icon: Circle, label: 'Add Circle (O)' },
  { id: 'draw-furniture', icon: Pencil, label: 'Draw Object (F)' },
  { id: 'calibrate', icon: Ruler, label: 'Calibrate (C)' },
  { id: 'measure', icon: Ruler, label: 'Measure (M)' },
  { id: 'dimension', icon: Ruler, label: 'Dimension (D)' },
  { id: 'add-door', icon: DoorOpen, label: 'Add Door' },
  { id: 'add-window', icon: Layout, label: 'Add Window' },
] as const;

export const Sidebar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    activeLayer,
    setBackgroundImage, 
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
    selectedRoomId,
    deleteRoom,
    wallAttachments,
    selectedAttachmentId,
    setSelectedAttachmentId,
    updateWallAttachment,
    deleteWallAttachment,
    saveHistory,
    saveProject,
    backgroundImage,
    backgroundVisible,
    setBackgroundVisible,
    backgroundOpacity,
    setBackgroundOpacity,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  } = useStore();

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const selectedFurniture = furniture.find(f => f.id === selectedId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);
  const selectedAttachment = wallAttachments.find(a => a.id === selectedAttachmentId);

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
      <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Tools</div>
          <div className="space-y-1">
            {tools
              .filter(tool => {
                if (tool.id === 'select') return true;
                if (activeLayer === 'blueprint') return tool.id === 'calibrate';
                if (activeLayer === 'room') return tool.id === 'draw-room' || tool.id === 'add-door' || tool.id === 'add-window';
                if (activeLayer === 'furniture') return tool.id === 'add-box' || tool.id === 'draw-circle' || tool.id === 'draw-furniture';
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
            
            {activeLayer === 'furniture' && (
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mt-4 border border-indigo-100 shadow-sm"
              >
                <BookPlus size={18} />
                Open Catalog
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
        <FileActions
          onSave={saveProject}
          onLoad={handleLoad}
          onImageUpload={handleImageUpload}
          backgroundImage={backgroundImage}
          backgroundVisible={backgroundVisible}
          setBackgroundVisible={setBackgroundVisible}
          backgroundOpacity={backgroundOpacity}
          setBackgroundOpacity={setBackgroundOpacity}
          removeBackgroundImage={() => setBackgroundImage(null)}
          hideGlobalActions={true}
          hideImageActions={activeLayer !== 'blueprint'}
        />

        <PropertyEditor
          selectedFurniture={selectedFurniture}
          selectedRoom={selectedRoom}
          selectedDimension={selectedDimension}
          selectedAttachment={selectedAttachment}
          pixelsPerCm={pixelsPerCm}
          updateFurniture={updateFurniture}
          deleteFurniture={deleteSelected}
          deleteRoom={deleteRoom}
          deleteDimension={deleteDimension}
          updateAttachment={updateWallAttachment}
          deleteAttachment={deleteWallAttachment}
          saveHistory={saveHistory}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          bringForward={bringForward}
          sendBackward={sendBackward}
        />
        
        {activeLayer === 'blueprint' && (
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl mx-4 mb-4">
            <p className="text-[10px] text-indigo-700 font-medium leading-tight">
              Blueprint Layer: Upload and calibrate your floor plan image here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
