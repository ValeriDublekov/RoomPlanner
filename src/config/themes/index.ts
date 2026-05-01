import { InteriorTheme } from '../../types';
import scandi from './scandi.json';
import industrial from './industrial.json';
import scandiNature from './scandi_nature.json';
import scandiBreeze from './scandi_breeze.json';
import scandiWarm from './scandi_warm.json';
import japandiLight from './japandi_light.json';
import modernSoft from './modern_soft.json';
import coastalLight from './coastal_light.json';

export const INTERIOR_THEMES: InteriorTheme[] = [
  scandi as InteriorTheme,
  industrial as InteriorTheme,
  scandiNature as InteriorTheme,
  scandiBreeze as InteriorTheme,
  scandiWarm as InteriorTheme,
  japandiLight as InteriorTheme,
  modernSoft as InteriorTheme,
  coastalLight as InteriorTheme
];

export default INTERIOR_THEMES;
