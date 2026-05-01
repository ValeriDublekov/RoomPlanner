import React from 'react';
import { X, Ruler, Link, Link2Off, Palette, Pipette } from 'lucide-react';
import { RoomObject, MaterialSlot, InteriorTheme } from '../../../types';
import { FLOOR_TEXTURES, WOOD_COLORS } from '../../../constants';
import { cn } from '../../../lib/utils';
import { useStore } from '../../../store';
import { INTERIOR_THEMES } from '../../../lib/themes';

const WALL_PALETTES = {
  neutrals: [
    { name: 'Pure White', color: '#FFFFFF' },
    { name: 'Linen', color: '#F0EDE5' },
    { name: 'Cool Grey', color: '#F2F5F8' },
    { name: 'Cream', color: '#FFFDD0' },
    { name: 'Sand', color: '#E6D6C5' },
    { name: 'Taupe', color: '#BCAFA6' },
    { name: 'Light Grey', color: '#D3D3D3' },
    { name: 'Charcoal', color: '#36454F' }
  ],
  soothing: [
    { name: 'Sage', color: '#9DC183' },
    { name: 'Mint', color: '#98FF98' },
    { name: 'Steel Blue', color: '#7393B3' },
    { name: 'Navy', color: '#000080' },
    { name: 'Lavender', color: '#E6E6FA' }
  ],
  warm: [
    { name: 'Terracotta', color: '#E2725B' },
    { name: 'Mustard', color: '#FFDB58' },
    { name: 'Rust', color: '#B7410E' },
    { name: 'Olive', color: '#808000' },
    { name: 'Coffee', color: '#A38068' }
  ]
};

