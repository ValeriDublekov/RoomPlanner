import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Group, Rect, Arc, Transformer, Text, Line } from 'react-konva';
import { WallAttachment, PlanSnapshot } from '../../types';
import { useStore } from '../../store';
import { formatDistance, getAttachmentTransform, getOutwardNormal } from '../../lib/geometry';
import { getRoomVertices } from '../../lib/geometry/topology';
import Konva from 'konva';

interface WallAttachmentItemProps {
  attachment: WallAttachment;
  isSelected: boolean;
  onSelect: () => void;
  scale: number;
  planSnapshot?: PlanSnapshot;
}

export const WallAttachmentItem: React.FC<WallAttachmentItemProps> = ({
  attachment,
  isSelected,
  onSelect,
  scale,
  planSnapshot,
}) => {
  const { rooms, wallThickness, pixelsPerCm, updateWallAttachment, saveHistory, activeLayer, isReadOnly, mode } = useStore();
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [distances, setDistances] = useState<{ left: number | null, right: number | null }>({ left: null, right: null });

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const room = rooms.find(r => r.id === attachment.roomId);
  const transform = useMemo(() => {
    if (planSnapshot) return getAttachmentTransform(attachment, planSnapshot);
    // Legacy fallback if snapshot not provided
    const tempSnapshot: PlanSnapshot = { 
      walls: rooms.flatMap(r => {
        const pts = getRoomVertices(r);
        return pts.map((p, i) => ({
            id: `${r.id}-${i}`,
            roomId: r.id,
            segmentIndex: i,
            referenceSegment: { p1: p, p2: pts[(i+1)%pts.length] },
            normal: getOutwardNormal(pts, i),
            thickness: wallThickness,
            interiorFace: { p1: p, p2: pts[(i+1)%pts.length]},
            exteriorFace: { p1: p, p2: pts[(i+1)%pts.length]},
            wallBandPolygon: [p, p, p, p]
        }));
      }),
      sharedWalls: [],
      generatedAt: 0
    };
    return getAttachmentTransform(attachment, tempSnapshot);
  }, [attachment, planSnapshot, rooms, wallThickness]);

  if (!room || !transform) return null;

  const { position, rotation, normal } = transform;
  const { x, y } = position;
  const angle = rotation;

  const p1 = transform.position; // fallback placeholder
  const p2 = transform.position; // fallback placeholder

  // We still need p1 and p2 for distance lines. 
  // Let's get them from the snapshot if possible.
  const wall = planSnapshot?.walls.find(w => w.roomId === attachment.roomId && w.segmentIndex === attachment.wallSegmentIndex);
  const segP1 = wall ? wall.referenceSegment.p1 : { x: 0, y: 0 };
  const segP2 = wall ? wall.referenceSegment.p2 : { x: 0, y: 0 };
  
  const dx = segP2.x - segP1.x;
  const dy = segP2.y - segP1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  const widthPx = attachment.width * pixelsPerCm;
  const thicknessPx = wallThickness * pixelsPerCm;

  const localY = { x: -dy / length, y: dx / length };
  const dot = localY.x * normal.x + localY.y * normal.y;
  const isLocalYOutside = dot > 0;
  const finalOffsetY = isLocalYOutside ? 0 : thicknessPx;

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = groupRef.current;
    if (!node) return;

    const newWidth = (node.width() * node.scaleX()) / pixelsPerCm;
    
    node.setAttrs({
      scaleX: 1,
      scaleY: 1,
    });

    updateWallAttachment(attachment.id, { width: Math.max(10, newWidth) });
    
    // Update distances during transform
    handleDragMove(e);
  };

  const handleDragMove = (_e: Konva.KonvaEventObject<DragEvent | Event>) => {
    const node = groupRef.current;
    if (!node) return;
    
    // Use node's current position
    const relPos = {
      x: node.x(),
      y: node.y()
    };

    // Project onto wall segment to get t
    const dx_seg = segP2.x - segP1.x;
    const dy_seg = segP2.y - segP1.y;
    const l2 = dx_seg * dx_seg + dy_seg * dy_seg;
    let t = ((relPos.x - segP1.x) * dx_seg + (relPos.y - segP1.y) * dy_seg) / l2;
    t = Math.max(0, Math.min(1, t));

    // Check if adjacent walls are perpendicular
    // NOTE: This still uses getRoomVertices for now, as SharedWalls transition is incomplete
    const points = getRoomVertices(room);
    const prevIdx = (attachment.wallSegmentIndex - 1 + points.length) % points.length;
    const nextIdx = (attachment.wallSegmentIndex + 1) % points.length;
    
    const prevP = points[prevIdx];
    const nextP = points[(nextIdx + 1) % points.length];

    const prevAngle = Math.atan2(segP1.y - prevP.y, segP1.x - prevP.x) * (180 / Math.PI);
    const nextAngle = Math.atan2(nextP.y - segP2.y, nextP.x - segP2.x) * (180 / Math.PI);

    const isPrevPerp = Math.abs((prevAngle - angle + 360) % 180 - 90) < 5;
    const isNextPerp = Math.abs((nextAngle - angle + 360) % 180 - 90) < 5;

    // Calculate distance from edge of attachment to perpendicular wall
    const halfWidth = (attachment.width * pixelsPerCm) / 2;
    const edgeDistToP1 = t * length - halfWidth;
    const edgeDistToP2 = (1 - t) * length - halfWidth;

    setDistances({
      left: isPrevPerp ? edgeDistToP1 / pixelsPerCm : null,
      right: isNextPerp ? edgeDistToP2 / pixelsPerCm : null
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsInteracting(false);
    const node = e.target;

    const relPos = {
      x: node.x(),
      y: node.y()
    };

    const dx_seg = segP2.x - segP1.x;
    const dy_seg = segP2.y - segP1.y;
    const l2 = dx_seg * dx_seg + dy_seg * dy_seg;
    let t = ((relPos.x - segP1.x) * dx_seg + (relPos.y - segP1.y) * dy_seg) / l2;
    t = Math.max(0, Math.min(1, t));

    updateWallAttachment(attachment.id, { positionAlongWall: t });
  };

  // Calculate edge points for distance lines
  const halfWidthPx = (attachment.width * pixelsPerCm) / 2;
  const dx_norm = dx / length;
  const dy_norm = dy / length;

  const edge1X = x - dx_norm * halfWidthPx;
  const edge1Y = y - dy_norm * halfWidthPx;
  const edge2X = x + dx_norm * halfWidthPx;
  const edge2Y = y + dy_norm * halfWidthPx;

  return (
    <Group>
      {/* Distance Labels during dragging/resizing */}
      {isInteracting && (
        <Group>
          {/* Line to P1 */}
          {distances.left !== null && (
            <>
              <Line
                points={[segP1.x, segP1.y, edge1X, edge1Y]}
                stroke="#f43f5e"
                strokeWidth={3 / scale}
                dash={[4 / scale, 4 / scale]}
              />
              <Group
                x={(segP1.x + edge1X) / 2}
                y={(segP1.y + edge1Y) / 2}
                rotation={(() => {
                  let a = angle;
                  if (a > 90) a -= 180;
                  if (a < -90) a += 180;
                  return a;
                })()}
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
                    text={formatDistance(distances.left * pixelsPerCm, 1)}
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
                    points={[edge2X, edge2Y, segP2.x, segP2.y]}
                    stroke="#f43f5e"
                    strokeWidth={3 / scale}
                    dash={[4 / scale, 4 / scale]}
                />
                <Group
                    x={(segP2.x + edge2X) / 2}
                    y={(segP2.y + edge2Y) / 2}
                    rotation={(() => {
                    let a = angle;
                    if (a > 90) a -= 180;
                    if (a < -90) a += 180;
                    return a;
                    })()}
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
                    text={formatDistance(distances.right * pixelsPerCm, 1)}
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
            name="wall-attachment"
            x={x}
            y={y}
            rotation={angle}
            onMouseDown={(e) => {
            if (isReadOnly || mode !== 'select') return;
            e.cancelBubble = true;
            }}
            onClick={(e) => {
            if (isReadOnly || e.evt.button !== 0 || activeLayer !== 'room') return;
            e.cancelBubble = true;
            onSelect();
            }}
            onTap={(e) => {
            if (isReadOnly || activeLayer !== 'room') return;
            e.cancelBubble = true;
            onSelect();
            }}
            draggable={!isReadOnly}
            onDragStart={(e) => {
            if (isReadOnly) {
                e.target.stopDrag();
                return;
            }
            if (e.evt.button !== 0 || activeLayer !== 'room') return;
            onSelect();
            saveHistory();
            setIsInteracting(true);
            }}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            dragBoundFunc={(pos) => {
            const stage = groupRef.current?.getStage();
            if (!stage) return pos;

            const relMouse = {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };

            const dx_s = segP2.x - segP1.x;
            const dy_s = segP2.y - segP1.y;
            const l2_s = dx_s * dx_s + dy_s * dy_s;
            if (l2_s === 0) return pos;
            let t = ((relMouse.x - segP1.x) * dx_s + (relMouse.y - segP1.y) * dy_s) / l2_s;
            t = Math.max(0, Math.min(1, t));

            const snappedRel = {
                x: segP1.x + t * dx_s,
                y: segP1.y + t * dy_s
            };

            return {
                x: snappedRel.x * stage.scaleX() + stage.x(),
                y: snappedRel.y * stage.scaleY() + stage.y()
            };
            }}
            width={widthPx}
            height={thicknessPx}
            offsetX={widthPx / 2}
            offsetY={finalOffsetY}
            listening={activeLayer === 'room' || true}
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
          hitStrokeWidth={20 / scale}
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
          name="transformer"
          onMouseDown={(e) => e.cancelBubble = true}
          onClick={(e) => e.cancelBubble = true}
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
          onTransformStart={(e) => {
            if (isReadOnly) {
              e.cancelBubble = true;
              return;
            }
            saveHistory();
            setIsInteracting(true);
          }}
          onTransform={handleTransform}
          onTransformEnd={() => {
            setIsInteracting(false);
          }}
        />
      )}
    </Group>
  );
};
