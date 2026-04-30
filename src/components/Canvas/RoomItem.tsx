import React, { useMemo } from 'react';
import { Line, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import { FLOOR_TEXTURES } from '../../constants';
import { getSignedArea, getDistance, getOutwardNormal, getDistanceToSegment, getWallSegments } from '../../lib/geometry';
import { DimensionLabel } from './DimensionLabel';

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
  const setSelectedRoomId = useStore((state) => state.setSelectedRoomId);
  const setSelectedWallIndex = useStore((state) => state.setSelectedWallIndex);
  const setSelectedId = useStore((state) => state.setSelectedId);
  const setSelectedIds = useStore((state) => state.setSelectedIds);
  const selectedWallIndex = useStore((state) => state.selectedWallIndex);
  
  const wallOpacity = activeLayer === 'room' ? 0.4 : (isDragging ? 0.2 : (isSelected ? 1 : 0.8));
  const floorOpacity = activeLayer === 'room' ? 0 : (isDragging ? 0.1 : 1);

  const wallSegments = useMemo(() => getWallSegments(room), [room]);

  const autoDimensions = useMemo(() => {
    if ((!showAutoDimensions && !isSelected) || room.points.length < 2) return null;
    
    const dimensions: React.ReactNode[] = [];
    const numPoints = room.points.length;

    for (const seg of wallSegments) {
      const dist = getDistance(seg.p1, seg.p2);
      
      if (dist < 10) continue; // Don't show for very small segments

      const midX = (seg.p1.x + seg.p2.x) / 2;
      const midY = (seg.p1.y + seg.p2.y) / 2;
      
      const normal = getOutwardNormal(room.points, seg.index);
      
      // Basic overlap avoidance: if segment is short, increase offset significantly
      let dynamicOffset = (wallThicknessPx + 24 / scale);
      if (dist < 120) {
        dynamicOffset += 14 / scale;
      }
      if (dist < 60) {
        dynamicOffset += 12 / scale;
      }

      const textX = midX + normal.x * dynamicOffset;
      const textY = midY + normal.y * dynamicOffset;

      const angle = Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x) * (180 / Math.PI);
      // Keep text upright
      const normalizedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;

      const labelText = `${(dist / pixelsPerCm).toFixed(1)} cm`;

      dimensions.push(
        <DimensionLabel
          key={`dim-label-${room.id}-${seg.index}`}
          x={textX}
          y={textY}
          text={labelText}
          rotation={normalizedAngle}
          scale={scale}
        />
      );
    }
    return dimensions;
  }, [room, showAutoDimensions, pixelsPerCm, scale, wallThicknessPx, isSelected, wallSegments]);

  return (
    <Group 
      id={room.id}
      onClick={(e) => {
        if (e.evt.button !== 0 || mode !== 'select' || activeLayer !== 'room') return;
        e.cancelBubble = true;
        
        // Check if we clicked on a wall specifically
        console.log('RoomItem Clicked, target name:', e.target.name(), 'activeLayer:', activeLayer);
        if (e.target.name() !== 'wall-attachment') {
          const stage = e.target.getStage();
          const pointer = stage?.getPointerPosition();
          if (pointer) {
            const worldPos = {
              x: (pointer.x - stage!.x()) / stage!.scaleX(),
              y: (pointer.y - stage!.y()) / stage!.scaleY()
            };
            
            let clickedWallIndex = -1;
            for (const seg of wallSegments) {
              const dist = getDistanceToSegment(worldPos, seg.p1, seg.p2).distance;
              if (dist < wallThicknessCm) {
                clickedWallIndex = seg.index;
                break;
              }
            }
            
            if (clickedWallIndex !== -1) {
              setSelectedWallIndex(clickedWallIndex);
              setSelectedRoomId(null);
              setSelectedId(null);
              setSelectedIds([]);
              return;
            }
          }
        }
        
        onSelect();
        setSelectedWallIndex(null);
      }} 
      onTap={(e) => {
        if (mode !== 'select') return;
        e.cancelBubble = true;
        onSelect();
        setSelectedWallIndex(null);
      }} 
      listening={!isLocked}
    >
      {/* 1. Walls Background (The dark structure) */}
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

        {/* Individual Wall Coloring */}
        {wallSegments.map((seg) => {
          const isWallSelected = isSelected && selectedWallIndex === seg.index;
          return (
            <Line
              key={`wall-color-${seg.index}`}
              points={[seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y]}
              stroke={isWallSelected ? "#4f46e5" : (room.wallColors?.[seg.index] || room.defaultWallColor || "#1e293b")}
              strokeWidth={wallThicknessPx * 2 - 2}
              opacity={wallOpacity}
              lineCap="butt"
              listening={false}
            />
          );
        })}

        {/* Selected Wall Highlight */}
        {isSelected && selectedWallIndex !== null && wallSegments[selectedWallIndex] && (
          <Line
            points={[
              wallSegments[selectedWallIndex].p1.x, 
              wallSegments[selectedWallIndex].p1.y, 
              wallSegments[selectedWallIndex].p2.x, 
              wallSegments[selectedWallIndex].p2.y
            ]}
            stroke="#818cf8"
            strokeWidth={wallThicknessPx * 2 + 4}
            opacity={0.3}
            listening={false}
          />
        )}
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
