import React, { useMemo, useState, useEffect } from 'react';
import { 
  Square, 
  Bed, 
  Tv, 
  Monitor, 
  Image as ImageIcon, 
  DoorOpen, 
  Box, 
  Lightbulb, 
  Bath, 
  Armchair, 
  Table, 
  Columns, 
  Layers, 
  Archive,
  Maximize,
  Search,
  ChevronDown,
  LayoutGrid,
  Hash,
  Link,
  Link2Off,
  FolderOpen
} from 'lucide-react';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { FurnitureObject, WallAttachment, BeamObject } from '../../types';
import { isPointInPolygon } from '../../lib/geometry';

const FurnitureIcon = ({ type }: { type: FurnitureObject['furnitureType'] }) => {
  switch (type) {
    case 'bed': return <Bed size={14} />;
    case 'desk': return <Monitor size={14} />;
    case 'wardrobe': return <Archive size={14} />;
    case 'dresser': return <Columns size={14} />;
    case 'chair': return <Armchair size={14} />;
    case 'shelf': return <Layers size={14} />;
    case 'electronics': return <Tv size={14} />;
    case 'table': return <Table size={14} />;
    case 'sofa': return <Armchair size={14} />;
    case 'armchair': return <Armchair size={14} />;
    case 'nightstand': return <Square size={14} />;
    case 'toilet': return <Square size={14} />;
    case 'bathtub': return <Bath size={14} />;
    case 'light': return <Lightbulb size={14} />;
    case 'picture': return <ImageIcon size={14} />;
    default: return <Box size={14} />;
  }
};

const AttachmentIcon = ({ type }: { type: WallAttachment['type'] | 'beam' }) => {
  switch (type) {
    case 'window': return <Maximize size={14} />;
    case 'door': return <DoorOpen size={14} />;
    case 'beam': return <Hash size={14} />;
    default: return <LayoutGrid size={14} />;
  }
};

