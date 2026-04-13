import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { RoomObject, WallAttachment } from '../../types';
import { FLOOR_TEXTURES } from '../../constants';

export const Floor: React.FC<{ room: RoomObject, pixelsPerCm: number }> = ({ room, pixelsPerCm }) => {
  const floorShape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    s.moveTo(room.points[0].x / pixelsPerCm, -room.points[0].y / pixelsPerCm);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x / pixelsPerCm, -room.points[i].y / pixelsPerCm);
    }
    s.closePath();
    return s;
  }, [room.points, pixelsPerCm]);

  const textureData = FLOOR_TEXTURES.find(t => t.id === room.floorTexture);
  const texture = textureData?.url ? useTexture(textureData.url) : null;

  if (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    let sizeCm = 100;
    if (room.floorTexture === 'laminate' || room.floorTexture === 'wood' || room.floorTexture === 'parquet') sizeCm = 64;
    if (room.floorTexture === 'tiles') sizeCm = 80;
    
    const repeatScale = 1 / sizeCm;
    texture.repeat.set(repeatScale, repeatScale);
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
      <shapeGeometry args={[floorShape]} />
      <meshStandardMaterial 
        color={texture ? (room.floorColor || "#ffffff") : (room.floorColor || "#e2e8f0")} 
        map={texture} 
        roughness={0.9} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
};

export const WallSegments: React.FC<{ 
  room: RoomObject, 
  pixelsPerCm: number, 
  wallThickness: number, 
  wallHeight: number,
  attachments: WallAttachment[] 
}> = ({ room, pixelsPerCm, wallThickness, wallHeight, attachments }) => {
  const segments = useMemo(() => {
    const segs: { type: 'wall' | 'glass', length: number, angle: number, midX: number, midZ: number, height: number, y: number, color: string }[] = [];
    
    const count = room.isClosed ? room.points.length : room.points.length - 1;
    for (let i = 0; i < count; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      
      const dx = (p2.x - p1.x) / pixelsPerCm;
      const dy = (p2.y - p1.y) / pixelsPerCm;
      const totalLength = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const segmentAttachments = attachments
        .filter(a => a.roomId === room.id && a.wallSegmentIndex === i)
        .sort((a, b) => a.positionAlongWall - b.positionAlongWall);

      const segmentColor = room.wallColors?.[i] || room.defaultWallColor || "#f0f0f0";

      if (segmentAttachments.length === 0) {
        const midX = (p1.x + p2.x) / (2 * pixelsPerCm);
        const midZ = (p1.y + p2.y) / (2 * pixelsPerCm);
        segs.push({ type: 'wall', length: totalLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
      } else {
        let currentPos = 0;
        segmentAttachments.forEach(att => {
          const attWidth = att.width / pixelsPerCm;
          const attCenterPos = att.positionAlongWall * totalLength;
          const attStartPos = Math.max(0, attCenterPos - attWidth / 2);
          const attEndPos = Math.min(totalLength, attCenterPos + attWidth / 2);

          if (attStartPos > currentPos) {
            const partLength = attStartPos - currentPos;
            const partMidPos = currentPos + partLength / 2;
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos;
            segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
          }

          const sillHeight = att.type === 'door' ? 0 : 90;
          const openingHeight = att.type === 'door' ? 210 : 120;
          
          if (att.type === 'window' && sillHeight > 0) {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'wall', length: attWidth, angle, midX, midZ, height: sillHeight, y: sillHeight / 2, color: segmentColor });
          }

          if (att.type === 'window') {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'glass', length: attWidth, angle, midX, midZ, height: Math.min(openingHeight, wallHeight - sillHeight), y: sillHeight + Math.min(openingHeight, wallHeight - sillHeight) / 2, color: '#93c5fd' });
          }

          currentPos = attEndPos;
        });

        if (currentPos < totalLength) {
          const partLength = totalLength - currentPos;
          const partMidPos = currentPos + partLength / 2;
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos;
          segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
        }
      }
    }
    return segs;
  }, [room.points, pixelsPerCm, attachments, room.wallColors, room.defaultWallColor, wallHeight]);

  return (
    <group>
      {room.isClosed && <Floor room={room} pixelsPerCm={pixelsPerCm} />}
      {segments.map((seg, i) => (
        <mesh 
          key={i} 
          position={[seg.midX, seg.y, seg.midZ]} 
          rotation={[0, -seg.angle, 0]}
          castShadow={seg.type === 'wall'}
          receiveShadow
        >
          <boxGeometry args={[seg.length, seg.height, wallThickness / pixelsPerCm]} />
          {seg.type === 'wall' ? (
            <meshStandardMaterial color={seg.color} roughness={1} />
          ) : (
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.4} roughness={0.1} metalness={0.5} />
          )}
        </mesh>
      ))}
    </group>
  );
};
