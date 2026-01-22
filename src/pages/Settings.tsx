import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { geminiApiKey, setGeminiApiKey, clearGeminiApiKey } =
    useSettingsStore()
  const [apiKey, setApiKey] = useState(geminiApiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)

    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim())
    } else {
      clearGeminiApiKey()
    }

    setTimeout(() => {
      setIsSaving(false)
      navigate('/dashboard')
    }, 500)
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
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <div></div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              🤖 AI Ayarları
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gemini API Key *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Gemini API key'inizi girin..."
                    className="w-full p-3 pr-12 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Gemini API key'i şarkı önerileri için kullanılır.
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 ml-1"
                  >
                    Buradan alabilirsiniz
                  </a>
                </p>
              </div>

              <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                  <div className="text-blue-100 text-sm">
                    <p className="font-semibold mb-1">Güvenlik Notu:</p>
                    <p>
                      API key'iniz sadece tarayıcınızda saklanır ve hiçbir
                      sunucuya gönderilmez.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              İptal
            </button>
          </div>
        </div>

        {/* API Key durumu */}
        <div className="mt-6 text-center">
          <div
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
              geminiApiKey
                ? 'bg-green-900 bg-opacity-30 text-green-400 border border-green-500'
                : 'bg-red-900 bg-opacity-30 text-red-400 border border-red-500'
            }`}
          >
            <span>{geminiApiKey ? '✅' : '❌'}</span>
            <span>AI Önerileri: {geminiApiKey ? 'Aktif' : 'Pasif'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
