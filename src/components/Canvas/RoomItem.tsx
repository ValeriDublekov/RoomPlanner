import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import useImage from 'use-image';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import { FLOOR_TEXTURES } from '../../constants';
import { getSignedArea } from '../../lib/geometry';

interface RoomItemProps {
  room: RoomObject;
  isSelected: boolean;
  onSelect: () => void;
  scale: number;
  isLocked: boolean;
}

export const RoomItem: React.FC<RoomItemProps> = ({
  room,
  isSelected,
  onSelect,
  scale,
  isLocked,
}) => {
  const wallThicknessCm = useStore((state) => state.wallThickness);
  const pixelsPerCm = useStore((state) => state.pixelsPerCm);
  
  const wallThicknessPx = wallThicknessCm * pixelsPerCm;
  
  const isDraggingWall = useStore((state) => state.isDraggingWall);
  const isDraggingVertex = useStore((state) => state.isDraggingVertex);
  const activeLayer = useStore((state) => state.activeLayer);
  const isDragging = isDraggingWall || isDraggingVertex;
  
  const textureData = useMemo(() => FLOOR_TEXTURES.find(t => t.id === room.floorTexture), [room.floorTexture]);
  const [textureImage] = useImage(textureData?.url || '');

  const textureScale = useMemo(() => {
    return { x: pixelsPerCm, y: pixelsPerCm };
  }, [pixelsPerCm]);

  const points = room.points.flatMap((p) => [p.x, p.y]);

  const wallOpacity = activeLayer === 'room' ? 0.4 : (isDragging ? 0.2 : (isSelected ? 1 : 0.8));
  const floorOpacity = activeLayer === 'room' ? 0 : (isDragging ? 0.1 : 1);

  return (
    <Group 
      id={room.id}
      onClick={(e) => {
        if (e.evt.button !== 0) return;
        onSelect();
      }} 
      onTap={onSelect} 
      listening={!isLocked}
    >
      {/* 1. Walls (Clipped to only show outside the room) */}
      <Group
        clipFunc={(ctx) => {
          if (!room.isClosed) return;
          
          ctx.beginPath();
          // Huge outer rectangle (Clockwise)
          ctx.rect(-100000, -100000, 200000, 200000);
          
          // Room interior (Counter-Clockwise relative to the rect to create a hole)
          if (room.points.length > 0) {
            const isCW = getSignedArea(room.points) >= 0;
            if (isCW) {
              // Points are CW, so draw them in reverse to get CCW
              ctx.moveTo(room.points[0].x, room.points[0].y);
              for (let i = room.points.length - 1; i >= 1; i--) {
                ctx.lineTo(room.points[i].x, room.points[i].y);
              }
            } else {
              // Points are already CCW
              ctx.moveTo(room.points[0].x, room.points[0].y);
              for (let i = 1; i < room.points.length; i++) {
                ctx.lineTo(room.points[i].x, room.points[i].y);
              }
            }
            ctx.closePath();
          }
        }}
      >
        <Line
          points={points}
          closed={room.isClosed}
          stroke="#1e293b"
          strokeWidth={wallThicknessPx * 2}
          lineJoin="miter"
          lineCap="butt"
          opacity={wallOpacity}
        />
      </Group>

      {/* 2. Inner Room Area (The "Floor") - Only if closed */}
      {room.isClosed && (
        <>
          <Line
            points={points}
            closed={true}
            fill={room.floorColor || "#f1f5f9"}
            fillPatternImage={textureImage || undefined}
            fillPatternRepeat="repeat"
            fillPatternScale={textureScale}
            fillPriority={textureImage ? "pattern" : "color"}
            lineJoin="miter"
            opacity={floorOpacity}
          />
          {isSelected && !isDragging && (
            <Line
              points={points}
              closed={true}
              fill="#818cf8"
              opacity={0.2}
              lineJoin="miter"
              listening={false}
            />
          )}
        </>
      )}

      {/* 2.1 Missing wall indicator for open rooms */}
      {!room.isClosed && room.points.length > 2 && (
        <Line
          points={[room.points[room.points.length - 1].x, room.points[room.points.length - 1].y, room.points[0].x, room.points[0].y]}
          stroke="#1e293b"
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.3}
          listening={false}
        />
      )}
    </Group>
  );
};
