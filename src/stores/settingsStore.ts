import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  geminiApiKey: string | null;
  setGeminiApiKey: (apiKey: string) => void;
  clearGeminiApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiApiKey: null,
      setGeminiApiKey: (apiKey) => set({ geminiApiKey: apiKey }),
      clearGeminiApiKey: () => set({ geminiApiKey: null }),
    }),
    {
      name: 'settings-storage',
    }
  )
);