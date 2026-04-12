import React from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Line, Text } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store';
import { getDistance } from '../../lib/geometry';
import { FurnitureItem } from './FurnitureItem';
import { RoomItem } from './RoomItem';
import { DimensionItem } from './DimensionItem';
import { DrawingLayer } from './DrawingLayer';
import { WallAttachmentItem } from './WallAttachmentItem';
import { RoomAreaLabel } from './RoomAreaLabel';

interface CanvasStageProps {
  stageRef: React.RefObject<Konva.Stage>;
  dimensions: { width: number; height: number };
  scale: number;
  position: { x: number; y: number };
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
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
    calibrationPoints
  } = useStore();

  return (
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
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDblClick={onDblClick}
      onMouseMove={onMouseMove}
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
      className={(mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture' || mode === 'add-door' || mode === 'add-window' || mode === 'measure' || mode === 'dimension') ? 'custom-cursor' : ''}
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

      <Layer id="content-layer">
        {/* Rooms */}
        {rooms.map((room) => (
          <RoomItem
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onSelect={() => setSelectedRoomId(room.id)}
            scale={scale}
            isLocked={activeLayer !== 'room'}
          />
        ))}

        {/* Furniture */}
        {[...furniture].sort((a, b) => (a.elevation || 0) - (b.elevation || 0)).map((item) => (
          <FurnitureItem
            key={item.id}
            shape={item}
            isSelected={item.id === selectedId}
            onSelect={() => {
              if (activeLayer === 'furniture') {
                setSelectedId(item.id);
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
        ))}

        {/* Room Area Labels (Rendered after furniture to be on top) */}
        {rooms.map((room) => (
          <RoomAreaLabel
            key={`label-${room.id}`}
            room={room}
            scale={scale}
          />
        ))}

        {/* Wall Attachments (Rendered above walls/rooms to "cut" them) */}
        {wallAttachments.map((attachment) => (
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
        ))}

        {/* Annotations */}
        {savedDimensions.map((dim) => (
          <DimensionItem
            key={dim.id}
            dimension={dim}
            pixelsPerCm={pixelsPerCmVal}
            scale={scale}
            isSelected={selectedDimensionId === dim.id}
            onSelect={() => {
              if (activeLayer === 'annotation') {
                setSelectedDimensionId(dim.id);
                setMode('select');
              }
            }}
          />
        ))}
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
      </Layer>
    </Stage>
  );
};
