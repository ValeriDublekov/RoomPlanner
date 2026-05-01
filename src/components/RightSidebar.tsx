import React from 'react';
import { useStore } from '@/src/store';
import { PropertyEditor, SceneExplorer } from '@/src/components/Sidebar';
import { ThemeManager } from '@/src/components/Sidebar/ThemeManager';
import { PanelLeftClose, Settings2, ListTree, Sparkles, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface TabButtonProps {
  id: 'explorer' | 'properties' | 'themes';
  activeTab: 'explorer' | 'properties' | 'themes';
  setActiveTab: (tab: 'explorer' | 'properties' | 'themes') => void;
  icon: LucideIcon;
  label: string;
  isObjectSelected: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ id, activeTab, setActiveTab, icon: Icon, label, isObjectSelected }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
      activeTab === id 
        ? "text-indigo-600 border-indigo-600 bg-indigo-50/30" 
        : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50"
    )}
  >
    <Icon size={14} />
    <span className="hidden sm:inline">{label}</span>
    {id === 'properties' && isObjectSelected && (
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
    )}
  </button>
);

export const RightSidebar: React.FC = () => {
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const setSidebarWidth = useStore(state => state.setSidebarWidth);
  const selectedId = useStore(state => state.selectedId);
  const furniture = useStore(state => state.furniture);
  const updateFurniture = useStore(state => state.updateFurniture);
  const rooms = useStore(state => state.rooms);
  const dimensions = useStore(state => state.dimensions);
  const selectedDimensionId = useStore(state => state.selectedDimensionId);
  const deleteDimension = useStore(state => state.deleteDimension);
  const selectedRoomId = useStore(state => state.selectedRoomId);
  const selectedWallIndex = useStore(state => state.selectedWallIndex);
  const deleteRoom = useStore(state => state.deleteRoom);
  const updateRoom = useStore(state => state.updateRoom);
  const wallAttachments = useStore(state => state.wallAttachments);
  const selectedAttachmentId = useStore(state => state.selectedAttachmentId);
  const updateWallAttachment = useStore(state => state.updateWallAttachment);
  const deleteWallAttachment = useStore(state => state.deleteWallAttachment);
  const beams = useStore(state => state.beams);
  const selectedBeamId = useStore(state => state.selectedBeamId);
  const updateBeam = useStore(state => state.updateBeam);
  const deleteBeam = useStore(state => state.deleteBeam);
  const saveHistory = useStore(state => state.saveHistory);
  const bringToFront = useStore(state => state.bringToFront);
  const sendToBack = useStore(state => state.sendToBack);
  const bringForward = useStore(state => state.bringForward);
  const sendBackward = useStore(state => state.sendBackward);
  const pixelsPerCm = useStore(state => state.pixelsPerCm);
  const deleteSelected = useStore(state => state.deleteSelected);

  const [activeTab, setActiveTab] = React.useState<'explorer' | 'properties' | 'themes'>('explorer');

  const selectedFurniture = furniture.find(f => f.id === selectedId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedDimension = dimensions.find(d => d.id === selectedDimensionId);
  const selectedAttachment = wallAttachments.find(a => a.id === selectedAttachmentId);
  const selectedBeam = beams.find(b => b.id === selectedBeamId);

  const isObjectSelected = !!(selectedFurniture || selectedRoom || selectedDimension || selectedAttachment || selectedBeam);

  // Automatically switch to properties when something is selected
  React.useEffect(() => {
    if (isObjectSelected) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setActiveTab('properties');
    }
  }, [isObjectSelected]);

  React.useEffect(() => {
    if (sidebarRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setSidebarWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(sidebarRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [setSidebarWidth]);

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        "w-80 lg:w-[320px] xl:w-[360px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl lg:shadow-none z-30 overflow-hidden absolute lg:relative right-0 top-0 bottom-0 transition-transform duration-300 ease-in-out",
        // Mobile visibility could be toggled here if needed
      )}
    >
      {/* Tabs Header */}
      <div className="flex border-b border-slate-100 bg-white">
        <TabButton id="explorer" activeTab={activeTab} setActiveTab={setActiveTab} icon={ListTree} label="Explorer" isObjectSelected={isObjectSelected} />
        <TabButton id="properties" activeTab={activeTab} setActiveTab={setActiveTab} icon={Settings2} label="Properties" isObjectSelected={isObjectSelected} />
        <TabButton id="themes" activeTab={activeTab} setActiveTab={setActiveTab} icon={Sparkles} label="Themes" isObjectSelected={isObjectSelected} />
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Explorer Content */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out transform",
          activeTab === 'explorer' ? "translate-x-0 opacity-100 z-10" : (activeTab === 'properties' ? "-translate-x-full opacity-0 z-0 pointer-events-none" : "-translate-x-full opacity-0 z-0 pointer-events-none")
        )}>
          <SceneExplorer />
        </div>

        {/* Themes Content */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out transform",
          activeTab === 'themes' ? "translate-x-0 opacity-100 z-10" : (activeTab === 'properties' ? "translate-x-full opacity-0 z-0 pointer-events-none" : "translate-x-full opacity-0 z-0 pointer-events-none")
        )}>
          <ThemeManager />
        </div>

        {/* Properties Content */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out transform overflow-y-auto custom-scrollbar",
          activeTab === 'properties' ? "translate-x-0 opacity-100 z-10" : "translate-x-full opacity-0 z-0 pointer-events-none"
        )}>
          {isObjectSelected ? (
            <PropertyEditor
              selectedFurniture={selectedFurniture}
              selectedRoom={selectedRoom}
              selectedWallIndex={selectedWallIndex}
              selectedDimension={selectedDimension}
              selectedAttachment={selectedAttachment}
              selectedBeam={selectedBeam}
              pixelsPerCm={pixelsPerCm}
              updateFurniture={updateFurniture}
              updateRoom={updateRoom}
              deleteFurniture={deleteSelected}
              deleteRoom={deleteRoom}
              deleteDimension={deleteDimension}
              updateAttachment={updateWallAttachment}
              deleteAttachment={deleteWallAttachment}
              updateBeam={updateBeam}
              deleteBeam={deleteBeam}
              saveHistory={saveHistory}
              bringToFront={bringToFront}
              sendToBack={sendToBack}
              bringForward={bringForward}
              sendBackward={sendBackward}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-200">
                <Settings2 size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">No Object Selected</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
                Select an element from the plan or the list to edit its properties.
              </p>
              <button 
                onClick={() => setActiveTab('explorer')}
                className="mt-6 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
              >
                Go to Scene Explorer
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Close Button (Optional if we have a toggle) */}
      <button 
        className="lg:hidden absolute bottom-4 right-4 w-12 h-12 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center z-40"
        onClick={() => {
          useStore.getState().setSelectedId(null);
          useStore.getState().setSelectedRoomId(null);
          useStore.getState().setSelectedDimensionId(null);
          useStore.getState().setSelectedAttachmentId(null);
          useStore.getState().setSelectedBeamId(null);
          useStore.getState().setSelectedIds([]);
          setSidebarWidth(0);
        }}
      >
        <PanelLeftClose size={20} />
      </button>
    </aside>
  );
};
