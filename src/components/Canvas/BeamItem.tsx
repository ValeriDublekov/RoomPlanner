import React, { useState, useRef } from 'react';
import { Line, Group, Text } from 'react-konva';
import Konva from 'konva';
import { BeamObject, AppMode, Vector2d } from '@/src/types';
import { useStore } from '@/src/store';
import { getDistance, getDistanceToSegment } from '@/src/lib/geometry';

interface BeamItemProps {
  beam: BeamObject;
  isSelected: boolean;
  onSelect: () => void;
  scale: number;
  mode: AppMode;
}

export const BeamItem: React.FC<BeamItemProps> = ({
  beam,
  isSelected,
  onSelect,
  scale,
  mode,
}) => {
  const activeLayer = useStore((state) => state.activeLayer);
  const pixelsPerCm = useStore((state) => state.pixelsPerCm);
  const rooms = useStore((state) => state.rooms);
  const updateBeam = useStore((state) => state.updateBeam);
  const snapToObjects = useStore((state) => state.snapToObjects);
  
  const [dragDistances, setDragDistances] = useState<{ p1: Vector2d, p2: Vector2d, dist: number }[]>([]);
  const groupRef = useRef<Konva.Group>(null);

  const thicknessPx = (beam.width || 20) * pixelsPerCm;
  const alignment = beam.alignment || 'center';

  // Calculate visual offset and unit normal for constraint
  const dx = beam.p2.x - beam.p1.x;
  const dy = beam.p2.y - beam.p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const unitNormal = { x: -Math.sin(angle), y: Math.cos(angle) };
  
  let visualP1 = { ...beam.p1 };
  let visualP2 = { ...beam.p2 };

  if (len > 0.1) {
    let offset = 0;
    // Reverse logic: alignment 'left' should shift positive relative to unitNormal calculation or vice versa
    // Based on user feedback, it was probably shifting the wrong way
    if (alignment === 'left') offset = thicknessPx / 2;
    else if (alignment === 'right') offset = -thicknessPx / 2;

    visualP1 = { x: beam.p1.x + unitNormal.x * offset, y: beam.p1.y + unitNormal.y * offset };
    visualP2 = { x: beam.p2.x + unitNormal.x * offset, y: beam.p2.y + unitNormal.y * offset };
  }

  const dragBoundFunc = (pos: Vector2d) => {
    if (!isSelected || mode !== 'select' || !groupRef.current) return pos;
    const node = groupRef.current;
    const parent = node.getParent();
    if (!parent) return pos;

    // Get the absolute position of where the beam should be sitting (its anchor P1)
    const absStart = parent.getAbsoluteTransform().point(beam.p1);
    
    // Calculate movement in screen space relative to that anchor
    const dx = pos.x - absStart.x;
    const dy = pos.y - absStart.y;
    
    // Project onto the normal vector (which stays valid in screen space due to uniform scaling)
    const dot = dx * unitNormal.x + dy * unitNormal.y;
    
    return {
      x: absStart.x + dot * unitNormal.x,
      y: absStart.y + dot * unitNormal.y
    };
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSelected) return;
    
    const node = e.target;
    if (node !== groupRef.current) return;
    
    const parent = node.getParent();
    if (!parent) return;

    // Convert current node position (which is being constrained by dragBoundFunc)
    // back to world coordinates to calculate distances for snapping display
    const worldPos = parent.getAbsoluteTransform().copy().invert().point(node.getAbsolutePosition());
    
    const dx = worldPos.x - beam.p1.x;
    const dy = worldPos.y - beam.p1.y;

    const p1 = { x: beam.p1.x + dx, y: beam.p1.y + dy };
    const p2 = { x: beam.p2.x + dx, y: beam.p2.y + dy };
    const pm = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    const newDistances: { p1: Vector2d, p2: Vector2d, dist: number }[] = [];
    
    [p1, p2, pm].forEach(point => {
      let minWallDist = Infinity;
      let nearestPointOnWall = point;

      rooms.forEach(room => {
        for (let i = 0; i < room.points.length; i++) {
          const v1 = room.points[i];
          const v2 = room.points[(i + 1) % room.points.length];
          if (!room.isClosed && i === room.points.length - 1) continue;
          
          const result = getDistanceToSegment(point, v1, v2);
          if (result.distance < minWallDist) {
            minWallDist = result.distance;
            nearestPointOnWall = result.point;
          }
        }
      });

      if (minWallDist < 200) {
        newDistances.push({ p1: point, p2: nearestPointOnWall, dist: minWallDist });
      }
    });

    setDragDistances(newDistances);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (node !== groupRef.current) return;

    const parent = node.getParent();
    if (!parent) return;

    // Final world position from absolute position
    const worldPos = parent.getAbsoluteTransform().copy().invert().point(node.getAbsolutePosition());
    
    const dx = worldPos.x - beam.p1.x;
    const dy = worldPos.y - beam.p1.y;

    const newP1 = { x: beam.p1.x + dx, y: beam.p1.y + dy };
    const newP2 = { x: beam.p2.x + dx, y: beam.p2.y + dy };

    // Recalculate attachments
    const findAttachment = (point: Vector2d) => {
      const threshold = 15; // slightly larger for drag end snapping
      let best = null;
      let minDist = Infinity;
      rooms.forEach(room => {
        for (let i = 0; i < room.points.length; i++) {
          const v1 = room.points[i];
          const v2 = room.points[(i + 1) % room.points.length];
          if (!room.isClosed && i === room.points.length - 1) continue;
          const res = getDistanceToSegment(point, v1, v2);
          if (res.distance < threshold && res.distance < minDist) {
            minDist = res.distance;
            best = { roomId: room.id, wallIndex: i, t: res.t };
          }
        }
      });
      return best;
    };

    updateBeam(beam.id, {
      p1: newP1,
      p2: newP2,
      p1Attachment: findAttachment(newP1) || undefined,
      p2Attachment: findAttachment(newP2) || undefined
    });

    // Reset group relative position back to its world anchor
    node.position({ x: newP1.x, y: newP1.y });
    setDragDistances([]);
  };

  // Adjust display coordinates to be relative to beam.p1
  const relP1 = { x: visualP1.x - beam.p1.x, y: visualP1.y - beam.p1.y };
  const relP2 = { x: visualP2.x - beam.p1.x, y: visualP2.y - beam.p1.y };

  return (
    <React.Fragment>
      {isSelected && dragDistances.map((d, i) => (
        <Group key={`beam-dim-${beam.id}-${i}`}>
          <Line
            points={[d.p1.x, d.p1.y, d.p2.x, d.p2.y]}
            stroke="#6366f1"
            strokeWidth={1 / scale}
            dash={[4 / scale, 4 / scale]}
          />
          <Text
            text={`${(d.dist / pixelsPerCm).toFixed(1)} cm`}
            x={(d.p1.x + d.p2.x) / 2}
            y={(d.p1.y + d.p2.y) / 2}
            fontSize={10 / scale}
            fill="#4f46e5"
            fontStyle="bold"
            align="center"
          />
        </Group>
      ))}
      <Group 
        ref={groupRef}
        x={beam.p1.x}
        y={beam.p1.y}
        draggable={isSelected && mode === 'select'}
        dragBoundFunc={dragBoundFunc}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          console.log('Beam onClick triggered. id:', beam.id, 'mode:', mode, 'activeLayer:', activeLayer);
          // Only select beams when in select mode
          if (mode !== 'select' || activeLayer !== 'room') {
            console.log('Beam onClick ignored (not in select mode).');
            return;
          }
          console.log('Beam onClick passed, calling onSelect.');
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          console.log('Beam onTap triggered. id:', beam.id, 'mode:', mode, 'activeLayer:', activeLayer);
          // Only select beams when in select mode
          if (mode !== 'select' || activeLayer !== 'room') {
            console.log('Beam onTap ignored (not in select mode).');
            return;
          }
          console.log('Beam onTap passed, calling onSelect.');
          e.cancelBubble = true;
          onSelect();
        }}
      >
        <Line
          points={[relP1.x, relP1.y, relP2.x, relP2.y]}
          stroke={isSelected ? "#4f46e5" : beam.color}
          strokeWidth={thicknessPx}
          hitStrokeWidth={thicknessPx + 20}
          opacity={0.8}
          lineCap="butt"
        />
        {isSelected && (
          <Line
            points={[relP1.x, relP1.y, relP2.x, relP2.y]}
            stroke="#818cf8"
            strokeWidth={thicknessPx + 6 / scale}
            opacity={0.3}
            listening={false}
          />
        )}
      </Group>
    </React.Fragment>
  );
};
