import { InteriorTheme, FurnitureObject, ObjectMaterials, RoomObject } from '../types';
import { INTERIOR_THEMES } from '../config/themes';

export { INTERIOR_THEMES };

export const applyThemeToMaterials = (
  materials: ObjectMaterials, 
  theme: InteriorTheme, 
  furnitureType?: string
): ObjectMaterials => {
  const newMaterials = { ...materials };

  if (newMaterials.woodBase) {
    newMaterials.woodBase = { source: 'theme', value: theme.woodColors.base };
  }
  
  if (newMaterials.woodFront) {
    newMaterials.woodFront = { 
      source: 'theme', 
      value: theme.woodColors.front 
    };
  }

  if (newMaterials.textileMain) {
    if (furnitureType === 'bed') {
      newMaterials.textileMain = { source: 'theme', value: theme.textileColors.main };
    } else {
      newMaterials.textileMain = { source: 'theme', value: theme.textileColors.secondary };
    }
  }

  if (newMaterials.textileAccent) {
    newMaterials.textileAccent = { source: 'theme', value: theme.textileColors.accent };
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

export const applyThemeToRoom = (
  room: RoomObject,
  theme: InteriorTheme
): RoomObject => {
  const currentMaterials = room.materials || {
    wallBase: { source: 'theme', value: theme.wallColors.base }
  };

  return {
    ...room,
    materials: {
      ...currentMaterials,
      wallBase: { source: 'theme', value: theme.wallColors.base }
    }
  };
};
