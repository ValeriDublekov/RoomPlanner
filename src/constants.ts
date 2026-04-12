// Base64 encoded small seamless patterns to ensure they always load without CORS issues
const LAMINATE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMjAwJyBoZWlnaHQ9JzIwMCcgdmlld0JveD0nMCAwIDIwMCAyMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzIwMCcgaGVpZ2h0PScyMDAnIGZpbGw9JyNERUI4ODcnLz48ZyBzdHJva2U9JyNBNTUyMkQnIHN0cm9rZS13aWR0aD0nMC41JyBvcGFjaXR5PScwLjYnPjxwYXRoIGQ9J00wIDIwaDIwME0wIDQwaDIwME0wIDYwaDIwME0wIDgwaDIwME0wIDEwMGgyMDBNMCAxMjBoMjAwTTAgMTQwaDIwME0wIDE2MGgyMDBNMCAxODBoMjAwJy8+PHBhdGggZD0nTTUwIDB2MjBNMTUwIDIwdjIwek04MCA0MHYyME0xODAgNjB2MjB6TTQwIDgwdjIwek0xNDAgMTAwdjIwek03MCAxMjB2MjBNMTcwIDE0MHYyMHpNMzAgMTYwdjIwek0xMzAgMTgwdjIwek0xMDAgMjAwJy8+PC9nPjwvc3ZnPg==';
const TILES_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHZpZXdCb3g9JzAgMCA4MCA4MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nODAnIGhlaWdodD0nODAnIGZpbGw9JyNmOGZhZmMnLz48ZyBzdHJva2U9JyNlMmU4ZjAnIHN0cm9rZS13aWR0aD0nMC41Jz48cGF0aCBkPSdNMCA0MGg4ME00MCAwdjgwJy8+PC9nPjxwYXRoIGQ9J00wIDBoODB2ODBIOFYweiB6JyBmaWxsPSdub25lJyBzdHJva2U9JyNlMmU4ZjAnIHN0cm9rZS13aWR0aD0nMC41Jy8+PC9zdmc+';
const CONCRETE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgdmlld0JveD0nMCAwIDEwMCAxMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMDAnIGZpbGw9JyM5NDlhM2InLz48ZyBvcGFjaXR5PScwLjInPjxjaXJjbGUgY3g9JzEwJyBjeT0nMTAnIHI9JzInIGZpbGw9JyMzMzQxNTUnLz48Y2lyY2xlIGN4PSc0MCcgY3k9JzYwJyByPScxJyBmaWxsPScjMzM0MTU1Jy8+PGNpcmNsZSBjeD0nODAnIGN5PSczMCcgcj0nMycgZmlsbD0nIzMzNDE1NScvPjxjaXJjbGUgY3g9JzIwJyBjeT0nODAnIHI9JzEuNScgZmlsbD0nIzMzNDE1NScvPjwvZz48L3N2Zz4=';

export const FLOOR_TEXTURES = [
  { id: 'none', name: 'Solid Color', url: '' },
  { id: 'laminate', name: 'Laminate', url: LAMINATE_BASE64 },
  { id: 'tiles', name: 'Ceramic Tiles', url: TILES_BASE64 },
  { id: 'concrete', name: 'Polished Concrete', url: CONCRETE_BASE64 },
];

export const WOOD_COLORS = [
  { id: 'light-oak', name: 'Light Oak', color: '#E5C494' },
  { id: 'natural-pine', name: 'Natural Pine', color: '#F2D2A9' },
  { id: 'walnut', name: 'Walnut', color: '#5D4037' },
  { id: 'dark-wenge', name: 'Dark Wenge', color: '#2D1E17' },
  { id: 'beech', name: 'Beech', color: '#D2B48C' },
];
