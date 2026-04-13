import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import useImage from 'use-image';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
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
  
  const wallThicknessPx = wallThicknessCm * pixelsPerCm;
  
  const textureData = useMemo(() => FLOOR_TEXTURES.find(t => t.id === room.floorTexture), [room.floorTexture]);
  const [textureImage] = useImage(textureData?.url || '');

  const textureScale = useMemo(() => {
    return { x: pixelsPerCm, y: pixelsPerCm };
  }, [pixelsPerCm]);

  const points = room.points.flatMap((p) => [p.x, p.y]);

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
      {/* 1. Inner Room Area (The "Floor") - Only if closed */}
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
          />
          {isSelected && (
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

      {/* 2. Walls */}
      <Line
        points={points}
        closed={room.isClosed}
        stroke="#1e293b"
        strokeWidth={wallThicknessPx}
        lineJoin="miter"
        lineCap="round"
        opacity={isSelected ? 1 : 0.8}
      />

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
