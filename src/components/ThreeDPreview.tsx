import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { FurnitureObject, RoomObject, WallAttachment } from '../types';
import { FLOOR_TEXTURES } from '../constants';

const Bed3D = ({ width, depth, height, color }: { width: number, depth: number, height: number, color: string }) => {
  const frameHeight = height * 0.3;
  const mattressHeight = height * 0.5;
  const mattressInset = 5; // 5cm inset
  
  return (
    <group>
      {/* Base Frame */}
      <mesh position={[width / 2, frameHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, frameHeight, depth]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Mattress */}
      <mesh position={[width / 2, frameHeight + mattressHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width - mattressInset, mattressHeight, depth - mattressInset]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      
      {/* Pillows */}
      <mesh position={[width * 0.25, frameHeight + mattressHeight + 2, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.3, 5, depth * 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={1} />
      </mesh>
      <mesh position={[width * 0.75, frameHeight + mattressHeight + 2, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.3, 5, depth * 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={1} />
      </mesh>
    </group>
  );
};

const Desk3D = ({ width, depth, height, color }: { width: number, depth: number, height: number, color: string }) => {
  const topThickness = 4; // 4cm
  const legRadius = 2; // 2cm
  
  return (
    <group>
      {/* Desktop */}
      <mesh position={[width / 2, height - topThickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Legs */}
      {[
        [legRadius, legRadius],
        [width - legRadius, legRadius],
        [legRadius, depth - legRadius],
        [width - legRadius, depth - legRadius]
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], (height - topThickness) / 2, pos[1]]} castShadow receiveShadow>
          <cylinderGeometry args={[legRadius, legRadius, height - topThickness, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const Wardrobe3D = ({ width, depth, height, color }: { width: number, depth: number, height: number, color: string }) => {
  const numDoors = width < 100 ? 2 : 3;
  const doorWidth = (width - 2) / numDoors;
  const handleRadius = 1;
  const handleHeight = 15;
  
  return (
    <group>
      {/* Carcass */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Doors */}
      {Array.from({ length: numDoors }).map((_, i) => (
        <group key={i} position={[i * doorWidth + doorWidth / 2 + 1, height / 2, depth + 0.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[doorWidth - 0.5, height - 2, 1]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
          </mesh>
          
          {/* Handle */}
          <mesh position={[i % 2 === 0 ? doorWidth / 3 : -doorWidth / 3, 0, 1]} castShadow receiveShadow>
            <cylinderGeometry args={[handleRadius, handleRadius, handleHeight, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const GenericFurniture3D = ({ width, depth, height, color }: { width: number, depth: number, height: number, color: string }) => (
  <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
    <boxGeometry args={[width, height, depth]} />
    <meshStandardMaterial color={color} roughness={0.8} />
  </mesh>
);

const Floor = ({ room, pixelsPerCm }: { room: RoomObject, pixelsPerCm: number }) => {
  const floorShape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    // Mirror Y to match Three.js coordinate system after -PI/2 rotation around X
    // Konva Y is down, Three.js Z is towards camera. 
    // After -PI/2 rotation, Shape Y becomes World Z.
    // So we use -p.y to make positive 2D Y map to positive 3D Z.
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
    texture.repeat.set(0.05, 0.05); // Adjust based on scale
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

const WallSegments = ({ room, pixelsPerCm, wallThickness, attachments }: { room: RoomObject, pixelsPerCm: number, wallThickness: number, attachments: WallAttachment[] }) => {
  const wallHeight = 210; // Dollhouse height

  const segments = useMemo(() => {
    const segs: { type: 'wall' | 'glass', length: number, angle: number, midX: number, midZ: number, height: number, y: number, color: string }[] = [];
    
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

          // Wall before attachment
          if (attStartPos > currentPos) {
            const partLength = attStartPos - currentPos;
            const partMidPos = currentPos + partLength / 2;
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos;
            segs.push({ type: 'wall', length: partLength, angle, midX, midZ, height: wallHeight, y: wallHeight / 2, color: segmentColor });
          }

          // Sill below window
          const sillHeight = att.type === 'door' ? 0 : 90;
          const openingHeight = att.type === 'door' ? 210 : 120;
          
          if (att.type === 'window' && sillHeight > 0) {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'wall', length: attWidth, angle, midX, midZ, height: sillHeight, y: sillHeight / 2, color: segmentColor });
          }

          // Glass for window
          if (att.type === 'window') {
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos;
            segs.push({ type: 'glass', length: attWidth, angle, midX, midZ, height: Math.min(openingHeight, wallHeight - sillHeight), y: sillHeight + Math.min(openingHeight, wallHeight - sillHeight) / 2, color: '#93c5fd' });
          }

          currentPos = attEndPos;
        });

        // Wall after last attachment
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
  }, [room.points, pixelsPerCm, attachments, room.wallColors, room.defaultWallColor]);

  return (
    <group>
      <Floor room={room} pixelsPerCm={pixelsPerCm} />

      {/* Walls and Glass */}
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

const Furniture = ({ item, pixelsPerCm }: { item: FurnitureObject, pixelsPerCm: number }) => {
  const width = item.width / pixelsPerCm;
  const depth = item.height / pixelsPerCm;
  const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm; // Default 75cm height
  
  // Konva rotation is in degrees, clockwise
  // Three.js rotation is in radians, counter-clockwise
  const rotationRad = -(item.rotation * Math.PI) / 180;

  const renderFurniture = () => {
    const props = { width, depth, height, color: item.color || "#f8fafc" };
    
    switch (item.furnitureType) {
      case 'bed':
        return <Bed3D {...props} />;
      case 'desk':
        return <Desk3D {...props} />;
      case 'wardrobe':
        return <Wardrobe3D {...props} />;
      default:
        return <GenericFurniture3D {...props} />;
    }
  };

  return (
    <group position={[item.x / pixelsPerCm, 0, item.y / pixelsPerCm]} rotation={[0, rotationRad, 0]}>
      {renderFurniture()}
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
        <Canvas 
          shadows
          camera={{ position: [center.x + 400, 400, center.z + 400], fov: 45, near: 1, far: 10000 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0f172a');
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        >
          <OrbitControls target={center} makeDefault />
          
          <ambientLight intensity={0.5} />
          <directionalLight 
            castShadow 
            intensity={1.5} 
            position={[center.x + 1000, 2000, center.z + 1000]} 
            shadow-bias={-0.0001}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-2000}
            shadow-camera-right={2000}
            shadow-camera-top={2000}
            shadow-camera-bottom={-2000}
            shadow-camera-near={1}
            shadow-camera-far={5000}
          />
          <Environment preset="city" />

          <Suspense fallback={null}>
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
          </Suspense>

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
