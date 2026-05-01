import React from 'react';
import { RoomObject, WallAttachment, BeamObject } from '../../types';
import { FLOOR_TEXTURES } from '../../constants';
import { getOutwardNormal } from '../../lib/geometry';
import { useStore } from '../../store';
import { INTERIOR_THEMES } from '../../lib/themes';

export const Beam3D: React.FC<{ 
  beam: BeamObject, 
  pixelsPerCm: number 
}> = ({ beam, pixelsPerCm }) => {
  const dx = (beam.p2.x - beam.p1.x) / pixelsPerCm;
  const dy = (beam.p2.y - beam.p1.y) / pixelsPerCm;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  const midX = (beam.p1.x + beam.p2.x) / (2 * pixelsPerCm);
  const midZ = (beam.p1.y + beam.p2.y) / (2 * pixelsPerCm);
  const y = (beam.elevation + beam.height / 2);

  return (
    <mesh 
      position={[midX, y, midZ]} 
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, beam.height, beam.width]} />
      <SmartMaterial color={beam.color || '#e2e8f0'} roughness={1} />
    </mesh>
  );
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const SmartMaterial = (props: any) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  if (edgeMode) {
    const { 
      color: _c, 
      map: _m, 
      emissive: _e, 
      emissiveIntensity: _ei, 
      transparent, 
      opacity, 
      side, 
      ...otherProps 
    } = props;
/* eslint-enable @typescript-eslint/no-unused-vars */
    return (
      <>
        <meshBasicMaterial 
          color="black" 
          transparent={transparent} 
          opacity={opacity} 
          side={side || THREE.FrontSide} 
          {...otherProps}
        />
        <Edges color="white" threshold={20} />
      </>
    );
  }
  return <meshStandardMaterial {...props} />;
};

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
  const floorColor = room.floorColor || (textureData ? "#ffffff" : "#e2e8f0");

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
      <shapeGeometry args={[floorShape]} />
      {textureData?.url ? (
        <FloorTexturedMaterial url={textureData.url} color={floorColor} floorTexture={room.floorTexture || ''} />
      ) : (
        <SmartMaterial 
          color={floorColor} 
          roughness={0.9} 
          side={THREE.DoubleSide} 
        />
      )}
    </mesh>
  );
};

const FloorTexturedMaterial: React.FC<{ url: string, color: string, floorTexture: string }> = ({ url, color, floorTexture }) => {
  const texture = useTexture(url);

  React.useLayoutEffect(() => {
    /* eslint-disable-next-line react-hooks/immutability */
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    let sizeCm = 100;
    if (floorTexture === 'laminate' || floorTexture === 'wood' || floorTexture === 'parquet') sizeCm = 64;
    if (floorTexture === 'tiles') sizeCm = 80;
    
    const repeatScale = 1 / sizeCm;
    texture.repeat.set(repeatScale, repeatScale);
  }, [texture, floorTexture]);

  return (
    <SmartMaterial 
      color={color} 
      map={texture} 
      roughness={0.9} 
      side={THREE.DoubleSide} 
    />
  );
};

export const Ceiling: React.FC<{ room: RoomObject, pixelsPerCm: number, height: number }> = ({ room, pixelsPerCm, height }) => {
  const ceilingShape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    s.moveTo(room.points[0].x / pixelsPerCm, -room.points[0].y / pixelsPerCm);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x / pixelsPerCm, -room.points[i].y / pixelsPerCm);
    }
    s.closePath();
    return s;
  }, [room.points, pixelsPerCm]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.1, 0]}>
      <shapeGeometry args={[ceilingShape]} />
      <SmartMaterial 
        color="#f8fafc" 
        roughness={1} 
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveIntensity={0.1}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
};

