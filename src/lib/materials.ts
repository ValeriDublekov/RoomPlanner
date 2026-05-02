import { FurnitureObject, FurnitureType, ObjectMaterials } from '../types';

/**
 * Returns default semantic materials based on furniture type
 */
export const getDefaultMaterialsForType = (type: FurnitureType | undefined, primaryColor?: string, secondaryColor?: string): ObjectMaterials => {
  const pValue = primaryColor || '#f1f5f9';
  const sValue = secondaryColor || pValue;
  
  const pSlot = primaryColor ? { source: 'custom' as const, value: pValue } : { source: 'theme' as const, value: pValue };
  const sSlot = secondaryColor ? { source: 'custom' as const, value: sValue } : { source: 'theme' as const, value: (pValue === sValue ? '#cbd5e1' : sValue) };

  switch (type) {
    case 'wardrobe':
    case 'dresser':
    case 'shelf':
      return {
        woodBase: pSlot,
        woodFront: sSlot,
      };
    case 'bed':
      return {
        woodBase: pSlot,
        textileMain: sSlot,
        textileAccent: { source: 'theme' as const, value: '#ffffff' },
      };
    case 'sofa':
    case 'armchair':
    case 'chair':
    case 'rug':
      return {
        textileMain: pSlot,
        textileAccent: sSlot,
      };
    case 'table':
    case 'desk':
    case 'nightstand':
      return {
        woodBase: pSlot,
      };
    default:
      return {
        woodBase: pSlot,
      };
  }
};

/**
 * Migrates a furniture object to the new materials system if it doesn't have it
 */
export const migrateFurnitureMaterials = (item: FurnitureObject): FurnitureObject => {
  if (item.materials) {
    // Already has new materials system
    return item;
  }

  // Handle groups recursively
  if (item.type === 'group' && item.children) {
    return {
      ...item,
      children: item.children.map(migrateFurnitureMaterials),
    };
  }

  // Use legacy color as base for custom materials
  return {
    ...item,
    materials: getDefaultMaterialsForType(item.furnitureType, item.color, item.secondaryColor),
  };
};
