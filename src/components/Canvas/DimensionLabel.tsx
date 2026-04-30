import React from 'react';
import { Group, Rect, Text } from 'react-konva';

interface DimensionLabelProps {
  x: number;
  y: number;
  text: string;
  rotation: number;
  scale: number;
  color?: string;
  stroke?: string;
}

export const DimensionLabel: React.FC<DimensionLabelProps> = ({
  x,
  y,
  text,
  rotation,
  scale,
  color = '#334155',
  stroke = '#94a3b8'
}) => {
  const fontSize = 11 / scale;
  const padding = 5 / scale;
  
  // Approximate text width
  const approxWidth = (text.length * 7.5 + padding * 2) / scale;
  const approxHeight = (fontSize + padding * 2);

  return (
    <Group x={x} y={y} rotation={rotation}>
      <Rect
        x={-approxWidth / 2}
        y={-approxHeight / 2}
        width={approxWidth}
        height={approxHeight}
        fill="white"
        opacity={0.9}
        cornerRadius={4 / scale}
        stroke={stroke}
        strokeWidth={1 / scale}
        listening={false}
        shadowBlur={4 / scale}
        shadowColor="black"
        shadowOpacity={0.1}
        shadowOffset={{ x: 1 / scale, y: 1 / scale }}
      />
      <Text
        text={text}
        x={-approxWidth / 2}
        y={-approxHeight / 2}
        width={approxWidth}
        height={approxHeight}
        fontSize={fontSize}
        fill={color}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};
