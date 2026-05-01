import { FurnitureObject, FurnitureType, ObjectMaterials } from '../types';

/**
 * Returns default semantic materials based on furniture type
 */
export const getDefaultMaterialsForType = (type: FurnitureType | undefined, primaryColor?: string): ObjectMaterials => {
  const value = primaryColor || '#f1f5f9';
  const defaultSlot = { source: 'theme' as const, value };
  const customSlot = { source: 'custom' as const, value };

  // If a specific color was provided, we assume it's a 'custom' detachment from theme
  const slot = primaryColor ? customSlot : defaultSlot;

  switch (type) {
    case 'wardrobe':
    case 'dresser':
    case 'shelf':
      return {
        woodBase: slot,
        woodFront: slot,
      };
    case 'bed':
      return {
        woodBase: slot,
        textileMain: slot,
        textileAccent: slot,
      };
    case 'sofa':
    case 'armchair':
    case 'chair':
      return {
        textileMain: slot,
        textileAccent: slot,
      };
    case 'table':
    case 'desk':
    case 'nightstand':
      return {
        woodBase: slot,
      };
    default:
      return {
        woodBase: slot,
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
  const legacyColor = item.color;
  return {
    ...item,
    materials: getDefaultMaterialsForType(item.furnitureType, legacyColor),
  };
};
