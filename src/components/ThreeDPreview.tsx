import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { FurnitureObject, RoomObject, WallAttachment } from '../types';

const WallSegments = ({ room, pixelsPerCm, wallThickness, attachments }: { room: RoomObject, pixelsPerCm: number, wallThickness: number, attachments: WallAttachment[] }) => {
  const wallHeight = 210; // Dollhouse height

  const floorShape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    s.moveTo(room.points[0].x / pixelsPerCm, room.points[0].y / pixelsPerCm);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x / pixelsPerCm, room.points[i].y / pixelsPerCm);
    }
    s.closePath();
    return s;
  }, [room.points, pixelsPerCm]);

  const segments = useMemo(() => {
    const segs: { type: 'wall' | 'glass', length: number, angle: number, midX: number, midZ: number, height: number, y: number }[] = [];
    
    for (let i = 0; i < room.points.length; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      
      const dx = (p2.x - p1.x) / pixelsPerCm;
      const dy = (p2.y - p1.y) / pixelsPerCm;
      const totalLength = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const segmentAttachments = attachments
        .filter(a => a.roomId === room.id && a.wallSegmentIndex === i)
        .sort((a, b) => a.positionAlongWall - b.positionAlongWall);

      if (segmentAttachments.length === 0) {
        const midX = (p1.x + p2.x) / (2 * pixelsPerCm);
        const midZ = (p1.y + p2.y) / (2 * pixelsPerCm);
        segs.push({ type: 'wall', length: totalLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2 });
      } else {
        let currentPos = 0;
        segmentAttachments.forEach(att => {
          const attWidth = att.width / pixelsPerCm;
          const attCenterPos = att.positionAlongWall * totalLength;
          const attStartPos = Math.max(0, attCenterPos - attWidth / 2);
          const attEndPos = Math.min(totalLength, attCenterPos + attWidth / 2);

          // Wall before attachment
          if (attStartPos > currentPos) {
            const partLength = attStartPos - currentPos;
            const partMidPos = currentPos + partLength / 2;
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos;
            segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2 });
          }

          // Header above attachment - REMOVED for dollhouse view as requested
          // Sill below window
          const sillHeight = att.type === 'door' ? 0 : 90;
          const openingHeight = att.type === 'door' ? 210 : 120;
          
          if (att.type === 'window' && sillHeight > 0) {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'wall', length: attWidth, angle, midX, midZ, height: sillHeight, y: sillHeight / 2 });
          }

          // Glass for window
          if (att.type === 'window') {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'glass', length: attWidth, angle, midX, midZ, height: Math.min(openingHeight, wallHeight - sillHeight), y: sillHeight + Math.min(openingHeight, wallHeight - sillHeight) / 2 });
          }

          currentPos = attEndPos;
        });

        // Wall after last attachment
        if (currentPos < totalLength) {
          const partLength = totalLength - currentPos;
          const partMidPos = currentPos + partLength / 2;
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos;
          segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2 });
        }
      }
    }
    return segs;
  }, [room.points, pixelsPerCm, attachments]);

  // Materials for wall boxes: [right, left, top, bottom, front, back]
  const wallMaterials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 1 }), // right
    new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 1 }), // left
    new THREE.MeshStandardMaterial({ color: "#cccccc", roughness: 1 }), // top (cutaway cap)
    new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 1 }), // bottom
    new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 1 }), // front
    new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 1 }), // back
  ], []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <shapeGeometry args={[floorShape]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls and Glass */}
      {segments.map((seg, i) => (
        <mesh 
          key={i} 
          position={[seg.midX, seg.y, seg.midZ]} 
          rotation={[0, -seg.angle, 0]}
          castShadow={seg.type === 'wall'}
          receiveShadow
          material={seg.type === 'wall' ? wallMaterials : undefined}
        >
          <boxGeometry args={[seg.length, seg.height, wallThickness / pixelsPerCm]} />
          {seg.type === 'glass' && (
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.4} roughness={0.1} metalness={0.5} />
          )}
        </mesh>
      ))}
    </group>
  );
};

const Furniture = ({ item, pixelsPerCm }: { item: FurnitureObject, pixelsPerCm: number }) => {
  const width = item.width / pixelsPerCm;
  const depth = item.height / pixelsPerCm;
  const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm; // Default 75cm height
  
  // Konva rotation is in degrees, clockwise
  // Three.js rotation is in radians, counter-clockwise
  const rotationRad = -(item.rotation * Math.PI) / 180;

  return (
    <group position={[item.x / pixelsPerCm, 0, item.y / pixelsPerCm]} rotation={[0, rotationRad, 0]}>
      <mesh 
        position={[width / 2, height / 2, depth / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={item.color || "#f8fafc"} roughness={0.8} />
      </mesh>
    </group>
  );
};

export const ThreeDPreview: React.FC = () => {
  const { rooms, furniture, pixelsPerCm, setShow3d, wallThickness, wallAttachments } = useStore();

  // Calculate center of the plan to position camera
  const center = useMemo(() => {
    if (rooms.length === 0) return new THREE.Vector3(0, 0, 0);
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    rooms.forEach(room => {
      room.points.forEach(p => {
        minX = Math.min(minX, p.x / pixelsPerCm);
        minZ = Math.min(minZ, p.y / pixelsPerCm);
        maxX = Math.max(maxX, p.x / pixelsPerCm);
        maxZ = Math.max(maxZ, p.y / pixelsPerCm);
      });
    });
    return new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
  }, [rooms, pixelsPerCm]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col">
      <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <span className="text-xs font-bold">3D</span>
          </div>
          <h2 className="text-white font-bold">3D Preview</h2>
        </div>
        <button 
          onClick={() => setShow3d(false)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
        >
          Back to 2D
        </button>
      </div>

      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [center.x + 400, 400, center.z + 400], fov: 45 }}>
          <OrbitControls target={center} />
          
          <ambientLight intensity={0.5} />
          <directionalLight 
            castShadow 
            intensity={1.5} 
            position={[center.x + 1000, 2000, center.z + 1000]} 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-2000}
            shadow-camera-right={2000}
            shadow-camera-top={2000}
            shadow-camera-bottom={-2000}
            shadow-camera-near={1}
            shadow-camera-far={5000}
          />
          <Environment preset="city" />

          <group>
            {/* Base Floor Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.2, center.z]} receiveShadow>
              <planeGeometry args={[10000, 10000]} />
              <meshStandardMaterial color="#f8fafc" roughness={1} />
            </mesh>

            {/* Walls and Floors */}
            {rooms.map(room => (
              <WallSegments 
                key={room.id} 
                room={room} 
                pixelsPerCm={pixelsPerCm} 
                wallThickness={wallThickness} 
                attachments={wallAttachments}
              />
            ))}

            {/* Furniture */}
            {furniture.map(item => (
              <Furniture key={item.id} item={item} pixelsPerCm={pixelsPerCm} />
            ))}
          </group>

          <ContactShadows 
            position={[center.x, 0, center.z]} 
            opacity={0.4} 
            scale={5000} 
            blur={2} 
            far={20} 
          />
        </Canvas>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 text-white text-xs font-medium flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            Left Click: Rotate
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            Right Click: Pan
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            Scroll: Zoom
          </div>
        </div>
      </div>
    </div>
  );
};
