import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { usePlaylistStore } from '../stores/playlistStore'
import { useSettingsStore } from '../stores/settingsStore'
import { spotifyService } from '../services/spotifyService'
import type { PlaylistPrompt } from '../types'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setGeneratedTracks, setIsGenerating, setError } = usePlaylistStore()
  const { geminiApiKey } = useSettingsStore()
  const [prompt, setPrompt] = useState('')
  const [mood, setMood] = useState('')
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium')
  const [trackCount, setTrackCount] = useState(20)
  const [musicProfile, setMusicProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Kullanıcı müzik profilini yükle
  const loadMusicProfile = async () => {
    if (!user || isLoadingProfile) return

    setIsLoadingProfile(true)
    try {
      const { accessToken, refreshToken } = useAuthStore.getState()
      if (accessToken) {
        spotifyService.initialize(accessToken, refreshToken || undefined)
        const profile = await spotifyService.getUserMusicProfile()
        setMusicProfile(profile)
        console.log('🎵 User music profile loaded:', profile)
      }
    } catch (error) {
      console.error('Failed to load music profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Sayfa yüklendiğinde müzik profilini al
  React.useEffect(() => {
    if (user && !musicProfile) {
      loadMusicProfile()
    }
  }, [user])

  const handleGeneratePlaylist = async () => {
    if (!prompt.trim()) {
      setError('Lütfen bir açıklama girin')
      return
    }

    if (!geminiApiKey) {
      setError('Gemini API key bulunamadı. Ayarlardan API key ekleyin.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Ensure Spotify API is initialized
      const { accessToken, refreshToken } = useAuthStore.getState()
      if (accessToken) {
        console.log('🔧 Re-initializing Spotify API')
        spotifyService.initialize(accessToken, refreshToken || undefined)
      }

      const playlistPrompt: PlaylistPrompt = {
        prompt: prompt.trim(),
        mood: mood.trim() || undefined,
        energy,
        trackCount,
      }

      console.log('🎵 Generating playlist with prompt:', playlistPrompt)
      const tracks = await spotifyService.generatePlaylist(playlistPrompt)
      console.log('✅ Playlist generated with', tracks.length, 'tracks')

      setGeneratedTracks(tracks)
      navigate('/playlist')
    } catch (error) {
      console.error('❌ Playlist generation error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Çalma listesi oluşturulurken bir hata oluştu'
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Hoş geldin, {user?.display_name}! 👋
        </h1>
        <p className="text-gray-400 text-lg">
          AI ile kişiselleştirilmiş çalma listesi oluşturmaya hazır mısın?
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Çalma listesi açıklaması *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Sabah koşusu için enerjik şarkılar, rahatlatıcı akustik müzikler, 90'lar nostalji..."
              className="w-full p-4 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Ruh hali (opsiyonel)
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Örn: mutlu, melankolik, romantik, enerjik..."
              className="w-full p-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Enerji seviyesi
              </label>
              <select
                value={energy}
                onChange={(e) =>
                  setEnergy(e.target.value as 'low' | 'medium' | 'high')
                }
                className="w-full p-3 bg-black border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="low">Düşük (Sakin)</option>
                <option value="medium">Orta (Dengeli)</option>
                <option value="high">Yüksek (Enerjik)</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Şarkı sayısı
              </label>
              <select
                value={trackCount}
                onChange={(e) => setTrackCount(Number(e.target.value))}
                className="w-full p-3 bg-black border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value={10}>10 şarkı</option>
                <option value={20}>20 şarkı</option>
                <option value={30}>30 şarkı</option>
                <option value={50}>50 şarkı</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePlaylist}
            disabled={!prompt.trim() || !geminiApiKey}
            className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎵 Çalma Listesi Oluştur
          </button>

          {!geminiApiKey && (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded-lg p-4 text-center">
              <p className="text-yellow-200 text-sm">
                ⚠️ AI önerileri için Gemini API key gerekli.
                <button
                  onClick={() => navigate('/settings')}
                  className="text-yellow-400 hover:text-yellow-300 underline ml-1"
                >
                  Ayarlardan ekleyin
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
          <span>💡</span>
          <span>
            Ne kadar detaylı açıklama verirsen, o kadar iyi sonuç alırsın!
          </span>
        </div>
      </div>

      {/* Müzik Profili Göstergesi */}
      {musicProfile && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              🎵 Müzik Profilin
              <button
                onClick={loadMusicProfile}
                disabled={isLoadingProfile}
                className="ml-2 text-sm text-green-500 hover:text-green-400 disabled:opacity-50"
              >
                {isLoadingProfile ? '🔄' : '🔄 Yenile'}
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-2">En Sevdiğin Türler:</p>
                <div className="flex flex-wrap gap-1">
                  {musicProfile.musicAnalysis.favoriteGenres
                    .slice(0, 3)
                    .map((genre: string, index: number) => (
                      <span
                        key={index}
                        className="bg-green-900 bg-opacity-30 text-green-400 px-2 py-1 rounded text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Dinleme Alışkanlığın:</p>
                <p className="text-white text-xs">
                  {musicProfile.musicAnalysis.listeningHabits}
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Enerji Tercihin:</p>
                <p className="text-white text-xs">
                  {musicProfile.musicAnalysis.energyPreference}
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">
                  En Çok Dinlediğin Sanatçılar:
                </p>
                <p className="text-white text-xs">
                  {musicProfile.topArtists
                    .slice(0, 3)
                    .map((artist: any) => artist.name)
                    .join(', ')}
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                  musicProfile.musicAnalysis.diversityScore > 0.7
                    ? 'bg-green-900 bg-opacity-30 text-green-400'
                    : musicProfile.musicAnalysis.diversityScore > 0.4
                      ? 'bg-yellow-900 bg-opacity-30 text-yellow-400'
                      : 'bg-red-900 bg-opacity-30 text-red-400'
                }`}
              >
                <span>🎯</span>
                <span>
                  Müzik Çeşitliliği:{' '}
                  {musicProfile.musicAnalysis.diversityScore > 0.7
                    ? 'Yüksek'
                    : musicProfile.musicAnalysis.diversityScore > 0.4
                      ? 'Orta'
                      : 'Düşük'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
