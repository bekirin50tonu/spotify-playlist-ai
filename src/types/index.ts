export interface User {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
}

export interface Track {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface Playlist {
  id?: string;
  name: string;
  description: string;
  tracks: Track[];
  public: boolean;
}

export interface PlaylistPrompt {
  prompt: string;
  mood?: string;
  genre?: string;
  energy?: 'low' | 'medium' | 'high';
  trackCount?: number;
}