import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { FurnitureObject } from '../../types';
import { WallSegments } from './RoomElements';
import { 
  Bed3D, Desk3D, Wardrobe3D, Dresser3D, Chair3D, 
  Shelf3D, Electronics3D, Table3D, GenericFurniture3D 
} from './FurnitureModels';

const Furniture = ({ item, pixelsPerCm }: { item: FurnitureObject, pixelsPerCm: number }) => {
  const width = item.width / pixelsPerCm;
  const depth = item.height / pixelsPerCm;
  const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm;
  const elevation = (item.elevation || 0) / pixelsPerCm;
  
  const rotationRad = -(item.rotation * Math.PI) / 180;

  const renderFurniture = () => {
    const props = { width, depth, height, color: item.color || "#f8fafc" };
    
    switch (item.furnitureType) {
      case 'bed': return <Bed3D {...props} />;
      case 'desk': return <Desk3D {...props} />;
      case 'wardrobe': return <Wardrobe3D {...props} />;
      case 'dresser': return <Dresser3D {...props} />;
      case 'chair': return <Chair3D {...props} />;
      case 'shelf': return <Shelf3D {...props} />;
      case 'electronics': return <Electronics3D {...props} />;
      case 'table': return <Table3D {...props} isRound={item.type === 'circle'} />;
      default: return <GenericFurniture3D {...props} />;
    }
  };

  return (
    <group position={[item.x / pixelsPerCm, elevation, item.y / pixelsPerCm]} rotation={[0, rotationRad, 0]}>
      {renderFurniture()}
    </group>
  );
};

export const ThreeDPreview: React.FC = () => {
  const { rooms, furniture, pixelsPerCm, setShow3d, wallThickness, wallAttachments } = useStore();

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
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.2, center.z]} receiveShadow>
                <planeGeometry args={[10000, 10000]} />
                <meshStandardMaterial color="#f8fafc" roughness={1} />
              </mesh>

              {rooms.map(room => (
                <WallSegments 
                  key={room.id} 
                  room={room} 
                  pixelsPerCm={pixelsPerCm} 
                  wallThickness={wallThickness} 
                  attachments={wallAttachments}
                />
              ))}

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
