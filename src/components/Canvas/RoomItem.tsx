import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Line, Group } from 'react-konva';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import Konva from 'konva';
import { FLOOR_TEXTURES } from '../../constants';

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
  const setSelectedWallIndex = useStore((state) => state.setSelectedWallIndex);
  const selectedWallIndex = useStore((state) => state.selectedWallIndex);
  const wallThicknessPx = wallThicknessCm * pixelsPerCm;
  const groupRef = useRef<Konva.Group>(null);
  const [textureImage, setTextureImage] = useState<HTMLImageElement | null>(null);

  const points = room.points.flatMap((p) => [p.x, p.y]);

  useEffect(() => {
    if (room.floorTexture && room.floorTexture !== 'none') {
      const tex = FLOOR_TEXTURES.find(t => t.id === room.floorTexture);
      if (tex && tex.url) {
        const img = new window.Image();
        img.src = tex.url;
        img.onload = () => setTextureImage(img);
      } else {
        setTextureImage(null);
      }
    } else {
      setTextureImage(null);
    }
  }, [room.floorTexture]);

  // Cache the group to make globalCompositeOperation work correctly within the group's local context
  useEffect(() => {
    const group = groupRef.current;
    if (group) {
      group.clearCache();
      group.cache();
    }
  }, [points, wallThicknessPx, isSelected, scale]);

  const wallSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < room.points.length; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      segments.push([p1.x, p1.y, p2.x, p2.y]);
    }
    return segments;
  }, [room.points]);

  return (
    <Group 
      onClick={onSelect} 
      onTap={onSelect} 
      listening={!isLocked}
    >
      {/* 1. Inner Room Area (The "Floor") - Draw first */}
      <Line
        points={points}
        closed={true}
        fill={isSelected ? "#818cf8" : (room.floorColor || "#f1f5f9")}
        fillPatternImage={textureImage || undefined}
        fillPatternRepeat="repeat"
        fillPatternScale={{ x: 0.5, y: 0.5 }}
        opacity={isSelected ? 0.4 : 1}
        lineJoin="miter"
      />

      {/* 
        2. Wall Group: 
        Drawn after floor so it covers the floor edges if there's any overlap.
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

      {/* 3. Wall Selection Overlays (Invisible but clickable) */}
      {isSelected && wallSegments.map((seg, idx) => (
        <Line
          key={idx}
          points={seg}
          stroke={selectedWallIndex === idx ? "#4f46e5" : "transparent"}
          strokeWidth={wallThicknessPx}
          hitStrokeWidth={wallThicknessPx * 2}
          onClick={(e) => {
            e.cancelBubble = true;
            setSelectedWallIndex(idx);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            setSelectedWallIndex(idx);
          }}
        />
      ))}
    </Group>
  );
};
