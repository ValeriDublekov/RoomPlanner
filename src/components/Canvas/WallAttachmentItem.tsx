import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Arc, Transformer, Text, Line } from 'react-konva';
import { WallAttachment, Vector2d } from '../../types';
import { useStore } from '../../store';
import { getDistance, formatDistance } from '../../lib/geometry';
import Konva from 'konva';

interface WallAttachmentItemProps {
  attachment: WallAttachment;
  isSelected: boolean;
  onSelect: () => void;
  scale: number;
}

export const WallAttachmentItem: React.FC<WallAttachmentItemProps> = ({
  attachment,
  isSelected,
  onSelect,
  scale,
}) => {
  const { rooms, wallThickness, pixelsPerCm, updateWallAttachment, saveHistory } = useStore();
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [distances, setDistances] = useState<{ left: number | null, right: number | null }>({ left: null, right: null });

  const room = rooms.find(r => r.id === attachment.roomId);
  if (!room) return null;

  const p1 = room.points[attachment.wallSegmentIndex];
  const p2 = room.points[(attachment.wallSegmentIndex + 1) % room.points.length];
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Exact projection point on the wall line
  const x = p1.x + dx * attachment.positionAlongWall;
  const y = p1.y + dy * attachment.positionAlongWall;

  const widthPx = attachment.width * pixelsPerCm;
  const thicknessPx = wallThickness * pixelsPerCm;

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle keyboard shortcuts for flipping
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        if (attachment.type === 'door') {
          // Cycle through flip states
          if (!attachment.flipX && !attachment.flipY) {
            updateWallAttachment(attachment.id, { flipX: true });
          } else if (attachment.flipX && !attachment.flipY) {
            updateWallAttachment(attachment.id, { flipY: true });
          } else if (attachment.flipX && attachment.flipY) {
            updateWallAttachment(attachment.id, { flipX: false });
          } else {
            updateWallAttachment(attachment.id, { flipX: false, flipY: false });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, attachment.id, attachment.type, attachment.flipX, attachment.flipY, updateWallAttachment]);

  const handleTransform = () => {
    const node = groupRef.current;
    if (!node) return;

    const newWidth = (node.width() * node.scaleX()) / pixelsPerCm;
    
    node.setAttrs({
      scaleX: 1,
      scaleY: 1,
    });

    updateWallAttachment(attachment.id, { width: Math.max(10, newWidth) });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert absolute pointer to relative
    const relPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY()
    };

    // Project onto wall segment
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;
    let t = ((relPos.x - p1.x) * dx + (relPos.y - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    // Calculate distances to corners
    const distToP1 = t * length;
    const distToP2 = (1 - t) * length;

    // Check if adjacent walls are perpendicular
    const prevIdx = (attachment.wallSegmentIndex - 1 + room.points.length) % room.points.length;
    const nextIdx = (attachment.wallSegmentIndex + 1) % room.points.length;
    
    const prevP = room.points[prevIdx];
    const nextP = room.points[(nextIdx + 1) % room.points.length];

    const prevAngle = Math.atan2(p1.y - prevP.y, p1.x - prevP.x) * (180 / Math.PI);
    const nextAngle = Math.atan2(nextP.y - p2.y, nextP.x - p2.x) * (180 / Math.PI);

    const isPrevPerp = Math.abs((prevAngle - angle + 360) % 180 - 90) < 5;
    const isNextPerp = Math.abs((nextAngle - angle + 360) % 180 - 90) < 5;

    setDistances({
      left: isPrevPerp ? distToP1 / pixelsPerCm : null,
      right: isNextPerp ? distToP2 / pixelsPerCm : null
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const relPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY()
    };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;
    let t = ((relPos.x - p1.x) * dx + (relPos.y - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    updateWallAttachment(attachment.id, { positionAlongWall: t });
  };

  return (
    <Group>
      {/* Distance Labels during dragging */}
      {isDragging && (
        <Group>
          {/* Line to P1 */}
          {distances.left !== null && (
            <>
              <Line
                points={[p1.x, p1.y, x, y]}
                stroke="#f43f5e"
                strokeWidth={3 / scale}
                dash={[4 / scale, 4 / scale]}
              />
              <Group
                x={(p1.x + x) / 2}
                y={(p1.y + y) / 2}
                rotation={angle}
              >
                <Rect
                  x={-20 / scale}
                  y={-25 / scale}
                  width={40 / scale}
                  height={16 / scale}
                  fill="white"
                  stroke="#f43f5e"
                  strokeWidth={1 / scale}
                  cornerRadius={4 / scale}
                />
                <Text
                  x={-20 / scale}
                  y={-22 / scale}
                  width={40 / scale}
                  text={formatDistance(distances.left, 1)}
                  fontSize={12 / scale}
                  fontStyle="bold"
                  fill="#f43f5e"
                  align="center"
                />
              </Group>
            </>
          )}

          {/* Line to P2 */}
          {distances.right !== null && (
            <>
              <Line
                points={[x, y, p2.x, p2.y]}
                stroke="#f43f5e"
                strokeWidth={3 / scale}
                dash={[4 / scale, 4 / scale]}
              />
              <Group
                x={(p2.x + x) / 2}
                y={(p2.y + y) / 2}
                rotation={angle}
              >
                <Rect
                  x={-20 / scale}
                  y={-25 / scale}
                  width={40 / scale}
                  height={16 / scale}
                  fill="white"
                  stroke="#f43f5e"
                  strokeWidth={1 / scale}
                  cornerRadius={4 / scale}
                />
                <Text
                  x={-20 / scale}
                  y={-22 / scale}
                  width={40 / scale}
                  text={formatDistance(distances.right, 1)}
                  fontSize={12 / scale}
                  fontStyle="bold"
                  fill="#f43f5e"
                  align="center"
                />
              </Group>
            </>
          )}
        </Group>
      )}

      <Group
        ref={groupRef}
        x={x}
        y={y}
        rotation={angle}
        onClick={onSelect}
        onTap={onSelect}
        draggable={isSelected}
        onDragStart={() => {
          saveHistory();
          setIsDragging(true);
        }}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        dragBoundFunc={(pos) => {
          // This is absolute. We handle snapping in onDragMove and reset in onDragEnd.
          // But for visual feedback during drag, we can project here too.
          const stage = groupRef.current?.getStage();
          if (!stage) return pos;

          const relMouse = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY()
          };

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const l2 = dx * dx + dy * dy;
          let t = ((relMouse.x - p1.x) * dx + (relMouse.y - p1.y) * dy) / l2;
          t = Math.max(0, Math.min(1, t));

          const snappedRel = {
            x: p1.x + t * dx,
            y: p1.y + t * dy
          };

          return {
            x: snappedRel.x * stage.scaleX() + stage.x(),
            y: snappedRel.y * stage.scaleY() + stage.y()
          };
        }}
        width={widthPx}
        height={thicknessPx}
        // Align the attachment to the wall line. 
        // Since walls are drawn on the outside, we default to offsetY=0 or offsetY=thicknessPx
        offsetX={widthPx / 2}
        offsetY={attachment.flipY ? thicknessPx : 0}
      >
        {/* 
          The "Cutter" Rectangle 
          This white fill visually masks the dark room wall underneath.
        */}
        <Rect
          width={widthPx}
          height={thicknessPx}
          fill="white"
          stroke={isSelected ? "#4f46e5" : "#334155"}
          strokeWidth={1 / scale}
        />

        {attachment.type === 'window' ? (
          /* Window Detail: Two lines representing glass */
          <Group>
            <Line
              points={[0, thicknessPx * 0.3, widthPx, thicknessPx * 0.3]}
              stroke="#94a3b8"
              strokeWidth={1 / scale}
            />
            <Line
              points={[0, thicknessPx * 0.7, widthPx, thicknessPx * 0.7]}
              stroke="#94a3b8"
              strokeWidth={1 / scale}
            />
          </Group>
        ) : (
          /* Door Detail: Swing Arc */
          <Group 
            x={attachment.flipX ? widthPx : 0} 
            y={attachment.flipY ? 0 : thicknessPx}
            scaleX={attachment.flipX ? -1 : 1}
            scaleY={attachment.flipY ? 1 : -1}
          >
            {/* Door Leaf */}
            <Rect
              width={2 / scale}
              height={widthPx}
              fill="#475569"
              offsetX={1 / scale}
            />
            {/* Swing Arc */}
            <Arc
              innerRadius={widthPx}
              outerRadius={widthPx}
              angle={90}
              stroke="#94a3b8"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
            />
          </Group>
        )}
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          rotateEnabled={false}
          resizeEnabled={true}
          keepRatio={false}
          borderStroke="#4f46e5"
          anchorFill="#4f46e5"
          anchorSize={8 / scale}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 * pixelsPerCm) return oldBox;
            return newBox;
          }}
          onTransformEnd={handleTransform}
        />
      )}
    </Group>
  );
};
