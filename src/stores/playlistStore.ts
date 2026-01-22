import { create } from 'zustand';
import type { Playlist, Track } from '../types';

interface PlaylistState {
  currentPlaylist: Playlist | null;
  generatedTracks: Track[];
  isGenerating: boolean;
  error: string | null;
  setCurrentPlaylist: (playlist: Playlist) => void;
  setGeneratedTracks: (tracks: Track[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  currentPlaylist: null,
  generatedTracks: [],
  isGenerating: false,
  error: null,
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setGeneratedTracks: (tracks) => set({ generatedTracks: tracks }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  clearPlaylist: () => set({
    currentPlaylist: null,
    generatedTracks: [],
    error: null
  }),
}));