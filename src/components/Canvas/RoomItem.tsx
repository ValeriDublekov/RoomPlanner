import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import useImage from 'use-image';
import { RoomObject, PlanSnapshot, WallGeometry } from '@/src/types';
import { useStore } from '@/src/store';
import { FLOOR_TEXTURES } from '@/src/constants';
import { getSignedArea, getWallSegments, getWallSegmentGeometry, derivePlanSnapshot } from '@/src/lib/geometry';
import { getRoomVertices } from '@/src/lib/geometry/topology';
import { DimensionLabel } from './DimensionLabel';

interface RoomItemProps {
  room: RoomObject;
  isSelected: boolean;
  onSelect: () => void;
  scale: number;
  isLocked: boolean;
  planSnapshot?: PlanSnapshot;
  renderMode?: 'floor' | 'walls' | 'all';
}

export const RoomItem: React.FC<RoomItemProps> = ({
  room,
  isSelected,
  onSelect,
  scale,
  isLocked,
  planSnapshot,
  renderMode = 'all',
}) => {
  React.useEffect(() => {
    console.log('RoomItem rendered for:', room.id, 'isSelected:', isSelected);
  }, [isSelected, room.id]);
  
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

  const points = getRoomVertices(room).flatMap((p) => [p.x, p.y]);

  const showAutoDimensions = useStore((state) => state.showAutoDimensions);
  const setSelectedWallIndex = useStore((state) => state.setSelectedWallIndex);
  const selectedWallIndex = useStore((state) => state.selectedWallIndex);
  const isReadOnly = useStore((state) => state.isReadOnly);
  
  // Updated wall rendering: use snapshot geometry if available,
  // otherwise compute it using the same derivation logic to ensure
  // consistent structure.
  const wallsToRender = useMemo(() => {
    let walls: WallGeometry[];
    if (planSnapshot) {
      walls = planSnapshot.walls.filter(w => w.roomId === room.id);
    } else {
      // Fallback: Compute from room using snapshot derivation
      const snapshot = derivePlanSnapshot([room], wallThicknessCm, pixelsPerCm);
      walls = snapshot.walls;
    }
    return walls.sort((a,b) => a.segmentIndex - b.segmentIndex);
  }, [planSnapshot, room, wallThicknessCm]);

  const wallOpacity = activeLayer === 'room' ? 0.8 : (isDragging ? 0.4 : (isSelected ? 1 : 0.9));
  const floorOpacity = activeLayer === 'room' ? 0 : (isDragging ? 0.1 : 1);

  // Simplified: autoDimensions can use roomWalls or fallback to manual.
  // The roomWalls variable needs to be updated to match the original structure, 
  // or I can adjust this.
  const roomWalls = useMemo(() => (planSnapshot ? planSnapshot.walls.filter(w => w.roomId === room.id) : null), [planSnapshot, room.id]);
  const wallSegments = useMemo(() => getWallSegments(room), [room]);

  const autoDimensions = useMemo(() => {
    const rawPoints = getRoomVertices(room);
    if ((!showAutoDimensions && !isSelected) || rawPoints.length < 2) return null;
    
    const dimensions: React.ReactNode[] = [];

    // Use snapshot geometry if available for more stable dimension placement
    if (roomWalls) {
        roomWalls.forEach(wall => {
            const { referenceSegment, normal, thickness } = wall;
            const p1 = referenceSegment.p1;
            const p2 = referenceSegment.p2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const centerX = (p1.x + p2.x) / 2;
            const centerY = (p1.y + p2.y) / 2;
            const angleRad = Math.atan2(dy, dx);

            if (dist < 10) return;

            let dynamicOffset = (thickness * pixelsPerCm / 2 + 24 / scale);
            if (dist < 120) dynamicOffset += 14 / scale;
            if (dist < 60) dynamicOffset += 12 / scale;

            const textX = centerX + normal.x * dynamicOffset;
            const textY = centerY + normal.y * dynamicOffset;

            const angle = angleRad * (180 / Math.PI);
            const normalizedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
            const labelText = `${(dist / pixelsPerCm).toFixed(1)} cm`;

            dimensions.push(
                <DimensionLabel
                    key={`dim-label-${room.id}-${wall.segmentIndex}`}
                    x={textX}
                    y={textY}
                    text={labelText}
                    rotation={normalizedAngle}
                    scale={scale}
                />
            );
        });
    } else {
        for (const seg of wallSegments) {
          const wallGeom = getWallSegmentGeometry(rawPoints, seg.index, wallThicknessPx);
          if (!wallGeom) continue;

          const { centerX: midX, centerY: midY, normal, length: dist, angle: angleRad } = wallGeom;
          
          if (dist < 10) continue; // Don't show for very small segments
          
          // Basic overlap avoidance: if segment is short, increase offset significantly
          let dynamicOffset = (wallThicknessPx / 2 + 24 / scale);
          if (dist < 120) {
            dynamicOffset += 14 / scale;
          }
          if (dist < 60) {
            dynamicOffset += 12 / scale;
          }

          const textX = midX + normal.x * dynamicOffset;
          const textY = midY + normal.y * dynamicOffset;

          const angle = angleRad * (180 / Math.PI);
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
    }
    return dimensions;
  }, [room, showAutoDimensions, pixelsPerCm, scale, wallThicknessPx, isSelected, wallSegments, roomWalls]);

  return (
    <Group 
      id={room.id}
      onClick={(e) => {
        if (isReadOnly) return;
        console.log('RoomItem Group onClick:', room.id, 'target name:', e.target.name(), 'activeLayer:', activeLayer, 'mode:', mode);
        // Remove strict target check to allow bubbling from floor area to select the room
        if (e.evt.button !== 0 || mode !== 'select' || activeLayer !== 'room') return;
        
        e.cancelBubble = true;
        onSelect();
        setSelectedWallIndex(null);
      }} 
      onTap={(e) => {
        if (isReadOnly) return;
        console.log('RoomItem Group onTap:', room.id);
        if (e.target !== e.currentTarget) return;
        if (mode !== 'select') return;
        e.cancelBubble = true;
        onSelect();
        setSelectedWallIndex(null);
      }} 
      listening={!isReadOnly}
    >
      {/* 1. Walls Background (The dark structure) */}
      {renderMode !== 'floor' && (
      <Group
        clipFunc={(ctx) => {
          if (!room.isClosed) return;
          
          ctx.beginPath();
          // Huge outer rectangle (Clockwise)
          ctx.rect(-100000, -100000, 200000, 200000);
          
          // Room interior (Counter-Clockwise relative to the rect to create a hole)
          const rawPoints = getRoomVertices(room);
          if (rawPoints.length > 0) {
            const isCW = getSignedArea(rawPoints) >= 0;
            if (isCW) {
              // Points are CW, so draw them in reverse to get CCW
              ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
              for (let i = rawPoints.length - 1; i >= 1; i--) {
                ctx.lineTo(rawPoints[i].x, rawPoints[i].y);
              }
            } else {
              // Points are already CCW
              ctx.moveTo(rawPoints[0].x, rawPoints[0].y);
              for (let i = 1; i < rawPoints.length; i++) {
                ctx.lineTo(rawPoints[i].x, rawPoints[i].y);
              }
            }
            ctx.closePath();
          }
        }}
      >
        {/* Individual Wall Rendering */}
        {wallsToRender.map((wall) => {
            const isWallSelected = isSelected && selectedWallIndex === wall.segmentIndex;
            
            // Check if this is a shared wall to potentially alter its stroke
            const otherRoomId = planSnapshot?.sharedWalls?.find(sw => sw.id === wall.sharedWallId)?.segments.find(s => s.roomId !== room.id)?.roomId;
            const isSecondaryShared = wall.sharedWallId && otherRoomId && room.id > otherRoomId;

            // If we hide secondary walls, miter corners with adjacent walls will be missing.
            // So we must render both to ensure corner joints are filled.

            let rawColor = room.wallColors?.[wall.segmentIndex] || room.materials?.wallBase?.value || room.defaultWallColor || "#1e293b";
            if (activeLayer === 'room') {
                rawColor = "#64748b"; // Darker color for architecture mode
            }
            const strokeColor = isWallSelected ? "#4f46e5" : rawColor;

            return (
                <Line
                    key={`wall-poly-${wall.id}`}
                    points={wall.wallBandPolygon.flatMap(p => [p.x, p.y])}
                    closed={true}
                    fill={strokeColor}
                    opacity={wallOpacity}
                    stroke={isWallSelected ? "#4f46e5" : "transparent"}
                    strokeWidth={isWallSelected ? 3.0 / scale : 0}
                    onMouseDown={(e) => {
                        if (isReadOnly || mode !== 'select' || activeLayer !== 'room') return;
                        e.cancelBubble = true;
                    }}
                    onClick={(e) => {
                        if (isReadOnly) return;
                        if (mode !== 'select' || activeLayer !== 'room') return;
                        e.cancelBubble = true;
                        onSelect();
                        setSelectedWallIndex(wall.segmentIndex);
                    }}
                    listening={!isReadOnly}
                />
            );
        })}

        {/* Selected Wall Highlight */}
        {isSelected && selectedWallIndex !== null && wallsToRender.find(w => w.segmentIndex === selectedWallIndex) && (
          <Line
            points={wallsToRender.find(w => w.segmentIndex === selectedWallIndex)!.wallBandPolygon.flatMap(p => [p.x, p.y])}
            stroke="#818cf8"
            fill="#818cf8"
            opacity={0.3}
            closed={true}
            listening={false}
          />
        )}
        
        {/* Draw outlines */}
        {wallsToRender.map(wall => {
            const isWallSelected = isSelected && selectedWallIndex === wall.segmentIndex;
            if (isWallSelected) return null; // Handled by standard render
            
            return (
                <React.Fragment key={`wall-lines-${wall.id}`}>
                    {!wall.sharedWallId && (
                      <Line
                          points={[wall.interiorFace.p1.x, wall.interiorFace.p1.y, wall.interiorFace.p2.x, wall.interiorFace.p2.y]}
                          stroke="#0f172a"
                          strokeWidth={1.5 / scale}
                          listening={false}
                      />
                    )}
                    <Line
                        points={[wall.exteriorFace.p1.x, wall.exteriorFace.p1.y, wall.exteriorFace.p2.x, wall.exteriorFace.p2.y]}
                        stroke="#0f172a"
                        strokeWidth={1.5 / scale}
                        listening={false}
                    />
                </React.Fragment>
            );
        })}
      </Group>
      )}

      {/* 2. Inner Room Area (The "Floor") - Only if closed */}
      {renderMode !== 'walls' && room.isClosed && (
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
            onMouseDown={(e) => {
              if (isReadOnly || mode !== 'select' || activeLayer !== 'room') return;
              e.cancelBubble = true;
            }}
            onClick={(e) => {
              if (isReadOnly) return;
              console.log('Room Floor clicked:', room.id, 'mode:', mode);
              if (mode !== 'select' || activeLayer !== 'room') return;
              e.cancelBubble = true;
              onSelect();
              setSelectedWallIndex(null);
            }}
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
      {!room.isClosed && getRoomVertices(room).length > 2 && (() => {
        const rawPoints = getRoomVertices(room);
        return (
          <Line
            points={[rawPoints[rawPoints.length - 1].x, rawPoints[rawPoints.length - 1].y, rawPoints[0].x, rawPoints[0].y]}
            stroke="#1e293b"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.3}
            listening={false}
          />
        );
      })()}

      {/* 3. Automatic Dimensions */}
      {autoDimensions}
    </Group>
  );
};
