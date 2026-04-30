import React, { useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { FurnitureObject } from '../../types';
import { FPVControls } from './FPVControls';
import { Camera, MousePointer2, Box } from 'lucide-react';
import { WallSegments, Ceiling } from './RoomElements';
import { 
  Bed3D, Desk3D, Wardrobe3D, Dresser3D, Chair3D, 
  Shelf3D, Electronics3D, Table3D, GenericFurniture3D,
  Sofa3D, Nightstand3D, Toilet3D, Bathtub3D, Light3D,
  Picture3D
} from './FurnitureModels';

const SceneBackground = ({ isExporting }: { isExporting: boolean }) => {
  const { gl } = useThree();
  const edgeMode3d = useStore(state => state.edgeMode3d);
  
  useEffect(() => {
    if (edgeMode3d) {
      gl.setClearColor('#000000');
    } else {
      gl.setClearColor(isExporting ? '#ffffff' : '#0f172a');
    }
  }, [isExporting, gl, edgeMode3d]);
  
  return edgeMode3d ? <color attach="background" args={['#000000']} /> : null;
};

const Flashlight = () => {
  const { camera } = useThree();
  const lightRef = React.useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
    }
  });

  return (
    <group>
      <pointLight 
        ref={lightRef} 
        intensity={200} 
        distance={2000} 
        decay={2} 
        color="#ffffff" 
        castShadow
      />
      <ambientLight intensity={0.2} />
    </group>
  );
};

