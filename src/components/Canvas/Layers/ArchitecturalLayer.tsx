import React from 'react';
import { Layer } from 'react-konva';
import { useStore } from '../../../store';
import { RoomItem } from '../RoomItem';
import { FurnitureItem } from '../FurnitureItem';
import { WallAttachmentItem } from '../WallAttachmentItem';
import { BeamItem } from '../BeamItem';
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
    beams,
    selectedBeamId,
    setSelectedBeamId,
    setMode,
    mode
  } = useStore();

  React.useEffect(() => {
    console.log('ArchitecturalLayer: selectedRoomId changed to', selectedRoomId);
  }, [selectedRoomId]);

  React.useEffect(() => {
    console.log('ArchitecturalLayer: selectedBeamId changed to', selectedBeamId);
  }, [selectedBeamId]);

  const roomElements = React.useMemo(() => rooms.map((room) => (
    <RoomItem
      key={room.id}
      room={room}
      isSelected={selectedRoomId === room.id}
      onSelect={() => {
        console.log('ArchitecturalLayer: RoomItem onSelect triggered for room:', room.id);
        setSelectedRoomId(room.id);
      }}
      scale={scale}
      isLocked={false} 
    />
  )), [rooms, selectedRoomId, scale, setSelectedRoomId]);

  const beamElements = React.useMemo(() => beams.map((beam) => (
    <BeamItem
      key={beam.id}
      beam={beam}
      isSelected={selectedBeamId === beam.id}
      onSelect={() => {
        console.log('ArchitecturalLayer: onSelect beam triggered, id:', beam.id);
        setSelectedBeamId(beam.id);
        console.log('ArchitecturalLayer: setSelectedBeamId called');
        setMode('select');
      }}
      scale={scale}
      mode={mode}
    />
  )), [beams, selectedBeamId, scale, setSelectedBeamId, setMode, mode]);

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
      {/* 1. Base Rooms (Floors & Walls) */}
      {roomElements}

      {/* 2. Room Editor (Handles & Drag Distances) - Below beams but above walls */}
      {selectedRoomId && rooms.find(r => r.id === selectedRoomId) && (
        <RoomEditor
          room={rooms.find(r => r.id === selectedRoomId)!}
          scale={scale}
        />
      )}

      {/* 3. Furniture */}
      {activeLayer === 'room' && furnitureElements}
      {activeLayer !== 'room' && furnitureElements}

      {/* 4. Beams - On top of walls and furniture in architecture mode */}
      {activeLayer === 'room' && beamElements}

      {/* 5. Room Area Labels */}
      {rooms.map((room) => (
        <RoomAreaLabel
          key={`label-${room.id}`}
          room={room}
          scale={scale}
        />
      ))}

      {/* 6. Wall Attachments (Doors/Windows) - Always findable/clickable */}
      {attachmentElements}
    </Layer>
  );
};
