import React, { useRef, useMemo, useState } from 'react';
import { Line, Group, Circle, Text, Rect } from 'react-konva';
import { RoomObject, Vector2d } from '../../types';
import { useStore } from '../../store';
import { getOutwardNormal } from '../../lib/geometry';

interface RoomEditorProps {
  room: RoomObject;
  scale: number;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  room,
  scale,
}) => {
  const wallThicknessCm = useStore((state) => state.wallThickness);
  const pixelsPerCm = useStore((state) => state.pixelsPerCm);
  const activeLayer = useStore((state) => state.activeLayer);
  const updateRoomPoint = useStore((state) => state.updateRoomPoint);
  const splitWallSegment = useStore((state) => state.splitWallSegment);
  const moveWallSegment = useStore((state) => state.moveWallSegment);
  const removeRoomVertex = useStore((state) => state.removeRoomVertex);
  const saveHistory = useStore((state) => state.saveHistory);
  
  const [dragDistances, setDragDistances] = useState<{p1: Vector2d, p2: Vector2d, dist: number}[]>([]);
  
  const wallThicknessPx = wallThicknessCm * pixelsPerCm;
  const dragStartMouseRef = useRef<Vector2d | null>(null);

  const wallSegments = useMemo(() => {
    const segments = [];
    const count = room.isClosed ? room.points.length : room.points.length - 1;
    for (let i = 0; i < count; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      segments.push({ p1, p2, index: i });
    }
    return segments;
  }, [room.points, room.isClosed]);

  if (activeLayer !== 'room' && activeLayer !== 'furniture') return null;

  return (
    <Group>
      {/* Wall Segment Handles for Parallel Moving */}
      {wallSegments.map((seg, idx) => {
        const midX = (seg.p1.x + seg.p2.x) / 2;
        const midY = (seg.p1.y + seg.p2.y) / 2;
        
        // Calculate outward normal for parallel dragging
        const normal = getOutwardNormal(room.points, idx);
        const nx = normal.x;
        const ny = normal.y;

        return (
          <Group key={`wall-editor-${idx}`}>
            {/* Invisible hit area for the wall */}
            <Line
              points={[seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y]}
              stroke="transparent"
              strokeWidth={wallThicknessPx * 2}
              hitStrokeWidth={wallThicknessPx * 4}
              draggable
              onDragStart={(e) => {
                saveHistory();
                const stage = e.target.getStage();
                dragStartMouseRef.current = stage?.getPointerPosition() || null;
                useStore.getState().setIsDraggingWall(true);
              }}
              onDragMove={(e) => {
                if (!dragStartMouseRef.current) return;
                const stage = e.target.getStage();
                const currentMouse = stage?.getPointerPosition();
                if (!currentMouse) return;

                const dx_mouse = (currentMouse.x - dragStartMouseRef.current.x) / scale;
                const dy_mouse = (currentMouse.y - dragStartMouseRef.current.y) / scale;
                
                // Project mouse movement onto normal
                const dot = dx_mouse * nx + dy_mouse * ny;
                const delta = { x: nx * dot, y: ny * dot };
                
                if (Math.abs(dot) > 0.01) {
                  moveWallSegment(room.id, idx, delta);
                  dragStartMouseRef.current = currentMouse;

                  // Calculate distances to opposite walls
                  const newDistances: {p1: Vector2d, p2: Vector2d, dist: number}[] = [];
                  const currentP1 = room.points[idx];
                  const currentP2 = room.points[(idx + 1) % room.points.length];
                  const mid = { x: (currentP1.x + currentP2.x) / 2, y: (currentP1.y + currentP2.y) / 2 };

                  wallSegments.forEach((other, oIdx) => {
                    if (oIdx === idx) return;
                    
                    const otherNormal = getOutwardNormal(room.points, oIdx);
                    const onx = otherNormal.x;
                    const ony = otherNormal.y;

                    // Check if parallel (dot product of normals is near 1 or -1)
                    const parallelDot = Math.abs(nx * onx + ny * ony);
                    if (parallelDot > 0.99) {
                      const odx = other.p2.x - other.p1.x;
                      const ody = other.p2.y - other.p1.y;
                      const olen = Math.sqrt(odx * odx + ody * ody);
                      if (olen === 0) return;

                      // Project mid point onto other wall line
                      const t = ((mid.x - other.p1.x) * odx + (mid.y - other.p1.y) * ody) / (olen * olen);
                      // Only show if projection is somewhat within the other segment
                      if (t >= -0.2 && t <= 1.2) {
                        const projection = {
                          x: other.p1.x + Math.max(0, Math.min(1, t)) * odx,
                          y: other.p1.y + Math.max(0, Math.min(1, t)) * ody
                        };
                        const d = Math.sqrt(Math.pow(mid.x - projection.x, 2) + Math.pow(mid.y - projection.y, 2));
                        if (d > 5) { // Only show if not overlapping
                          newDistances.push({ p1: mid, p2: projection, dist: d });
                        }
                      }
                    }
                  });
                  setDragDistances(newDistances);
                }
                
                // Reset node position so it doesn't actually move
                e.target.position({ x: 0, y: 0 });
              }}
              onDragEnd={() => {
                setDragDistances([]);
                useStore.getState().setIsDraggingWall(false);
              }}
            />

            {/* Split Handle (Plus icon in the middle) */}
            <Circle
              x={midX}
              y={midY}
              radius={6 / scale}
              fill="white"
              stroke="#4f46e5"
              strokeWidth={1 / scale}
              opacity={0.8}
              onClick={(e) => {
                e.cancelBubble = true;
                saveHistory();
                splitWallSegment(room.id, idx, { x: midX, y: midY });
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'copy';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
          </Group>
        );
      })}

      {/* Vertex Handles for Corner Moving */}
      {room.points.map((p, idx) => (
        <Circle
          key={`vertex-editor-${idx}`}
          x={p.x}
          y={p.y}
          radius={8 / scale}
          fill="#4f46e5"
          stroke="white"
          strokeWidth={2 / scale}
          draggable
          onDragStart={(e) => {
            saveHistory();
            const stage = e.target.getStage();
            dragStartMouseRef.current = stage?.getPointerPosition() || null;
            useStore.getState().setIsDraggingVertex(true);
          }}
          onDragMove={(e) => {
            if (!dragStartMouseRef.current) return;
            const stage = e.target.getStage();
            const currentMouse = stage?.getPointerPosition();
            if (!currentMouse) return;

            const dx = (currentMouse.x - dragStartMouseRef.current.x) / scale;
            const dy = (currentMouse.y - dragStartMouseRef.current.y) / scale;

            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
              updateRoomPoint(room.id, idx, { x: p.x + dx, y: p.y + dy });
              dragStartMouseRef.current = currentMouse;
            }
            
            e.target.position({ x: 0, y: 0 });
          }}
          onDragEnd={() => {
            setDragDistances([]);
            useStore.getState().setIsDraggingVertex(false);
          }}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            if (room.points.length > 2) {
              saveHistory();
              removeRoomVertex(room.id, idx);
            }
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'move';
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
          }}
        />
      ))}

      {/* Temporary Drag Distances */}
      {dragDistances.map((d, i) => {
        const angle = Math.atan2(d.p2.y - d.p1.y, d.p2.x - d.p1.x);
        let labelAngle = angle * (180 / Math.PI);
        
        // Normalize angle to keep text upright
        if (labelAngle > 90) labelAngle -= 180;
        if (labelAngle < -90) labelAngle += 180;

        const labelX = (d.p1.x + d.p2.x) / 2;
        const labelY = (d.p1.y + d.p2.y) / 2;
        
        return (
          <Group key={`drag-dist-editor-${i}`}>
            <Line
              points={[d.p1.x, d.p1.y, d.p2.x, d.p2.y]}
              stroke="#6366f1"
              strokeWidth={2 / scale}
              dash={[4 / scale, 4 / scale]}
            />
            <Group 
              x={labelX} 
              y={labelY}
              rotation={labelAngle}
            >
              <Rect
                x={-25 / scale}
                y={-10 / scale}
                width={50 / scale}
                height={20 / scale}
                fill="white"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                cornerRadius={4 / scale}
              />
              <Text
                text={`${(d.dist / pixelsPerCm).toFixed(1)} cm`}
                fontSize={12 / scale}
                fill="#4f46e5"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                width={50 / scale}
                height={20 / scale}
                x={-25 / scale}
                y={-10 / scale}
              />
            </Group>
          </Group>
        );
      })}
    </Group>
  );
};
