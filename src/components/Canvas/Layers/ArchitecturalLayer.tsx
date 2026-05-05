import React from 'react';
import { Layer } from 'react-konva';
import { useStore } from '../../../store';
import { RoomItem } from '../RoomItem';
import { FurnitureItem } from '../FurnitureItem';
import { WallAttachmentItem } from '../WallAttachmentItem';
import { BeamItem } from '../BeamItem';
import { RoomEditor } from '../RoomEditor';
import { RoomAreaLabel } from '../RoomAreaLabel';
import { usePlanSnapshot } from '../../../hooks/usePlanSnapshot';

interface ArchitecturalLayerProps {
  scale: number;
}

export const ArchitecturalLayer: React.FC<ArchitecturalLayerProps> = ({ scale }) => {
  const planSnapshot = usePlanSnapshot();
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

  const roomFloorElements = React.useMemo(() => rooms.map((room) => (
    <RoomItem
      key={`floor-${room.id}`}
      room={room}
      isSelected={selectedRoomId === room.id}
      onSelect={() => {
        setSelectedRoomId(room.id);
      }}
      scale={scale}
      isLocked={false} 
      planSnapshot={planSnapshot}
      renderMode="floor"
    />
  )), [rooms, selectedRoomId, scale, setSelectedRoomId, planSnapshot]);

  const roomWallElements = React.useMemo(() => rooms.map((room) => (
    <RoomItem
      key={`walls-${room.id}`}
      room={room}
      isSelected={selectedRoomId === room.id}
      onSelect={() => {
        setSelectedRoomId(room.id);
      }}
      scale={scale}
      isLocked={false} 
      planSnapshot={planSnapshot}
      renderMode="walls"
    />
  )), [rooms, selectedRoomId, scale, setSelectedRoomId, planSnapshot]);

  const beamElements = React.useMemo(() => beams.map((beam) => (
    <BeamItem
      key={beam.id}
      beam={beam}
      isSelected={selectedBeamId === beam.id}
      onSelect={() => {
        console.log('ArchitecturalLayer: onSelect beam triggered, id:', beam.id);
        setSelectedBeamId(beam.id);
        if (mode !== 'select') setMode('select');
      }}
      scale={scale}
      mode={mode}
      planSnapshot={planSnapshot}
    />
  )), [beams, selectedBeamId, scale, setSelectedBeamId, setMode, mode, planSnapshot]);

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
        if (mode !== 'select') setMode('select');
      }}
      scale={scale}
      planSnapshot={planSnapshot}
    />
  )), [wallAttachments, selectedAttachmentId, scale, setSelectedAttachmentId, setMode, planSnapshot]);

  return (
    <Layer id="architectural-layer" visible={activeLayer !== 'blueprint'}>
      {/* 1. Base Rooms Floors */}
      {roomFloorElements}

      {/* 2. Base Rooms Walls */}
      {roomWallElements}

      {/* 3. Room Editor (Handles & Drag Distances) - Below beams but above walls */}
      {selectedRoomId && rooms.find(r => r.id === selectedRoomId) && (
        <RoomEditor
          room={rooms.find(r => r.id === selectedRoomId)!}
          scale={scale}
          planSnapshot={planSnapshot}
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
          planSnapshot={planSnapshot}
        />
      ))}

      {/* 6. Wall Attachments (Doors/Windows) - Always findable/clickable */}
      {attachmentElements}
    </Layer>
  );
};