const MaterialPicker: React.FC<{
  label: string;
  slot: MaterialSlot | undefined;
  onChange: (updates: Partial<MaterialSlot>) => void;
  activeTheme: InteriorTheme | undefined;
  slotType: 'wallBase' | 'floorBase';
}> = ({ label, slot, onChange, activeTheme, slotType }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  if (!slot) return null;

  const isThemeMode = slot.source === 'theme';
  const palette = activeTheme ? (slotType === 'wallBase' ? [activeTheme.wallColors.base, activeTheme.wallColors.secondary, activeTheme.wallColors.accent] : []) : [];

  const handleToggle = () => {
    if (!isThemeMode) {
      onChange({ source: 'theme', value: activeTheme ? (slotType === 'wallBase' ? activeTheme.wallColors.base : slot.value) : slot.value });
    } else {
      onChange({ source: 'custom' });
    }
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white hover:shadow-md">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Palette size={12} className="text-slate-400" />
          {label}
        </label>
        <div className="flex bg-slate-200 p-0.5 rounded-lg">
          <button
            onClick={() => isThemeMode ? null : handleToggle()}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all",
              isThemeMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Link size={10} /> Theme
          </button>
          <button
            onClick={() => !isThemeMode ? null : handleToggle()}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all",
              !isThemeMode ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Link2Off size={10} /> Custom
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isThemeMode ? (
          <div className="flex gap-2 flex-wrap items-center">
            {palette.map((color, i) => (
              <button
                key={i}
                onClick={() => onChange({ value: color })}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  slot.value === color ? "border-indigo-500 scale-110 shadow-sm" : "border-white hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            {palette.length === 0 && (
              <span className="text-[10px] text-slate-400 italic">No theme active</span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {Object.entries(WALL_PALETTES).map(([groupName, colors]) => (
                <div key={groupName} className="space-y-1">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tighter ml-0.5">
                    {groupName}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((c) => (
                      <button
                        key={c.color}
                        onClick={() => onChange({ value: c.color })}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 transition-all overflow-hidden",
                          slot.value === c.color ? "border-amber-500 scale-110 z-10 shadow-md" : "border-transparent hover:scale-105"
                        )}
                        title={c.name}
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-medium transition-colors p-1 rounded-md",
                  showAdvanced ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
              >
                <Pipette size={12} />
                Advanced
              </button>
              {showAdvanced && (
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">
                    {slot.value}
                  </div>
                  <input 
                    type="color" 
                    value={slot.value} 
                    onChange={(e) => onChange({ value: e.target.value })}
                    className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RoomEditorProps {
  selectedRoom: RoomObject;
  selectedWallIndex: number | null;
  updateRoom: (id: string, updates: Partial<RoomObject>) => void;
  deleteRoom: (id: string) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({
  selectedRoom,
  selectedWallIndex,
  updateRoom,
  deleteRoom,
}) => {
  const wallThickness = useStore(state => state.wallThickness);
  const setWallThickness = useStore(state => state.setWallThickness);
  const wallHeight = useStore(state => state.wallHeight);
  const setWallHeight = useStore(state => state.setWallHeight);
  const activeThemeId = useStore(state => state.activeThemeId);
  const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);
  
  const saveHistory = useStore(state => state.saveHistory);
  
  const materials = selectedRoom.materials || {
    wallBase: { source: 'theme', value: activeTheme ? activeTheme.wallColors.base : (selectedRoom.defaultWallColor || '#f8fafc') },
  };

  const updateMaterialSlot = (slotName: 'wallBase' | 'floorBase', updates: Partial<MaterialSlot>) => {
    saveHistory();
    const newMaterials = { ...materials };
    newMaterials[slotName] = { ...newMaterials[slotName]!, ...updates };
    
    updateRoom(selectedRoom.id, { 
      materials: newMaterials,
      // Keep legacy fields in sync for backward compatibility
      defaultWallColor: slotName === 'wallBase' ? (updates.value || newMaterials.wallBase?.value) : selectedRoom.defaultWallColor
    });
  };

  return (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Properties</div>
      
      <div className="space-y-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Ruler size={12} className="text-slate-400" />
          Global Wall Dimensions
        </label>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thickness</span>
              <span className="text-[10px] font-mono font-bold text-indigo-600">{wallThickness}cm</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={wallThickness}
              onChange={(e) => setWallThickness(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (3D)</span>
              <span className="text-[10px] font-mono font-bold text-indigo-600">{wallHeight}cm</span>
            </div>
            <input
              type="range"
              min="100"
              max="400"
              step="5"
              value={wallHeight}
              onChange={(e) => setWallHeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Floor Texture</label>
        <div className="grid grid-cols-2 gap-2">
          {FLOOR_TEXTURES.map(tex => (
            <button
              key={tex.id}
              onClick={() => updateRoom(selectedRoom.id, { floorTexture: tex.id })}
              className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-center",
                selectedRoom.floorTexture === tex.id || (!selectedRoom.floorTexture && tex.id === 'none')
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {tex.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Floor Color / Tint</label>
        <div className="flex gap-2 flex-wrap">
          {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
            <button
              key={color}
              onClick={() => updateRoom(selectedRoom.id, { floorColor: color })}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                (selectedRoom.floorColor || '#f1f5f9') === color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedRoom.floorColor || '#f1f5f9'} 
            onChange={(e) => updateRoom(selectedRoom.id, { floorColor: e.target.value })}
            className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <MaterialPicker 
          label="Default Wall Material" 
          slot={materials.wallBase} 
          slotType="wallBase"
          activeTheme={activeTheme}
          onChange={(u) => updateMaterialSlot('wallBase', u)} 
        />
      </div>

      {selectedWallIndex !== null && (
        <div className="space-y-1.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Wall #{selectedWallIndex + 1} Color</label>
          <div className="flex gap-2 flex-wrap">
            {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
              <button
                key={color}
                onClick={() => {
                  const newColors = [...(selectedRoom.wallColors || [])];
                  while (newColors.length < selectedRoom.points.length) {
                    newColors.push('');
                  }
                  newColors[selectedWallIndex] = color;
                  updateRoom(selectedRoom.id, { wallColors: newColors });
                }}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  (selectedRoom.wallColors?.[selectedWallIndex] || selectedRoom.defaultWallColor || '#f8fafc') === color ? "border-indigo-500 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input 
              type="color" 
              value={selectedRoom.wallColors?.[selectedWallIndex] || selectedRoom.defaultWallColor || '#f8fafc'} 
              onChange={(e) => {
                const newColors = [...(selectedRoom.wallColors || [])];
                while (newColors.length < selectedRoom.points.length) {
                  newColors.push('');
                }
                newColors[selectedWallIndex] = e.target.value;
                updateRoom(selectedRoom.id, { wallColors: newColors });
              }}
              className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
            />
          </div>
          <p className="text-[9px] text-indigo-400 italic">This overrides the default room wall color.</p>
        </div>
      )}

      <button
        onClick={() => deleteRoom(selectedRoom.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete Room
      </button>
    </>
  );
};
