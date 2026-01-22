import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { User, Track, Playlist, PlaylistPrompt } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

class SpotifyService {
  private api: SpotifyApi | null = null;

  initialize(accessToken: string) {
    this.api = SpotifyApi.withAccessToken(
      import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: '',
      }
    );
  }

  async getAuthUrl(): Promise<string> {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-top-read',
      'user-read-recently-played'
    ].join(' ');

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier in localStorage for later use
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string }> {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    // Clean up code verifier
    localStorage.removeItem('spotify_code_verifier');

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange error:', errorData);
      throw new Error(`Failed to exchange code for token: ${errorData.error_description || errorData.error}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    if (!this.api) throw new Error('Spotify API not initialized');

    try {
      const profile = await this.api.currentUser.profile();
      return {
        id: profile.id,
        display_name: profile.display_name || '',
        email: profile.email || '',
        images: profile.images || [],
        followers: profile.followers,
      };
    } catch (error) {
      throw new Error('Failed to get current user');
    }
  }

  async getUserMusicProfile(): Promise<{
    topArtists: Array<{ name: string; genres: string[] }>;
    topTracks: Array<{ name: string; artist: string; genres: string[] }>;
    recentTracks: Array<{ name: string; artist: string; playedAt: string }>;
    musicAnalysis: {
      favoriteGenres: string[];
      listeningHabits: string;
      energyPreference: string;
      diversityScore: number;
    };
  }> {
    if (!this.api) throw new Error('Spotify API not initialized');

    try {
      console.log('🔍 Analyzing user music profile...');

      // Son 1 ay içindeki en çok dinlenen sanatçılar
      const topArtistsShort = await this.api.currentUser.topItems('artists', 'short_term', 20);
      const topArtistsMedium = await this.api.currentUser.topItems('artists', 'medium_term', 20);

      // Son 1 ay içindeki en çok dinlenen şarkılar
      const topTracksShort = await this.api.currentUser.topItems('tracks', 'short_term', 20);
      const topTracksMedium = await this.api.currentUser.topItems('tracks', 'medium_term', 20);

      // Son dinlenen şarkılar
      const recentTracks = await this.api.player.getRecentlyPlayedTracks(50);

      // Sanatçı verilerini işle
      const topArtists = [...topArtistsShort.items, ...topArtistsMedium.items]
        .slice(0, 15)
        .map(artist => ({
          name: artist.name,
          genres: artist.genres,
        }));

      // Şarkı verilerini işle
      const topTracks = [...topTracksShort.items, ...topTracksMedium.items]
        .slice(0, 15)
        .map(track => ({
          name: track.name,
          artist: track.artists[0].name,
          genres: [], // SimplifiedArtist'te genres yok, boş array kullan
        }));

      // Son dinlenen şarkıları işle
      const recentTracksData = recentTracks.items.slice(0, 20).map(item => ({
        name: item.track.name,
        artist: item.track.artists[0].name,
        playedAt: item.played_at,
      }));

      // Müzik analizi yap
      const musicAnalysis = this.analyzeMusicProfile(topArtists, topTracks, recentTracksData);

      return {
        topArtists,
        topTracks,
        recentTracks: recentTracksData,
        musicAnalysis,
      };
    } catch (error) {
      console.error('Failed to get user music profile:', error);
      // Hata durumunda boş analiz döndür
      return {
        topArtists: [],
        topTracks: [],
        recentTracks: [],
        musicAnalysis: {
          favoriteGenres: [],
          listeningHabits: 'Analiz edilemedi',
          energyPreference: 'Bilinmiyor',
          diversityScore: 0,
        },
      };
    }
  }

  private analyzeMusicProfile(
    topArtists: Array<{ name: string; genres: string[] }>,
    topTracks: Array<{ name: string; artist: string; genres: string[] }>,
    recentTracks: Array<{ name: string; artist: string; playedAt: string }>
  ) {
    // Tüm türleri topla ve sıklığını hesapla
    const genreCount: { [key: string]: number } = {};

    [...topArtists, ...topTracks].forEach(item => {
      item.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // En popüler türleri al
    const favoriteGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // Sanatçı çeşitliliğini hesapla
    const uniqueArtists = new Set([
      ...topArtists.map(a => a.name),
      ...topTracks.map(t => t.artist),
      ...recentTracks.map(t => t.artist),
    ]);

    const diversityScore = Math.min(uniqueArtists.size / 20, 1); // 0-1 arası normalize et

    // Dinleme alışkanlıklarını analiz et
    let listeningHabits = '';
    if (favoriteGenres.some(g => g.includes('metal') || g.includes('rock') || g.includes('punk'))) {
      listeningHabits = 'Ağır müzik türlerini tercih ediyor';
    } else if (favoriteGenres.some(g => g.includes('pop') || g.includes('dance') || g.includes('electronic'))) {
      listeningHabits = 'Popüler ve dans edilebilir müzikleri seviyor';
    } else if (favoriteGenres.some(g => g.includes('jazz') || g.includes('classical') || g.includes('ambient'))) {
      listeningHabits = 'Sakin ve sofistike müzik zevki var';
    } else if (favoriteGenres.some(g => g.includes('hip hop') || g.includes('rap') || g.includes('trap'))) {
      listeningHabits = 'Hip-hop ve rap müzik dinliyor';
    } else {
      listeningHabits = 'Çeşitli müzik türlerini dinliyor';
    }

    // Enerji tercihi analizi
    let energyPreference = '';
    if (favoriteGenres.some(g => g.includes('metal') || g.includes('punk') || g.includes('hardcore'))) {
      energyPreference = 'Yüksek enerjili müzikler';
    } else if (favoriteGenres.some(g => g.includes('ambient') || g.includes('chill') || g.includes('lo-fi'))) {
      energyPreference = 'Sakin ve rahatlatıcı müzikler';
    } else {
      energyPreference = 'Orta seviye enerjili müzikler';
    }

    return {
      favoriteGenres,
      listeningHabits,
      energyPreference,
      diversityScore,
    };
  }

  async generatePlaylist(prompt: PlaylistPrompt): Promise<Track[]> {
    if (!this.api) {
      console.error('❌ Spotify API not initialized');
      throw new Error('Spotify API not initialized. Please login again.');
    }

    console.log('🎵 Starting playlist generation...');

    try {
      // Kullanıcının müzik profilini al
      console.log('👤 Getting user music profile...');
      const userProfile = await this.getUserMusicProfile();

      // Gemini'den şarkı önerilerini al
      const { geminiService } = await import('./geminiService');
      const { useSettingsStore } = await import('../stores/settingsStore');

      const geminiApiKey = useSettingsStore.getState().geminiApiKey;

      if (!geminiApiKey) {
        throw new Error('Gemini API key bulunamadı. Ayarlardan API key ekleyin.');
      }

      console.log('🤖 Initializing Gemini service...');
      geminiService.initialize(geminiApiKey);

      console.log('🎯 Getting personalized song suggestions from Gemini...');
      const songSuggestions = await geminiService.generatePersonalizedPlaylist(
        prompt.prompt,
        prompt.mood,
        prompt.energy,
        userProfile
      );

      console.log('🎵 Gemini önerileri:', songSuggestions);

      if (songSuggestions.length === 0) {
        throw new Error('AI şarkı önerisi bulunamadı. Farklı bir açıklama deneyin.');
      }

      // Önerilen şarkıları Spotify'da ara
      const tracks: Track[] = [];

      console.log('🔍 Searching songs on Spotify...');
      for (const suggestion of songSuggestions.slice(0, prompt.trackCount || 20)) {
        try {
          // Şarkı adı ve sanatçıyı ayır
          const parts = suggestion.split(' - ');
          if (parts.length < 2) {
            console.warn('⚠️ Invalid song format:', suggestion);
            continue;
          }

          const [songName, artistName] = parts.map(s => s.trim());

          if (!songName || !artistName) {
            console.warn('⚠️ Empty song or artist name:', suggestion);
            continue;
          }

          // Spotify'da ara
          const searchQuery = `track:"${songName}" artist:"${artistName}"`;
          console.log('🔍 Searching:', searchQuery);

          const searchResults = await this.api.search(searchQuery, ['track'], 'TR', 1);

          if (searchResults.tracks.items.length > 0) {
            const track = searchResults.tracks.items[0];
            console.log('✅ Found:', track.name, 'by', track.artists[0].name);

            tracks.push({
              id: track.id,
              name: track.name,
              artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
              })),
              album: {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images,
              },
              duration_ms: track.duration_ms,
              preview_url: track.preview_url,
              external_urls: track.external_urls,
            });
          } else {
            console.warn('❌ Not found on Spotify:', suggestion);
          }
        } catch (searchError) {
          console.warn('⚠️ Search error for:', suggestion, searchError);
          continue;
        }
      }

      if (tracks.length === 0) {
        throw new Error('Önerilen şarkılar Spotify\'da bulunamadı. Farklı bir açıklama deneyin.');
      }

      console.log(`✅ ${tracks.length} şarkı bulundu`);
      return tracks;

    } catch (error) {
      console.error('❌ Playlist generation error:', error);
      throw error;
    }
  }

  async createPlaylist(playlist: Playlist, userId: string): Promise<string> {
    if (!this.api) throw new Error('Spotify API not initialized');

    try {
      const createdPlaylist = await this.api.playlists.createPlaylist(userId, {
        name: playlist.name,
        description: playlist.description,
        public: playlist.public,
      });

      const trackUris = playlist.tracks.map(track => `spotify:track:${track.id}`);

      if (trackUris.length > 0) {
        await this.api.playlists.addItemsToPlaylist(createdPlaylist.id, trackUris);
      }

      return createdPlaylist.id;
    } catch (error) {
      throw new Error('Failed to create playlist');
    }
  }
}

export const spotifyService = new SpotifyService();