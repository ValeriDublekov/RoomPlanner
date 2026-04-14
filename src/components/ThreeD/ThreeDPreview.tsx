import React, { useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { FurnitureObject } from '../../types';
import { WallSegments } from './RoomElements';
import { 
  Bed3D, Desk3D, Wardrobe3D, Dresser3D, Chair3D, 
  Shelf3D, Electronics3D, Table3D, GenericFurniture3D,
  Sofa3D, Nightstand3D, Toilet3D, Bathtub3D
} from './FurnitureModels';

const SceneBackground = ({ isExporting }: { isExporting: boolean }) => {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(isExporting ? '#ffffff' : '#0f172a');
  }, [isExporting, gl]);
  return null;
};

const Furniture = ({ item, pixelsPerCm }: { item: FurnitureObject, pixelsPerCm: number }) => {
  const width = item.width / pixelsPerCm;
  const depth = item.height / pixelsPerCm;
  const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm;
  const elevation = (item.elevation || 0) / pixelsPerCm;
  
  const rotationRad = -(item.rotation * Math.PI) / 180;

  if (item.type === 'group' && item.children) {
    return (
      <group position={[item.x / pixelsPerCm, elevation, item.y / pixelsPerCm]} rotation={[0, rotationRad, 0]}>
        {item.children.map(child => (
          <Furniture key={child.id} item={child} pixelsPerCm={pixelsPerCm} />
        ))}
      </group>
    );
  }

  const renderFurniture = () => {
    const props = { 
      width, 
      depth, 
      height, 
      color: item.color || "#f8fafc",
      secondaryColor: item.secondaryColor
    };
    
    switch (item.furnitureType) {
      case 'bed': return <Bed3D {...props} />;
      case 'desk': return <Desk3D {...props} />;
      case 'wardrobe': return <Wardrobe3D {...props} />;
      case 'dresser': return <Dresser3D {...props} />;
      case 'chair': return <Chair3D {...props} />;
      case 'shelf': return <Shelf3D {...props} />;
      case 'electronics': return <Electronics3D {...props} />;
      case 'table': return <Table3D {...props} isRound={item.type === 'circle'} />;
      case 'sofa': return <Sofa3D {...props} />;
      case 'armchair': return <Sofa3D {...props} width={props.width} depth={props.depth} />;
      case 'nightstand': return <Nightstand3D {...props} />;
      case 'toilet': return <Toilet3D {...props} />;
      case 'bathtub': return <Bathtub3D {...props} />;
      default: {
        // Fallback for catalogId if furnitureType is still generic
        const cid = item.catalogId || '';
        if (cid.includes('sofa')) return <Sofa3D {...props} />;
        if (cid.includes('nightstand')) return <Nightstand3D {...props} />;
        if (cid.includes('armchair')) return <Sofa3D {...props} width={props.width} depth={props.depth} />;
        if (cid.includes('toilet')) return <Toilet3D {...props} />;
        if (cid.includes('bathtub')) return <Bathtub3D {...props} />;
        return <GenericFurniture3D {...props} />;
      }
    }
  };

  return (
    <group position={[item.x / pixelsPerCm, elevation, item.y / pixelsPerCm]} rotation={[0, rotationRad, 0]}>
      {renderFurniture()}
    </group>
  );
};

export const ThreeDPreview: React.FC = () => {
  const { rooms, furniture, pixelsPerCm, setShow3d, wallThickness, wallHeight, setWallHeight, wallAttachments } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (isPrint = false) => {
    setIsExporting(true);
    // Wait for a few frames to ensure the background color change is applied
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = document.querySelector('.three-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      
      if (isPrint) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <html>
              <head>
                <title>3D Preview - ${useStore.getState().projectName}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                  @page { margin: 0; }
                </style>
              </head>
              <body>
                <img src="${dataURL}" />
                <script>
                  window.onload = () => {
                    window.print();
                    setTimeout(() => {
                      window.frameElement.remove();
                    }, 1000);
                  };
                </script>
              </body>
            </html>
          `);
          doc.close();
        }
      } else {
        const link = document.createElement('a');
        const projectName = useStore.getState().projectName || 'project';
        const sanitizedName = projectName.toLowerCase().replace(/\s+/g, '-');
        link.download = `${sanitizedName}-3d-${new Date().getTime()}.png`;
        link.href = dataURL;
        link.click();
      }
    }
    setIsExporting(false);
  };

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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export Image
          </button>
          <button 
            onClick={() => handleExport(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button 
            onClick={() => setShow3d(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
          >
            Back to 2D
          </button>
        </div>
      </div>

      <div className="flex-1 relative three-canvas">
        <Canvas 
          shadows
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: [center.x + 400, 400, center.z + 400], fov: 45, near: 1, far: 10000 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0f172a');
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        >
          <SceneBackground isExporting={isExporting} />
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
                  wallHeight={wallHeight}
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

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
          <div className="bg-slate-800/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-3 w-80">
            <div className="flex justify-between items-center">
              <span className="text-white text-xs font-bold uppercase tracking-wider">Wall Height</span>
              <span className="text-indigo-400 font-mono font-bold">{wallHeight} cm</span>
            </div>
            <input 
              type="range"
              min="0"
              max="400"
              step="10"
              value={wallHeight}
              onChange={(e) => setWallHeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 text-white text-[10px] font-bold uppercase tracking-wider flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Left Click: Rotate
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Right Click: Pan
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Scroll: Zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
