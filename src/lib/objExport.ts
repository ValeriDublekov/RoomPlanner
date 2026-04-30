import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

export const exportToOBJ = (scene: THREE.Object3D) => {
  // 1. Update Matrices (Ensures global coordinates are correct)
  scene.updateMatrixWorld(true);

  // 2. Setup Exporter & Filtering
  const exporter = new OBJExporter();
  const exportGroup = new THREE.Group();

  // 3. Traverse and clone only Meshes
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
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
  const result = exporter.parse(exportGroup);

  // 5. Download
  const blob = new Blob([result], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = '3d-model.obj';
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
