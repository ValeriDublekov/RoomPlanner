import React from 'react';
import { useTexture, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { WOOD_GRAIN } from '../../constants';
import { useStore } from '../../store';

interface ModelProps {
  width: number;
  depth: number;
  height: number;
  color: string;
  secondaryColor?: string;
  hasDoors?: boolean;
  imageUrl?: string;
  materials?: import('../../types').ObjectMaterials;
  furnitureType?: string;
}

const getSlotColor = (materials: import('../../types').ObjectMaterials | undefined, slot: keyof import('../../types').ObjectMaterials, fallback: string) => {
  return materials?.[slot]?.value || fallback;
};

const WoodMaterial: React.FC<{ color: string, opacity?: number, transparent?: boolean }> = ({ color, opacity = 1, transparent = false }) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  const texture = useTexture(WOOD_GRAIN);
  
  React.useLayoutEffect(() => {
    /* eslint-disable-next-line react-hooks/immutability */
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.02, 0.02);
  }, [texture]);
  
  if (edgeMode) {
    return (
      <>
        <meshBasicMaterial color="black" transparent={transparent} opacity={opacity} />
        <Edges color="white" threshold={20} />
      </>
    );
  }
  
  return <meshStandardMaterial color={color} map={texture} roughness={0.8} opacity={opacity} transparent={transparent} />;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const SmartMaterial = (props: any) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  if (edgeMode) {
    // In Edge Mode, we strictly want black surfaces and white outlines.
    // We ignore color, map and emissive to prevent surfaces from appearing white/textured.
    const { 
      color: _c, 
      map: _m, 
      emissive: _e, 
      emissiveIntensity: _ei, 
      transparent, 
      opacity, 
      side, 
      ...otherProps 
    } = props;
/* eslint-enable @typescript-eslint/no-unused-vars */
    return (
      <>
        <meshBasicMaterial 
          color="black" 
          transparent={transparent} 
          opacity={opacity} 
          side={side || THREE.FrontSide} 
          {...otherProps} 
        />
        <Edges color="white" threshold={20} />
      </>
    );
  }
  return <meshStandardMaterial {...props} />;
};

export const Bed3D: React.FC<ModelProps & { 
  hasHeadboard?: boolean, 
  headboardHeight?: number, 
  headboardTilt?: number,
  mattressWidth?: number,
  mattressDepth?: number
}> = ({ width, depth, height, color, secondaryColor, hasHeadboard, headboardHeight = 60, headboardTilt = 15, mattressWidth, mattressDepth, materials }) => {
  const frameHeight = Math.min(height * 0.4, 30);
  const mattressThickness = 20;
  const mattressInset = 2; 
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  const textileMainColor = getSlotColor(materials, 'textileMain', secondaryColor || "#ffffff");
  const textileAccentColor = getSlotColor(materials, 'textileAccent', "#ffffff");
  
  const mattressColor = textileMainColor;
  const frameThickness = 3;
  
  // Use mattress size if provided, otherwise derive from width/depth
  const mWidth = mattressWidth || (width - frameThickness * 2);
  const mDepth = mattressDepth || (depth - frameThickness - 5);
  
  // Headboard settings
  const hbThickness = 8;
  const hbHeight = headboardHeight || 60; // Height above mattress
  const tiltRad = ((headboardTilt || 15) * Math.PI) / 180;
  
  // Calculate headboard projection (how much it slants back)
  const hbProjection = hasHeadboard ? Math.sin(tiltRad) * hbHeight : 0;
  const hbDepth = hasHeadboard ? (hbThickness + hbProjection) : 0;
  
  // Offset everything forward by hbDepth so nothing goes behind z=0
  const zOffset = hbDepth;
  
  return (
    <group>
      {/* Base Frame - sized to fit mattress plus frame thickness */}
      <mesh position={[width / 2, frameHeight / 2, zOffset + mDepth / 2 + frameThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[mWidth + frameThickness * 2, frameHeight, mDepth + frameThickness]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Mattress */}
      <mesh position={[width / 2, frameHeight + mattressThickness / 2, zOffset + mDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[mWidth - mattressInset, mattressThickness, mDepth - mattressInset]} />
        <SmartMaterial color={mattressColor} roughness={0.9} />
      </mesh>
      
      {/* Headboard */}
      {hasHeadboard && (
        <group position={[width / 2, frameHeight, hbDepth]}>
          <group rotation={[-tiltRad, 0, 0]}>
            <mesh position={[0, hbHeight / 2, -hbThickness / 2]} castShadow receiveShadow>
              <boxGeometry args={[mWidth + frameThickness * 2, hbHeight, hbThickness]} />
              <WoodMaterial color={woodBaseColor} />
              <Edges color="white" threshold={20} />
            </mesh>
          </group>
        </group>
      )}

      {/* Pillows - placed near headboard */}
      <group position={[width / 2, frameHeight + mattressThickness, zOffset + 20]}>
        <mesh position={[-mWidth * 0.25, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[mWidth * 0.35, 6, 25]} />
          <SmartMaterial color={textileAccentColor} roughness={1} />
        </mesh>
        <mesh position={[mWidth * 0.25, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[mWidth * 0.35, 6, 25]} />
          <SmartMaterial color={textileAccentColor} roughness={1} />
        </mesh>
      </group>
    </group>
  );
};

export const Sofa3D: React.FC<ModelProps> = ({ width, depth, height, color, materials }) => {
  const seatHeight = height * 0.5;
  const armWidth = 15;
  const backDepth = 15;
  
  const textileMainColor = getSlotColor(materials, 'textileMain', color);
  
  return (
    <group>
      {/* Base/Seat */}
      <mesh position={[width / 2, seatHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, seatHeight, depth]} />
        <SmartMaterial color={textileMainColor} roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[width / 2, height / 2 + seatHeight / 2, backDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height - seatHeight, backDepth]} />
        <SmartMaterial color={textileMainColor} roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <SmartMaterial color={textileMainColor} roughness={0.9} />
      </mesh>
      <mesh position={[width - armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <SmartMaterial color={textileMainColor} roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Nightstand3D: React.FC<ModelProps> = ({ width, depth, height, color, materials }) => {
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  
  return (
    <group>
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width / 2, height * 0.7, depth + 0.6]} castShadow receiveShadow>
        <boxGeometry args={[width - 4, 2, 1]} />
        <SmartMaterial color="#94a3b8" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  );
};

export const Toilet3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <group>
    {/* Tank */}
    <mesh position={[width / 2, height * 0.8, depth * 0.2]} castShadow receiveShadow>
      <boxGeometry args={[width, height * 0.4, depth * 0.3]} />
      <SmartMaterial color={color} roughness={0.1} />
    </mesh>
    {/* Bowl */}
    <mesh position={[width / 2, height * 0.3, depth * 0.6]} castShadow receiveShadow>
      <cylinderGeometry args={[width / 2, width / 3, height * 0.6, 16]} />
      <SmartMaterial color={color} roughness={0.1} />
    </mesh>
  </group>
);

export const Bathtub3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <group>
    <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <SmartMaterial color={color} roughness={0.1} />
    </mesh>
    <mesh position={[width / 2, height * 0.6, depth / 2]}>
      <boxGeometry args={[width - 10, height * 0.8, depth - 10]} />
      <SmartMaterial color="#e2e8f0" roughness={0.1} />
    </mesh>
  </group>
);

export const Desk3D: React.FC<ModelProps> = ({ width, depth, height, color, materials }) => {
  const topThickness = 4; // 4cm
  const legRadius = 2; // 2cm
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  
  return (
    <group>
      {/* Desktop */}
      <mesh position={[width / 2, height - topThickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Legs */}
      {[
        [legRadius, legRadius],
        [width - legRadius, legRadius],
        [legRadius, depth - legRadius],
        [width - legRadius, depth - legRadius]
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], (height - topThickness) / 2, pos[1]]} castShadow receiveShadow>
          <cylinderGeometry args={[legRadius, legRadius, height - topThickness, 16]} />
          <SmartMaterial color="#334155" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

export const Wardrobe3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor, materials }) => {
  const numDoors = width < 100 ? 2 : 3;
  const doorWidth = (width - 2) / numDoors;
  const handleRadius = 1;
  const handleHeight = 15;
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  const woodFrontColor = getSlotColor(materials, 'woodFront', secondaryColor || woodBaseColor);
  
  return (
    <group>
      {/* Carcass */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Doors */}
      {Array.from({ length: numDoors }).map((_, i) => {
        // Handle position logic: pair them up. 0-1, 2-3, etc.
        // For the last door in an odd count, put handle on the "opening" side (usually right)
        const isLeftDoorInPair = i % 2 === 0;
        const isRightDoorInPair = i % 2 === 1;
        const isLastOddDoor = i === numDoors - 1 && numDoors % 2 !== 0;
        
        const handleXOffset = (isLeftDoorInPair && !isLastOddDoor) 
          ? doorWidth / 3 
          : (isRightDoorInPair ? -doorWidth / 3 : -doorWidth / 3);

        return (
          <group key={i} position={[i * doorWidth + doorWidth / 2 + 1, height / 2, depth + 0.6]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[doorWidth - 0.5, height - 2, 1]} />
              <WoodMaterial color={woodFrontColor} />
            </mesh>
            
            {/* Handle */}
            <mesh position={[handleXOffset, 0, 1.1]} castShadow receiveShadow>
              <cylinderGeometry args={[handleRadius, handleRadius, handleHeight, 8]} />
              <SmartMaterial color="#94a3b8" metalness={0.8} roughness={0.2} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Dresser3D: React.FC<ModelProps & { drawerRows?: number, drawerCols?: number }> = ({ width, depth, height, color, secondaryColor, drawerRows, drawerCols, materials }) => {
  const finalCols = drawerCols || Math.ceil(width / 80);
  const finalRows = drawerRows || Math.max(1, Math.floor(height / 20));
  
  const colWidth = (width - 4) / finalCols;
  const rowHeight = (height - 4) / finalRows;
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  const woodFrontColor = getSlotColor(materials, 'woodFront', secondaryColor || woodBaseColor);
  
  const thickness = 2;
  
  return (
    <group>
      {/* Carcass Panels */}
      <mesh position={[width / 2, thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width / 2, height - thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width - thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[width - thickness * 2, height - thickness * 2, 1]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Internal Dividers for columns if more than 1 */}
      {finalCols > 1 && Array.from({ length: finalCols - 1 }).map((_, i) => (
        <mesh key={`div-${i}`} position={[(i + 1) * colWidth + 2, height / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[thickness, height - thickness * 2, depth - thickness]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
      ))}

      {/* Drawers */}
      {Array.from({ length: finalCols }).map((_, col) => (
        Array.from({ length: finalRows }).map((_, row) => (
          <group key={`${col}-${row}`} position={[col * colWidth + colWidth / 2 + 2, row * rowHeight + rowHeight / 2 + 2, depth + 0.3]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[colWidth - 1, rowHeight - 2, 0.8]} />
              <WoodMaterial color={woodFrontColor} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0, 0.8]} castShadow receiveShadow>
              <boxGeometry args={[Math.min(10, colWidth * 0.5), 1, 1]} />
              <SmartMaterial color="#94a3b8" metalness={0.8} roughness={0.2} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
            </mesh>
          </group>
        ))
      ))}
    </group>
  );
};

export const FoldingChair3D: React.FC<ModelProps> = ({ width, depth, height, color, materials }) => {
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  const seatHeight = 45;
  const legThickness = 2.4;
  const backrestHeight = 15;
  
  // Outer frame params (Front-floor to Back-top)
  const outerLength = Math.sqrt(depth * depth + height * height);
  const outerAngle = -Math.atan2(depth, height);
  
  // Inner frame params (Back-floor to Front-support)
  const innerLength = Math.sqrt(depth * depth + seatHeight * seatHeight);
  const innerAngle = Math.atan2(depth, seatHeight);
  
  const outerWidth = width;
  const innerWidth = width - legThickness * 2 - 1.2;

  return (
    <group position={[width / 2, 0, depth / 2]}>
      {/* OUTER FRAME (Backrest frame) */}
      <group position={[0, height / 2, 0]} rotation={[outerAngle, 0, 0]}>
        <mesh position={[outerWidth / 2 - legThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[legThickness, outerLength, legThickness]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
        <mesh position={[-outerWidth / 2 + legThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[legThickness, outerLength, legThickness]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>

        {/* Backrest Panel */}
        <group position={[0, outerLength / 2 - backrestHeight / 2 - 1, legThickness / 2]}>
          <mesh castShadow>
            <boxGeometry args={[outerWidth, backrestHeight, 1.2]} />
            <WoodMaterial color={woodBaseColor} />
          </mesh>
          <mesh position={[0, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 0.2, 24]} />
            <meshStandardMaterial color="#333" opacity={0.4} transparent />
          </mesh>
        </group>
        
        {/* Lower Cross Rail */}
        <mesh position={[0, -outerLength * 0.3, 0]} castShadow>
          <boxGeometry args={[outerWidth - legThickness, legThickness * 0.8, legThickness * 0.8]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
      </group>

      {/* INNER FRAME (Crossing support frame) */}
      <group position={[0, seatHeight / 2, 0]} rotation={[innerAngle, 0, 0]}>
        <mesh position={[innerWidth / 2 - legThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[legThickness, innerLength, legThickness]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
        <mesh position={[-innerWidth / 2 + legThickness / 2, 0, 0]} castShadow>
          <boxGeometry args={[legThickness, innerLength, legThickness]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>

        {/* Bottom Stabilizer Bar */}
        <mesh position={[0, -innerLength / 2 + 6, 0]} castShadow>
          <boxGeometry args={[innerWidth - legThickness, legThickness * 0.8, legThickness * 0.8]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
        
        {/* Seat Support Rail (Upper inner cross rail) */}
        <mesh position={[0, innerLength / 2 - 1, 0]} castShadow>
          <boxGeometry args={[innerWidth - legThickness, legThickness * 1.2, legThickness * 1.2]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
      </group>

      {/* SEAT */}
      {(() => {
        // Geometric alignment for seat
        // Attach at z(y=seatHeight) on the outer frame
        const zBack = (depth / 2) - (depth * seatHeight / height);
        const zFront = depth / 2;
        const seatDepth = zFront - zBack + 4; // Extend slightly
        const seatCenterZ = (zBack + zFront) / 2;
        
        return (
          <group position={[0, seatHeight, seatCenterZ]}>
            {/* Seat Slats */}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh 
                key={i} 
                position={[0, 0.5, -seatDepth / 2 + 2 + i * (seatDepth - 4) / 5]} 
                castShadow 
                receiveShadow
              >
                <boxGeometry args={[width - 1, 1, 3]} />
                <WoodMaterial color={woodBaseColor} />
              </mesh>
            ))}
            
            {/* Side Rails for Seat */}
            <mesh position={[width / 2 - 1.5, -0.6, 0]} castShadow>
              <boxGeometry args={[2, 2.2, seatDepth - 1]} />
              <WoodMaterial color={woodBaseColor} />
            </mesh>
            <mesh position={[-width / 2 + 1.5, -0.6, 0]} castShadow>
              <boxGeometry args={[2, 2.2, seatDepth - 1]} />
              <WoodMaterial color={woodBaseColor} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
};

export const Plant3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const potHeight = height * 0.3;
  const potRadius = width * 0.4;
  
  return (
    <group>
      {/* Pot */}
      <mesh position={[width / 2, potHeight / 2, depth / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[potRadius, potRadius * 0.8, potHeight, 16]} />
        <SmartMaterial color={color || "#78350f"} roughness={0.8} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[width / 2, potHeight - 0.5, depth / 2]}>
        <cylinderGeometry args={[potRadius * 0.9, potRadius * 0.9, 1, 16]} />
        <SmartMaterial color="#451a03" roughness={1} />
      </mesh>
      
      {/* Leaves */}
      <group position={[width / 2, potHeight, depth / 2]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const leafLen = (height - potHeight) * 0.8;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh position={[0, leafLen / 2, potRadius * 0.5]} rotation={[0.4, 0, 0]} castShadow>
                <boxGeometry args={[width * 0.15, leafLen, 0.5]} />
                <SmartMaterial color="#166534" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
        {/* Center leaves */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2 + 0.5;
          const leafLen = (height - potHeight) * 1.0;
          return (
            <group key={`center-${i}`} rotation={[0, angle, 0]}>
              <mesh position={[0, leafLen / 2, 2]} rotation={[0.1, 0, 0]} castShadow>
                <boxGeometry args={[width * 0.1, leafLen, 0.5]} />
                <SmartMaterial color="#15803d" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

export const Chair3D: React.FC<ModelProps> = ({ width, depth, height, color, materials, furnitureType }) => {
  const seatHeight = 45;
  const legRadius = 2;
  const backrestHeight = height - seatHeight;
  
  const textileMainColor = getSlotColor(materials, 'textileMain', color);
  const textileAccentColor = getSlotColor(materials, 'textileAccent', color);
  
  // Use textileMain if it's a standard chair, but we can also use accent for decorative ones
  const chairColor = (furnitureType === 'armchair') ? textileMainColor : textileAccentColor;

  return (
    <group>
      {/* Seat */}
      <mesh position={[width / 2, seatHeight, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 5, depth]} />
        <SmartMaterial color={chairColor} roughness={0.6} />
      </mesh>
      
      {/* Legs */}
      {[
        [legRadius, legRadius],
        [width - legRadius, legRadius],
        [legRadius, depth - legRadius],
        [width - legRadius, depth - legRadius]
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], seatHeight / 2, pos[1]]} castShadow receiveShadow>
          <cylinderGeometry args={[legRadius, legRadius, seatHeight, 16]} />
          <SmartMaterial color="#334155" roughness={0.5} />
        </mesh>
      ))}
      
      {/* Backrest */}
      <mesh position={[width / 2, seatHeight + backrestHeight / 2, 2.5]} castShadow receiveShadow>
        <boxGeometry args={[width, backrestHeight, 5]} />
        <SmartMaterial color={chairColor} roughness={0.6} />
      </mesh>
    </group>
  );
};

export const Shelf3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor, hasDoors, materials }) => {
  const isWallShelf = height < 100;
  const numShelves = isWallShelf ? 0 : (height > 100 ? 5 : 3);
  const shelfSpacing = isWallShelf ? 0 : (height - 4) / numShelves;
  
  const numVerticalDividers = (isWallShelf || hasDoors) ? Math.floor((width - 1) / 50) : 0;
  const dividerSpacing = width / (numVerticalDividers + 1);
  const numSections = numVerticalDividers + 1;
  const sectionWidth = width / numSections;
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  const woodFrontColor = getSlotColor(materials, 'woodFront', secondaryColor || woodBaseColor);
  
  const thickness = 2;

  return (
    <group>
      {/* Sides */}
      <mesh position={[thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width - thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Top & Bottom */}
      <mesh position={[width / 2, thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      <mesh position={[width / 2, height - thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Horizontal Shelves */}
      {!isWallShelf && Array.from({ length: numShelves - 1 }).map((_, i) => (
        <mesh key={i} position={[width / 2, (i + 1) * shelfSpacing + thickness, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width - thickness * 2, thickness, depth - 1]} />
          <WoodMaterial color={woodBaseColor} />
        </mesh>
      ))}

      {/* Back Panel */}
      <mesh position={[width / 2, height / 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[width - thickness * 2, height - thickness * 2, 1]} />
        <WoodMaterial color={woodBaseColor} opacity={0.5} transparent />
      </mesh>

      {/* Doors */}
      {hasDoors && (
        <group position={[0, height / 2, depth]}>
          {Array.from({ length: numSections }).map((_, i) => {
            const xPos = i * sectionWidth + sectionWidth / 2;
            
            const isLeftDoorInPair = i % 2 === 0;
            const isRightDoorInPair = i % 2 === 1;
            const isLastOddDoor = i === numSections - 1 && numSections % 2 !== 0;
            
            const handleSide = (isLeftDoorInPair && !isLastOddDoor) ? 1 : -1;
            const handleX = handleSide * (sectionWidth / 2 - 4);
            
            return (
              <group key={i} position={[xPos, 0, 0]}>
                <mesh position={[0, 0, 0.6]} castShadow receiveShadow>
                  <boxGeometry args={[sectionWidth - 0.5, height - thickness, 1]} />
                  <WoodMaterial color={woodFrontColor} />
                </mesh>
                {/* Handle */}
                <mesh position={[handleX, 0, 1.2]} castShadow receiveShadow>
                  <boxGeometry args={[1, 10, 1]} />
                  <SmartMaterial color="#94a3b8" metalness={1} roughness={0.1} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};

export const Picture3D: React.FC<ModelProps> = ({ width, depth, height, color, imageUrl }) => {
  const frameThickness = 2; // 2cm frame
  const wallOffset = 0.1; // 1mm offset from wall to prevent z-fighting
  
  return (
    <group>
      {/* Frame */}
      <mesh position={[width / 2, height / 2, depth / 2 + wallOffset]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.5} 
          polygonOffset 
          polygonOffsetFactor={-1} 
          polygonOffsetUnits={-1}
        />
      </mesh>
      
      {/* Canvas/Image */}
      <mesh position={[width / 2, height / 2, depth + wallOffset + 0.05]} castShadow receiveShadow>
        <boxGeometry args={[width - frameThickness * 2, height - frameThickness * 2, 0.1]} />
        <PictureMaterial imageUrl={imageUrl} />
      </mesh>
    </group>
  );
};

const PictureMaterial: React.FC<{ imageUrl?: string }> = ({ imageUrl }) => {
  // We must not call useTexture conditionally.
  // If no imageUrl, we skip useTexture entirely by using a separate component or a fallback.
  if (!imageUrl) {
    return (
      <meshStandardMaterial 
        color="#ffffff" 
        roughness={1} 
        polygonOffset 
        polygonOffsetFactor={-2} 
        polygonOffsetUnits={-2}
      />
    );
  }

  return <TexturedPictureMaterial imageUrl={imageUrl} />;
};

const TexturedPictureMaterial: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const texture = useTexture(imageUrl);
  return (
    <meshStandardMaterial 
      map={texture} 
      roughness={0.3} 
      polygonOffset 
      polygonOffsetFactor={-2} 
      polygonOffsetUnits={-2}
    />
  );
};

export const Electronics3D: React.FC<ModelProps & { hideStand?: boolean }> = ({ width, depth, height, color, hideStand }) => {
  const standHeight = hideStand ? 0 : 10;
  return (
    <group>
      {/* Screen */}
      <mesh position={[width / 2, (height - standHeight) / 2 + standHeight, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height - standHeight, 2]} />
        <SmartMaterial color="#0f172a" roughness={0.1} metalness={0.8} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Stand */}
      {!hideStand && (
        <>
          <mesh position={[width / 2, 5, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.3, 10, 2]} />
            <SmartMaterial color="#334155" roughness={0.5} />
          </mesh>
          <mesh position={[width / 2, 1, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.4, 2, depth]} />
            <SmartMaterial color="#334155" roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
};

export const Table3D: React.FC<ModelProps & { isRound?: boolean }> = ({ width, depth, height, color, isRound, materials }) => {
  const topThickness = 4;
  const legRadius = 3;
  
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[width / 2, height - topThickness / 2, depth / 2]} castShadow receiveShadow>
        {isRound ? (
          <cylinderGeometry args={[width / 2, width / 2, topThickness, 32]} />
        ) : (
          <boxGeometry args={[width, topThickness, depth]} />
        )}
        <WoodMaterial color={woodBaseColor} />
      </mesh>
      
      {/* Legs */}
      {isRound ? (
        <mesh position={[width / 2, (height - topThickness) / 2, depth / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[legRadius * 2, legRadius * 2, height - topThickness, 16]} />
          <SmartMaterial color="#334155" roughness={0.5} />
        </mesh>
      ) : (
        [
          [legRadius + 5, legRadius + 5],
          [width - legRadius - 5, legRadius + 5],
          [legRadius + 5, depth - legRadius - 5],
          [width - legRadius - 5, depth - legRadius - 5]
        ].map((pos, i) => (
          <mesh key={i} position={[pos[0], (height - topThickness) / 2, pos[1]]} castShadow receiveShadow>
            <boxGeometry args={[legRadius * 2, height - topThickness, legRadius * 2]} />
            <SmartMaterial color="#334155" roughness={0.5} />
          </mesh>
        ))
      )}
    </group>
  );
};

export const Light3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  return (
    <group>
      {/* Base */}
      <mesh position={[width / 2, 2, depth / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.2, width * 0.25, 4, 16]} />
        <SmartMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Stem */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, height, 8]} />
        <SmartMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Shade */}
      <mesh position={[width / 2, height - 10, depth / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.4, width * 0.5, 20, 16, 1, true]} />
        <SmartMaterial color={color} side={2} transparent opacity={0.9} />
      </mesh>
      {/* Light Source (Visual) */}
      <mesh position={[width / 2, height - 10, depth / 2]}>
        <sphereGeometry args={[5, 16, 16]} />
        <SmartMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
      </mesh>
      {/* Actual PointLight */}
      {!edgeMode && (
        <pointLight 
          position={[width / 2, height - 10, depth / 2]} 
          intensity={1.5} 
          distance={500} 
          decay={2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
      )}
    </group>
  );
};

export const AirConditioner3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const radius = 2;
  return (
    <group>
      {/* Main Body */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <SmartMaterial color={color} roughness={0.3} />
      </mesh>
      
      {/* Top Grill / Intake */}
      <mesh position={[width / 2, height - 0.5, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.8, 0.2, depth * 0.6]} />
        <SmartMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>

      {/* Front Flap / Vent */}
      <mesh position={[width / 2, height * 0.2, depth - 0.2]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.9, height * 0.1, 0.5]} />
        <SmartMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Logo/Detail */}
      <mesh position={[width * 0.15, height * 0.5, depth + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.05, height * 0.1, 0.1]} />
        <SmartMaterial color="#94a3b8" roughness={0.1} />
      </mesh>
    </group>
  );
};

export const Rug3D: React.FC<ModelProps & { shape?: 'rectangle' | 'circle' }> = ({ width, depth, height, color, secondaryColor, shape = 'rectangle', materials }) => {
  const textileMainColor = getSlotColor(materials, 'textileMain', color);
  const textileAccentColor = getSlotColor(materials, 'textileAccent', secondaryColor || "#cbd5e1");
  
  // A rug is very thin
  const rugHeight = 0.5; // 0.5 cm
  
  return (
    <group>
      {/* Base Layer */}
      <mesh position={[width / 2, rugHeight / 2, depth / 2]} receiveShadow>
        {shape === 'circle' ? (
          <cylinderGeometry args={[width / 2, width / 2, rugHeight, 32]} />
        ) : (
          <boxGeometry args={[width, rugHeight, depth]} />
        )}
        <SmartMaterial color={textileMainColor} roughness={1} />
      </mesh>
      
      {/* Ring/Border 1 - Pattern (100% of path size) */}
      <mesh position={[width / 2, rugHeight + 0.02, depth / 2]} receiveShadow>
        {shape === 'circle' ? (
          <cylinderGeometry args={[width * 0.5, width * 0.5, 0.05, 32]} />
        ) : (
          <boxGeometry args={[width, 0.05, depth]} />
        )}
        <SmartMaterial color={textileAccentColor} roughness={1} />
      </mesh>

      {/* Ring/Border 2 - Base Color Gap (approx 77.7% of path size) */}
      <mesh position={[width / 2, rugHeight + 0.04, depth / 2]} receiveShadow>
        {shape === 'circle' ? (
          <cylinderGeometry args={[width * (35 / 90), width * (35 / 90), 0.05, 32]} />
        ) : (
          <boxGeometry args={[width * (70 / 90), 0.05, depth * (70 / 90)]} />
        )}
        <SmartMaterial color={textileMainColor} roughness={1} />
      </mesh>

      {/* Center Pattern - Pattern (approx 55.5% of path size) */}
      <mesh position={[width / 2, rugHeight + 0.06, depth / 2]} receiveShadow>
        {shape === 'circle' ? (
          <cylinderGeometry args={[width * (25 / 90), width * (25 / 90), 0.05, 32]} />
        ) : (
          <boxGeometry args={[width * (50 / 90), 0.05, depth * (50 / 90)]} />
        )}
        <SmartMaterial color={textileAccentColor} roughness={1} />
      </mesh>
    </group>
  );
};

export const WallPanel3D: React.FC<ModelProps & { panelStyle?: 'slats' | 'trellis' | 'green' | 'stone' | 'plain' }> = ({ width, depth, height, color, panelStyle = 'slats' }) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  
  if (panelStyle === 'plain') {
    return (
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <SmartMaterial color={color} />
      </mesh>
    );
  }

  if (panelStyle === 'slats') {
    const slatWidth = 4;
    const slatGap = 2;
    const numSlats = Math.floor(width / (slatWidth + slatGap));
    const startX = (width - (numSlats * (slatWidth + slatGap) - slatGap)) / 2;

    return (
      <group>
        {/* Backing */}
        <mesh position={[width / 2, height / 2, depth * 0.2]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth * 0.4]} />
          <SmartMaterial color="#2d1e17" />
        </mesh>
        {/* Slats */}
        {Array.from({ length: numSlats }).map((_, i) => (
          <mesh 
            key={i} 
            position={[startX + i * (slatWidth + slatGap) + slatWidth / 2, height / 2, depth * 0.7]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[slatWidth, height, depth * 0.6]} />
            <WoodMaterial color={color} />
          </mesh>
        ))}
      </group>
    );
  }

  if (panelStyle === 'trellis') {
    const barThinkness = 1.5;
    const spacing = 15;
    const numX = Math.ceil(width / spacing) + 2;
    const numY = Math.ceil(height / spacing) + 2;

    return (
      <group>
         <mesh position={[width / 2, height / 2, depth * 0.1]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth * 0.2]} />
          <SmartMaterial color="#000" opacity={0} transparent />
        </mesh>
        {/* Frame */}
        <mesh position={[width / 2, barThinkness / 2, depth / 2]} castShadow>
          <boxGeometry args={[width, barThinkness, depth]} />
          <SmartMaterial color={color} />
        </mesh>
        <mesh position={[width / 2, height - barThinkness / 2, depth / 2]} castShadow>
          <boxGeometry args={[width, barThinkness, depth]} />
          <SmartMaterial color={color} />
        </mesh>
        <mesh position={[barThinkness / 2, height / 2, depth / 2]} castShadow>
          <boxGeometry args={[barThinkness, height, depth]} />
          <SmartMaterial color={color} />
        </mesh>
        <mesh position={[width - barThinkness / 2, height / 2, depth / 2]} castShadow>
          <boxGeometry args={[barThinkness, height, depth]} />
          <SmartMaterial color={color} />
        </mesh>

        {/* Diagonal Bars 1 */}
        <group>
          {Array.from({ length: numX + numY }).map((_, i) => {
            const offset = (i - numY) * spacing;
            return (
              <mesh 
                key={`d1-${i}`} 
                position={[width / 2, height / 2, depth * 0.3]} 
                rotation={[0, 0, Math.PI / 4]}
              >
                <boxGeometry args={[width * 2, barThinkness, depth * 0.2]} />
                <mesh position={[0, offset, 0]}>
                   <boxGeometry args={[width * 2, barThinkness, depth * 0.2]} />
                   <SmartMaterial color={color} />
                </mesh>
              </mesh>
            );
          })}
        </group>
        {/* Diagonal Bars 2 */}
        <group>
          {Array.from({ length: numX + numY }).map((_, i) => {
            const offset = (i - numY) * spacing;
            return (
              <mesh 
                key={`d2-${i}`} 
                position={[width / 2, height / 2, depth * 0.6]} 
                rotation={[0, 0, -Math.PI / 4]}
              >
                 <mesh position={[0, offset, 0]}>
                   <boxGeometry args={[width * 2, barThinkness, depth * 0.2]} />
                   <SmartMaterial color={color} />
                </mesh>
              </mesh>
            );
          })}
        </group>
      </group>
    );
  }

  if (panelStyle === 'green') {
    return (
      <group>
        <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <SmartMaterial color="#14532d" roughness={1} />
        </mesh>
        {/* Leaves "noise" */}
        {!edgeMode && Array.from({ length: 40 }).map((_, i) => (
          <mesh 
            key={i} 
            position={[
              ((i * 13) % 100) / 100 * width, 
              ((i * 17) % 100) / 100 * height, 
              depth + ((i * 7) % 100) / 100 * 2
            ]} 
            rotation={[
              ((i * 3) % 100) / 100 * Math.PI, 
              ((i * 5) % 100) / 100 * Math.PI, 
              ((i * 11) % 100) / 100 * Math.PI
            ]}
          >
            <boxGeometry args={[5, 5, 0.5]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#166534" : "#15803d"} roughness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  if (panelStyle === 'stone') {
    return (
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <SmartMaterial color="#78716c" roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }

  return (
    <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <SmartMaterial color={color} />
    </mesh>
  );
};

export const GenericFurniture3D: React.FC<ModelProps> = ({ width, depth, height, color, materials }) => {
  const woodBaseColor = getSlotColor(materials, 'woodBase', color);
  return (
    <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <SmartMaterial color={woodBaseColor} />
    </mesh>
  );
};
