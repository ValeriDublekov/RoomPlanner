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
}

const WoodMaterial: React.FC<{ color: string, opacity?: number, transparent?: boolean }> = ({ color, opacity = 1, transparent = false }) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  const texture = useTexture(WOOD_GRAIN);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.02, 0.02);
  
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

const SmartMaterial = (props: any) => {
  const edgeMode = useStore(state => state.edgeMode3d);
  if (edgeMode) {
    // In Edge Mode, we strictly want black surfaces and white outlines.
    // We ignore color, map and emissive to prevent surfaces from appearing white/textured.
    const { color, map, emissive, emissiveIntensity, transparent, opacity, side, ...otherProps } = props;
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
}> = ({ width, depth, height, color, secondaryColor, hasHeadboard, headboardHeight = 60, headboardTilt = 15, mattressWidth, mattressDepth }) => {
  const frameHeight = Math.min(height * 0.4, 30);
  const mattressThickness = 20;
  const mattressInset = 2; 
  const mattressColor = secondaryColor || "#ffffff";
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
        <WoodMaterial color={color} />
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
              <WoodMaterial color={color} />
              <Edges color="white" threshold={20} />
            </mesh>
          </group>
        </group>
      )}

      {/* Pillows - placed near headboard */}
      <group position={[width / 2, frameHeight + mattressThickness, zOffset + 20]}>
        <mesh position={[-mWidth * 0.25, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[mWidth * 0.35, 6, 25]} />
          <SmartMaterial color={mattressColor} roughness={1} />
        </mesh>
        <mesh position={[mWidth * 0.25, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[mWidth * 0.35, 6, 25]} />
          <SmartMaterial color={mattressColor} roughness={1} />
        </mesh>
      </group>
    </group>
  );
};

export const Sofa3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const seatHeight = height * 0.5;
  const armWidth = 15;
  const backDepth = 15;
  
  return (
    <group>
      {/* Base/Seat */}
      <mesh position={[width / 2, seatHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, seatHeight, depth]} />
        <SmartMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[width / 2, height / 2 + seatHeight / 2, backDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height - seatHeight, backDepth]} />
        <SmartMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <SmartMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[width - armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <SmartMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Nightstand3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <group>
    <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <WoodMaterial color={color} />
    </mesh>
    <mesh position={[width / 2, height * 0.7, depth + 0.6]} castShadow receiveShadow>
      <boxGeometry args={[width - 4, 2, 1]} />
      <SmartMaterial color="#94a3b8" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  </group>
);

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

export const Desk3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const topThickness = 4; // 4cm
  const legRadius = 2; // 2cm
  
  return (
    <group>
      {/* Desktop */}
      <mesh position={[width / 2, height - topThickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <WoodMaterial color={color} />
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

export const Wardrobe3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor }) => {
  const numDoors = width < 100 ? 2 : 3;
  const doorWidth = (width - 2) / numDoors;
  const handleRadius = 1;
  const handleHeight = 15;
  const doorColor = secondaryColor || color;
  
  return (
    <group>
      {/* Carcass */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <WoodMaterial color={color} />
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
              <WoodMaterial color={doorColor} />
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

export const Dresser3D: React.FC<ModelProps & { drawerRows?: number, drawerCols?: number }> = ({ width, depth, height, color, secondaryColor, drawerRows, drawerCols }) => {
  const finalCols = drawerCols || Math.ceil(width / 80);
  const finalRows = drawerRows || Math.max(1, Math.floor(height / 20));
  
  const colWidth = (width - 4) / finalCols;
  const rowHeight = (height - 4) / finalRows;
  const drawerColor = secondaryColor || color;
  const thickness = 2;
  
  return (
    <group>
      {/* Carcass Panels */}
      <mesh position={[width / 2, thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[width / 2, height - thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[width - thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[width - thickness * 2, height - thickness * 2, 1]} />
        <WoodMaterial color={color} />
      </mesh>
      
      {/* Internal Dividers for columns if more than 1 */}
      {finalCols > 1 && Array.from({ length: finalCols - 1 }).map((_, i) => (
        <mesh key={`div-${i}`} position={[(i + 1) * colWidth + 2, height / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[thickness, height - thickness * 2, depth - thickness]} />
          <WoodMaterial color={color} />
        </mesh>
      ))}

      {/* Drawers */}
      {Array.from({ length: finalCols }).map((_, col) => (
        Array.from({ length: finalRows }).map((_, row) => (
          <group key={`${col}-${row}`} position={[col * colWidth + colWidth / 2 + 2, row * rowHeight + rowHeight / 2 + 2, depth + 0.3]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[colWidth - 1, rowHeight - 2, 0.8]} />
              <WoodMaterial color={drawerColor} />
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

export const Chair3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const seatHeight = 45;
  const legRadius = 2;
  const backrestHeight = height - seatHeight;
  
  return (
    <group>
      {/* Seat */}
      <mesh position={[width / 2, seatHeight, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 5, depth]} />
        <SmartMaterial color={color} roughness={0.6} />
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
        <SmartMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
};

export const Shelf3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor, hasDoors }) => {
  const isWallShelf = height < 100;
  const numShelves = isWallShelf ? 0 : (height > 100 ? 5 : 3);
  const shelfSpacing = isWallShelf ? 0 : (height - 4) / numShelves;
  
  const numVerticalDividers = (isWallShelf || hasDoors) ? Math.floor((width - 1) / 50) : 0;
  const dividerSpacing = width / (numVerticalDividers + 1);
  const numSections = numVerticalDividers + 1;
  const sectionWidth = width / numSections;
  const doorColor = secondaryColor || color;
  const thickness = 2;

  return (
    <group>
      {/* Sides */}
      <mesh position={[thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[width - thickness / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      
      {/* Top & Bottom */}
      <mesh position={[width / 2, thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      <mesh position={[width / 2, height - thickness / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      
      {/* Horizontal Shelves */}
      {!isWallShelf && Array.from({ length: numShelves - 1 }).map((_, i) => (
        <mesh key={i} position={[width / 2, (i + 1) * shelfSpacing + thickness, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width - thickness * 2, thickness, depth - 1]} />
          <WoodMaterial color={color} />
        </mesh>
      ))}

      {/* Back Panel */}
      <mesh position={[width / 2, height / 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[width - thickness * 2, height - thickness * 2, 1]} />
        <WoodMaterial color={color} opacity={0.5} transparent />
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
                  <WoodMaterial color={doorColor} />
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
  const texture = imageUrl ? useTexture(imageUrl) : null;
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
        {texture ? (
          <meshStandardMaterial 
            map={texture} 
            roughness={0.3} 
            polygonOffset 
            polygonOffsetFactor={-2} 
            polygonOffsetUnits={-2}
          />
        ) : (
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={1} 
            polygonOffset 
            polygonOffsetFactor={-2} 
            polygonOffsetUnits={-2}
          />
        )}
      </mesh>
    </group>
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

export const Table3D: React.FC<ModelProps & { isRound?: boolean }> = ({ width, depth, height, color, isRound }) => {
  const topThickness = 4;
  const legRadius = 3;
  
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[width / 2, height - topThickness / 2, depth / 2]} castShadow receiveShadow>
        {isRound ? (
          <cylinderGeometry args={[width / 2, width / 2, topThickness, 32]} />
        ) : (
          <boxGeometry args={[width, topThickness, depth]} />
        )}
        <WoodMaterial color={color} />
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

export const GenericFurniture3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
    <boxGeometry args={[width, height, depth]} />
    <SmartMaterial color={color} />
  </mesh>
);
