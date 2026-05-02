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

      <div className="p-4 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {INTERIOR_THEMES.map(theme => {
            const isSelected = activeThemeId === theme.id;
            
            return (
              <div key={theme.id} className="flex flex-col gap-2">
                <div
                  onClick={() => {
                    setActiveTheme(theme.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveTheme(theme.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "group relative flex flex-col rounded-xl border-2 transition-all text-left overflow-hidden cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    isSelected 
                      ? "border-indigo-500 bg-indigo-50/20 shadow-md p-4" 
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm p-3"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-between",
                    isSelected ? "mb-3" : "mb-2"
                  )}>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      isSelected ? "text-indigo-700" : "text-slate-600"
                    )}>
                      {theme.name}
                    </span>
                    {isSelected && (
                      <div className="bg-indigo-500 text-white p-0.5 rounded-full">
                        <Check size={10} />
                      </div>
                    )}
                  </div>

                  {isSelected ? (
                    /* Detailed View for Selected Theme */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Walls</div>
                        <div className="flex gap-1">
                          {[theme.wallColors.base, theme.wallColors.secondary, theme.wallColors.accent].map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Wood</div>
                        <div className="flex gap-1">
                          {[theme.woodColors.base, theme.woodColors.front].map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-md border border-slate-200" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase w-12 text-right">Textile</div>
                        <div className="flex gap-1">
                          {[theme.textileColors.main, theme.textileColors.secondary, theme.textileColors.accent].map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-sm border border-slate-200" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          applyThemeToScene();
                        }}
                        className="w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold transition-all shadow-md shadow-indigo-200 active:scale-[0.98]"
                      >
                        <Palette size={14} />
                        APPLY THEME
                      </button>
                    </div>
                  ) : (
                    /* Compact View for Unselected Themes */
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex -space-x-1.5 mr-2">
                        {[
                          theme.wallColors.base, 
                          theme.woodColors.base, 
                          theme.textileColors.main,
                          theme.wallColors.accent
                        ].map((c, i) => (
                          <div 
                            key={i} 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: c, zIndex: 5 - i }} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Quick preview</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