const Curtain: React.FC<{
  length: number;
  height: number;
  color: string;
  opacity: number;
  amplitude: number;
  frequency: number;
}> = ({ length, height, color, opacity, amplitude, frequency }) => {
  const geometry = useMemo(() => {
    const segments = Math.max(20, Math.floor(length / 2));
    const geo = new THREE.PlaneGeometry(length, height, segments, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Sine wave for the folds
      const z = Math.sin((x + length / 2) * frequency) * amplitude;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [length, height, amplitude, frequency]);

  return (
    <mesh geometry={geometry}>
      <SmartMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        side={THREE.DoubleSide} 
        roughness={1} 
        depthWrite={false}
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
  const activeThemeId = useStore(state => state.activeThemeId);
  const activeTheme = React.useMemo(() => {
    if (!activeThemeId) return null;
    return INTERIOR_THEMES.find(t => t.id === activeThemeId);
  }, [activeThemeId]);

  const segments = useMemo(() => {
    const segs: { 
      type: 'wall' | 'glass' | 'frame' | 'curtain', 
      length: number, 
      angle: number, 
      midX: number, 
      midZ: number, 
      height: number, 
      y: number, 
      color: string,
      depth?: number,
      opacity?: number
    }[] = [];
    
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

      let segmentColor = room.wallColors?.[i] || room.materials?.wallBase?.value || room.defaultWallColor || "#f0f0f0";
      
      // If we don't have materials or specifically set wall colors, and there's a theme, use theme default
      if (!room.wallColors?.[i] && !room.materials?.wallBase && activeTheme) {
        segmentColor = activeTheme.wallColors.base;
      }

      const normal = getOutwardNormal(room.points, i);
      const offsetX = (normal.x * wallThickness) / 2;
      const offsetZ = (normal.y * wallThickness) / 2;

      if (segmentAttachments.length === 0) {
        const midX = (p1.x + p2.x) / (2 * pixelsPerCm) + offsetX;
        const midZ = (p1.y + p2.y) / (2 * pixelsPerCm) + offsetZ;
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
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos + offsetX;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos + offsetZ;
            segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
          }

          const sillHeight = att.type === 'door' ? 0 : 90;
          const openingHeight = att.type === 'door' ? 210 : 120;
          const headerHeight = Math.max(0, wallHeight - (sillHeight + openingHeight));
          
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos + offsetX;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos + offsetZ;

          // Sill (wall under window)
          if (att.type === 'window' && sillHeight > 0) {
            segs.push({ type: 'wall', length: attWidth, angle, midX, midZ, height: sillHeight, y: sillHeight / 2, color: segmentColor });
          }

          // Header (wall above window/door)
          if (headerHeight > 0) {
            segs.push({ type: 'wall', length: attWidth, angle, midX, midZ, height: headerHeight, y: wallHeight - headerHeight / 2, color: segmentColor });
          }

          // Glass or Door Opening
          if (att.type === 'window') {
            segs.push({ type: 'glass', length: attWidth, angle, midX, midZ, height: Math.min(openingHeight, wallHeight - sillHeight), y: sillHeight + Math.min(openingHeight, wallHeight - sillHeight) / 2, color: '#93c5fd' });
          }

          // Frame
          const frameColor = att.frameColor || '#ffffff';
          const frameThickness = 5;
          const frameDepth = wallThickness + 2;

          // Vertical Frame Sides
          const sideX1 = (p1.x / pixelsPerCm) + Math.cos(angle) * (attCenterPos - attWidth / 2 + frameThickness / 2) + offsetX;
          const sideZ1 = (p1.y / pixelsPerCm) + Math.sin(angle) * (attCenterPos - attWidth / 2 + frameThickness / 2) + offsetZ;
          segs.push({ type: 'frame', length: frameThickness, angle, midX: sideX1, midZ: sideZ1, height: openingHeight, y: sillHeight + openingHeight / 2, color: frameColor, depth: frameDepth });

          const sideX2 = (p1.x / pixelsPerCm) + Math.cos(angle) * (attCenterPos + attWidth / 2 - frameThickness / 2) + offsetX;
          const sideZ2 = (p1.y / pixelsPerCm) + Math.sin(angle) * (attCenterPos + attWidth / 2 - frameThickness / 2) + offsetZ;
          segs.push({ type: 'frame', length: frameThickness, angle, midX: sideX2, midZ: sideZ2, height: openingHeight, y: sillHeight + openingHeight / 2, color: frameColor, depth: frameDepth });

          // Horizontal Frame Top
          const topY = sillHeight + openingHeight - frameThickness / 2;
          segs.push({ type: 'frame', length: attWidth, angle, midX, midZ, height: frameThickness, y: topY, color: frameColor, depth: frameDepth });

          // Horizontal Frame Bottom (for windows)
          if (att.type === 'window') {
            const bottomY = sillHeight + frameThickness / 2;
            segs.push({ type: 'frame', length: attWidth, angle, midX, midZ, height: frameThickness, y: bottomY, color: frameColor, depth: frameDepth });
          }

          // Curtains
          if (att.type === 'window' && att.curtainType && att.curtainType !== 'none') {
            const curtainOffset = wallThickness / 2 + 5;
            const cMidX = midX - normal.x * curtainOffset;
            const cMidZ = midZ - normal.y * curtainOffset;
            
            if (att.curtainType === 'thin' || att.curtainType === 'both') {
              segs.push({ 
                type: 'curtain', 
                length: attWidth + 20, 
                angle, 
                midX: cMidX, 
                midZ: cMidZ, 
                height: openingHeight + 10, 
                y: sillHeight + openingHeight / 2, 
                color: att.thinCurtainColor || '#ffffff', 
                opacity: 0.6, 
                depth: 1 
              });
            }
            
            if (att.curtainType === 'thick' || att.curtainType === 'both') {
              const thickOffset = att.curtainType === 'both' ? 2 : 0;
              const thickColor = att.thickCurtainColor || '#f1f5f9';
              
              if (att.curtainType === 'both') {
                // Split thick curtains at the ends
                const sideWidth = (attWidth + 40) * 0.25; // Each side takes 25% of width
                const offsetFromCenter = (attWidth + 40) / 2 - sideWidth / 2;
                
                // Left side
                const lx = cMidX - Math.cos(angle) * offsetFromCenter - normal.x * thickOffset;
                const lz = cMidZ - Math.sin(angle) * offsetFromCenter - normal.y * thickOffset;
                segs.push({ 
                  type: 'curtain', 
                  length: sideWidth, 
                  angle, 
                  midX: lx, 
                  midZ: lz, 
                  height: openingHeight + 20, 
                  y: sillHeight + openingHeight / 2 + 5, 
                  color: thickColor, 
                  opacity: 0.9, 
                  depth: 2 
                });

                // Right side
                const rx = cMidX + Math.cos(angle) * offsetFromCenter - normal.x * thickOffset;
                const rz = cMidZ + Math.sin(angle) * offsetFromCenter - normal.y * thickOffset;
                segs.push({ 
                  type: 'curtain', 
                  length: sideWidth, 
                  angle, 
                  midX: rx, 
                  midZ: rz, 
                  height: openingHeight + 20, 
                  y: sillHeight + openingHeight / 2 + 5, 
                  color: thickColor, 
                  opacity: 0.9, 
                  depth: 2 
                });
              } else {
                // Full width thick curtain
                segs.push({ 
                  type: 'curtain', 
                  length: attWidth + 40, 
                  angle, 
                  midX: cMidX - normal.x * thickOffset, 
                  midZ: cMidZ - normal.y * thickOffset, 
                  height: openingHeight + 20, 
                  y: sillHeight + openingHeight / 2 + 5, 
                  color: thickColor, 
                  opacity: 0.9, 
                  depth: 2 
                });
              }
            }
          }

          currentPos = attEndPos;
        });

        if (currentPos < totalLength) {
          const partLength = totalLength - currentPos;
          const partMidPos = currentPos + partLength / 2;
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos + offsetX;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos + offsetZ;
          segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
        }
      }
    }
    return segs;
  }, [room.points, pixelsPerCm, attachments, room.wallColors, room.defaultWallColor, room.materials, activeThemeId, activeTheme, wallHeight, wallThickness, room.id, room.isClosed]);

  return (
    <group>
      {room.isClosed && <Floor room={room} pixelsPerCm={pixelsPerCm} />}
      {segments.map((seg, i) => {
        if (seg.type === 'curtain') {
          return (
            <group key={i} position={[seg.midX, seg.y, seg.midZ]} rotation={[0, -seg.angle, 0]}>
              <Curtain 
                length={seg.length} 
                height={seg.height} 
                color={seg.color} 
                opacity={seg.opacity || 1} 
                amplitude={seg.depth === 1 ? 2.5 : 4} 
                frequency={seg.depth === 1 ? 0.8 : 0.4} 
              />
            </group>
          );
        }
        return (
          <mesh 
            key={i} 
            position={[seg.midX, seg.y, seg.midZ]} 
            rotation={[0, -seg.angle, 0]}
            castShadow={seg.type === 'wall'}
            receiveShadow
          >
            <boxGeometry args={[seg.length, seg.height, seg.depth || wallThickness]} />
            {seg.type === 'wall' ? (
              <SmartMaterial color={seg.color} roughness={1} />
            ) : seg.type === 'glass' ? (
              <SmartMaterial color="#93c5fd" transparent opacity={0.4} roughness={0.1} metalness={0.5} />
            ) : seg.type === 'frame' ? (
              <SmartMaterial color={seg.color} roughness={0.5} />
            ) : (
              <SmartMaterial color={seg.color} transparent opacity={seg.opacity || 1} roughness={1} />
            )}
          </mesh>
        );
      })}
    </group>
  );
};
