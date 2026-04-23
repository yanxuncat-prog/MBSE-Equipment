import { create } from 'zustand';

export type ThemeMode = 'shadcn' | 'mui';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'aeroequip_theme';

function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'shadcn' || saved === 'mui') return saved;
  } catch { /* ignore */ }
  return 'shadcn';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'mui') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, mode);
}

// Apply theme on load
applyTheme(loadTheme());

export const useThemeStore = create<ThemeState>((set) => ({
  mode: loadTheme(),
  setMode: (mode) => {
    applyTheme(mode);
    set({ mode });
  },
  toggle: () => {
    set((state) => {
      const next = state.mode === 'shadcn' ? 'mui' : 'shadcn';
      applyTheme(next);
      return { mode: next };
    });
  },
}));
