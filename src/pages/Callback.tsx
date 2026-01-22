import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { spotifyService } from '../services/spotifyService'

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        setError('Giriş iptal edildi')
        setTimeout(() => navigate('/'), 3000)
        return
      }

      if (!code) {
        setError('Geçersiz yetkilendirme kodu')
        setTimeout(() => navigate('/'), 3000)
        return
      }

      try {
        console.log('🔍 Callback Debug Info:')
        console.log('Authorization code:', code)

        const tokens = await spotifyService.exchangeCodeForToken(code)
        console.log('✅ Tokens received successfully')

        setTokens(tokens.access_token, tokens.refresh_token)

        spotifyService.initialize(tokens.access_token)
        const user = await spotifyService.getCurrentUser()
        console.log('✅ User profile received:', user.display_name)

        setUser(user)
        navigate('/dashboard')
      } catch (err) {
        console.error('❌ Callback error:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Giriş sırasında bir hata oluştu'
        setError(errorMessage)
        setTimeout(() => navigate('/'), 5000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, setTokens, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-500 text-xl">❌</div>
            <h2 className="text-xl text-white">{error}</h2>
            <p className="text-gray-400">Ana sayfaya yönlendiriliyorsunuz...</p>

            {/* Debug bilgileri - sadece development'ta göster */}
            {import.meta.env.DEV && (
              <div className="bg-gray-800 p-4 rounded-lg text-xs text-gray-300 text-left max-w-md">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>URL Params:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>
                    code: {searchParams.get('code') ? '✅ Mevcut' : '❌ Eksik'}
                  </li>
                  <li>error: {searchParams.get('error') || 'Yok'}</li>
                  <li>state: {searchParams.get('state') || 'Yok'}</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin text-green-500 text-4xl">🎵</div>
            <h2 className="text-xl text-white">Giriş yapılıyor...</h2>
            <p className="text-gray-400">Lütfen bekleyin</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Callback
