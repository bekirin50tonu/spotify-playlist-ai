import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { usePlaylistStore } from '../stores/playlistStore'
import { spotifyService } from '../services/spotifyService'
import TrackCard from '../components/TrackCard'

const PlaylistView: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { generatedTracks, setError } = usePlaylistStore()
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState(
    'AI ile oluşturulmuş çalma listesi'
  )
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) {
      setError('Lütfen çalma listesi adı girin')
      return
    }

    if (!user) {
      setError('Kullanıcı bilgisi bulunamadı')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const playlist = {
        name: playlistName.trim(),
        description: playlistDescription.trim(),
        tracks: generatedTracks,
        public: isPublic,
      }

      await spotifyService.createPlaylist(playlist, user.id)

      // Success message and redirect
      alert('Çalma listesi başarıyla Spotify hesabınıza kaydedildi! 🎉')
      navigate('/dashboard')
    } catch (error) {
      setError('Çalma listesi kaydedilirken bir hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  if (generatedTracks.length === 0) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl text-white">
          Henüz çalma listesi oluşturulmamış
        </h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Çalma Listesi Oluştur
        </button>
      </div>
    )
  }

  const totalDuration = generatedTracks.reduce(
    (acc, track) => acc + track.duration_ms,
    0
  )
  const formatTotalDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    return hours > 0 ? `${hours}sa ${minutes}dk` : `${minutes}dk`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Geri
        </button>
        <div className="text-gray-400 text-sm">
          {generatedTracks.length} şarkı • {formatTotalDuration(totalDuration)}
        </div>
      </div>

      <div className="card space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Çalma listesi adı *
            </label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Çalma listesi adını girin..."
              className="w-full p-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Açıklama
            </label>
            <input
              type="text"
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              placeholder="Çalma listesi açıklaması..."
              className="w-full p-3 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-green-500 bg-black border-gray-600 rounded focus:ring-green-500"
            />
            <label htmlFor="isPublic" className="text-white text-sm">
              Herkese açık yap
            </label>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSavePlaylist}
            disabled={!playlistName.trim() || isSaving}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Kaydediliyor...' : "💾 Spotify'a Kaydet"}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Yeni Liste Oluştur
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-4">Şarkılar</h3>
        <div className="space-y-1">
          {generatedTracks.map((track, index) => (
            <TrackCard key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlaylistView
