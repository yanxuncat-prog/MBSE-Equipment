import { create } from 'zustand';

interface ConfigState {
  activeConfigId: string | null;
  activeProgramId: string | null;
  activeSeriesId: string | null;
  setActiveConfig: (configId: string) => void;
  setActiveProgram: (programId: string) => void;
  setActiveSeries: (seriesId: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  activeConfigId: null,
  activeProgramId: null,
  activeSeriesId: null,
  setActiveConfig: (configId) => set({ activeConfigId: configId }),
  setActiveProgram: (programId) => set({ activeProgramId: programId }),
  setActiveSeries: (seriesId) => set({ activeSeriesId: seriesId }),
}));
