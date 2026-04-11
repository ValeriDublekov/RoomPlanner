import React, { useRef, useEffect } from 'react';
import { Line, Group } from 'react-konva';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import Konva from 'konva';

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
  const groupRef = useRef<Konva.Group>(null);

  const points = room.points.flatMap((p) => [p.x, p.y]);

  // Cache the group to make globalCompositeOperation work correctly within the group's local context
  useEffect(() => {
    const group = groupRef.current;
    if (group) {
      // Clear cache first to allow re-caching with new dimensions/points
      group.clearCache();
      group.cache();
    }
  }, [points, wallThicknessPx, isSelected, scale]);

  return (
    <Group 
      onClick={onSelect} 
      onTap={onSelect} 
      listening={!isLocked}
    >
      {/* 
        Wall Group: 
        We draw a thick centered stroke, then "cut out" the inner part 
        using destination-out. This ensures the wall only exists OUTSIDE 
         the drawn points.
      */}
      <Group ref={groupRef}>
        {/* The Wall Stroke */}
        <Line
          points={points}
          closed={true}
          stroke="#1e293b" // Slate 800 (Structural Wall Color)
          strokeWidth={wallThicknessPx * 2}
          lineJoin="miter"
          lineCap="butt"
          opacity={isSelected ? 1 : 0.8}
        />
        
        {/* The "Cutter" - Erases the inner half of the stroke */}
        <Line
          points={points}
          closed={true}
          fill="black"
          globalCompositeOperation="destination-out"
        />
      </Group>

      {/* Inner Room Area (The "Floor") */}
      <Line
        points={points}
        closed={true}
        fill={isSelected ? "#818cf8" : "#f1f5f9"}
        opacity={isSelected ? 0.4 : 0.7}
        stroke={isSelected ? "#4f46e5" : "#94a3b8"}
        strokeWidth={1 / scale}
        lineJoin="miter"
      />
    </Group>
  );
};
