import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { User, Track, Playlist, PlaylistPrompt } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

class SpotifyService {
  private api: SpotifyApi | null = null;
  private currentRefreshToken: string | null = null;

  initialize(accessToken: string, refreshToken?: string) {
    this.currentRefreshToken = refreshToken || null;

    this.api = SpotifyApi.withAccessToken(
      import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken || '',
      }
    );
  }

  async refreshAccessToken(): Promise<{ access_token: string; refresh_token?: string }> {
    // Refresh token'ı önce mevcut değişkenden, sonra store'dan al
    let refreshToken = this.currentRefreshToken;

    if (!refreshToken) {
      const { useAuthStore } = await import('../stores/authStore');
      refreshToken = useAuthStore.getState().refreshToken;
    }

    if (!refreshToken) {
      throw new Error('Refresh token bulunamadı. Yeniden giriş yapın.');
    }

    console.log('🔄 Refreshing access token...');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token refresh error:', errorData);
      throw new Error(`Token yenileme hatası: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await response.json();

    // Yeni token'ları güncelle
    if (tokens.refresh_token) {
      this.currentRefreshToken = tokens.refresh_token;
    } else {
      // Eğer yeni refresh token gelmezse, mevcut olanı koru
      this.currentRefreshToken = refreshToken;
    }

    // Store'u güncelle
    const { useAuthStore } = await import('../stores/authStore');
    useAuthStore.getState().setTokens(tokens.access_token, this.currentRefreshToken || undefined);

    // API'yi yeni token ile yeniden initialize et
    this.initialize(tokens.access_token, this.currentRefreshToken || undefined);

    console.log('✅ Access token refreshed successfully');
    return tokens;
  }

  async makeAuthenticatedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      console.log('🔍 Error details:', error);

      // Spotify API hatalarını kontrol et
      const isUnauthorized =
        error?.status === 401 ||
        error?.response?.status === 401 ||
        error?.message?.includes('401') ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('Bad or expired token') ||
        error?.message?.includes('The access token expired');

      if (isUnauthorized) {
        console.log('🔄 Access token expired, attempting refresh...');

        try {
          await this.refreshAccessToken();
          console.log('✅ Token refreshed, retrying request...');
          // Token yenilendikten sonra isteği tekrar dene
          return await requestFn();
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);

          // Refresh token da geçersizse logout yap
          const { useAuthStore } = await import('../stores/authStore');
          useAuthStore.getState().logout();

          throw new Error('Oturum süresi doldu. Lütfen yeniden giriş yapın.');
        }
      }

      // Diğer hatalar için orijinal hatayı fırlat
      throw error;
    }
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

    return this.makeAuthenticatedRequest(async () => {
      const profile = await this.api!.currentUser.profile();
      return {
        id: profile.id,
        display_name: profile.display_name || '',
        email: profile.email || '',
        images: profile.images || [],
        followers: profile.followers,
      };
    });
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

    return this.makeAuthenticatedRequest(async () => {
      console.log('🔍 Analyzing user music profile...');

      // Son 1 ay içindeki en çok dinlenen sanatçılar
      const topArtistsShort = await this.api!.currentUser.topItems('artists', 'short_term', 20);
      const topArtistsMedium = await this.api!.currentUser.topItems('artists', 'medium_term', 20);

      // Son 1 ay içindeki en çok dinlenen şarkılar
      const topTracksShort = await this.api!.currentUser.topItems('tracks', 'short_term', 20);
      const topTracksMedium = await this.api!.currentUser.topItems('tracks', 'medium_term', 20);

      // Son dinlenen şarkılar
      const recentTracks = await this.api!.player.getRecentlyPlayedTracks(50);

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
    });
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
        userProfile,
        prompt.trackCount
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

          // Çoklu arama stratejisi - en iyi eşleşmeyi bul
          let searchResults = null;

          // 1. Tam eşleşme arama
          const exactQuery = `track:"${songName}" artist:"${artistName}"`;
          console.log('🔍 Exact search:', exactQuery);

          searchResults = await this.makeAuthenticatedRequest(async () => {
            return await this.api!.search(exactQuery, ['track'], 'TR', 5);
          });

          // 2. Eğer tam eşleşme bulunamazsa, daha esnek arama
          if (searchResults.tracks.items.length === 0) {
            const flexibleQuery = `${songName} ${artistName}`;
            console.log('🔍 Flexible search:', flexibleQuery);

            searchResults = await this.makeAuthenticatedRequest(async () => {
              return await this.api!.search(flexibleQuery, ['track'], 'TR', 10);
            });
          }

          // 3. En iyi eşleşmeyi bul
          let bestMatch = null;
          if (searchResults.tracks.items.length > 0) {
            // Şarkı adı ve sanatçı adı benzerliğine göre sırala
            const scoredTracks = searchResults.tracks.items.map(track => {
              const trackNameSimilarity = this.calculateSimilarity(
                songName.toLowerCase(),
                track.name.toLowerCase()
              );
              const artistNameSimilarity = this.calculateSimilarity(
                artistName.toLowerCase(),
                track.artists[0].name.toLowerCase()
              );

              return {
                track,
                score: (trackNameSimilarity + artistNameSimilarity) / 2
              };
            });

            // En yüksek skora sahip şarkıyı seç (minimum %60 benzerlik)
            const bestScoredTrack = scoredTracks
              .filter(item => item.score > 0.6)
              .sort((a, b) => b.score - a.score)[0];

            if (bestScoredTrack) {
              bestMatch = bestScoredTrack.track;
              console.log(`✅ Found with ${Math.round(bestScoredTrack.score * 100)}% similarity:`,
                bestMatch.name, 'by', bestMatch.artists[0].name);
            }
          }

          if (bestMatch) {
            tracks.push({
              id: bestMatch.id,
              name: bestMatch.name,
              artists: bestMatch.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
              })),
              album: {
                id: bestMatch.album.id,
                name: bestMatch.album.name,
                images: bestMatch.album.images,
              },
              duration_ms: bestMatch.duration_ms,
              preview_url: bestMatch.preview_url,
              external_urls: bestMatch.external_urls,
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

    return this.makeAuthenticatedRequest(async () => {
      const createdPlaylist = await this.api!.playlists.createPlaylist(userId, {
        name: playlist.name,
        description: playlist.description,
        public: playlist.public,
      });

      const trackUris = playlist.tracks.map(track => `spotify:track:${track.id}`);

      if (trackUris.length > 0) {
        await this.api!.playlists.addItemsToPlaylist(createdPlaylist.id, trackUris);
      }

      return createdPlaylist.id;
    });
  }

  // String benzerlik hesaplama (Levenshtein distance)
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }
}

export const spotifyService = new SpotifyService();