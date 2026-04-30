import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const exportToGLB = (scene: THREE.Object3D) => {
  // 1. Update Matrices (Critical for correct global positions)
  scene.updateMatrixWorld(true);

  // 2. Temporarily hide non-essential objects (Grid, Helpers, etc.)
  // Designers usually only want Meshes. GLTFExporter naturally handles Groups.
  const hiddenObjects: THREE.Object3D[] = [];
  scene.traverse((object) => {
    // We keep Meshes and Groups (for hierarchy). Hide others if they are helpers/lights/cameras.
    const obj = object as any;
    if (!obj.isMesh && !obj.isGroup) {
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
  
  // 4. Parse the ORIGINAL scene to preserve hierarchy/coordinartes
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
      console.error('An error happened during GLB export:', error);
      restoreVisibility();
    },
    { binary: true }
  );
};
