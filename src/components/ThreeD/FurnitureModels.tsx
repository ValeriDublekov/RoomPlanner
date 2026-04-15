import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { WOOD_GRAIN } from '../../constants';

interface ModelProps {
  width: number;
  depth: number;
  height: number;
  color: string;
  secondaryColor?: string;
}

const WoodMaterial: React.FC<{ color: string, opacity?: number, transparent?: boolean }> = ({ color, opacity = 1, transparent = false }) => {
  const texture = useTexture(WOOD_GRAIN);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.02, 0.02);
  return <meshStandardMaterial color={color} map={texture} roughness={0.8} opacity={opacity} transparent={transparent} />;
};

export const Bed3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor }) => {
  const frameHeight = height * 0.3;
  const mattressHeight = height * 0.5;
  const mattressInset = 5; // 5cm inset
  const mattressColor = secondaryColor || "#ffffff";
  
  return (
    <group>
      {/* Base Frame */}
      <mesh position={[width / 2, frameHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, frameHeight, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      
      {/* Mattress */}
      <mesh position={[width / 2, frameHeight + mattressHeight / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width - mattressInset, mattressHeight, depth - mattressInset]} />
        <meshStandardMaterial color={mattressColor} roughness={0.9} />
      </mesh>
      
      {/* Pillows */}
      <mesh position={[width * 0.25, frameHeight + mattressHeight + 2, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.3, 5, depth * 0.2]} />
        <meshStandardMaterial color={mattressColor} roughness={1} />
      </mesh>
      <mesh position={[width * 0.75, frameHeight + mattressHeight + 2, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.3, 5, depth * 0.2]} />
        <meshStandardMaterial color={mattressColor} roughness={1} />
      </mesh>
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
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[width / 2, height / 2 + seatHeight / 2, backDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height - seatHeight, backDepth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[width - armWidth / 2, height * 0.7 / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[armWidth, height * 0.7, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
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
    <mesh position={[width / 2, height * 0.7, depth + 0.5]} castShadow receiveShadow>
      <boxGeometry args={[width - 4, 2, 1]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  </group>
);

export const Toilet3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <group>
    {/* Tank */}
    <mesh position={[width / 2, height * 0.8, depth * 0.2]} castShadow receiveShadow>
      <boxGeometry args={[width, height * 0.4, depth * 0.3]} />
      <meshStandardMaterial color={color} roughness={0.1} />
    </mesh>
    {/* Bowl */}
    <mesh position={[width / 2, height * 0.3, depth * 0.6]} castShadow receiveShadow>
      <cylinderGeometry args={[width / 2, width / 3, height * 0.6, 16]} />
      <meshStandardMaterial color={color} roughness={0.1} />
    </mesh>
  </group>
);

export const Bathtub3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <group>
    <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.1} />
    </mesh>
    <mesh position={[width / 2, height * 0.6, depth / 2]}>
      <boxGeometry args={[width - 10, height * 0.8, depth - 10]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.1} />
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
          <meshStandardMaterial color="#334155" roughness={0.5} />
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
      {Array.from({ length: numDoors }).map((_, i) => (
        <group key={i} position={[i * doorWidth + doorWidth / 2 + 1, height / 2, depth + 0.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[doorWidth - 0.5, height - 2, 1]} />
            <WoodMaterial color={doorColor} />
          </mesh>
          
          {/* Handle */}
          <mesh position={[i % 2 === 0 ? doorWidth / 3 : -doorWidth / 3, 0, 1]} castShadow receiveShadow>
            <cylinderGeometry args={[handleRadius, handleRadius, handleHeight, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Dresser3D: React.FC<ModelProps> = ({ width, depth, height, color, secondaryColor }) => {
  const numDrawers = height < 90 ? 3 : 4;
  const drawerHeight = (height - 4) / numDrawers;
  const drawerColor = secondaryColor || color;
  
  return (
    <group>
      {/* Main Body */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <WoodMaterial color={color} />
      </mesh>
      
      {/* Drawers */}
      {Array.from({ length: numDrawers }).map((_, i) => (
        <group key={i} position={[width / 2, i * drawerHeight + drawerHeight / 2 + 2, depth + 0.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width - 2, drawerHeight - 2, 1]} />
            <WoodMaterial color={drawerColor} />
          </mesh>
          {/* Handle */}
          <mesh position={[0, 0, 1]} castShadow receiveShadow>
            <boxGeometry args={[10, 1, 1]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
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
        <meshStandardMaterial color={color} roughness={0.6} />
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
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      ))}
      
      {/* Backrest */}
      <mesh position={[width / 2, seatHeight + backrestHeight / 2, 2.5]} castShadow receiveShadow>
        <boxGeometry args={[width, backrestHeight, 5]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
};

export const Shelf3D: React.FC<ModelProps> = ({ width, depth, height, color }) => {
  const isWallShelf = height < 100;
  const numShelves = isWallShelf ? 0 : (height > 100 ? 5 : 3);
  const shelfSpacing = isWallShelf ? 0 : (height - 4) / numShelves;
  
  const numVerticalDividers = isWallShelf ? Math.floor(width / 30) : 0;
  const dividerSpacing = isWallShelf ? width / (numVerticalDividers + 1) : 0;

  return (
    <group>
      {/* Top and Bottom Panels for Wall Shelf, or Side Panels for Tall Shelf */}
      {isWallShelf ? (
        <>
          <mesh position={[width / 2, 1, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width, 2, depth]} />
            <WoodMaterial color={color} />
          </mesh>
          <mesh position={[width / 2, height - 1, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width, 2, depth]} />
            <WoodMaterial color={color} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[1, height / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[2, height, depth]} />
            <WoodMaterial color={color} />
          </mesh>
          <mesh position={[width - 1, height / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[2, height, depth]} />
            <WoodMaterial color={color} />
          </mesh>
        </>
      )}
      
      {/* Horizontal Shelves (for tall units) */}
      {!isWallShelf && Array.from({ length: numShelves + 1 }).map((_, i) => (
        <mesh key={i} position={[width / 2, i * shelfSpacing + 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width - 2, 2, depth - 1]} />
          <WoodMaterial color={color} />
        </mesh>
      ))}

      {/* Vertical Dividers (for wall shelves) */}
      {isWallShelf && Array.from({ length: numVerticalDividers }).map((_, i) => (
        <mesh key={i} position={[(i + 1) * dividerSpacing, height / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[2, height - 4, depth - 1]} />
          <WoodMaterial color={color} />
        </mesh>
      ))}

      {/* Side Panels for Wall Shelf */}
      {isWallShelf && (
        <>
          <mesh position={[1, height / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[2, height, depth]} />
            <WoodMaterial color={color} />
          </mesh>
          <mesh position={[width - 1, height / 2, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[2, height, depth]} />
            <WoodMaterial color={color} />
          </mesh>
        </>
      )}
      
      {/* Back Panel */}
      <mesh position={[width / 2, height / 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[width - 2, height, 1]} />
        <WoodMaterial color={color} opacity={0.5} transparent />
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
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Stand */}
      {!hideStand && (
        <>
          <mesh position={[width / 2, 5, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.3, 10, 2]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          <mesh position={[width / 2, 1, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.4, 2, depth]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
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
          <meshStandardMaterial color="#334155" roughness={0.5} />
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
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
        ))
      )}
    </group>
  );
};

export const GenericFurniture3D: React.FC<ModelProps> = ({ width, depth, height, color }) => (
  <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
    <boxGeometry args={[width, height, depth]} />
    <WoodMaterial color={color} />
  </mesh>
);
