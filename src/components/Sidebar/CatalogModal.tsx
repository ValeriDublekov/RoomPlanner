import React, { useState } from 'react';
import { FURNITURE_CATALOG } from '../../constants/furnitureCatalog';
import { useStore } from '../../store';
import { CatalogItem } from '../../types';
import { X, Plus, Search, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({ isOpen, onClose }) => {
  const { addFurniture, pixelsPerCm, setMode } = useStore();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customDepth, setCustomDepth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [customElevation, setCustomElevation] = useState<number>(0);

  if (!isOpen) return null;

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItem(item);
    setCustomWidth(item.width);
    setCustomDepth(item.depth);
    setCustomHeight(item.height3d || 75); // Default 75cm if not specified
    setCustomElevation(item.defaultElevation || 0);
  };

  const handleAddItem = () => {
    if (!selectedItem) return;

    const widthPx = customWidth * pixelsPerCm;
    const heightPx = customDepth * pixelsPerCm;
    const height3dPx = customHeight * pixelsPerCm;
    const elevationPx = customElevation * pixelsPerCm;
    
    addFurniture({
      type: selectedItem.type === 'circle' ? 'circle' : 'box',
      furnitureType: selectedItem.furnitureType || 'generic',
      name: selectedItem.name,
      x: 200,
      y: 200,
      width: widthPx,
      height: heightPx,
      height3d: height3dPx,
      elevation: elevationPx,
      rotation: 0,
      color: selectedItem.defaultColor,
      svgPath: selectedItem.svgPath
    });
    setMode('select');
    onClose();
  };

  const filteredCatalog = FURNITURE_CATALOG.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(FURNITURE_CATALOG.map(item => item.category)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Furniture Catalog</h2>
              <p className="text-xs text-slate-500 font-medium">Select and customize standard household items</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar / Categories */}
          <div className="w-48 border-r border-slate-100 p-4 space-y-1 overflow-y-auto bg-slate-50/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Categories</div>
            <button 
              onClick={() => setSearch('')}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all",
                search === '' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSearch(cat)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all",
                  search === cat ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Grid */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search furniture..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalog.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left group",
                    selectedItem?.id === item.id 
                      ? "border-indigo-500 bg-indigo-50/30 shadow-sm" 
                      : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50"
                  )}
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:text-indigo-200 transition-colors overflow-hidden p-4">
                    {item.svgPath ? (
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-current stroke-current stroke-2">
                        <path d={item.svgPath} fillOpacity="0.2" />
                      </svg>
                    ) : (
                      item.type === 'circle' ? <div className="w-12 h-12 rounded-full border-4 border-current" /> : <div className="w-12 h-12 border-4 border-current rounded-md" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-700 mb-1 group-hover:text-indigo-700">{item.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Customization Panel */}
          <div className="w-72 border-l border-slate-100 p-6 bg-slate-50/30 flex flex-col">
            {selectedItem ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customize Item</div>
                
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">{selectedItem.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{selectedItem.category}</p>
                </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
                      <input 
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Depth (cm)</label>
                      <input 
                        type="number"
                        value={customDepth}
                        onChange={(e) => setCustomDepth(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Height (cm)</label>
                      <input 
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Elevation (cm)</label>
                      <input 
                        type="number"
                        value={customElevation}
                        onChange={(e) => setCustomElevation(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                <div className="pt-4">
                  <button 
                    onClick={handleAddItem}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add to Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                <Info size={48} className="text-slate-300" />
                <p className="text-sm font-medium text-slate-400">Select an item to customize and add to your plan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
