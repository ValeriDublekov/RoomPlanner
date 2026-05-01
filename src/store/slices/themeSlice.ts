import { StateCreator } from 'zustand';
import { AppState } from '../../store';
import { InteriorTheme } from '../../types';
import { INTERIOR_THEMES, applyThemeToFurniture } from '../../lib/themes';

export interface ThemeSlice {
  activeThemeId: string | null;
  setActiveTheme: (themeId: string | null) => void;
  applyThemeToScene: () => void;
}

export const createThemeSlice: StateCreator<AppState, [], [], ThemeSlice> = (set, get) => ({
  activeThemeId: null,
  
  setActiveTheme: (themeId) => set({ activeThemeId: themeId }),
  
  applyThemeToScene: () => {
    const { activeThemeId, furniture, saveHistory } = get();
    if (!activeThemeId) return;

    const theme = INTERIOR_THEMES.find(t => t.id === activeThemeId);
    if (!theme) return;

    saveHistory();

    const updatedFurniture = furniture.map(item => applyThemeToFurniture(item, theme));
    
    set({ furniture: updatedFurniture });
  }
});
