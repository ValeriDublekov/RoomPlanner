import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const exportToGLB = (scene: THREE.Object3D) => {
  // 1. Update Matrices (Ensures all children have correct world positions)
  scene.updateMatrixWorld(true);

  // 2. Temporarily hide non-essential objects
  const hiddenObjects: THREE.Object3D[] = [];
  scene.traverse((object) => {
    const obj = object as any;
    
    // Hide helpers, grids, axes, and the infinite ground plane
    if (
      obj.isHelper || 
      obj.name === 'InfiniteFloor' || 
      (!obj.isMesh && !obj.isGroup && !obj.isSprite)
    ) {
      if (object.visible) {
        object.visible = false;
        hiddenObjects.push(object);
      }
    }
  });

  const restoreVisibility = () => {
    hiddenObjects.forEach(obj => {
      obj.visible = true;
    });
  };

  // 3. Setup Exporter
  const exporter = new GLTFExporter();
  
  // 4. Parse the scene to preserve hierarchy/coordinates
  exporter.parse(
    scene,
    (gltf) => {
      try {
        const isArrayBuffer = gltf instanceof ArrayBuffer;
        const buffer = isArrayBuffer ? gltf : JSON.stringify(gltf);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'room-model.glb';
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } finally {
        restoreVisibility();
      }
    },
    (error) => {
      console.error('GLB Export Error:', error);
      restoreVisibility();
    },
    { binary: true }
  );
};

