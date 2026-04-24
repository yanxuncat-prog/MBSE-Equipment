import { create } from 'zustand';

interface ConfigState {
  activeConfigId: string | null;
  activeProgramId: string | null;
  activeATA: string | null; // null = all ATAs
  setActiveConfig: (configId: string) => void;
  setActiveProgram: (programId: string) => void;
  setActiveATA: (ata: string | null) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  activeConfigId: null,
  activeProgramId: null,
  activeATA: null,
  setActiveConfig: (configId) => set({ activeConfigId: configId }),
  setActiveProgram: (programId) => set({ activeProgramId: programId }),
  setActiveATA: (ata) => set({ activeATA: ata }),
}));
