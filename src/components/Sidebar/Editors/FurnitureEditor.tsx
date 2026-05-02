import React from 'react';
import { X, RotateCcw, RotateCw, ArrowUpToLine, ChevronUp, ChevronDown, ArrowDownToLine, ClipboardCopy } from 'lucide-react';
import { FurnitureObject, MaterialSlot, ObjectMaterials, InteriorTheme } from '../../../types';
import { WOOD_COLORS } from '../../../constants';
import { cn } from '../../../lib/utils';
import { Palette, Link, Link2Off, Pipette } from 'lucide-react';
import { useStore } from '../../../store';
import { INTERIOR_THEMES } from '../../../lib/themes';
import { getDefaultMaterialsForType } from '../../../lib/materials';

const CURATED_PALETTES = {
  hard: {
    wood: [
      { name: 'Light Oak', color: '#d1bfae' },
      { name: 'Walnut', color: '#5c4033' },
      { name: 'Cherry', color: '#7b3f00' }
    ],
    solid: [
      { name: 'Matte White', color: '#FAFAFA' },
      { name: 'Matte Black', color: '#2b2b2b' },
      { name: 'Light Grey', color: '#D3D3D3' },
      { name: 'Graphite', color: '#4a4a4a' }
    ]
  },
  soft: {
    foundation: [
      { name: 'White', color: '#FFFFFF' },
      { name: 'Linen', color: '#e8dcc4' },
      { name: 'Light Grey', color: '#d3d3d3' },
      { name: 'Dark Grey', color: '#5a5a5a' }
    ],
    colors: [
      { name: 'Royal Blue', color: '#1c39bb' },
      { name: 'Mustard', color: '#ffdb58' },
      { name: 'Emerald', color: '#50c878' },
      { name: 'Pale Pink', color: '#f8c8dc' }
    ]
  }
};

interface FurnitureEditorProps {
  selectedFurniture: FurnitureObject;
  pixelsPerCm: number;
  updateFurniture: (id: string, updates: Partial<FurnitureObject>) => void;
  deleteFurniture: () => void;
  saveHistory: () => void;
  bringToFront?: (id: string) => void;
  sendToBack?: (id: string) => void;
  bringForward?: (id: string) => void;
  sendBackward?: (id: string) => void;
}

