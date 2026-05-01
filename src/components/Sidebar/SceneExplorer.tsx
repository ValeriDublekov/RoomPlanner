import React, { useMemo } from 'react';
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
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Hash
} from 'lucide-react';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { FurnitureObject, RoomObject, WallAttachment, BeamObject } from '../../types';

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

const AttachmentIcon = ({ type }: { type: WallAttachment['type'] }) => {
  switch (type) {
    case 'window': return <Maximize size={14} />;
    case 'door': return <DoorOpen size={14} />;
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
  
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    rooms: true,
    furniture: true,
    attachments: true,
    beams: true
  });

  const toggleExpand = (group: string) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const filteredFurniture = useMemo(() => 
    furniture.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [furniture, search]
  );

  const filteredRooms = useMemo(() => 
    rooms.filter((r, idx) => `Room ${idx + 1}`.toLowerCase().includes(search.toLowerCase())),
    [rooms, search]
  );

  const filteredAttachments = useMemo(() => 
    attachments.filter(a => (a.type === 'door' ? 'Door' : 'Window').toLowerCase().includes(search.toLowerCase())),
    [attachments, search]
  );

  const filteredBeams = useMemo(() => 
    beams.filter(b => 'Structural Beam'.toLowerCase().includes(search.toLowerCase())),
    [beams, search]
  );

  const ItemRow = ({ 
    icon, 
    label, 
    isSelected, 
    onClick,
    id 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    isSelected: boolean, 
    onClick: () => void,
    id: string
  }) => (
    <button
      id={`explorer-item-${id}`}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left group",
        isSelected 
          ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm" 
          : "hover:bg-slate-50 text-slate-600 border border-transparent"
      )}
    >
      <span className={cn(
        "transition-colors",
        isSelected ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500"
      )}>
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
    </button>
  );

  const GroupHeader = ({ title, count, group }: { title: string, count: number, group: string }) => (
    <button 
      onClick={() => toggleExpand(group)}
      className="w-full flex items-center justify-between px-2 py-3 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        <span className="transition-transform duration-200">
          {expanded[group] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {title}
        <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[9px]">{count}</span>
      </div>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 bg-slate-50/30">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Properties & Scene</label>
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

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredRooms.length > 0 && (
          <div>
            <GroupHeader title="Rooms" count={filteredRooms.length} group="rooms" />
            {expanded.rooms && filteredRooms.map((room, idx) => (
              <ItemRow
                key={room.id}
                id={room.id}
                label={`Room ${idx + 1}`}
                icon={<Square size={14} />}
                isSelected={selectedRoomId === room.id}
                onClick={() => setSelectedRoomId(room.id)}
              />
            ))}
          </div>
        )}

        {filteredFurniture.length > 0 && (
          <div>
            <GroupHeader title="Furniture" count={filteredFurniture.length} group="furniture" />
            {expanded.furniture && filteredFurniture.map(f => (
              <ItemRow
                key={f.id}
                id={f.id}
                label={f.name || 'Generic Object'}
                icon={<FurnitureIcon type={f.furnitureType} />}
                isSelected={selectedId === f.id}
                onClick={() => setSelectedId(f.id)}
              />
            ))}
          </div>
        )}

        {filteredAttachments.length > 0 && (
          <div>
            <GroupHeader title="Openings" count={filteredAttachments.length} group="attachments" />
            {expanded.attachments && filteredAttachments.map(a => (
              <ItemRow
                key={a.id}
                id={a.id}
                label={a.type === 'door' ? 'Door' : 'Window'}
                icon={<AttachmentIcon type={a.type} />}
                isSelected={selectedAttachmentId === a.id}
                onClick={() => setSelectedAttachmentId(a.id)}
              />
            ))}
          </div>
        )}

        {filteredBeams.length > 0 && (
          <div>
            <GroupHeader title="Structural Beams" count={filteredBeams.length} group="beams" />
            {expanded.beams && filteredBeams.map(b => (
              <ItemRow
                key={b.id}
                id={b.id}
                label="Structural Beam"
                icon={<Hash size={14} />}
                isSelected={selectedBeamId === b.id}
                onClick={() => setSelectedBeamId(b.id)}
              />
            ))}
          </div>
        )}

        {search && [filteredRooms, filteredFurniture, filteredAttachments, filteredBeams].every(arr => arr.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Search size={20} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">No results found</p>
            <p className="text-[10px] text-slate-400 mt-1">Try a different search term</p>
          </div>
        )}

        {!search && rooms.length === 0 && furniture.length === 0 && attachments.length === 0 && beams.length === 0 && (
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
