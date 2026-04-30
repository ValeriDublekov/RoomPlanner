import React from 'react';
import { FurnitureObject, RoomObject, DimensionObject, WallAttachment } from '@/src/types';
import { FurnitureEditor, RoomEditor, AttachmentEditor, DimensionEditor } from './Editors';

interface PropertyEditorProps {
  selectedFurniture?: FurnitureObject;
  selectedRoom?: RoomObject;
  selectedWallIndex?: number | null;
  selectedDimension?: DimensionObject;
  selectedAttachment?: WallAttachment;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
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

export const PropertyEditor: React.FC<PropertyEditorProps> = (props) => {
  const {
    selectedFurniture,
    selectedRoom,
    selectedWallIndex,
    selectedDimension,
    selectedAttachment,
    pixelsPerCm,
    updateFurniture,
    updateRoom,
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
  } = props;

  if (!selectedFurniture && !selectedRoom && !selectedDimension && !selectedAttachment) return null;

  return (
    <div className="space-y-6 mb-4 p-4">
      {selectedFurniture && (
        <FurnitureEditor
          selectedFurniture={selectedFurniture}
          pixelsPerCm={pixelsPerCm}
          updateFurniture={updateFurniture}
          deleteFurniture={deleteFurniture}
          saveHistory={saveHistory}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          bringForward={bringForward}
          sendBackward={sendBackward}
        />
      )}
      
      {selectedRoom && (
        <RoomEditor
          selectedRoom={selectedRoom}
          selectedWallIndex={selectedWallIndex ?? null}
          updateRoom={updateRoom}
          deleteRoom={deleteRoom}
        />
      )}

      {selectedDimension && (
        <DimensionEditor
          selectedDimension={selectedDimension}
          deleteDimension={deleteDimension}
        />
      )}

      {selectedAttachment && (
        <AttachmentEditor
          selectedAttachment={selectedAttachment}
          updateAttachment={updateAttachment}
          deleteAttachment={deleteAttachment}
          saveHistory={saveHistory}
        />
      )}
    </div>
  );
};
