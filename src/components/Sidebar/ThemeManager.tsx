import React from 'react';
import { useStore } from '../../store';
import { INTERIOR_THEMES } from '../../lib/themes';
import { Check, Palette, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ThemeManager: React.FC = () => {
  const activeThemeId = useStore(state => state.activeThemeId);
  const setActiveTheme = useStore(state => state.setActiveTheme);
  const applyThemeToScene = useStore(state => state.applyThemeToScene);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 bg-indigo-50/30">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-indigo-500" size={16} />
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Interior Themes</label>
        </div>
        <p className="text-[10px] text-slate-500 ml-6">Apply global styles to your entire scene</p>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3">
          {INTERIOR_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                setActiveTheme(theme.id);
              }}
              className={cn(
                "group relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left",
                activeThemeId === theme.id 
                  ? "border-indigo-500 bg-indigo-50/30 shadow-md" 
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  activeThemeId === theme.id ? "text-indigo-700" : "text-slate-700"
                )}>
                  {theme.name}
                </span>
                {activeThemeId === theme.id && (
                  <div className="bg-indigo-500 text-white p-0.5 rounded-full">
                    <Check size={10} />
                  </div>
                )}
              </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Walls</div>
                    <div className="flex gap-1">
                      {[theme.wallColors.base, theme.wallColors.secondary, theme.wallColors.accent].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Wood</div>
                    <div className="flex gap-1">
                      {[theme.woodColors.base, theme.woodColors.front].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-md border border-slate-200" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Textile</div>
                    <div className="flex gap-1">
                      {[theme.textileColors.main, theme.textileColors.secondary, theme.textileColors.accent].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-sm border border-slate-200" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
            </button>
          ))}
        </div>

        {activeThemeId && (
          <button
            onClick={applyThemeToScene}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-200"
          >
            <Palette size={16} />
            APPLY THEME TO SCENE
          </button>
        )}
      </div>

      <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <Sparkles className="text-indigo-400" size={14} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase">Tip</p>
            <p className="text-[10px] text-slate-500 leading-tight">Applying a theme overrides all "Following Theme" material slots on your furniture.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