const MaterialPicker: React.FC<{
  label: string;
  slot: MaterialSlot | undefined;
  onChange: (updates: Partial<MaterialSlot>) => void;
  activeTheme: InteriorTheme | undefined;
  slotType: keyof ObjectMaterials;
  furnitureType?: string;
}> = ({ label, slot, onChange, activeTheme, slotType, furnitureType }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  if (!slot) return null;

  const getThemePalette = () => {
    if (!activeTheme) return [];
    if (slotType === 'woodBase' || slotType === 'woodFront') return [activeTheme.woodColors.base, activeTheme.woodColors.front];
    if (slotType === 'textileMain' || slotType === 'textileAccent') return [activeTheme.textileColors.main, activeTheme.textileColors.secondary, activeTheme.textileColors.accent];
    return [];
  };

  const palette = getThemePalette();
  const isThemeMode = slot.source === 'theme';

  const handleToggle = () => {
    if (!isThemeMode) {
      // Switching to Theme mode - reset to default for this slot
      let resetValue = slot.value;
      if (activeTheme) {
        if (slotType === 'woodBase') resetValue = activeTheme.woodColors.base;
        if (slotType === 'woodFront') resetValue = activeTheme.woodColors.front;
        if (slotType === 'textileMain') {
          resetValue = (furnitureType === 'bed' || furnitureType === 'rug') ? activeTheme.textileColors.main : activeTheme.textileColors.secondary;
        }
        if (slotType === 'textileAccent') resetValue = activeTheme.textileColors.accent;
      }
      onChange({ source: 'theme', value: resetValue });
    } else {
      onChange({ source: 'custom' });
    }
  };

  const isHardMaterial = slotType === 'woodBase' || slotType === 'woodFront';
  const curated = isHardMaterial ? CURATED_PALETTES.hard : CURATED_PALETTES.soft;

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
              {Object.entries(curated).map(([groupName, colors]) => (
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
                          "w-6 h-6 rounded-lg border-2 transition-all relative overflow-hidden",
                          slot.value === c.color ? "border-amber-500 scale-110 z-10 shadow-md" : "border-transparent hover:scale-105"
                        )}
                        title={c.name}
                        style={{ backgroundColor: c.color }}
                      >
                        {isHardMaterial && groupName === 'wood' && (
                           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_40%,transparent_40%,transparent_60%,#000_60%,#000_80%,transparent_80%)] bg-[length:4px_4px]" />
                        )}
                      </button>
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

const PRESET_ARTWORKS = [
  { id: 'minimal-1', name: 'Abstract Geometric', url: 'https://picsum.photos/seed/minimal-1/400/300' },
  { id: 'minimal-2', name: 'Modern Lines', url: 'https://picsum.photos/seed/minimal-2/400/300' },
  { id: 'minimal-3', name: 'Monochrome Landscape', url: 'https://picsum.photos/seed/minimal-3/400/300' },
  { id: 'minimal-4', name: 'Circular Forms', url: 'https://picsum.photos/seed/minimal-4/400/300' },
  { id: 'minimal-5', name: 'Vertical Stripes', url: 'https://picsum.photos/seed/minimal-5/400/300' },
  { id: 'minimal-6', name: 'Soft Gradient', url: 'https://picsum.photos/seed/minimal-6/400/300' },
  { id: 'minimal-7', name: 'Minimal Dot', url: 'https://picsum.photos/seed/minimal-7/400/300' },
];

export const FurnitureEditor: React.FC<FurnitureEditorProps> = ({
  selectedFurniture,
  pixelsPerCm,
  updateFurniture,
  deleteFurniture,
  saveHistory,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
}) => {
  const materials = selectedFurniture.materials || {};
  const activeThemeId = useStore(state => state.activeThemeId);
  const activeTheme = INTERIOR_THEMES.find(t => t.id === activeThemeId);
  
  const pasteImageTargetId = useStore(state => state.pasteImageTargetId);
  const setPasteImageTargetId = useStore(state => state.setPasteImageTargetId);

  const updateMaterialSlot = (slotName: keyof ObjectMaterials, updates: Partial<MaterialSlot>) => {
    saveHistory();
    const currentSlot = materials[slotName] || { source: 'theme', value: '#F8FAFC' };
    updateFurniture(selectedFurniture.id, {
      materials: {
        ...materials,
        [slotName]: { ...currentSlot, ...updates }
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Palette className="text-indigo-500" size={16} />
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Object Properties</div>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
        <input
          type="text"
          value={selectedFurniture.name}
          onFocus={saveHistory}
          onChange={(e) => updateFurniture(selectedFurniture.id, { name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Furniture Type</label>
        <select
          value={selectedFurniture.furnitureType || 'generic'}
            onFocus={saveHistory}
            onChange={(e) => {
              const newType = e.target.value as any;
              const currentMaterials = selectedFurniture.materials || {};
              const newDefaults = getDefaultMaterialsForType(newType);
              const updates: Partial<FurnitureObject> = { 
                furnitureType: newType,
                materials: { ...newDefaults, ...currentMaterials }
              };
              
              if (newType === 'air-conditioner') {
                updates.color = '#ffffff';
              }
              
              if (newType === 'picture') {
                // Better defaults for wall-mounted picture
                updates.height = 2 * pixelsPerCm; // Depth (Y on canvas)
                updates.height3d = 60 * pixelsPerCm; // Vertical height (Z)
                updates.elevation = 120 * pixelsPerCm; // Wall position
                updates.color = '#1e293b'; // Frame color
              }
              
              updateFurniture(selectedFurniture.id, updates);
            }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
        >
          <option value="generic">Generic Box</option>
          <option value="bed">Bed</option>
          <option value="desk">Desk</option>
          <option value="wardrobe">Wardrobe</option>
          <option value="dresser">Dresser</option>
          <option value="chair">Chair</option>
          <option value="shelf">Shelf / Unit</option>
          <option value="electronics">Electronics / TV</option>
          <option value="table">Table</option>
          <option value="sofa">Sofa</option>
          <option value="armchair">Armchair</option>
          <option value="nightstand">Nightstand</option>
          <option value="toilet">Toilet</option>
          <option value="bathtub">Bathtub</option>
          <option value="light">Light / Lamp</option>
          <option value="picture">Picture / Wall Art</option>
          <option value="air-conditioner">Air Conditioner</option>
          <option value="rug">Rug / Carpet</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
          <input
            type="number"
            value={Math.round(selectedFurniture.width / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { width: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Depth (cm)</label>
          <input
            type="number"
            value={Math.round(selectedFurniture.height / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { height: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Height (3D) (cm)</label>
          <input
            type="number"
            value={Math.round((selectedFurniture.height3d || 0) / pixelsPerCm)}
            readOnly={selectedFurniture.furnitureType === 'bed' || selectedFurniture.furnitureType === 'rug'}
            title={selectedFurniture.furnitureType === 'bed' ? "Calculated from frame and headboard" : (selectedFurniture.furnitureType === 'rug' ? "Fixed thickness" : "")}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { height3d: parseFloat(e.target.value) * pixelsPerCm })}
            className={cn(
              "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none transition-all",
              (selectedFurniture.furnitureType === 'bed' || selectedFurniture.furnitureType === 'rug') ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 focus:ring-2 focus:ring-indigo-500"
            )}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Elevation (cm)</label>
          <input
            type="number"
            value={Math.round((selectedFurniture.elevation || 0) / pixelsPerCm)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { elevation: parseFloat(e.target.value) * pixelsPerCm })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {(selectedFurniture.furnitureType === 'electronics' || selectedFurniture.furnitureType === 'shelf' || selectedFurniture.furnitureType === 'picture') && (
        <div className="space-y-3 pt-2">
          {selectedFurniture.furnitureType === 'picture' && (
            <div className="space-y-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Artwork</label>
                <button
                  onClick={() => setPasteImageTargetId(pasteImageTargetId === selectedFurniture.id ? null : selectedFurniture.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm border",
                    pasteImageTargetId === selectedFurniture.id 
                      ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  )}
                >
                  <ClipboardCopy size={10} />
                  {pasteImageTargetId === selectedFurniture.id ? "Waiting for Paste..." : "Paste Image Mode"}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const artworks = [...PRESET_ARTWORKS];
                  const currentUrl = selectedFurniture.imageUrl;
                  if (currentUrl && !PRESET_ARTWORKS.some(a => a.url === currentUrl)) {
                    artworks.unshift({ id: 'active-custom', name: 'Applied Artwork', url: currentUrl });
                  }
                  
                  return artworks.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => updateFurniture(selectedFurniture.id, { imageUrl: art.url })}
                      className={cn(
                        "aspect-[4/3] rounded-lg border-2 transition-all bg-white flex items-center justify-center overflow-hidden group relative",
                        selectedFurniture.imageUrl === art.url ? "border-indigo-500 scale-105 shadow-md" : "border-transparent hover:border-slate-300"
                      )}
                      title={art.name}
                    >
                      <img 
                        src={art.url} 
                        alt={art.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {art.id === 'active-custom' && (
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white p-0.5 rounded-bl-md shadow-sm">
                          <ClipboardCopy size={8} />
                        </div>
                      )}
                    </button>
                  ));
                })()}
              </div>
              <div className="pt-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Custom Image URL</label>
                <input
                  type="text"
                  value={selectedFurniture.imageUrl || ''}
                  onChange={(e) => updateFurniture(selectedFurniture.id, { imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {selectedFurniture.furnitureType === 'electronics' && (
            <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <input
                type="checkbox"
                checked={selectedFurniture.hideStand || false}
                onChange={(e) => updateFurniture(selectedFurniture.id, { hideStand: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wall Mounted</span>
                <span className="text-[10px] text-slate-500 font-medium">Hide stand in 3D view</span>
              </div>
            </label>
          )}

          {selectedFurniture.furnitureType === 'shelf' && (
            <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <input
                type="checkbox"
                checked={selectedFurniture.hasDoors || false}
                onChange={(e) => updateFurniture(selectedFurniture.id, { hasDoors: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">With Doors</span>
                <span className="text-[10px] text-slate-500 font-medium">Turn shelf into a cabinet</span>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="space-y-4 pt-2">
        {/* Helper to check if a slot should be visible for this furniture type */}
        {(() => {
          const type = selectedFurniture.furnitureType || 'generic';
          const showWoodBase = [
            'generic', 'bed', 'desk', 'wardrobe', 'dresser', 'shelf', 'table', 'nightstand', 'electronics'
          ].includes(type);
          const showWoodFront = [
            'wardrobe', 'dresser'
          ].includes(type) || (type === 'shelf' && selectedFurniture.hasDoors);
          const showTextileMain = [
            'bed', 'sofa', 'armchair', 'chair', 'rug'
          ].includes(type);
          const showTextileAccent = [
            'bed', 'armchair', 'chair', 'rug'
          ].includes(type);

          return (
            <>
              {showWoodBase && (
                <MaterialPicker 
                  label={type === 'bed' ? "Bed Frame Material" : (type === 'generic' ? "Main Material" : "Body / Base Material")}
                  slot={materials.woodBase} 
                  slotType="woodBase"
                  activeTheme={activeTheme}
                  furnitureType={type}
                  onChange={(u) => updateMaterialSlot('woodBase', u)} 
                />
              )}
              {showWoodFront && (
                <MaterialPicker 
                  label="Front / Doors Material" 
                  slot={materials.woodFront} 
                  slotType="woodFront"
                  activeTheme={activeTheme}
                  furnitureType={type}
                  onChange={(u) => updateMaterialSlot('woodFront', u)} 
                />
              )}
              {showTextileMain && (
                <MaterialPicker 
                  label={type === 'bed' ? "Mattress Material" : (type === 'rug' ? "Rug Color" : "Main Textile")} 
                  slot={materials.textileMain} 
                  slotType="textileMain"
                  activeTheme={activeTheme}
                  furnitureType={type}
                  onChange={(u) => updateMaterialSlot('textileMain', u)} 
                />
              )}
              {showTextileAccent && (
                <MaterialPicker 
                  label={type === 'bed' ? "Pillows Material" : (type === 'rug' ? "Pattern / Border" : "Accent Textile")} 
                  slot={materials.textileAccent} 
                  slotType="textileAccent"
                  activeTheme={activeTheme}
                  furnitureType={type}
                  onChange={(u) => updateMaterialSlot('textileAccent', u)} 
                />
              )}
              
              {/* Fallback for objects without semantic slots (Picture, Light, Toilet, etc) */}
              {!showWoodBase && !showTextileMain && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Main Color</label>
                  {type === 'air-conditioner' ? (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full border border-slate-200 bg-[#ffffff]" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Fixed: White Only</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap items-center">
                      {['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateFurniture(selectedFurniture.id, { color })}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            selectedFurniture.color === color ? "border-indigo-500 scale-110 shadow-sm" : "border-white"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={selectedFurniture.color || '#f8fafc'} 
                        onChange={(e) => updateFurniture(selectedFurniture.id, { color: e.target.value })}
                        className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {(selectedFurniture.furnitureType === 'wardrobe' || selectedFurniture.furnitureType === 'dresser' || selectedFurniture.furnitureType === 'bed' || (selectedFurniture.furnitureType === 'shelf' && selectedFurniture.hasDoors)) && (
        <div className="space-y-3">
          {selectedFurniture.furnitureType === 'dresser' && (
            <div className="space-y-1.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-2">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">Drawers Configuration</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Columns</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto"
                    value={selectedFurniture.drawerCols || ''}
                    onChange={(e) => updateFurniture(selectedFurniture.id, { drawerCols: parseInt(e.target.value) || undefined })}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Rows</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto"
                    value={selectedFurniture.drawerRows || ''}
                    onChange={(e) => updateFurniture(selectedFurniture.id, { drawerRows: parseInt(e.target.value) || undefined })}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedFurniture.furnitureType === 'bed' && (
            <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">Mattress Size</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Width (cm)</label>
                  <input
                    type="number"
                    value={selectedFurniture.mattressWidth || Math.round((selectedFurniture.width / pixelsPerCm) - 6)}
                    onChange={(e) => {
                      const mWidth = parseInt(e.target.value) || 0;
                      const newWidth = (mWidth + 6) * pixelsPerCm;
                      updateFurniture(selectedFurniture.id, { 
                        mattressWidth: mWidth,
                        width: newWidth,
                        height3d: (30 + 20 + (selectedFurniture.hasHeadboard ? (selectedFurniture.headboardHeight || 60) : 0)) * pixelsPerCm
                      });
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">Depth (cm)</label>
                  <input
                    type="number"
                    value={selectedFurniture.mattressDepth || Math.round((selectedFurniture.height / pixelsPerCm) - 15)}
                    onChange={(e) => {
                      const mDepth = parseInt(e.target.value) || 0;
                      const tiltRad = ((selectedFurniture.headboardTilt || 15) * Math.PI) / 180;
                      const hbProj = selectedFurniture.hasHeadboard ? (Math.sin(tiltRad) * (selectedFurniture.headboardHeight || 60) + 8) : 3;
                      const newDepth = (mDepth + hbProj + 3) * pixelsPerCm;
                      updateFurniture(selectedFurniture.id, { 
                        mattressDepth: mDepth,
                        height: newDepth,
                        height3d: (30 + 20 + (selectedFurniture.hasHeadboard ? (selectedFurniture.headboardHeight || 60) : 0)) * pixelsPerCm
                      });
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-indigo-100/50 mt-1">
                <input
                  type="checkbox"
                  id="hasHeadboard"
                  checked={selectedFurniture.hasHeadboard || false}
                  onChange={(e) => {
                    const hasHb = e.target.checked;
                    const mDepth = selectedFurniture.mattressDepth || Math.round((selectedFurniture.height / pixelsPerCm) - 15);
                    const tiltRad = ((selectedFurniture.headboardTilt || 15) * Math.PI) / 180;
                    const hbProj = hasHb ? (Math.sin(tiltRad) * (selectedFurniture.headboardHeight || 60) + 8) : 3;
                    const newDepth = (mDepth + hbProj + 3) * pixelsPerCm;
                    const hbH = selectedFurniture.headboardHeight || 60;
                    
                    updateFurniture(selectedFurniture.id, { 
                      hasHeadboard: hasHb,
                      height: newDepth,
                      headboardHeight: hbH,
                      headboardTilt: selectedFurniture.headboardTilt || 15,
                      height3d: (30 + 20 + (hasHb ? hbH : 0)) * pixelsPerCm
                    });
                  }}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="hasHeadboard" className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Include Headboard</label>
              </div>

              {selectedFurniture.hasHeadboard && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-1">HB Height (cm)</label>
                    <input
                      type="number"
                      value={selectedFurniture.headboardHeight || 60}
                      onChange={(e) => {
                        const h = parseInt(e.target.value) || 0;
                        const mDepth = selectedFurniture.mattressDepth || Math.round((selectedFurniture.height / pixelsPerCm) - 15);
                        const tiltRad = ((selectedFurniture.headboardTilt || 15) * Math.PI) / 180;
                        const hbProj = Math.sin(tiltRad) * h + 8;
                        const newDepth = (mDepth + hbProj + 3) * pixelsPerCm;
                        
                        updateFurniture(selectedFurniture.id, { 
                          headboardHeight: h,
                          height: newDepth,
                          height3d: (30 + 20 + h) * pixelsPerCm
                        });
                      }}
                      className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rotation</label>
          <button 
            onClick={() => { saveHistory(); updateFurniture(selectedFurniture.id, { rotation: 0 }); }}
            className="text-[9px] text-indigo-500 hover:text-indigo-600 font-bold uppercase tracking-tighter"
          >
            Reset (0°)
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={Math.round(selectedFurniture.rotation)}
            onFocus={saveHistory}
            onChange={(e) => updateFurniture(selectedFurniture.id, { rotation: parseFloat(e.target.value) || 0 })}
            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                saveHistory();
                updateFurniture(selectedFurniture.id, { rotation: (selectedFurniture.rotation - 90) % 360 });
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600 text-[10px] font-bold uppercase tracking-wider"
              title="Rotate -90°"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                saveHistory();
                updateFurniture(selectedFurniture.id, { rotation: (selectedFurniture.rotation + 90) % 360 });
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600 text-[10px] font-bold uppercase tracking-wider"
              title="Rotate +90°"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
          <input
            type="checkbox"
            checked={selectedFurniture.showLabel || false}
            onChange={(e) => updateFurniture(selectedFurniture.id, { showLabel: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Show Label</span>
            <span className="text-[10px] text-slate-500 font-medium">Always show name and dimensions</span>
          </div>
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Z-Order</label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => bringToFront?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Bring to Front"
          >
            <ArrowUpToLine size={14} />
          </button>
          <button
            onClick={() => bringForward?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Bring Forward"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => sendBackward?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Send Backward"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => sendToBack?.(selectedFurniture.id)}
            className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            title="Send to Back"
          >
            <ArrowDownToLine size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={deleteFurniture}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete Object
      </button>
    </>
  );
};
