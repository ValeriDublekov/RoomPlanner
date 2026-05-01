import { InteriorTheme, FurnitureObject, ObjectMaterials } from '../types';

export const INTERIOR_THEMES: InteriorTheme[] = [
  {
    id: 'scandi_light',
    name: 'Scandinavian Light',
    wallPalette: ['#F0EDE5', '#E6D6C5', '#9DC183'],
    woodPalette: ['#d1bfae', '#FFFFFF'],
    textilePalette: ['#FFFFFF', '#D3D3D3', '#FFDB58']
  },
  {
    id: 'industrial_dark',
    name: 'Industrial Loft',
    wallPalette: ['#2D2D2D', '#4A4A4A', '#C6714E'],
    woodPalette: ['#5D4037', '#212121'],
    textilePalette: ['#BDBDBD', '#424242', '#C6714E']
  }
];

export const applyThemeToMaterials = (
  materials: ObjectMaterials, 
  theme: InteriorTheme, 
  furnitureType?: string
): ObjectMaterials => {
  const newMaterials = { ...materials };

  if (newMaterials.woodBase) {
    newMaterials.woodBase = { source: 'theme', value: theme.woodPalette[0] };
  }
  
  if (newMaterials.woodFront) {
    newMaterials.woodFront = { 
      source: 'theme', 
      value: theme.woodPalette[1] || theme.woodPalette[0] 
    };
  }

  if (newMaterials.textileMain) {
    if (furnitureType === 'bed') {
      newMaterials.textileMain = { source: 'theme', value: theme.textilePalette[0] };
    } else {
      newMaterials.textileMain = { source: 'theme', value: theme.textilePalette[1] };
    }
  }

  if (newMaterials.textileAccent) {
    newMaterials.textileAccent = { source: 'theme', value: theme.textilePalette[2] };
  }

  return newMaterials;
};

export const applyThemeToFurniture = (
  item: FurnitureObject, 
  theme: InteriorTheme
): FurnitureObject => {
  if (item.type === 'group' && item.children) {
    return {
      ...item,
      children: item.children.map(child => applyThemeToFurniture(child, theme))
    };
  }

  if (!item.materials) return item;

  return {
    ...item,
    materials: applyThemeToMaterials(item.materials, theme, item.furnitureType)
  };
};
