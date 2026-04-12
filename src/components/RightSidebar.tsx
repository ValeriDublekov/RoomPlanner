import React from 'react';
import { useStore } from '../store';
import { PropertyEditor } from './Sidebar/PropertyEditor';

export const RightSidebar: React.FC = () => {
  const { 
    selectedId,
    furniture,
    updateFurniture,
    rooms,
    dimensions,
    selectedDimensionId,
    deleteDimension,
    selectedRoomId,
    selectedWallIndex,
    deleteRoom,
    updateRoom,
    wallAttachments,
    selectedAttachmentId,
    updateWallAttachment,
    deleteWallAttachment,
    saveHistory,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    pixelsPerCm,
    deleteSelected
  } = useStore();

  const selectedFurniture = furniture.find(f => f.id === selectedId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);
  const selectedAttachment = wallAttachments.find(a => a.id === selectedAttachmentId);

  if (!selectedFurniture && !selectedRoom && !selectedDimension && !selectedAttachment) {
    return null;
  }

  return (
    <aside className="w-[400px] min-w-[400px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full shadow-sm z-10 overflow-hidden">
      <div className="h-14 border-b border-slate-100 flex items-center px-6 bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Properties</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <PropertyEditor
          selectedFurniture={selectedFurniture}
          selectedRoom={selectedRoom}
          selectedWallIndex={selectedWallIndex}
          selectedDimension={selectedDimension}
          selectedAttachment={selectedAttachment}
          pixelsPerCm={pixelsPerCm}
          updateFurniture={updateFurniture}
          updateRoom={updateRoom}
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
      </div>
    </aside>
  );
};
