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
  const activeLayer = useStore((state) => state.activeLayer);
  const setSelectedWallIndex = useStore((state) => state.setSelectedWallIndex);
  const selectedWallIndex = useStore((state) => state.selectedWallIndex);
  const wallThicknessPx = wallThicknessCm * pixelsPerCm;
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
        2. Walls: 
        Drawn after floor so they cover the floor edges.
        Centered on the points to match 3D logic.
      */}
      <Line
        points={points}
        closed={true}
        stroke="#1e293b" // Slate 800 (Structural Wall Color)
        strokeWidth={wallThicknessPx}
        lineJoin="miter"
        lineCap="butt"
        opacity={isSelected ? 1 : 0.8}
      />

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
