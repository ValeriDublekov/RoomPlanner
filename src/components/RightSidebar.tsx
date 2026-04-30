import React from 'react';
import { useStore } from '../store';
import { PropertyEditor } from './Sidebar/PropertyEditor';

export const RightSidebar: React.FC = () => {
  const selectedId = useStore(state => state.selectedId);
  const furniture = useStore(state => state.furniture);
  const updateFurniture = useStore(state => state.updateFurniture);
  const rooms = useStore(state => state.rooms);
  const dimensions = useStore(state => state.dimensions);
  const selectedDimensionId = useStore(state => state.selectedDimensionId);
  const deleteDimension = useStore(state => state.deleteDimension);
  const selectedRoomId = useStore(state => state.selectedRoomId);
  const selectedWallIndex = useStore(state => state.selectedWallIndex);
  const deleteRoom = useStore(state => state.deleteRoom);
  const updateRoom = useStore(state => state.updateRoom);
  const wallAttachments = useStore(state => state.wallAttachments);
  const selectedAttachmentId = useStore(state => state.selectedAttachmentId);
  const updateWallAttachment = useStore(state => state.updateWallAttachment);
  const deleteWallAttachment = useStore(state => state.deleteWallAttachment);
  const saveHistory = useStore(state => state.saveHistory);
  const bringToFront = useStore(state => state.bringToFront);
  const sendToBack = useStore(state => state.sendToBack);
  const bringForward = useStore(state => state.bringForward);
  const sendBackward = useStore(state => state.sendBackward);
  const pixelsPerCm = useStore(state => state.pixelsPerCm);
  const deleteSelected = useStore(state => state.deleteSelected);

  const selectedFurniture = furniture.find(f => f.id === selectedId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);
  const selectedAttachment = wallAttachments.find(a => a.id === selectedAttachmentId);

  if (!selectedFurniture && !selectedRoom && !selectedDimension && !selectedAttachment) {
    return null;
  }

  return (
    <aside className="w-80 lg:w-[350px] xl:w-[400px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl lg:shadow-sm z-30 overflow-hidden absolute lg:relative right-0 top-0 bottom-0 max-w-[calc(100vw-4rem)]">
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Properties</h2>
        <button 
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          onClick={() => {
            useStore.getState().setSelectedId(null);
            useStore.getState().setSelectedRoomId(null);
            useStore.getState().setSelectedDimensionId(null);
            useStore.getState().setSelectedAttachmentId(null);
            useStore.getState().setSelectedIds([]);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
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
