import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-500">Playlist AI</h1>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.images?.[0] && (
                    <img
                      src={user.images[0].url}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-white">{user.display_name}</span>
                </div>
                <Link
                  className="text-gray-400 hover:text-white transition-colors"
                  to="/settings"
                >
                  ⚙️ Ayarlar
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Çıkış
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
