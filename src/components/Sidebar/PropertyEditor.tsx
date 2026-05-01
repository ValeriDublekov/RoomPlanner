import React from 'react';
import { FurnitureObject, RoomObject, DimensionObject, WallAttachment, BeamObject } from '@/src/types';
import { FurnitureEditor, RoomEditor, AttachmentEditor, DimensionEditor, BeamEditor } from './Editors';

interface PropertyEditorProps {
  selectedFurniture?: FurnitureObject;
  selectedRoom?: RoomObject;
  selectedWallIndex?: number | null;
  selectedDimension?: DimensionObject;
  selectedAttachment?: WallAttachment;
  selectedBeam?: BeamObject;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
  deleteFurniture: () => void;
  deleteRoom: (id: string) => void;
  deleteDimension: (id: string) => void;
  updateAttachment: (id: string, updates: Partial<WallAttachment>) => void;
  deleteAttachment: (id: string) => void;
  updateBeam: (id: string, updates: Partial<BeamObject>) => void;
  deleteBeam: (id: string) => void;
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
    selectedBeam,
    pixelsPerCm,
    updateFurniture,
    updateRoom,
    deleteFurniture,
    deleteRoom,
    deleteDimension,
    updateAttachment,
    deleteAttachment,
    updateBeam,
    deleteBeam,
    saveHistory,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = props;

  if (!selectedFurniture && !selectedRoom && !selectedDimension && !selectedAttachment && !selectedBeam) return null;

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

      {selectedBeam && (
        <BeamEditor
          selectedBeam={selectedBeam}
          updateBeam={updateBeam}
          deleteBeam={deleteBeam}
          saveHistory={saveHistory}
        />
      )}
    </div>
  );
};
