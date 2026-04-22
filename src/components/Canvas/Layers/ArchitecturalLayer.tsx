import React from 'react';
import { Layer } from 'react-konva';
import { useStore } from '../../../store';
import { RoomItem } from '../RoomItem';
import { FurnitureItem } from '../FurnitureItem';
import { WallAttachmentItem } from '../WallAttachmentItem';
import { RoomEditor } from '../RoomEditor';
import { RoomAreaLabel } from '../RoomAreaLabel';

interface ArchitecturalLayerProps {
  scale: number;
}

export const ArchitecturalLayer: React.FC<ArchitecturalLayerProps> = ({ scale }) => {
  const {
    activeLayer,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    furniture,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    updateFurniture,
    saveHistory,
    pixelsPerCm: pixelsPerCmVal,
    wallAttachments,
    selectedAttachmentId,
    setSelectedAttachmentId,
    setMode,
  } = useStore();

  const roomElements = React.useMemo(() => rooms.map((room) => (
    <RoomItem
      key={room.id}
      room={room}
      isSelected={selectedRoomId === room.id}
      onSelect={() => setSelectedRoomId(room.id)}
      scale={scale}
      isLocked={activeLayer !== 'room'}
    />
  )), [rooms, selectedRoomId, scale, activeLayer, setSelectedRoomId]);

  const furnitureElements = React.useMemo(() => [...furniture].sort((a, b) => (a.elevation || 0) - (b.elevation || 0)).map((item) => (
    <FurnitureItem
      key={item.id}
      shape={item}
      isSelected={selectedIds.includes(item.id)}
      onSelect={(multi) => {
        if (activeLayer === 'furniture') {
          if (multi) {
            const newIds = selectedIds.includes(item.id)
              ? selectedIds.filter(id => id !== item.id)
              : [...selectedIds, item.id];
            setSelectedIds(newIds);
          } else {
            setSelectedId(item.id);
          }
        }
      }}
      onStartChange={saveHistory}
      onChange={(newAttrs) => updateFurniture(item.id, newAttrs)}
      scale={scale}
      pixelsPerCm={pixelsPerCmVal}
      isLocked={activeLayer !== 'furniture'}
      rooms={rooms}
      allFurniture={furniture}
    />
  )), [furniture, selectedIds, activeLayer, scale, pixelsPerCmVal, rooms, setSelectedIds, setSelectedId, saveHistory, updateFurniture]);

  const attachmentElements = React.useMemo(() => wallAttachments.map((attachment) => (
    <WallAttachmentItem
      key={attachment.id}
      attachment={attachment}
      isSelected={selectedAttachmentId === attachment.id}
      onSelect={() => {
        setSelectedAttachmentId(attachment.id);
        setMode('select');
      }}
      scale={scale}
    />
  )), [wallAttachments, selectedAttachmentId, scale, setSelectedAttachmentId, setMode]);

  return (
    <Layer id="architectural-layer" visible={activeLayer !== 'blueprint'}>
      {/* 1. Base Rooms */}
      {roomElements}

      {/* 2. Furniture (if in room mode, it's below attachments) */}
      {activeLayer === 'room' && furnitureElements}

      {/* 3. Wall Attachments */}
      {attachmentElements}

      {/* 4. Furniture (if NOT in room mode, it's above attachments) */}
      {activeLayer !== 'room' && furnitureElements}

      {/* 5. Room Editor (Handles & Drag Distances) - Always on top of room elements */}
      {selectedRoomId && rooms.find(r => r.id === selectedRoomId) && (
        <RoomEditor
          room={rooms.find(r => r.id === selectedRoomId)!}
          scale={scale}
        />
      )}

      {/* 6. Room Area Labels */}
      {rooms.map((room) => (
        <RoomAreaLabel
          key={`label-${room.id}`}
          room={room}
          scale={scale}
        />
      ))}
    </Layer>
  );
};
