import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { downloadBlob } from './download';

/**
 * Generates an OBJ string from a THREE.js scene.
 */
export const generateOBJ = (scene: THREE.Object3D): string => {
  // 1. Update Matrices (Ensures global coordinates are correct)
  scene.updateMatrixWorld(true);

  // 2. Setup Exporter & Filtering
  const exporter = new OBJExporter();
  const exportGroup = new THREE.Group();

  // 3. Traverse and clone only Meshes
  scene.traverse((object) => {
    const obj = object as any;
    // Skip ground, helpers, and edge lines
    if (obj.name === 'InfiniteFloor' || obj.isHelper || obj.name.includes('Edges')) return;
    
    if (obj.isMesh) {
      const mesh = object as THREE.Mesh;
      
      // Clone the mesh so we don't modify the original scene
      const clonedMesh = mesh.clone();
      
      // Apply world matrix to clone geometry so it's in absolute space
      clonedMesh.applyMatrix4(mesh.matrixWorld);
      
      // Keep relevant properties
      clonedMesh.name = mesh.name || 'Unnamed Object';
      
      exportGroup.add(clonedMesh);
    }
  });

  // 4. Export
  return exporter.parse(exportGroup);
};

/**
 * Convenience function to generate and download an OBJ file.
 */
export const exportToOBJ = (scene: THREE.Object3D) => {
  const result = generateOBJ(scene);
  const blob = new Blob([result], { type: 'text/plain' });
  downloadBlob(blob, '3d-model.obj');
};
