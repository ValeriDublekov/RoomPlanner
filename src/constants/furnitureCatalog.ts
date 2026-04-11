import { CatalogItem } from '../types';

export const FURNITURE_CATALOG: CatalogItem[] = [
  // Bedroom
  { 
    id: 'bed-double', 
    name: 'Double Bed', 
    furnitureType: 'bed',
    category: 'Bedroom', 
    type: 'rectangle', 
    width: 160, 
    depth: 200, 
    height3d: 50,
    defaultColor: '#f8fafc',
    svgPath: 'M0 0 H100 V100 H0 Z M10 5 H45 V25 H10 Z M55 5 H90 V25 H55 Z'
  },
  { id: 'bed-king', name: 'King Size Bed', furnitureType: 'bed', category: 'Bedroom', type: 'rectangle', width: 200, depth: 210, height3d: 50, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M10 5 H45 V25 H10 Z M55 5 H90 V25 H55 Z' },
  { id: 'bed-single', name: 'Single Bed', furnitureType: 'bed', category: 'Bedroom', type: 'rectangle', width: 90, depth: 200, height3d: 50, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M20 5 H80 V25 H20 Z' },
  { id: 'wardrobe-large', name: 'Large Wardrobe', furnitureType: 'wardrobe', category: 'Bedroom', type: 'rectangle', width: 150, depth: 60, height3d: 210, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M0 50 H100 M45 20 V80 M55 20 V80' },
  { id: 'wardrobe-small', name: 'Small Wardrobe', furnitureType: 'wardrobe', category: 'Bedroom', type: 'rectangle', width: 80, depth: 60, height3d: 210, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M0 50 H100 M45 20 V80 M55 20 V80' },
  { id: 'nightstand', name: 'Nightstand', category: 'Bedroom', type: 'rectangle', width: 45, depth: 40, height3d: 45, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M10 10 H90 V20 H10 Z' },
  
  // Office
  { id: 'desk-large', name: 'Large Desk', furnitureType: 'desk', category: 'Office', type: 'rectangle', width: 160, depth: 80, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 15 H100 V20 H0 Z' },
  { id: 'desk-small', name: 'Small Desk', furnitureType: 'desk', category: 'Office', type: 'rectangle', width: 100, depth: 60, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 15 H100 V20 H0 Z' },

  // Living Room
  { 
    id: 'sofa-3', 
    name: '3-Seater Sofa', 
    category: 'Living Room', 
    type: 'rectangle', 
    width: 220, 
    depth: 90, 
    height3d: 85,
    defaultColor: '#f8fafc',
    svgPath: 'M0 0 H100 V100 H0 Z M0 75 H100 V100 H0 Z M0 0 H15 V100 H0 Z M85 0 H100 V100 H85 Z'
  },
  { id: 'armchair', name: 'Armchair', category: 'Living Room', type: 'rectangle', width: 85, depth: 85, height3d: 85, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 75 H100 V100 H0 Z M0 0 H20 V100 H0 Z M80 0 H100 V100 H80 Z' },
  
  // Bathroom
  { 
    id: 'toilet', 
    name: 'Standard Toilet', 
    category: 'Bathroom', 
    type: 'rectangle', 
    width: 40, 
    depth: 65, 
    height3d: 45,
    defaultColor: '#f8fafc',
    svgPath: 'M20 0 H80 V35 H20 Z M30 35 Q30 100 50 100 Q70 100 70 35 Z'
  },
  { id: 'bathtub', name: 'Bathtub', category: 'Bathroom', type: 'rectangle', width: 170, depth: 75, height3d: 60, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M10 10 Q10 90 50 90 Q90 90 90 10 Z' },
];
