import React from 'react';
import { Line } from 'react-konva';
import { RoomObject } from '../../types';

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
  return (
    <Line
      points={room.points.flatMap((p) => [p.x, p.y])}
      closed={true}
      fill={isSelected ? "#818cf8" : "#f1f5f9"}
      opacity={isSelected ? 0.3 : 0.5}
      stroke={isSelected ? "#4f46e5" : "#94a3b8"}
      strokeWidth={isSelected ? 3 / scale : 2 / scale}
      onClick={onSelect}
      onTap={onSelect}
      listening={!isLocked}
    />
  );
};
