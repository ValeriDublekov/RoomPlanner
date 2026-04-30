import * as THREE from 'three';
import { RoomObject, FurnitureObject, WallAttachment } from '../types';
import { getOutwardNormal } from './geometry';
import { createFurnitureModel } from './furnitureFactory';

interface SceneData {
  rooms: RoomObject[];
  furniture: FurnitureObject[];
  wallAttachments: WallAttachment[];
  pixelsPerCm: number;
  wallThickness: number;
  wallHeight: number;
}

export const generateProjectScene = (state: SceneData) => {
  const { rooms, furniture, wallAttachments, pixelsPerCm, wallThickness, wallHeight } = state;
  const mainGroup = new THREE.Group();

  // Helper to create a basic mesh with name
  const createMesh = (geometry: THREE.BufferGeometry, color: string, name: string, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.name = name;
    return mesh;
  };

  // 1. Process Rooms (Floors and Walls)
  rooms.forEach(room => {
    const roomGroup = new THREE.Group();
    roomGroup.name = `Room_${room.id}`;

    // Floor
    if (room.isClosed && room.points.length > 0) {
      const floorShape = new THREE.Shape();
      floorShape.moveTo(room.points[0].x / pixelsPerCm, -room.points[0].y / pixelsPerCm);
      for (let i = 1; i < room.points.length; i++) {
        floorShape.lineTo(room.points[i].x / pixelsPerCm, -room.points[i].y / pixelsPerCm);
      }
      floorShape.closePath();
      
      const floorGeo = new THREE.ShapeGeometry(floorShape);
      const floorMesh = createMesh(floorGeo, room.floorColor || "#e2e8f0", "Floor", [0, 0.1, 0], [-Math.PI / 2, 0, 0]);
      roomGroup.add(floorMesh);
    }

    // Walls
    const count = room.isClosed ? room.points.length : room.points.length - 1;
    for (let i = 0; i < count; i++) {
      const p1 = room.points[i];
      const p2 = room.points[(i + 1) % room.points.length];
      
      const dx = (p2.x - p1.x) / pixelsPerCm;
      const dy = (p2.y - p1.y) / pixelsPerCm;
      const totalLength = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const segmentAttachments = wallAttachments
        .filter(a => a.roomId === room.id && a.wallSegmentIndex === i)
        .sort((a, b) => a.positionAlongWall - b.positionAlongWall);

      const segmentColor = room.wallColors?.[i] || room.defaultWallColor || "#f0f0f0";
      const normal = getOutwardNormal(room.points, i);
      const offsetX = (normal.x * wallThickness) / 2;
      const offsetZ = (normal.y * wallThickness) / 2;

      const addWallPart = (len: number, midX: number, midZ: number, h: number, y: number, nameSuffix = "") => {
        const geo = new THREE.BoxGeometry(len, h, wallThickness);
        const mesh = createMesh(geo, segmentColor, `Wall_${i}${nameSuffix}`, [midX, y, midZ], [0, -angle, 0]);
        roomGroup.add(mesh);
      };

      if (segmentAttachments.length === 0) {
        const midX = (p1.x + p2.x) / (2 * pixelsPerCm) + offsetX;
        const midZ = (p1.y + p2.y) / (2 * pixelsPerCm) + offsetZ;
        addWallPart(totalLength, midX, midZ, wallHeight, wallHeight / 2);
      } else {
        let currentPos = 0;
        segmentAttachments.forEach((att, attIdx) => {
          const attWidth = att.width / pixelsPerCm;
          const attCenterPos = att.positionAlongWall * totalLength;
          const attStartPos = Math.max(0, attCenterPos - attWidth / 2);
          const attEndPos = Math.min(totalLength, attCenterPos + attWidth / 2);

          if (attStartPos > currentPos) {
            const partLength = attStartPos - currentPos;
            const partMidPos = currentPos + partLength / 2;
            const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos + offsetX;
            const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos + offsetZ;
            addWallPart(partLength, midX, midZ, wallHeight, wallHeight / 2, `_part_${attIdx}`);
          }

          const sillHeight = att.type === 'door' ? 0 : 90;
          const openingHeight = att.type === 'door' ? 210 : 120;
          const headerHeight = Math.max(0, wallHeight - (sillHeight + openingHeight));
          
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * attCenterPos + offsetX;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * attCenterPos + offsetZ;

          if (att.type === 'window' && sillHeight > 0) {
            addWallPart(attWidth, midX, midZ, sillHeight, sillHeight / 2, `_sill_${attIdx}`);
          }
          if (headerHeight > 0) {
            addWallPart(attWidth, midX, midZ, headerHeight, wallHeight - headerHeight / 2, `_header_${attIdx}`);
          }

          // Glass
          if (att.type === 'window') {
            const glassH = Math.min(openingHeight, wallHeight - sillHeight);
            const glassGeo = new THREE.BoxGeometry(attWidth, glassH, wallThickness * 0.2);
            const glassMesh = createMesh(glassGeo, "#93c5fd", `Window_Glass_${attIdx}`, [midX, sillHeight + glassH / 2, midZ], [0, -angle, 0]);
            roomGroup.add(glassMesh);
          }

          currentPos = attEndPos;
        });

        if (currentPos < totalLength) {
          const partLength = totalLength - currentPos;
          const partMidPos = currentPos + partLength / 2;
          const midX = (p1.x / pixelsPerCm) + Math.cos(angle) * partMidPos + offsetX;
          const midZ = (p1.y / pixelsPerCm) + Math.sin(angle) * partMidPos + offsetZ;
          addWallPart(partLength, midX, midZ, wallHeight, wallHeight / 2, `_end`);
        }
      }
    }
    mainGroup.add(roomGroup);
  });

  // 2. Process Furniture
  furniture.forEach(item => {
    // Determine the 3D model to use
    const width = item.width / pixelsPerCm;
    const depth = item.height / pixelsPerCm;
    const height = (item.height3d || 75 * pixelsPerCm) / pixelsPerCm;
    const elevation = (item.elevation || 0) / pixelsPerCm;
    const rotationRad = -(item.rotation * Math.PI) / 180;
    
    // Get center positioning
    const centerX = (item.x + item.width / 2) / pixelsPerCm;
    const centerZ = (item.y + item.height / 2) / pixelsPerCm;

    // Use factory for detailed model
    const furnitureModel = createFurnitureModel(item.furnitureType || 'generic', {
      width,
      height,
      depth,
      color: item.color || '#f8fafc',
      secondaryColor: item.secondaryColor
    });

    furnitureModel.position.set(centerX, elevation, centerZ);
    furnitureModel.rotation.y = rotationRad;
    furnitureModel.name = item.name || item.furnitureType || 'Furniture';

    mainGroup.add(furnitureModel);
  });

  return mainGroup;
};

