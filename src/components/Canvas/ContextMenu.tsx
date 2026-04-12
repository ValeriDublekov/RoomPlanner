import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Copy, Trash2, ArrowUp, ArrowDown, Group, Ungroup } from 'lucide-react';

export const ContextMenu: React.FC = () => {
  const { 
    contextMenu, 
    setContextMenu, 
    deleteSelected, 
    duplicateSelected, 
    bringToFront, 
    sendToBack,
    groupSelected,
    ungroupSelected,
    selectedIds,
    furniture,
    selectedId
  } = useStore();
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu, setContextMenu]);

  if (!contextMenu.visible) return null;

  const targetItem = furniture.find(f => f.id === contextMenu.targetId);
  const isGroup = targetItem?.type === 'group';
  const isMultiSelect = selectedIds.length > 1 && selectedIds.includes(contextMenu.targetId!);
  const canGroup = selectedIds.length > 1;

  const handleAction = (action: () => void) => {
    action();
    setContextMenu({ ...contextMenu, visible: false });
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in duration-100"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      <button
        onClick={() => handleAction(() => bringToFront(contextMenu.targetId!))}
        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
      >
        <ArrowUp className="w-4 h-4" />
        {isMultiSelect ? 'Bring Selection to Front' : 'Bring to Front'}
      </button>
      <button
        onClick={() => handleAction(() => sendToBack(contextMenu.targetId!))}
        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
      >
        <ArrowDown className="w-4 h-4" />
        {isMultiSelect ? 'Send Selection to Back' : 'Send to Back'}
      </button>
      <div className="h-px bg-slate-100 my-1" />
      
      {canGroup && (
        <button
          onClick={() => handleAction(groupSelected)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
        >
          <Group className="w-4 h-4" />
          Group Selected
        </button>
      )}
      
      {isGroup && (
        <button
          onClick={() => handleAction(ungroupSelected)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
        >
          <Ungroup className="w-4 h-4" />
          Ungroup
        </button>
      )}

      <button
        onClick={() => handleAction(duplicateSelected)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
      >
        <Copy className="w-4 h-4" />
        {isMultiSelect ? 'Duplicate Selected' : 'Duplicate'}
      </button>
      <div className="h-px bg-slate-100 my-1" />
      <button
        onClick={() => handleAction(deleteSelected)}
        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
      >
        <Trash2 className="w-4 h-4" />
        {isMultiSelect ? 'Delete Selected' : 'Delete'}
      </button>
    </div>
  );
};
