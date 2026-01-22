import React, { useState } from 'react'
import { spotifyService } from '../services/spotifyService'

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setError(null)
      setIsLoading(true)

      console.log('🔍 Debug Info:')
      console.log('Client ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID)
      console.log('Redirect URI:', import.meta.env.VITE_SPOTIFY_REDIRECT_URI)

      if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID) {
        throw new Error(
          'Spotify Client ID bulunamadı. .env dosyasını kontrol edin.'
        )
      }

      const authUrl = await spotifyService.getAuthUrl()
      console.log('Auth URL:', authUrl)

      window.location.href = authUrl
    } catch (err) {
      console.error('Login hatası:', err)
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-green-500 mb-4">🎵</h1>
          <h2 className="text-4xl font-bold text-white mb-2">Playlist AI</h2>
          <p className="text-gray-400 text-lg">
            AI ile kişiselleştirilmiş Spotify çalma listeleri oluşturun
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg text-center">
              <p className="font-semibold">Hata:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-white mb-6">
              Başlamak için Spotify hesabınızla giriş yapın
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Yönlendiriliyor...' : 'Spotify ile Giriş Yap'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            <p>
              Giriş yaparak müzik tercihlerinize erişim izni veriyorsunuz.
              Verileriniz güvende tutulur.
            </p>
          </div>

          {/* Debug bilgileri - sadece development'ta göster */}
          {import.meta.env.DEV && (
            <div className="bg-gray-800 p-4 rounded-lg text-xs text-gray-300">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>
                Client ID:{' '}
                {import.meta.env.VITE_SPOTIFY_CLIENT_ID
                  ? '✅ Mevcut'
                  : '❌ Eksik'}
              </p>
              <p>Redirect URI: {import.meta.env.VITE_SPOTIFY_REDIRECT_URI}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
