import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToolButtonProps {
  id: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  id,
  icon: Icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-indigo-50 text-indigo-600 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
      )}>
        <Icon size={18} />
      </div>
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </button>
  );
};
