import React from 'react';
import { Layout, Cloud } from 'lucide-react';
import { useStore } from '@/src/store';

export const ProjectTitle: React.FC = () => {
  const { projectName, setProjectName, cloudName } = useStore();

  return (
    <div className="flex items-center gap-3 pr-2 border-r border-slate-100 hidden sm:flex">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex shrink-0 items-center justify-center text-white shadow-sm">
        <Layout size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none w-24 sm:w-28 md:w-40 placeholder:text-slate-300"
            title={cloudName ? `Filename: ${cloudName}` : 'Project name'}
          />
          {cloudName && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100/50 text-[8px] text-indigo-400 font-bold tracking-wider">
              <Cloud size={9} />
              <span className="truncate max-w-[60px] md:max-w-[100px]">{cloudName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
