// Base64 encoded small seamless patterns to ensure they always load without CORS issues
// Base64 encoded small seamless patterns to ensure they always load without CORS issues
const WOOD_GRAIN_SVG = (color: string, grainColor: string) => {
  const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${color}"/><g opacity="0.3" stroke="${grainColor}" stroke-width="0.5" fill="none"><path d="M0 5 Q 16 8 32 5 T 64 5"/><path d="M0 15 Q 32 12 32 15 T 64 15"/><path d="M0 25 Q 16 28 32 25 T 64 25"/><path d="M0 35 Q 32 32 32 35 T 64 35"/><path d="M0 45 Q 16 48 32 45 T 64 45"/><path d="M0 55 Q 32 52 32 55 T 64 55"/></g></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const LIGHT_WOOD_BASE64 = WOOD_GRAIN_SVG('#F5E6CC', '#D2B48C'); // Natural Oak/Beech
const MEDIUM_WOOD_BASE64 = WOOD_GRAIN_SVG('#D2B48C', '#8B4513'); // Golden Oak
const DARK_WOOD_BASE64 = WOOD_GRAIN_SVG('#5D4037', '#3E2723'); // Walnut/Dark Brown
const TILES_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHZpZXdCb3g9JzAgMCA4MCA4MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nODAnIGhlaWdodD0nODAnIGZpbGw9JyNmOGZhZmMnLz48ZyBzdHJva2U9JyNjYmQ1ZTEnIHN0cm9rZS13aWR0aD0nMC44Jz48cGF0aCBkPSdNMCA0MGg4ME00MCAwdjgwJy8+PC9nPjxwYXRoIGQ9J00wIDBoODB2ODBIOFYweiB6JyBmaWxsPSdub25lJyBzdHJva2U9JyNjYmQ1ZTEnIHN0cm9rZS13aWR0aD0nMC44Jy8+PC9zdmc+';
const CONCRETE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgdmlld0JveD0nMCAwIDEwMCAxMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMDAnIGZpbGw9JyM5NDlhM2InLz48ZyBvcGFjaXR5PScwLjQnPjxjaXJjbGUgY3g9JzEwJyBjeT0nMTAnIHI9JzInIGZpbGw9JyMzMzQxNTUnLz48Y2lyY2xlIGN4PSc0MCcgY3k9JzYwJyByPScxJyBmaWxsPScjMzM0MTU1Jy8+PGNpcmNsZSBjeD0nODAnIGN5PSczMCcgcj0nMycgZmlsbD0nIzMzNDE1NScvPjxjaXJjbGUgY3g9JzIwJyBjeT0nODAnIHI9JzEuNScgZmlsbD0nIzMzNDE1NScvPjwvZz48L3N2Zz4=';
const MARBLE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMjAwJyBoZWlnaHQ9JzIwMCcgdmlld0JveD0nMCAwIDIwMCAyMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PGcgb3BhY2l0eT0nMC4xNScgc3Ryb2tlPScjMDAwJyBzdHJva2Utd2lkdGg9JzAuNScgZmlsbD0nbm9uZSc+PHBhdGggZD0nTTAgNTAgUSA1MCA0MCAxMDAgNTAgVCAyMDAgNTAnLz48cGF0aCBkPSdNNTAgMCBRIDQwIDUwIDUwIDEwMCBUIDUwIDIwMCcvPjxwYXRoIGQ9J00xMDAgMCBRIDExMCA1MCAxMDAgMTAwIFQgMTAwIDIwMCcvPjxwYXRoIGQ9J00wIDE1MCBRIDUwIDE0MCAxMDAgMTUwIFQgMjAwIDE1MCcvPjwvZz48L3N2Zz4=';
const CARPET_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIHZpZXdCb3g9JzAgMCA0MCA0MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZyBvcGFjaXR5PScwLjInPjxjaXJjbGUgY3g9JzInIGN5PScyJyByPScwLjUnIGZpbGw9JyMwMDAnLz48Y2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScwLjUnIGZpbGw9JyMwMDAnLz48Y2lyY2xlIGN4PScyMicgY3k9JzIyJyByPScwLjUnIGZpbGw9JyMwMDAnLz48Y2lyY2xlIGN4PSczMicgY3k9JzMyJyByPScwLjUnIGZpbGw9JyMwMDAnLz48L2c+PC9zdmc+';
const WOOD_GRAIN_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjQnIGhlaWdodD0nNjQnIHZpZXdCb3g9JzAgMCA2NCA2NCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nNjQnIGhlaWdodD0nNjQnIGZpbGw9JyNmZmZmZmYnLz48ZyBvcGFjaXR5PScwLjA1Jz48cmVjdCB4PScwJyB5PScwJyB3aWR0aD0nMC41JyBoZWlnaHQ9JzY0JyBmaWxsPScjMDAwMDAwJy8+PHJlY3QgeD0nMTAnIHk9JzAnIHdpZHRoPScwLjUnIGhlaWdodD0nNjQnIGZpbGw9JyMwMDAwMDAnLz48cmVjdCB4PScyNScgeT0nMCcgd2lkdGg9JzAuNScgaGVpZ2h0PSc2NCcgZmlsbD0nIzAwMDAwMCcvPjxyZWN0IHg9JzQ1JyB5PScwJyB3aWR0aD0nMC41JyBoZWlnaHQ9JzY0JyBmaWxsPScjMDAwMDAwJy8+PHJlY3QgeD0nNTUnIHk9JzAnIHdpZHRoPScwLjUnIGhlaWdodD0nNjQnIGZpbGw9JyMwMDAwMDAnLz48L2c+PC9zdmc+';

export const FLOOR_TEXTURES = [
  { id: 'none', name: 'Solid Color', url: '' },
  { id: 'laminate', name: 'Light Wood', url: LIGHT_WOOD_BASE64 },
  { id: 'wood', name: 'Medium Wood', url: MEDIUM_WOOD_BASE64 },
  { id: 'parquet', name: 'Dark Wood', url: DARK_WOOD_BASE64 },
  { id: 'tiles', name: 'Ceramic Tiles', url: TILES_BASE64 },
  { id: 'concrete', name: 'Polished Concrete', url: CONCRETE_BASE64 },
  { id: 'marble', name: 'Marble', url: MARBLE_BASE64 },
  { id: 'carpet', name: 'Carpet', url: CARPET_BASE64 },
];

export const WOOD_COLORS = [
  { id: 'light-oak', name: 'Light Oak', color: '#D2B48C' },
  { id: 'natural-pine', name: 'Natural Pine', color: '#F5DEB3' },
  { id: 'walnut', name: 'Walnut', color: '#5D4037' },
  { id: 'dark-wenge', name: 'Dark Wenge', color: '#2D1E17' },
  { id: 'beech', name: 'Beech', color: '#E3C58E' },
];

export const WOOD_GRAIN = WOOD_GRAIN_BASE64;
