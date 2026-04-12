import React from 'react';
import { Line, Text, Group } from 'react-konva';
import { DimensionObject, Vector2d } from '../../types';
import { getDistance } from '../../lib/geometry';

interface DimensionItemProps {
  dimension: DimensionObject;
  pixelsPerCm: number;
  scale: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const DimensionItem: React.FC<DimensionItemProps> = ({ 
  dimension, 
  pixelsPerCm, 
  scale,
  isSelected,
  onSelect
}) => {
  const { p1, p2 } = dimension;
  const dist = getDistance(p1, p2);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  
  // Perpendicular angle for tick marks
  const perpAngle = angle + Math.PI / 2;
  const tickSize = 10 / scale;
  
  const t1Start = {
    x: p1.x - Math.cos(perpAngle) * tickSize / 2,
    y: p1.y - Math.sin(perpAngle) * tickSize / 2,
  };
  const t1End = {
    x: p1.x + Math.cos(perpAngle) * tickSize / 2,
    y: p1.y + Math.sin(perpAngle) * tickSize / 2,
  };
  
  const t2Start = {
    x: p2.x - Math.cos(perpAngle) * tickSize / 2,
    y: p2.y - Math.sin(perpAngle) * tickSize / 2,
  };
  const t2End = {
    x: p2.x + Math.cos(perpAngle) * tickSize / 2,
    y: p2.y + Math.sin(perpAngle) * tickSize / 2,
  };

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  
  // Ensure text is always upright
  let textRotation = angle * (180 / Math.PI);
  let textOffsetY = 15 / scale;
  
  if (textRotation > 90 || textRotation < -90) {
    textRotation += 180;
    textOffsetY = -5 / scale; // Flip offset when text is flipped
  }

  const color = isSelected ? "#6366f1" : "#64748b";
  const textColor = isSelected ? "#4f46e5" : "#475569";

  return (
    <Group 
      id={dimension.id}
      onClick={(e) => {
        if (e.evt.button !== 0) return;
        if (onSelect) {
          e.cancelBubble = true;
          onSelect();
        }
      }}
    >
      {/* Hit area for easier selection */}
      <Line
        points={[p1.x, p1.y, p2.x, p2.y]}
        stroke="transparent"
        strokeWidth={20 / scale}
      />

      {/* Main line */}
      <Line
        points={[p1.x, p1.y, p2.x, p2.y]}
        stroke={color}
        strokeWidth={(isSelected ? 2 : 1) / scale}
      />
      
      {/* Tick marks */}
      <Line
        points={[t1Start.x, t1Start.y, t1End.x, t1End.y]}
        stroke={color}
        strokeWidth={(isSelected ? 2 : 1) / scale}
      />
      <Line
        points={[t2Start.x, t2Start.y, t2End.x, t2End.y]}
        stroke={color}
        strokeWidth={(isSelected ? 2 : 1) / scale}
      />
      
      {/* Measurement text */}
      <Text
        text={`${(dist / pixelsPerCm).toFixed(1)} cm`}
        x={midX}
        y={midY}
        fontSize={12 / scale}
        fill={textColor}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        rotation={textRotation}
        offsetX={0}
        offsetY={textOffsetY}
      />
    </Group>
  );
};
