import * as THREE from 'three';

interface FurnitureParams {
  width: number;
  height: number;
  depth: number;
  color: string;
  secondaryColor?: string;
  hasDoors?: boolean;
  drawerRows?: number;
  drawerCols?: number;
  hasHeadboard?: boolean;
  headboardHeight?: number;
  headboardTilt?: number;
  mattressWidth?: number;
  mattressDepth?: number;
}

export const createFurnitureModel = (type: string, params: FurnitureParams): THREE.Group => {
  const group = new THREE.Group();
  const { width, height, depth, color, secondaryColor } = params;
  const doorColor = secondaryColor || color;

  const loader = new THREE.TextureLoader();
  const woodTexture = loader.load(params.color.startsWith('#') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjQnIGhlaWdodD0nNjQnIHZpZXdCb3g9JzAgMCA2NCA2NCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nNjQnIGhlaWdodD0nNjQnIGZpbGw9JyNmZmZmZmYnLz48ZyBvcGFjaXR5PScwLjA1Jz48cmVjdCB4PScwJyB5PScwJyB3aWR0aD0nMC41JyBoZWlnaHQ9JzY0JyBmaWxsPScjMDAwMDAwJy8+PHJlY3QgeD0nMTAnIHk9JzAnIHdpZHRoPScwLjUnIGhlaWdodD0nNjQnIGZpbGw9JyMwMDAwMDAnLz48cmVjdCB4PScyNScgeT0nMCcgd2lkdGg9JzAuNScgaGVpZ2h0PScMapJyBmaWxsPScjMDAwMDAwJy8+PHJlY3QgeD0nNDUnIHk9JzAnIHdpZHRoPScwLjUnIGhlaWdodD0nNjQnIGZpbGw9JyMwMDAwMDAnLz48cmVjdCB4PSc1NScgeT0nMCcgd2lkdGg9JzAuNScgaGVpZ2h0PSc2NCcgZmlsbD0nIzAwMDAwMCcvPjwvZz48L3N2Zz4=' : '');
  if (woodTexture) {
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(0.02, 0.02);
  }

  const createBox = (w: number, h: number, d: number, col: string, pos: [number, number, number], name: string, useWood = true) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ 
      color: col, 
      roughness: 0.8,
      map: (useWood && woodTexture.image) ? woodTexture : null
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  switch (type.toLowerCase()) {
    case 'wardrobe':
    case 'closet': {
      // Body
      group.add(createBox(width, height, depth, color, [0, height / 2, 0], 'Carcass'));
      // Doors
      const numDoors = width < 100 ? 2 : 3;
      const doorWidth = (width - 2) / numDoors;
      for (let i = 0; i < numDoors; i++) {
        const xPos = -width / 2 + (i * doorWidth + doorWidth / 2 + 1);
        const door = createBox(doorWidth - 0.5, height - 2, 1, doorColor, [xPos, height / 2, depth / 2 + 0.6], `Door_${i}`);
        group.add(door);
        
        // Handle position logic: pair them up. 0-1, 2-3, etc.
        const isLeftDoorInPair = i % 2 === 0;
        const isRightDoorInPair = i % 2 === 1;
        const isLastOddDoor = i === numDoors - 1 && numDoors % 2 !== 0;
        
        const handleXOffset = (isLeftDoorInPair && !isLastOddDoor) 
          ? doorWidth / 3 
          : (isRightDoorInPair ? -doorWidth / 3 : -doorWidth / 3);

        const handle = createBox(2, 15, 1, '#94a3b8', [xPos + handleXOffset, height / 2, depth / 2 + 1.2], `Handle_${i}`);
        group.add(handle);
      }
      break;
    }

    case 'bed': {
      const frameH = Math.min(height * 0.4, 30);
      const mattressT = 20;
      const frameThickness = 3;
      
      const mWidth = params.mattressWidth || (width - frameThickness * 2);
      const mDepth = params.mattressDepth || (depth - frameThickness - 5);
      
      const hbH = params.headboardHeight || 60;
      const tiltDeg = params.headboardTilt || 15;
      const tiltRad = (tiltDeg * Math.PI) / 180;
      const hbThickness = 8;
      const hbProjection = params.hasHeadboard ? Math.sin(tiltRad) * hbH : 0;
      const hbDepth = params.hasHeadboard ? (hbThickness + hbProjection) : 0;
      
      const zOffset = hbDepth;

      // Base Frame
      group.add(createBox(mWidth + frameThickness * 2, frameH, mDepth + frameThickness, color, [0, frameH / 2, -depth/2 + zOffset + mDepth/2 + frameThickness/2], 'Frame'));
      
      // Mattress
      group.add(createBox(mWidth - 2, mattressT, mDepth - 2, doorColor, [0, frameH + mattressT / 2, -depth/2 + zOffset + mDepth/2], 'Mattress'));
      
      // Headboard
      if (params.hasHeadboard) {
        const hbGroup = new THREE.Group();
        hbGroup.position.set(0, frameH, -depth/2 + hbDepth);
        
        const headboard = createBox(mWidth + frameThickness * 2, hbH, hbThickness, color, [0, hbH / 2, -hbThickness / 2], 'Headboard');
        headboard.rotation.x = -tiltRad;
        hbGroup.add(headboard);
        group.add(hbGroup);
      }

      // Pillows
      group.add(createBox(mWidth * 0.35, 6, 25, doorColor, [-mWidth * 0.25, frameH + mattressT + 3, -depth / 2 + zOffset + 20], 'Pillow_L'));
      group.add(createBox(mWidth * 0.35, 6, 25, doorColor, [mWidth * 0.25, frameH + mattressT + 3, -depth / 2 + zOffset + 20], 'Pillow_R'));
      break;
    }

    case 'desk':
    case 'table': {
      const topH = 4;
      group.add(createBox(width, topH, depth, color, [0, height - topH / 2, 0], 'Top'));
      // Legs
      const legPos = [
        [-width / 2 + 3, -depth / 2 + 3],
        [width / 2 - 3, -depth / 2 + 3],
        [-width / 2 + 3, depth / 2 - 3],
        [width / 2 - 3, depth / 2 - 3],
      ];
      legPos.forEach(([x, z], i) => {
        const leg = createBox(4, height - topH, 4, '#334155', [x, (height - topH) / 2, z], `Leg_${i}`);
        group.add(leg);
      });
      break;
    }

    case 'couch':
    case 'sofa': {
      const seatH = height * 0.5;
      group.add(createBox(width, seatH, depth, color, [0, seatH / 2, 0], 'Seat'));
      group.add(createBox(width, height - seatH, 15, color, [0, seatH + (height - seatH) / 2, -depth / 2 + 7.5], 'Backrest'));
      group.add(createBox(15, height * 0.7, depth, color, [-width / 2 + 7.5, (height * 0.7) / 2, 0], 'Arm_L'));
      group.add(createBox(15, height * 0.7, depth, color, [width / 2 - 7.5, (height * 0.7) / 2, 0], 'Arm_R'));
      break;
    }

    case 'nightstand': {
      group.add(createBox(width, height, depth, color, [0, height / 2, 0], 'Body'));
      group.add(createBox(width - 2, 2, 2, '#94a3b8', [0, height - 10, depth / 2 + 0.1], 'Handle'));
      break;
    }

    case 'dresser': {
      const carcassThickness = 2;
      // Bottom
      group.add(createBox(width, carcassThickness, depth, color, [0, carcassThickness / 2, 0], 'Bottom'));
      // Top
      group.add(createBox(width, carcassThickness, depth, color, [0, height - carcassThickness / 2, 0], 'Top'));
      // Sides
      group.add(createBox(carcassThickness, height, depth, color, [-width / 2 + carcassThickness / 2, height / 2, 0], 'Side_L'));
      group.add(createBox(carcassThickness, height, depth, color, [width / 2 - carcassThickness / 2, height / 2, 0], 'Side_R'));
      // Back
      group.add(createBox(width - carcassThickness * 2, height - carcassThickness * 2, 1, color, [0, height / 2, -depth / 2 + 0.5], 'Back'));

      const finalCols = params.drawerCols || Math.ceil(width / 80);
      const finalRows = params.drawerRows || Math.max(1, Math.floor(height / 20));
      
      const colW = (width - 4) / finalCols;
      const rowH = (height - 4) / finalRows;

      for (let col = 0; col < finalCols; col++) {
        for (let row = 0; row < finalRows; row++) {
          const xPos = -width / 2 + (col * colW + colW / 2 + 2);
          const yPos = row * rowH + rowH / 2 + 2;
          
          // Drawer front
          group.add(createBox(colW - 1, rowH - 2, 1.5, doorColor, [xPos, yPos, depth / 2 + 0.2], `Drawer_${col}_${row}`));
          // Handle
          group.add(createBox(Math.min(10, colW * 0.5), 2, 1, '#94a3b8', [xPos, yPos, depth / 2 + 1.2], `Handle_${col}_${row}`));
        }
      }
      break;
    }

    case 'chair':
    case 'office-chair': {
      const seatH = height * 0.5;
      const legSize = 3;
      // Legs
      const legPositions = [
        [-width / 2 + legSize, -depth / 2 + legSize],
        [width / 2 - legSize, -depth / 2 + legSize],
        [-width / 2 + legSize, depth / 2 - legSize],
        [width / 2 - legSize, depth / 2 - legSize],
      ];
      legPositions.forEach(([x, z], i) => {
        group.add(createBox(legSize, seatH, legSize, '#334155', [x, seatH / 2, z], `Leg_${i}`));
      });
      // Seat
      group.add(createBox(width, 4, depth, color, [0, seatH, 0], 'Seat'));
      // Backrest
      group.add(createBox(width, height - seatH, 4, color, [0, seatH + (height - seatH) / 2, -depth / 2 + 2], 'Backrest'));
      break;
    }

    case 'armchair': {
      const seatH = height * 0.45;
      group.add(createBox(width, seatH, depth, color, [0, seatH / 2, 0], 'SeatBase'));
      group.add(createBox(width - 20, 10, depth - 5, doorColor, [0, seatH + 5, 2.5], 'Cushion'));
      group.add(createBox(width, height - seatH, 15, color, [0, seatH + (height - seatH) / 2, -depth / 2 + 7.5], 'Backrest'));
      group.add(createBox(15, height * 0.7, depth, color, [-width / 2 + 7.5, (height * 0.7) / 2, 0], 'Arm_L'));
      group.add(createBox(15, height * 0.7, depth, color, [width / 2 - 7.5, (height * 0.7) / 2, 0], 'Arm_R'));
      break;
    }

    case 'picture': {
      // Thin frame on the wall
      group.add(createBox(width, height, 2, '#475569', [0, height / 2, 0], 'Frame'));
      group.add(createBox(width - 4, height - 4, 0.5, '#ffffff', [0, height / 2, 1.1], 'Canvas'));
      break;
    }

    case 'electronics': { // TV
      group.add(createBox(width, height, 3, '#0f172a', [0, height / 2, 0], 'ScreenBody'));
      group.add(createBox(width - 2, height - 2, 0.1, '#1e293b', [0, height / 2, 1.6], 'Display'));
      // Stand if height is above floor
      group.add(createBox(width * 0.4, 2, depth, '#0f172a', [0, -height/2, 0], 'Base'));
      break;
    }

    case 'toilet': {
      group.add(createBox(width, height * 0.6, depth * 0.6, '#ffffff', [0, height * 0.3, depth * 0.2], 'Bowl'));
      group.add(createBox(width, height, depth * 0.3, '#ffffff', [0, height * 0.5, -depth * 0.35], 'Tank'));
      break;
    }

    case 'bathtub': {
      group.add(createBox(width, height, depth, '#ffffff', [0, height / 2, 0], 'Body'));
      // Hollow it out slightly with a "water" plane or just top shadow
      group.add(createBox(width - 10, 2, depth - 10, '#cbd5e1', [0, height - 2, 0], 'Interior'));
      break;
    }

    case 'light': {
      // Base
      group.add(createBox(width * 0.5, 2, depth * 0.5, '#475569', [0, 0, 0], 'Base'));
      // Pole
      group.add(createBox(2, height - 15, 2, '#94a3b8', [0, (height - 15) / 2, 0], 'Pole'));
      // Shade
      group.add(createBox(width, 15, depth, color, [0, height - 7.5, 0], 'Shade'));
      break;
    }

    case 'shelf': {
      const shelfThickness = 2;

      // Vertical Sides
      group.add(createBox(shelfThickness, height, depth, color, [-width / 2 + shelfThickness / 2, height / 2, 0], 'Side_L'));
      group.add(createBox(shelfThickness, height, depth, color, [width / 2 - shelfThickness / 2, height / 2, 0], 'Side_R'));
      
      // Top & Bottom
      group.add(createBox(width, shelfThickness, depth, color, [0, shelfThickness / 2, 0], 'Bottom'));
      group.add(createBox(width, shelfThickness, depth, color, [0, height - shelfThickness / 2, 0], 'Top'));

      // Back panel
      group.add(createBox(width - shelfThickness * 2, height - shelfThickness * 2, 0.5, color, [0, height / 2, -depth / 2 + 0.25], 'BackPanel'));

      const numLevels = Math.floor(height / 40);
      if (numLevels > 1) {
        for (let i = 1; i < numLevels; i++) {
          const y = (i / numLevels) * height;
          group.add(createBox(width - shelfThickness * 2, shelfThickness, depth - 2, color, [0, y, 0], `InternalShelf_${i}`));
        }
      }

      // Doors if it's a cabinet
      if (width > 40 && height > 40 && (type.toLowerCase().includes('cabinet') || secondaryColor)) {
         const numSections = Math.floor((width - 1) / 50) + 1;
         const sectionWidth = width / numSections;
         
         for (let i = 0; i < numSections; i++) {
           const xPos = -width / 2 + (i * sectionWidth + sectionWidth / 2);
           
           const isLeftDoorInPair = i % 2 === 0;
           const isRightDoorInPair = i % 2 === 1;
           const isLastOddDoor = i === numSections - 1 && numSections % 2 !== 0;
           
           const handleSide = (isLeftDoorInPair && !isLastOddDoor) ? 1 : -1;
           const handleX = handleSide * (sectionWidth / 2 - 4);
           
           // Door front
           group.add(createBox(sectionWidth - 0.5, height - shelfThickness, 1.5, doorColor, [xPos, height / 2, depth / 2 + 0.5], `Door_${i}`));
           
           // Handle
           group.add(createBox(1, 10, 1, '#94a3b8', [xPos + handleX, height / 2, depth / 2 + 1.5], `Handle_${i}`));
         }
      }
      break;
    }

    case 'rug': {
      const rugH = 0.5;
      group.add(createBox(width, rugH, depth, color, [0, rugH / 2, 0], 'Rug'));
      break;
    }

    default: {
      // Fallback to simple box
      group.add(createBox(width, height, depth, color, [0, height / 2, 0], 'MainBody'));
    }
  }

  return group;
};
