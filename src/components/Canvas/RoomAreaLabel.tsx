import React, { useRef, useEffect, useMemo } from 'react';
import { Text } from 'react-konva';
import { RoomObject } from '../../types';
import { useStore } from '../../store';
import Konva from 'konva';
import { calculateArea } from '../../lib/geometry';

interface RoomAreaLabelProps {
  room: RoomObject;
  scale: number;
}

export const RoomAreaLabel: React.FC<RoomAreaLabelProps> = ({
  room,
  scale,
}) => {
  const pixelsPerCm = useStore((state) => state.pixelsPerCm);
  const activeLayer = useStore((state) => state.activeLayer);
  const textRef = useRef<Konva.Text>(null);

  const areaM2 = useMemo(() => {
    const areaPx2 = calculateArea(room.points);
    const areaCm2 = areaPx2 / (pixelsPerCm * pixelsPerCm);
    return areaCm2 / 10000;
  }, [room.points, pixelsPerCm]);

  const center = useMemo(() => {
    if (room.points.length === 0) return { x: 0, y: 0 };
    const xs = room.points.map(p => p.x);
    const ys = room.points.map(p => p.y);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }, [room.points]);

  const areaText = `${areaM2.toFixed(2)} m²`;

  useEffect(() => {
    if (textRef.current) {
      textRef.current.offsetX(textRef.current.width() / 2);
      textRef.current.offsetY(textRef.current.height() / 2);
    }
  }, [areaText, scale, activeLayer]);

  const isRoomSelected = useStore(state => state.selectedRoomId === room.id);
  const isDraggingWall = useStore(state => state.isDraggingWall);
  const isDraggingVertex = useStore(state => state.isDraggingVertex);

  if (activeLayer !== 'room') return null;
  if (isDraggingWall || isDraggingVertex) return null;

  return (
    <Text
      ref={textRef}
      text={areaText}
      x={center.x}
      y={center.y}
      fontSize={14 / scale}
      fill="#1e293b"
      fontStyle="bold"
      listening={false}
      shadowColor="white"
      shadowBlur={2}
      shadowOpacity={0.8}
      shadowOffset={{ x: 0, y: 0 }}
      opacity={isRoomSelected ? 0.3 : 1}
    />
  );
};
