import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';

interface FPVControlsProps {
  initialPosition: THREE.Vector3;
}

export const FPVControls: React.FC<FPVControlsProps> = ({ initialPosition }) => {
  const { camera } = useThree();
  const { rooms, wallAttachments, pixelsPerCm } = useStore();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    camera.position.set(initialPosition.x, 160, initialPosition.z);
    camera.lookAt(initialPosition.x + 100, 160, initialPosition.z);
  }, [camera, initialPosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = true; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = true; break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = false; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = false; break;
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (camera instanceof THREE.PerspectiveCamera) {
        const zoomSpeed = 0.05;
        const newFov = camera.fov + event.deltaY * zoomSpeed;
        camera.fov = Math.max(20, Math.min(110, newFov));
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera]);

  const checkCollision = (targetPos: THREE.Vector3): boolean => {
    const collisionRadius = 25; // cm (player width)

    for (const room of rooms) {
      const count = room.isClosed ? room.points.length : room.points.length - 1;
      for (let i = 0; i < count; i++) {
        const p1_raw = room.points[i];
        const p2_raw = room.points[(i + 1) % room.points.length];
        
        const p1 = { x: p1_raw.x / pixelsPerCm, z: p1_raw.y / pixelsPerCm };
        const p2 = { x: p2_raw.x / pixelsPerCm, z: p2_raw.y / pixelsPerCm };

        // Vector p1 -> p2
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) continue;

        // Project point onto line
        let t = ((targetPos.x - p1.x) * dx + (targetPos.z - p1.z) * dz) / lenSq;
        const clampedT = Math.max(0, Math.min(1, t));
        
        const projX = p1.x + clampedT * dx;
        const projZ = p1.z + clampedT * dz;

        const distSq = Math.pow(targetPos.x - projX, 2) + Math.pow(targetPos.z - projZ, 2);

        if (distSq < collisionRadius * collisionRadius) {
          // It's a collision candidate. Check if there's a door here.
          const segmentAttachments = wallAttachments.filter(
            a => a.roomId === room.id && a.wallSegmentIndex === i && a.type === 'door'
          );

          const totalLength = Math.sqrt(lenSq);
          let atDoor = false;
          for (const att of segmentAttachments) {
            const attWidth = att.width; // cm
            const attStart = att.positionAlongWall * totalLength - attWidth / 2;
            const attEnd = att.positionAlongWall * totalLength + attWidth / 2;
            const currentPosOnWall = clampedT * totalLength;

            if (currentPosOnWall >= attStart && currentPosOnWall <= attEnd) {
              atDoor = true;
              break;
            }
          }

          if (!atDoor) return true;
        }
      }
    }
    return false;
  };

  useFrame((state, delta) => {
    const moveSpeed = 400 * delta;
    
    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.current.normalize();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up);

    // Calculate intended movements separately for sliding
    const moveX = new THREE.Vector3().addScaledVector(forward, direction.current.z * moveSpeed)
                                      .addScaledVector(right, direction.current.x * moveSpeed);
    
    // Try moving X
    const nextX = camera.position.clone();
    nextX.x += moveX.x;
    if (!checkCollision(nextX)) {
      camera.position.x = nextX.x;
    }

    // Try moving Z
    const nextZ = camera.position.clone();
    nextZ.z += moveX.z;
    if (!checkCollision(nextZ)) {
      camera.position.z = nextZ.z;
    }
    
    camera.position.y = 160;
  });

  return <PointerLockControls />;
};
