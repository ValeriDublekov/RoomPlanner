import React, { useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store';
import { getDistance } from '../../lib/geometry';
import { FurnitureItem } from './FurnitureItem';
import { RoomItem } from './RoomItem';
import { RoomEditor } from './RoomEditor';
import { DimensionItem } from './DimensionItem';
import { DrawingLayer } from './DrawingLayer';
import { WallAttachmentItem } from './WallAttachmentItem';
import { RoomAreaLabel } from './RoomAreaLabel';

import { ContextMenu } from './ContextMenu';

import { FurnitureRenderer } from './FurnitureRenderer';

interface CanvasStageProps {
  stageRef: React.RefObject<Konva.Stage>;
  dimensions: { width: number; height: number };
  scale: number;
  position: { x: number; y: number };
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDblClick: () => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  bgImage: HTMLImageElement | undefined;
  bgRef: React.RefObject<Konva.Image>;
  bgTrRef: React.RefObject<Konva.Transformer>;
  snappedMouse: { x: number; y: number };
  mousePos: { x: number; y: number };
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  stageRef,
  dimensions,
  scale,
  position,
  onWheel,
  onMouseDown,
  onMouseUp,
  onDragEnd,
  onDragMove,
  onClick,
  onDblClick,
  onMouseMove,
  bgImage,
  bgRef,
  bgTrRef,
  snappedMouse,
  mousePos
}) => {
    const {
    mode,
    setMode,
    activeLayer,
    backgroundPosition,
    backgroundScale,
    backgroundRotation,
    backgroundOpacity,
    backgroundVisible,
    setBackgroundTransform,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    furniture,
    selectedId,
    setSelectedId,
    selectedIds,
    setSelectedIds,
    updateFurniture,
    saveHistory,
    dimensions: savedDimensions,
    selectedDimensionId,
    setSelectedDimensionId,
    wallAttachments,
    selectedAttachmentId,
    setSelectedAttachmentId,
    pixelsPerCm: pixelsPerCmVal,
    measurePoints,
    roomPoints,
    calibrationPoints,
    setContextMenu,
    pendingFurniture
  } = useStore();

  const roomElements = useMemo(() => rooms.map((room) => (
    <RoomItem
      key={room.id}
      room={room}
      isSelected={selectedRoomId === room.id}
      onSelect={() => setSelectedRoomId(room.id)}
      scale={scale}
      isLocked={activeLayer !== 'room'}
    />
  )), [rooms, selectedRoomId, scale, activeLayer, setSelectedRoomId]);

  const furnitureElements = useMemo(() => [...furniture].sort((a, b) => (a.elevation || 0) - (b.elevation || 0)).map((item) => (
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

  const attachmentElements = useMemo(() => wallAttachments.map((attachment) => (
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

  const dimensionElements = useMemo(() => savedDimensions.map((dim) => (
    <DimensionItem
      key={dim.id}
      dimension={dim}
      pixelsPerCm={pixelsPerCmVal}
      scale={scale}
      isSelected={selectedDimensionId === dim.id}
      onSelect={() => {
        if (activeLayer === 'furniture') {
          setSelectedDimensionId(dim.id);
          if (mode !== 'select') setMode('select');
        }
      }}
      isLocked={activeLayer !== 'furniture'}
    />
  )), [savedDimensions, pixelsPerCmVal, scale, selectedDimensionId, setSelectedDimensionId, setMode, mode, activeLayer]);

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
 
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
 
    const intersections = stage.getAllIntersections(pointer);
    
    // Find all valid furniture/room/dimension IDs under the pointer
    const hits: { id: string, type: 'furniture' | 'room' | 'dimension' }[] = [];
    
    intersections.forEach(node => {
      let p: Konva.Node | null = node;
      while (p && p !== stage) {
        // Skip transformers and their internal parts
        if (p.getType() === 'Transformer' || p.name().startsWith('_')) return; 
        
        const id = p.id();
        if (id) {
          // Check if we already found this ID in a previous intersection
          if (hits.some(h => h.id === id)) return;

          if (furniture.some(f => f.id === id)) {
            hits.push({ id, type: 'furniture' });
            return;
          }
          if (savedDimensions.some(d => d.id === id)) {
            hits.push({ id, type: 'dimension' });
            return;
          }
          if (rooms.some(r => r.id === id)) {
            hits.push({ id, type: 'room' });
            return;
          }
        }
        p = p.getParent();
      }
    });

    if (hits.length === 0) {
      setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });
      return;
    }

    // Priority: If any hit is already part of the current selection, use it to preserve multi-selection
    const selectedHit = hits.find(h => 
      (h.type === 'furniture' && selectedIds.includes(h.id)) ||
      (h.type === 'room' && selectedRoomId === h.id) ||
      (h.type === 'dimension' && selectedDimensionId === h.id)
    );

    const finalTarget = selectedHit || hits[0];

    // If we are right-clicking something NOT in the current selection, 
    // we should select it (clearing previous selection)
    if (!selectedHit) {
      if (finalTarget.type === 'furniture') {
        setSelectedId(finalTarget.id);
      } else if (finalTarget.type === 'room') {
        setSelectedRoomId(finalTarget.id);
      } else if (finalTarget.type === 'dimension') {
        setSelectedDimensionId(finalTarget.id);
      }
    }

    setContextMenu({
      visible: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
      targetId: finalTarget.id,
      targetType: finalTarget.type,
    });
  };

  return (
    <>
      <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDblClick={onDblClick}
      onMouseMove={onMouseMove}
      onContextMenu={handleContextMenu}
      draggable={mode === 'select'}
      name="stage"
      dragBoundFunc={(pos) => {
        // If we are clicking on an object, don't drag the stage
        const stage = stageRef.current;
        if (stage) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const intersection = stage.getIntersection(pointer);
            // If we hit something that isn't the stage itself or the grid
            if (intersection && intersection.getStage() && intersection.name() !== 'stage' && !intersection.hasName('grid-line')) {
              return { x: stage.x(), y: stage.y() };
            }
          }
        }
        return pos;
      }}
      className={(mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture' || mode === 'add-door' || mode === 'add-window' || mode === 'measure' || mode === 'dimension' || mode === 'place-furniture') ? 'custom-cursor' : ''}
    >
      <Layer id="background-layer" visible={backgroundVisible}>
        {bgImage && (
          <>
            <KonvaImage
              ref={bgRef}
              image={bgImage}
              x={backgroundPosition.x}
              y={backgroundPosition.y}
              scaleX={backgroundScale}
              scaleY={backgroundScale}
              rotation={backgroundRotation}
              opacity={backgroundOpacity}
              draggable={activeLayer === 'blueprint'}
              onDragEnd={(e) => {
                setBackgroundTransform({ x: e.target.x(), y: e.target.y() });
              }}
              onTransformEnd={() => {
                const node = bgRef.current;
                if (node) {
                  setBackgroundTransform({
                    x: node.x(),
                    y: node.y(),
                    scale: node.scaleX(),
                    rotation: node.rotation(),
                  });
                }
              }}
            />
            {activeLayer === 'blueprint' && (
              <Transformer
                ref={bgTrRef}
                rotateEnabled={true}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
              />
            )}
          </>
        )}
      </Layer>

      <Layer id="content-layer" visible={activeLayer !== 'blueprint'}>
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

      <Layer id="annotation-layer" visible={activeLayer !== 'blueprint'}>
        {/* 7. Annotations */}
        {dimensionElements}
        {(mode === 'measure' || mode === 'dimension') && measurePoints.length === 1 && (
          <>
            <Line
              points={[measurePoints[0].x, measurePoints[0].y, snappedMouse.x, snappedMouse.y]}
              stroke={mode === 'measure' ? "#f43f5e" : "#6366f1"}
              strokeWidth={2 / scale}
              dash={[5 / scale, 5 / scale]}
            />
            <Text
              text={`${(getDistance(measurePoints[0], snappedMouse) / pixelsPerCmVal).toFixed(1)} cm`}
              x={(measurePoints[0].x + snappedMouse.x) / 2}
              y={(measurePoints[0].y + snappedMouse.y) / 2 - 20 / scale}
              fontSize={14 / scale}
              fill={mode === 'measure' ? "#f43f5e" : "#6366f1"}
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </>
        )}
      </Layer>

      <Layer id="interaction-layer">
        <DrawingLayer
          mode={mode}
          roomPoints={roomPoints}
          snappedMouse={snappedMouse}
          mousePos={mousePos}
          calibrationPoints={calibrationPoints}
          scale={scale}
          pixelsPerCm={pixelsPerCmVal}
        />
        {mode === 'place-furniture' && pendingFurniture && (
          <Group
            x={snappedMouse.x}
            y={snappedMouse.y}
            rotation={pendingFurniture.rotation}
            offsetX={pendingFurniture.width / 2}
            offsetY={pendingFurniture.height / 2}
            opacity={0.6}
            listening={false}
          >
            <FurnitureRenderer
              shape={{ ...pendingFurniture, id: 'preview' } as any}
              isSelected={false}
              isColliding={false}
              scale={scale}
              pixelsPerCm={pixelsPerCmVal}
            />
          </Group>
        )}
      </Layer>
    </Stage>
    <ContextMenu />
    </>
  );
};
