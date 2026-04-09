import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import { Vector2d, AppMode } from '../../types';
import { getDistance, formatDistance } from '../../lib/geometry';

interface DrawingLayerProps {
  mode: AppMode;
  roomPoints: Vector2d[];
  snappedMouse: Vector2d;
  mousePos: Vector2d;
  calibrationPoints: Vector2d[] | null;
  scale: number;
  pixelsPerCm: number;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  mode,
  roomPoints,
  snappedMouse,
  mousePos,
  calibrationPoints,
  scale,
  pixelsPerCm,
}) => {
  const isDrawing = (mode === 'draw-room' || mode === 'draw-furniture') && roomPoints.length > 0;
  const isCalibrating = mode === 'calibrate' && calibrationPoints && calibrationPoints.length === 1;

  return (
    <Group>
      {/* Current Drawing (Room or Furniture) */}
      {isDrawing && (
        <Group>
          <Line
            points={[...roomPoints.flatMap((p) => [p.x, p.y]), snappedMouse.x, snappedMouse.y]}
            stroke="#6366f1"
            strokeWidth={2 / scale}
            lineJoin="round"
            lineCap="round"
          />
          {roomPoints.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={i === 0 ? 6 / scale : 3 / scale}
              fill="#4f46e5"
              stroke={i === 0 ? "white" : "none"}
              strokeWidth={i === 0 ? 2 / scale : 0}
            />
          ))}
          {/* Live Distance Label */}
          <Text
            x={snappedMouse.x + 10 / scale}
            y={snappedMouse.y + 10 / scale}
            text={formatDistance(
              getDistance(snappedMouse, roomPoints[roomPoints.length - 1]),
              pixelsPerCm
            )}
            fontSize={12 / scale}
            fill="#4f46e5"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* Calibration Preview */}
      {isCalibrating && (
        <Group>
          <Line
            points={[calibrationPoints![0].x, calibrationPoints![0].y, mousePos.x, mousePos.y]}
            stroke="#6366f1"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
          />
          <Circle x={calibrationPoints![0].x} y={calibrationPoints![0].y} radius={4 / scale} fill="#6366f1" />
        </Group>
      )}
    </Group>
  );
};
