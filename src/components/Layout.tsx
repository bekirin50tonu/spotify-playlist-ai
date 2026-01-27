import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore()

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Spotify Playlist AI',
    description: 'AI ile kişiselleştirilmiş Spotify çalma listeleri oluşturun',
    url: 'https://bekirin50tonu.github.io/spotify-playlist-ai/',
    applicationCategory: 'MusicApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: 'Bekir Yazgan',
    },
    featureList: [
      'AI destekli çalma listesi oluşturma',
      'Kişiselleştirilmiş müzik önerileri',
      'Spotify entegrasyonu',
      'Müzik profili analizi',
    ],
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-green-500">
                🎵 Playlist AI
              </h1>
            </div>

            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  {user.images?.[0] && (
                    <img
                      src={user.images[0].url}
                      alt={user.display_name}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                    />
                  )}
                  <span className="text-white text-sm sm:text-base truncate max-w-24 sm:max-w-none">
                    {user.display_name}
                  </span>
                </div>

                {/* Mobile: Show only avatar */}
                <div className="sm:hidden">
                  {user.images?.[0] && (
                    <img
                      src={user.images[0].url}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                </div>

                <Link
                  className="flex items-center text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  to="/settings"
                >
                  <span className="sm:hidden">⚙️</span>
                  <span className="hidden sm:inline">⚙️ Ayarlar</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                >
                  <span className="sm:hidden">🚪</span>
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
