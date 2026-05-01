import React from 'react';
import { Rect, Line as KonvaLine, Ellipse, Path, Group, Text } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject, MaterialSlot } from '../../types';

interface FurnitureRendererProps {
  shape: FurnitureObject;
  isSelected: boolean;
  isColliding: boolean;
  scale: number;
  pixelsPerCm: number;
}

const getSlotColor = (slot: MaterialSlot | undefined, fallback: string) => {
  return slot?.value || fallback;
};

export const FurnitureRenderer: React.FC<FurnitureRendererProps> = ({
  shape,
  isSelected,
  isColliding,
  scale,
  pixelsPerCm,
}) => {
  const isGroup = shape.type === 'group';
  const m = shape.materials || {};

  // Base colors for various types
  const woodBaseColor = getSlotColor(m.woodBase, shape.color || "#f8fafc");
  const woodFrontColor = getSlotColor(m.woodFront, shape.secondaryColor || woodBaseColor);
  const textileMainColor = getSlotColor(m.textileMain, shape.secondaryColor || "#f8fafc");
  const textileAccentColor = getSlotColor(m.textileAccent, "#ffffff");

  if (isGroup) {
    return (
      <Group>
        {shape.children?.map((child) => (
          <Group
            key={child.id}
            x={child.x + child.width / 2}
            y={child.y + child.height / 2}
            width={child.width}
            height={child.height}
            offsetX={child.width / 2}
            offsetY={child.height / 2}
            rotation={child.rotation}
          >
            <FurnitureRenderer
              shape={child}
              isSelected={false}
              isColliding={false}
              scale={scale}
              pixelsPerCm={pixelsPerCm}
            />
          </Group>
        ))}
        <Rect
          width={shape.width}
          height={shape.height}
          fill="rgba(0,0,0,0)"
          stroke={isSelected ? "#4f46e5" : "transparent"}
          strokeWidth={1 / scale}
          dash={[5 / scale, 5 / scale]}
          listening={true}
        />
      </Group>
    );
  }

  // Determine main "visible" color for the basic Rect
  let mainFill = woodBaseColor;
  if (shape.furnitureType === 'bed') mainFill = textileMainColor;
  if (isColliding) mainFill = "rgba(239, 68, 68, 0.1)";
  if (shape.svgPath) mainFill = "rgba(0,0,0,0.001)";

  return (
    <>
      <Rect
        width={shape.width}
        height={shape.height}
        fill={mainFill}
        stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : (
          (shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser')
            ? woodBaseColor
            : "#cbd5e1"
        ))}
        strokeWidth={(shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser') ? 4 / scale : 2 / scale}
        cornerRadius={4 / scale}
        shadowBlur={isSelected ? 10 / scale : 0}
        shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
        shadowOpacity={0.2}
        opacity={shape.svgPath ? 0.2 : 1}
        listening={true}
      />

      {shape.svgPath && (() => {
        const tempPath = new Konva.Path({ data: shape.svgPath });
        const pathRect = tempPath.getSelfRect();
        const sX = shape.width / (pathRect.width || 100);
        const sY = shape.height / (pathRect.height || 100);
        
        const isTwoColor = shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser';
        
        let fillColor = woodBaseColor;
        if (shape.furnitureType === 'bed') fillColor = textileMainColor;
        else if (isTwoColor) fillColor = woodFrontColor;

        const strokeColor = isTwoColor ? woodBaseColor : (isSelected ? "#4f46e5" : "#64748b");

        return (
          <Path
            data={shape.svgPath}
            fill={isColliding ? "rgba(239, 68, 68, 0.2)" : fillColor}
            stroke={isColliding ? "#ef4444" : strokeColor}
            strokeWidth={(isTwoColor ? 2 : 1.5) / (scale * sX)}
            scaleX={sX}
            scaleY={sY}
            x={-pathRect.x * sX}
            y={-pathRect.y * sY}
          />
        );
      })()}

      {/* Bed Detail */}
      {!shape.svgPath && shape.furnitureType === 'bed' && (() => {
        const tiltDeg = shape.headboardTilt || 15;
        const hbH = shape.headboardHeight || 60;
        const tiltRad = (tiltDeg * Math.PI) / 180;
        const hbThickness = 8;
        const hbProjection = shape.hasHeadboard ? Math.sin(tiltRad) * hbH : 0;
        const hbTotalDepthCm = shape.hasHeadboard ? (hbThickness + hbProjection) : 0;
        const hbTotalDepth = hbTotalDepthCm * pixelsPerCm;
        const frameThickness = 3 * pixelsPerCm;
        const mattressInset = 2 * pixelsPerCm;

        return (
          <Group>
            {/* Headboard Area (at the top) */}
            {shape.hasHeadboard && (
              <>
                {/* Slanted part projection */}
                <Rect
                  width={shape.width}
                  height={hbProjection * pixelsPerCm}
                  fill={woodBaseColor}
                  opacity={0.3}
                />
                {/* Main thick part */}
                <Rect
                  y={hbProjection * pixelsPerCm}
                  width={shape.width}
                  height={hbThickness * pixelsPerCm}
                  fill={woodBaseColor}
                />
              </>
            )}
            
            {/* Mattress Area */}
            <Rect
              x={mattressInset}
              y={hbTotalDepth + mattressInset}
              width={shape.width - mattressInset * 2}
              height={shape.height - hbTotalDepth - mattressInset * 2 - (3 * pixelsPerCm)} // minus footboard
              fill={textileMainColor}
              stroke="#cbd5e1"
              strokeWidth={1 / scale}
              cornerRadius={2 / scale}
            />

            {/* Pillows */}
            <Group y={hbTotalDepth + 5 * pixelsPerCm}>
              <Rect
                x={shape.width * 0.15}
                width={shape.width * 0.3}
                height={shape.height * 0.1}
                fill={textileAccentColor}
                stroke="#e2e8f0"
                strokeWidth={1 / scale}
                cornerRadius={2 / scale}
              />
              <Rect
                x={shape.width * 0.55}
                width={shape.width * 0.3}
                height={shape.height * 0.1}
                fill={textileAccentColor}
                stroke="#e2e8f0"
                strokeWidth={1 / scale}
                cornerRadius={2 / scale}
              />
            </Group>
          </Group>
        );
      })()}

      {!shape.svgPath && shape.type === 'circle' && (
        <Ellipse
          x={shape.width / 2}
          y={shape.height / 2}
          radiusX={shape.width / 2}
          radiusY={shape.height / 2}
          fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (shape.color || "#f8fafc")}
          stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#cbd5e1")}
          strokeWidth={2 / scale}
          shadowBlur={isSelected ? 10 / scale : 0}
          shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
          shadowOpacity={0.2}
        />
      )}

      {!shape.svgPath && shape.type === 'polygon' && (
        <KonvaLine
          points={shape.points?.flatMap((p) => [p.x, p.y]) || []}
          closed={true}
          fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (shape.color || "#f8fafc")}
          stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#cbd5e1")}
          strokeWidth={2 / scale}
          shadowBlur={isSelected ? 10 / scale : 0}
          shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
          shadowOpacity={0.2}
        />
      )}

      {/* Dimensions Text */}
      {(shape.showLabel || isSelected) && (() => {
        const normRot = (shape.rotation % 360 + 360) % 360;
        let textRotation = 0;
        if (normRot > 90 && normRot <= 270) {
          textRotation = 180;
        }

        const labelText = `${shape.name}\n${(shape.width / pixelsPerCm).toFixed(0)} x ${(shape.height / pixelsPerCm).toFixed(0)} cm`;
        const fontSize = 10 / scale;
        const padding = 4 / scale;
        
        // Approximate dimensions
        const lines = labelText.split('\n');
        const maxChars = Math.max(...lines.map(l => l.length));
        const approxWidth = (maxChars * 6 + padding * 2) / scale;
        const approxHeight = (lines.length * fontSize * 1.2 + padding * 2);

        return (
          <Group x={shape.width / 2} y={shape.height / 2} rotation={textRotation}>
            <Rect
              x={-approxWidth / 2}
              y={-approxHeight / 2}
              width={approxWidth}
              height={approxHeight}
              fill="white"
              opacity={0.8}
              cornerRadius={4 / scale}
              listening={false}
            />
            <Text
              text={labelText}
              x={-approxWidth / 2}
              y={-approxHeight / 2}
              width={approxWidth}
              height={approxHeight}
              align="center"
              verticalAlign="middle"
              fontSize={fontSize}
              fill={isSelected ? "#4f46e5" : "#64748b"}
              fontStyle="bold"
              listening={false}
            />
          </Group>
        );
      })()}

      {/* Face Indicator */}
      {(shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser' || shape.furnitureType === 'desk' || shape.furnitureType === 'bed') && (
        <Group>
          <KonvaLine
            points={[5 / scale, shape.height - 2 / scale, shape.width - 5 / scale, shape.height - 2 / scale]}
            stroke="#4f46e5"
            strokeWidth={3 / scale}
            opacity={0.6}
          />
          {shape.furnitureType === 'wardrobe' && (
            <KonvaLine
              points={[shape.width / 2, shape.height - 8 / scale, shape.width / 2, shape.height]}
              stroke="#4f46e5"
              strokeWidth={1 / scale}
              opacity={0.4}
            />
          )}
        </Group>
      )}

      {/* Shelf Dividers */}
      {shape.furnitureType === 'shelf' && !shape.svgPath && (
        <Group>
          {(() => {
            const widthCm = shape.width / pixelsPerCm;
            const numDividers = Math.floor(widthCm / 30);
            const dividers = [];
            if (numDividers > 0) {
              const spacing = shape.width / (numDividers + 1);
              for (let i = 1; i <= numDividers; i++) {
                dividers.push(
                  <KonvaLine
                    key={i}
                    points={[i * spacing, 0, i * spacing, shape.height]}
                    stroke="#cbd5e1"
                    strokeWidth={1 / scale}
                  />
                );
              }
            }
            return dividers;
          })()}
        </Group>
      )}
    </>
  );
};
