// Base64 encoded small seamless patterns to ensure they always load without CORS issues
const LAMINATE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIHZpZXdCb3g9JzAgMCA0MCA0MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cGF0aCBkPSdNMCAwaDQwdjQwSDBWMHptMjAgMHY0ME0wIDIwaDQwJyBzdHJva2U9JyM4QjQ1MTMnIGZpbGw9JyNERUI4ODcnLz48L3N2Zz4=';
const TILES_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIHZpZXdCb3g9JzAgMCA0MCA0MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cGF0aCBkPSdNMCAwaDQwdjQwSDBWMHptMjAgMHY0ME0wIDIwaDQwJyBzdHJva2U9JyNjY2MnIGZpbGw9JyNmZmYnLz48L3N2Zz4=';
const CONCRETE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIHZpZXdCb3g9JzAgMCA0MCA0MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nNDAnIGhlaWdodD0nNDAnIGZpbGw9JyM5OTknLz48Y2lyY2xlIGN4PScxMCcgY3k9JzEwJyByPScxJyBmaWxsPScjODg4Jy8+PGNpcmNsZSBjeD0nMzAnIGN5PSczMCcgcj0nMicgZmlsbD0nIzc3NycvPjwvc3ZnPg==';

export const FLOOR_TEXTURES = [
  { id: 'none', name: 'Solid Color', url: '' },
  { id: 'laminate', name: 'Laminate', url: LAMINATE_BASE64 },
  { id: 'tiles', name: 'Ceramic Tiles', url: TILES_BASE64 },
  { id: 'concrete', name: 'Polished Concrete', url: CONCRETE_BASE64 },
];
