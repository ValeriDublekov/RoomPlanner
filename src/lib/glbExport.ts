import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { downloadBlob } from './download';

/**
 * Generates a GLB Blob from a THREE.js scene.
 */
export const generateGLB = (scene: THREE.Object3D): Promise<Blob> => {
  return new Promise((resolve, reject) => {
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
          resolve(blob);
        } catch (err) {
          reject(err);
        } finally {
          restoreVisibility();
        }
      },
      (error) => {
        restoreVisibility();
        reject(error);
      },
      { binary: true }
    );
  });
};

/**
 * Convenience function to generate and download a GLB file.
 */
export const exportToGLB = async (scene: THREE.Object3D) => {
  try {
    const blob = await generateGLB(scene);
    downloadBlob(blob, 'room-model.glb');
  } catch (error) {
    console.error('GLB Export Error:', error);
  }
};