const Furniture = ({ item, pixelsPerCm, isChild = false, parentWidth = 0, parentDepth = 0 }: { item: FurnitureObject, pixelsPerCm: number, isChild?: boolean, parentWidth?: number, parentDepth?: number }) => {
  const width = item.width / pixelsPerCm;
  const depth = item.height / pixelsPerCm;
  const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm;
  const elevation = (item.elevation || 0) / pixelsPerCm;
  
  const rotationRad = -(item.rotation * Math.PI) / 180;

  // Calculate position relative to parent center if it's a child, otherwise world position
  const centerX = isChild 
    ? (item.x + item.width / 2 - parentWidth / 2) / pixelsPerCm
    : (item.x + item.width / 2) / pixelsPerCm;
  const centerZ = isChild
    ? -(item.y + item.height / 2 - parentDepth / 2) / pixelsPerCm
    : (item.y + item.height / 2) / pixelsPerCm;

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
      case 'dresser': return <Dresser3D {...props} drawerRows={item.drawerRows} drawerCols={item.drawerCols} />;
      case 'chair': return <Chair3D {...props} />;
      case 'shelf': return <Shelf3D {...props} hasDoors={item.hasDoors} />;
      case 'electronics': return <Electronics3D {...props} hideStand={item.hideStand} />;
      case 'table': return <Table3D {...props} isRound={item.type === 'circle'} />;
      case 'sofa': return <Sofa3D {...props} />;
      case 'armchair': return <Sofa3D {...props} width={props.width} depth={props.depth} />;
      case 'nightstand': return <Nightstand3D {...props} />;
      case 'toilet': return <Toilet3D {...props} />;
      case 'bathtub': return <Bathtub3D {...props} />;
      case 'light': return <Light3D {...props} />;
      case 'picture': return <Picture3D {...props} imageUrl={item.imageUrl} />;
      default: {
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

  if (item.type === 'group' && item.children) {
    return (
      <group position={[centerX, elevation, centerZ]} rotation={[0, rotationRad, 0]}>
        {item.children.map(child => (
          <Furniture 
            key={child.id} 
            item={child} 
            pixelsPerCm={pixelsPerCm} 
            isChild={true} 
            parentWidth={item.width} 
            parentDepth={item.height} 
          />
        ))}
      </group>
    );
  }

  return (
    <group 
      position={[centerX, elevation, centerZ]} 
      rotation={[0, rotationRad, 0]}
    >
      <group position={[-width / 2, 0, -depth / 2]}>
        {renderFurniture()}
      </group>
    </group>
  );
};

export const ThreeDPreview: React.FC = () => {
  const { rooms, furniture, pixelsPerCm, setShow3d, wallThickness, wallHeight, setWallHeight, wallAttachments, edgeMode3d, setEdgeMode3d, setThreeScene } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'dollhouse' | 'first-person'>('dollhouse');

  useEffect(() => {
    console.log(`[3D Preview] Switched to ${viewMode} view`);
  }, [viewMode]);

  const handleExport = async (isPrint = false) => {
    setIsExporting(true);
    // Wait for a few frames to ensure any background/state changes are applied
    await new Promise(resolve => setTimeout(resolve, 150));

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
        const typePrefix = useStore.getState().edgeMode3d ? 'edge-map' : '3d';
        link.download = `${sanitizedName}-${typePrefix}-${new Date().getTime()}.png`;
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
          <div className="flex bg-slate-700/50 p-1 rounded-xl border border-slate-600 mr-2">
            <button
              onClick={() => setViewMode('dollhouse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'dollhouse' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box size={14} />
              Dollhouse
            </button>
            <button
              onClick={() => setViewMode('first-person')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'first-person' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera size={14} />
              1st Person
            </button>
          </div>
          <button 
            onClick={() => handleExport(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            {edgeMode3d ? 'Save Edge Map' : 'Export Image'}
          </button>
          <button 
            onClick={() => setEdgeMode3d(!edgeMode3d)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              edgeMode3d ? 'bg-white text-slate-900 shadow-inner' : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <Box size={16} />
            {edgeMode3d ? 'Standard View' : 'AI Edge Map'}
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
          camera={viewMode === 'dollhouse' 
            ? { position: [center.x + 400, 400, center.z + 400], fov: 45, near: 1, far: 10000 }
            : { position: [center.x, 160, center.z], fov: 60, near: 0.1, far: 10000 }
          }
          onCreated={({ gl }) => {
            gl.setClearColor('#0f172a');
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        >
          <SceneBackground isExporting={isExporting} />
          {viewMode === 'dollhouse' ? (
            <OrbitControls target={center} makeDefault />
          ) : (
            <FPVControls initialPosition={center} />
          )}
          
          {!edgeMode3d && (
            <>
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
              {viewMode === 'first-person' && <Flashlight />}
            </>
          )}

          <Suspense fallback={null}>
            <group ref={setThreeScene}>
              {!edgeMode3d && (
                <mesh name="InfiniteFloor" rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.2, center.z]} receiveShadow>
                  <planeGeometry args={[10000, 10000]} />
                  <meshStandardMaterial color="#f8fafc" roughness={1} />
                </mesh>
              )}

              {rooms.map(room => (
                <React.Fragment key={room.id}>
                  <WallSegments 
                    room={room} 
                    pixelsPerCm={pixelsPerCm} 
                    wallThickness={wallThickness} 
                    wallHeight={wallHeight}
                    attachments={wallAttachments}
                  />
                  {viewMode === 'first-person' && (
                    <Ceiling 
                      room={room} 
                      pixelsPerCm={pixelsPerCm} 
                      height={wallHeight} 
                    />
                  )}
                </React.Fragment>
              ))}

              {furniture.map(item => (
                <Furniture key={item.id} item={item} pixelsPerCm={pixelsPerCm} />
              ))}
            </group>
          </Suspense>

          {!edgeMode3d && (
            <ContactShadows 
              position={[center.x, 0, center.z]} 
              opacity={0.4} 
              scale={5000} 
              blur={2} 
              far={20} 
            />
          )}
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

          {viewMode === 'dollhouse' ? (
            <div className="bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 text-white text-[10px] font-bold uppercase tracking-wider flex gap-6 pointer-events-none">
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
          ) : (
            <div className="bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 text-white text-[10px] font-bold uppercase tracking-wider flex flex-col gap-2 items-center pointer-events-none">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  WASD / Arrows: Move
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Mouse: Look
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  ESC: Release Mouse
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Scroll: Zoom FOV
                </div>
              </div>
              <div className="text-indigo-400 animate-pulse">
                Click on the scene to start Looking
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