export const SceneExplorer: React.FC = () => {
  const rooms = useStore(state => state.rooms);
  const furniture = useStore(state => state.furniture);
  const attachments = useStore(state => state.wallAttachments);
  const beams = useStore(state => state.beams);
  
  const selectedId = useStore(state => state.selectedId);
  const selectedRoomId = useStore(state => state.selectedRoomId);
  const selectedAttachmentId = useStore(state => state.selectedAttachmentId);
  const selectedBeamId = useStore(state => state.selectedBeamId);

  const setSelectedId = useStore(state => state.setSelectedId);
  const setSelectedRoomId = useStore(state => state.setSelectedRoomId);
  const setSelectedAttachmentId = useStore(state => state.setSelectedAttachmentId);
  const setSelectedBeamId = useStore(state => state.setSelectedBeamId);
  const setActiveLayer = useStore(state => state.setActiveLayer);
  
  const mode = useStore(state => state.mode);
  
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {
      unassigned: true
    };
    rooms.forEach(r => {
      initialState[r.id] = true;
    });
    return initialState;
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Auto-expand based on mode
  useEffect(() => {
    const isRoomMode = ['draw-room', 'add-door', 'add-window', 'draw-beam'].includes(mode);
    const isFurnitureMode = ['draw-furniture', 'place-furniture', 'add-box', 'draw-circle'].includes(mode);

    if (isRoomMode || isFurnitureMode) {
      setExpanded(prev => {
        const next = { ...prev };
        rooms.forEach(room => {
          if (isRoomMode) next[`${room.id}-openings`] = true;
          if (isFurnitureMode) next[`${room.id}-furniture`] = true;
        });
        if (isRoomMode) next['unassigned-openings'] = true;
        if (isFurnitureMode) next['unassigned-furniture'] = true;
        return next;
      });
    }
  }, [mode, rooms]); // Include rooms to avoid stale closure

  // Grouping logic with search support
  const sceneData = useMemo(() => {
    const searchLower = search.toLowerCase();

    const data = rooms.map((room, idx) => {
      const roomLabel = `Room ${idx + 1}`;
      const matchesRoom = roomLabel.toLowerCase().includes(searchLower);

      const roomFurniture = furniture.filter(f => {
        const inRoom = isPointInPolygon({ x: f.x + f.width / 2, y: f.y + f.height / 2 }, room.points);
        const matchesSearch = f.name.toLowerCase().includes(searchLower);
        return inRoom && (matchesSearch || matchesRoom);
      });
      
      const roomAttachments = attachments.filter(a => {
        const isAttached = a.roomId === room.id;
        const typeLabel = a.type === 'door' ? 'Door' : 'Window';
        const matchesSearch = typeLabel.toLowerCase().includes(searchLower);
        return isAttached && (matchesSearch || matchesRoom);
      });
      
      const roomBeams = beams.filter(b => {
        const isAttached = b.p1Attachment?.roomId === room.id || b.p2Attachment?.roomId === room.id;
        const matchesSearch = 'Structural Beam'.toLowerCase().includes(searchLower);
        return isAttached && (matchesSearch || matchesRoom);
      });

      const openings = [...roomAttachments, ...roomBeams.map(b => ({ ...b, type: 'beam' as const }))];

      return {
        room,
        label: roomLabel,
        furniture: roomFurniture,
        openings,
        hasVisibleChildren: roomFurniture.length > 0 || openings.length > 0 || matchesRoom
      };
    });

    const filteredRooms = data.filter(d => d.hasVisibleChildren);

    // Handle objects not in any room (orphaned)
    const assignedFurnitureIds = new Set(data.flatMap(d => d.furniture.map(f => f.id)));
    const unassignedFurniture = furniture.filter(f => 
      !assignedFurnitureIds.has(f.id) && f.name.toLowerCase().includes(searchLower)
    );

    const assignedAttachmentIds = new Set(data.flatMap(d => d.openings.filter(o => 'roomId' in o).map(o => (o as WallAttachment).id)));
    const unassignedAttachments = attachments.filter(a => 
      !assignedAttachmentIds.has(a.id) && (a.type === 'door' ? 'Door' : 'Window').toLowerCase().includes(searchLower)
    );

    const assignedBeamIds = new Set(data.flatMap(d => d.openings.filter(o => !('roomId' in o)).map(o => (o as BeamObject).id)));
    const unassignedBeams = beams.filter(b => 
      !assignedBeamIds.has(b.id) && 'Structural Beam'.toLowerCase().includes(searchLower)
    );

    return {
      rooms: filteredRooms,
      unassigned: {
        furniture: unassignedFurniture,
        openings: [...unassignedAttachments, ...unassignedBeams.map(b => ({ ...b, type: 'beam' as const }))]
      }
    };
  }, [rooms, furniture, attachments, beams, search]);

  const ItemRow = ({ 
    icon, 
    label, 
    isSelected, 
    onClick,
    id,
    level = 0
  }: { 
    icon: React.ReactNode, 
    label: string, 
    isSelected: boolean, 
    onClick: () => void,
    id?: string,
    level?: number
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all text-left group",
        isSelected 
          ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm" 
          : "hover:bg-slate-50 text-slate-600 border border-transparent",
        level > 0 && "ml-2 w-[calc(100%-0.5rem)]",
        level > 1 && "ml-4 w-[calc(100%-1rem)]"
      )}
    >
      <span className={cn(
        "transition-colors flex-shrink-0",
        isSelected ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500"
      )}>
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {id && <ThemeIcon id={id} />}
    </button>
  );

  const ThemeIcon = ({ id }: { id: string }) => {
    const item = furniture.find(f => f.id === id);
    const room = rooms.find(r => r.id === id);
    const materials = item?.materials || room?.materials;
    if (!materials) return null;
    const isDetached = Object.values(materials).some(slot => slot.source === 'custom');
    return (
      <div className={cn("px-1 py-0.5 rounded transition-colors mr-1", isDetached ? "text-amber-400" : "text-indigo-400")}>
        {isDetached ? <Link2Off size={10} /> : <Link size={10} />}
      </div>
    );
  };

  const TreeHeader = ({ 
    title, 
    isOpen, 
    onToggle, 
    icon,
    isSelected,
    onClick,
    level = 0
  }: { 
    title: string, 
    isOpen: boolean, 
    onToggle: (e: React.MouseEvent) => void,
    icon: React.ReactNode,
    isSelected?: boolean,
    onClick?: () => void,
    level?: number
  }) => (
    <div className={cn(
      "flex items-center group cursor-pointer rounded-lg transition-all",
      isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50",
      level > 0 && "ml-2",
      level > 1 && "ml-4"
    )}>
      <button 
        onClick={onToggle}
        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className={cn("block transition-transform duration-200", isOpen ? "rotate-0" : "-rotate-90")}>
          <ChevronDown size={12} />
        </span>
      </button>
      <div 
        className="flex-1 flex items-center gap-2 py-1.5 pr-3 text-xs font-semibold text-slate-600"
        onClick={onClick}
      >
        <span className={cn(isSelected ? "text-indigo-500" : "text-slate-400")}>{icon}</span>
        <span className="truncate">{title}</span>
      </div>
    </div>
  );

  const FurnitureTreeItems = ({ 
    items, 
    level = 2
  }: { 
    items: FurnitureObject[], 
    level?: number
  }) => {
    return (
      <>
        {items.map(f => (
          <React.Fragment key={f.id}>
            <ItemRow
              level={level}
              id={f.id}
              label={f.name || 'Generic Object'}
              icon={<FurnitureIcon type={f.furnitureType} />}
              isSelected={selectedId === f.id}
              onClick={() => {
                setActiveLayer('furniture');
                setSelectedId(f.id);
              }}
            />
            {f.children && f.children.length > 0 && (
              <FurnitureTreeItems 
                items={f.children} 
                level={level + 1} 
              />
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 bg-slate-50/30">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Scene Explorer</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {sceneData.rooms.map((data) => {
          const isSearching = search.length > 0;
          const isRoomExpanded = expanded[data.room.id] || isSearching;
          
          return (
            <div key={data.room.id} className="space-y-0.5">
              <TreeHeader 
                title={data.label}
                icon={<Square size={14} />}
                isOpen={expanded[data.room.id] || isSearching}
                onToggle={() => toggleExpand(data.room.id)}
                isSelected={selectedRoomId === data.room.id}
                onClick={() => {
                  setActiveLayer('room');
                  setSelectedRoomId(data.room.id);
                }}
              />
              
              {isRoomExpanded && (
                <div className="space-y-0.5">
                  {/* Openings Group */}
                  <TreeHeader 
                    level={1}
                    title="Openings"
                    icon={<FolderOpen size={14} />}
                    isOpen={expanded[`${data.room.id}-openings`] || isSearching}
                    onToggle={() => toggleExpand(`${data.room.id}-openings`)}
                  />
                  {(expanded[`${data.room.id}-openings`] || isSearching) && data.openings.map((o) => (
                    <ItemRow
                      level={2}
                      key={o.id}
                      id={o.id}
                      label={'type' in o && o.type === 'beam' ? 'Structural Beam' : (o as WallAttachment).type === 'door' ? 'Door' : 'Window'}
                      icon={<AttachmentIcon type={'type' in o ? (o as any).type : 'beam'} />}
                      isSelected={('roomId' in o ? selectedAttachmentId : selectedBeamId) === o.id}
                      onClick={() => {
                        setActiveLayer('room');
                        if ('roomId' in o) {
                          setSelectedAttachmentId(o.id);
                        } else {
                          setSelectedBeamId(o.id);
                        }
                      }}
                    />
                  ))}

                  {/* Furniture Group */}
                  <TreeHeader 
                    level={1}
                    title="Furniture"
                    icon={<FolderOpen size={14} />}
                    isOpen={expanded[`${data.room.id}-furniture`] || isSearching}
                    onToggle={() => toggleExpand(`${data.room.id}-furniture`)}
                  />
                  {(expanded[`${data.room.id}-furniture`] || isSearching) && (
                    <FurnitureTreeItems items={data.furniture} level={2} />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Section */}
        {(sceneData.unassigned.furniture.length > 0 || sceneData.unassigned.openings.length > 0) && (
          <div className="mt-4 border-t border-slate-50 pt-2">
            <TreeHeader 
              title="Global / Unassigned"
              icon={<LayoutGrid size={14} />}
              isOpen={expanded.unassigned || search.length > 0}
              onToggle={() => toggleExpand('unassigned')}
            />
            {(expanded.unassigned || search.length > 0) && (
              <div className="space-y-0.5">
                {/* Openings Group */}
                {sceneData.unassigned.openings.length > 0 && (
                  <>
                    <TreeHeader 
                      level={1}
                      title="Openings"
                      icon={<FolderOpen size={14} />}
                      isOpen={expanded['unassigned-openings'] || search.length > 0}
                      onToggle={() => toggleExpand('unassigned-openings')}
                    />
                    {(expanded['unassigned-openings'] || search.length > 0) && sceneData.unassigned.openings.map((o) => (
                      <ItemRow
                        level={2}
                        key={o.id}
                        id={o.id}
                        label={'type' in o && o.type === 'beam' ? 'Structural Beam' : (o as WallAttachment).type === 'door' ? 'Door' : 'Window'}
                        icon={<AttachmentIcon type={'type' in o ? (o as any).type : 'beam'} />}
                        isSelected={('roomId' in o ? selectedAttachmentId : selectedBeamId) === o.id}
                        onClick={() => {
                          setActiveLayer('room');
                          if ('roomId' in o) {
                            setSelectedAttachmentId(o.id);
                          } else {
                            setSelectedBeamId(o.id);
                          }
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Furniture Group */}
                {sceneData.unassigned.furniture.length > 0 && (
                  <>
                    <TreeHeader 
                      level={1}
                      title="Furniture"
                      icon={<FolderOpen size={14} />}
                      isOpen={expanded['unassigned-furniture'] || search.length > 0}
                      onToggle={() => toggleExpand('unassigned-furniture')}
                    />
                    {(expanded['unassigned-furniture'] || search.length > 0) && (
                      <FurnitureTreeItems items={sceneData.unassigned.furniture} level={2} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {search && sceneData.rooms.length === 0 && sceneData.unassigned.furniture.length === 0 && sceneData.unassigned.openings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Search size={20} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">No results found</p>
            <p className="text-[10px] text-slate-400 mt-1">Try a different search term</p>
          </div>
        )}

        {rooms.length === 0 && furniture.length === 0 && attachments.length === 0 && beams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
              <LayoutGrid size={20} className="text-indigo-300" />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Scene Empty</p>
            <p className="text-[10px] text-slate-400 mt-1">Start by adding a room or drag furniture from catalog</p>
          </div>
        )}
      </div>
    </div>
  );
};

