import React, { useState } from 'react';
import { MousePointer2, Pencil, Square, Ruler, DoorOpen, Layout, Circle, BookPlus, LogIn, LogOut, User as UserIcon, Cloud, Download, Upload } from 'lucide-react';
import { useStore } from '@/src/store';
import { ToolButton, FileActions, CatalogModal } from './Sidebar';
import { loginWithGoogle, logout } from '@/src/firebase';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'draw-room', icon: Pencil, label: 'Draw Room (R)' },
  { id: 'add-box', icon: Square, label: 'Add Box (B)' },
  { id: 'draw-circle', icon: Circle, label: 'Add Circle (O)' },
  { id: 'draw-furniture', icon: Pencil, label: 'Draw Object (F)' },
  { id: 'calibrate', icon: Ruler, label: 'Calibrate (C)' },
  { id: 'measure', icon: Ruler, label: 'Measure (M)' },
  { id: 'dimension', icon: Ruler, label: 'Dimension (D)' },
  { id: 'add-door', icon: DoorOpen, label: 'Add Door' },
  { id: 'add-window', icon: Layout, label: 'Add Window' },
] as const;

export const Sidebar: React.FC = () => {
  const mode = useStore(state => state.mode);
  const setMode = useStore(state => state.setMode);
  const activeLayer = useStore(state => state.activeLayer);
  const setBackgroundImage = useStore(state => state.setBackgroundImage);
  const loadState = useStore(state => state.loadState);
  const backgroundImage = useStore(state => state.backgroundImage);
  const backgroundVisible = useStore(state => state.backgroundVisible);
  const setBackgroundVisible = useStore(state => state.setBackgroundVisible);
  const backgroundOpacity = useStore(state => state.backgroundOpacity);
  const setBackgroundOpacity = useStore(state => state.setBackgroundOpacity);
  const setSelectedId = useStore(state => state.setSelectedId);
  const setSelectedIds = useStore(state => state.setSelectedIds);
  const setSelectedRoomId = useStore(state => state.setSelectedRoomId);
  const setSelectedDimensionId = useStore(state => state.setSelectedDimensionId);
  const setSelectedAttachmentId = useStore(state => state.setSelectedAttachmentId);
  const currentUser = useStore(state => state.currentUser);
  const isAuthLoading = useStore(state => state.isAuthLoading);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Tools</div>
          <div className="space-y-1">
            {tools
              .filter(tool => {
                if (tool.id === 'select') return true;
                if (activeLayer === 'blueprint') return tool.id === 'calibrate';
                if (activeLayer === 'room') return tool.id === 'draw-room' || tool.id === 'add-door' || tool.id === 'add-window';
                if (activeLayer === 'furniture') return tool.id === 'add-box' || tool.id === 'draw-circle' || tool.id === 'draw-furniture' || tool.id === 'measure' || tool.id === 'dimension';
                return false;
              })
              .map((tool) => (
                <ToolButton
                  key={tool.id}
                  id={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  isActive={mode === tool.id}
                  onClick={() => {
                    setMode(tool.id as any);
                    setSelectedId(null);
                    setSelectedIds([]);
                    setSelectedRoomId(null);
                    setSelectedDimensionId(null);
                    setSelectedAttachmentId(null);
                  }}
                />
              ))}
            
            {activeLayer === 'furniture' && (
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 mt-4 border border-indigo-100 shadow-sm"
              >
                <BookPlus size={18} />
                Open Catalog
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
        {/* Auth Section */}
        <div className="px-2 pb-2">
          {isAuthLoading ? (
            <div className="h-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200 bg-white"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
            >
              <LogIn size={18} className="text-indigo-600" />
              Login with Google
            </button>
          )}
        </div>

        <FileActions
          onImageUpload={handleImageUpload}
          backgroundImage={backgroundImage}
          backgroundVisible={backgroundVisible}
          setBackgroundVisible={setBackgroundVisible}
          backgroundOpacity={backgroundOpacity}
          setBackgroundOpacity={setBackgroundOpacity}
          removeBackgroundImage={() => setBackgroundImage(null)}
          hideImageActions={activeLayer !== 'blueprint'}
        />

        {activeLayer === 'blueprint' && (
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl mx-4 mb-4">
            <p className="text-[10px] text-indigo-700 font-medium leading-tight">
              Blueprint Layer: Upload and calibrate your floor plan image here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
