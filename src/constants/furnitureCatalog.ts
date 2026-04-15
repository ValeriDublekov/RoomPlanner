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
    defaultColor: '#f1f5f9',
    svgPath: 'M0 0 H100 V100 H0 Z M10 5 H45 V25 H10 Z M55 5 H90 V25 H55 Z'
  },
  { id: 'bed-king', name: 'King Size Bed', furnitureType: 'bed', category: 'Bedroom', type: 'rectangle', width: 200, depth: 210, height3d: 50, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M10 5 H45 V25 H10 Z M55 5 H90 V25 H55 Z' },
  { id: 'bed-single', name: 'Single Bed', furnitureType: 'bed', category: 'Bedroom', type: 'rectangle', width: 90, depth: 200, height3d: 50, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M20 5 H80 V25 H20 Z' },
  { id: 'wardrobe-large', name: 'Large Wardrobe', furnitureType: 'wardrobe', category: 'Bedroom', type: 'rectangle', width: 150, depth: 60, height3d: 210, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M50 0 V100 M40 45 H45 M55 45 H60' },
  { id: 'wardrobe-small', name: 'Small Wardrobe', furnitureType: 'wardrobe', category: 'Bedroom', type: 'rectangle', width: 80, depth: 60, height3d: 210, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M50 0 V100 M40 45 H45 M55 45 H60' },
  { id: 'nightstand', name: 'Nightstand', furnitureType: 'nightstand', category: 'Bedroom', type: 'rectangle', width: 45, depth: 40, height3d: 45, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M10 10 H90 V20 H10 Z' },
  {id: 'dresser-small', name: 'Small Dresser', furnitureType: 'dresser', category: 'Bedroom', type: 'rectangle', width: 80, depth: 50, height3d: 80, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M0 33 H100 M0 66 H100 M45 10 H55 M45 43 H55 M45 76 H55'}, 
  {id: 'dresser-large', name: 'Large Dresser', furnitureType: 'dresser', category: 'Bedroom', type: 'rectangle', width: 120, depth: 50, height3d: 100, defaultColor: '#f1f5f9', svgPath: 'M0 0 H100 V100 H0 Z M50 0 V100 M0 25 H100 M0 50 H100 M0 75 H100 M20 12 H30 M70 12 H80 M20 37 H30 M70 37 H80 M20 62 H30 M70 62 H80 M20 87 H30 M70 87 H80'}, 
 
  // Office
  { id: 'desk-large', name: 'Large Desk', furnitureType: 'desk', category: 'Office', type: 'rectangle', width: 160, depth: 80, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 15 H100 V20 H0 Z' },
  { id: 'desk-small', name: 'Small Desk', furnitureType: 'desk', category: 'Office', type: 'rectangle', width: 100, depth: 60, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 15 H100 V20 H0 Z' },
  {id: 'office-chair', name: 'Office Chair', furnitureType: 'chair', category: 'Office', type: 'rectangle', width: 60, depth: 60, height3d: 90, defaultColor: '#334155', svgPath: 'M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20 M20 10 H80 V25 Q50 30 20 25 Z'},

  // Living Room
  { 
    id: 'sofa-3', 
    name: '3-Seater Sofa', 
    furnitureType: 'sofa',
    category: 'Living Room', 
    type: 'rectangle', 
    width: 220, 
    depth: 90, 
    height3d: 85,
    defaultColor: '#f8fafc',
    svgPath: 'M0 0 H100 V100 H0 Z M0 75 H100 V100 H0 Z M0 0 H15 V100 H0 Z M85 0 H100 V100 H85 Z'
  },
  { id: 'armchair', name: 'Armchair', furnitureType: 'armchair', category: 'Living Room', type: 'rectangle', width: 85, depth: 85, height3d: 85, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M0 75 H100 V100 H0 Z M0 0 H20 V100 H0 Z M80 0 H100 V100 H80 Z' },
  {id: 'bookshelf-tall', name: 'Tall Shelving Unit', furnitureType: 'shelf', category: 'Living Room', type: 'rectangle', width: 80, depth: 35, height3d: 200, defaultColor: '#e2e8f0', svgPath: 'M0 0 H100 V100 H0 Z M10 10 H90 V90 H10 Z M10 25 H90 M10 40 H90 M10 55 H90 M10 70 H90 M10 85 H90'}, 
  {id: 'wall-shelf', name: 'Wall Shelf', furnitureType: 'shelf', category: 'Living Room', type: 'rectangle', width: 100, depth: 25, height3d: 40, defaultElevation: 120, defaultColor: '#e2e8f0'},
  {id: 'tv-lcd', name: 'LCD TV', furnitureType: 'electronics', category: 'Living Room', type: 'rectangle', width: 120, depth: 10, height3d: 70, defaultElevation: 100, defaultColor: '#1e293b', svgPath: 'M0 40 H100 V55 H0 Z M35 55 H65 V65 H35 Z'}, 
 {id: 'dining-table-round', name: 'Round Dining Table', furnitureType: 'table', category: 'Kitchen', type: 'circle', width: 100, depth: 100, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M 50, 50 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0'}, 
 {id: 'dining-table-square', name: 'Square Dining Table', furnitureType: 'table', category: 'Kitchen', type: 'rectangle', width: 90, depth: 90, height3d: 75, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M10 10 H90 V90 H10 Z'},
 
  // Bathroom
  { 
    id: 'toilet', 
    name: 'Standard Toilet', 
    furnitureType: 'toilet',
    category: 'Bathroom', 
    type: 'rectangle', 
    width: 40, 
    depth: 65, 
    height3d: 45,
    defaultColor: '#f8fafc',
    svgPath: 'M20 0 H80 V35 H20 Z M30 35 Q30 100 50 100 Q70 100 70 35 Z'
  },
  { id: 'bathtub', name: 'Bathtub', furnitureType: 'bathtub', category: 'Bathroom', type: 'rectangle', width: 170, depth: 75, height3d: 60, defaultColor: '#f8fafc', svgPath: 'M0 0 H100 V100 H0 Z M10 10 Q10 90 50 90 Q90 90 90 10 Z' },
  { 
    id: 'floor-lamp', 
    name: 'Floor Lamp', 
    furnitureType: 'light',
    category: 'Living Room', 
    type: 'circle', 
    width: 40, 
    depth: 40, 
    height3d: 160,
    defaultColor: '#fef9c3',
    svgPath: 'M 50, 50 m -15, 0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0'
  },
  { 
    id: 'table-lamp', 
    name: 'Table Lamp', 
    furnitureType: 'light',
    category: 'Office', 
    type: 'circle', 
    width: 25, 
    depth: 25, 
    height3d: 45,
    defaultElevation: 75,
    defaultColor: '#fef9c3',
    svgPath: 'M 50, 50 m -10, 0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 50, 50 m -25, 0 a 25,25 0 1,0 50,0 a 40,40 0 1,0 -50,0'
  },
];
