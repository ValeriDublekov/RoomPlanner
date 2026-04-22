import React, { useMemo } from 'react';
import { Line, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import { FLOOR_TEXTURES } from '../../constants';
import { getSignedArea, getDistance, getOutwardNormal } from '../../lib/geometry';

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
  const mode = useStore((state) => state.mode);
  const isDragging = isDraggingWall || isDraggingVertex;
  
  const textureData = useMemo(() => FLOOR_TEXTURES.find(t => t.id === room.floorTexture), [room.floorTexture]);
  const [textureImage] = useImage(textureData?.url || '');

  const textureScale = useMemo(() => {
    return { x: pixelsPerCm, y: pixelsPerCm };
  }, [pixelsPerCm]);

  const points = room.points.flatMap((p) => [p.x, p.y]);

  const showAutoDimensions = useStore((state) => state.showAutoDimensions);
  
  const wallOpacity = activeLayer === 'room' ? 0.4 : (isDragging ? 0.2 : (isSelected ? 1 : 0.8));
  const floorOpacity = activeLayer === 'room' ? 0 : (isDragging ? 0.1 : 1);

  const autoDimensions = useMemo(() => {
    if ((!showAutoDimensions && !isSelected) || room.points.length < 2) return null;
    
    const dimensions: React.ReactNode[] = [];
    const numPoints = room.points.length;
    const limit = room.isClosed ? numPoints : numPoints - 1;

    for (let i = 0; i < limit; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % numPoints];
      const dist = getDistance(p1, p2);
      
      if (dist < 10) continue; // Don't show for very small segments

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      const normal = getOutwardNormal(room.points, i);
      
      // Calculate corner angles to adjust offset and avoid overlaps
      const prevIdx = (i - 1 + numPoints) % numPoints;
      const nextIdx = (i + 1) % numPoints;
      const pPrev = room.points[prevIdx];
      const pNext = room.points[(i + 2) % numPoints];
      
      // Basic overlap avoidance: if segment is short, increase offset significantly
      // or if it's near a sharp corner
      let dynamicOffset = (wallThicknessPx + 24 / scale);
      if (dist < 120) {
        dynamicOffset += 14 / scale;
      }
      if (dist < 60) {
        dynamicOffset += 12 / scale;
      }

      const textX = midX + normal.x * dynamicOffset;
      const textY = midY + normal.y * dynamicOffset;

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
      // Keep text upright
      const normalizedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;

      const labelText = `${(dist / pixelsPerCm).toFixed(1)} cm`;
      const fontSize = 11 / scale;
      const padding = 5 / scale;
      
      // Approximate text width
      const approxWidth = (labelText.length * 7.5 + padding * 2) / scale;
      const approxHeight = (fontSize + padding * 2);

      dimensions.push(
        <Group key={`dim-group-${room.id}-${i}`} x={textX} y={textY} rotation={normalizedAngle}>
          <Rect
            x={-approxWidth / 2}
            y={-approxHeight / 2}
            width={approxWidth}
            height={approxHeight}
            fill="white"
            opacity={0.9}
            cornerRadius={4 / scale}
            stroke="#94a3b8"
            strokeWidth={1 / scale}
            listening={false}
            shadowBlur={4 / scale}
            shadowColor="black"
            shadowOpacity={0.1}
            shadowOffset={{ x: 1 / scale, y: 1 / scale }}
          />
          <Text
            text={labelText}
            x={-approxWidth / 2}
            y={-approxHeight / 2}
            width={approxWidth}
            height={approxHeight}
            fontSize={fontSize}
            fill="#334155"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      );
    }
    return dimensions;
  }, [room, showAutoDimensions, pixelsPerCm, scale, wallThicknessPx]);

  return (
    <Group 
      id={room.id}
      onClick={(e) => {
        if (e.evt.button !== 0 || mode !== 'select') return;
        onSelect();
      }} 
      onTap={() => {
        if (mode === 'select') onSelect();
      }} 
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

      {/* 3. Automatic Dimensions */}
      {autoDimensions}
    </Group>
  );
};
