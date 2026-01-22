import { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { usePlaylistStore } from './stores/playlistStore'
import { spotifyService } from './services/spotifyService'
import Layout from './components/Layout'
import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import PlaylistView from './pages/PlaylistView'
import Settings from './pages/Settings'
import ErrorMessage from './components/ErrorMessage'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { isAuthenticated, accessToken, user } = useAuthStore()
  const { isGenerating } = usePlaylistStore()

  useEffect(() => {
    if (accessToken) {
      // Initialize Spotify service whenever we have a token
      console.log('🔧 Initializing Spotify API with token')
      spotifyService.initialize(accessToken)

      // If we don't have user data, fetch it
      if (!user) {
        spotifyService
          .getCurrentUser()
          .then((userData) => {
            console.log('✅ User data fetched:', userData.display_name)
            useAuthStore.getState().setUser(userData)
          })
          .catch((error) => {
            console.error('❌ Failed to get user data:', error)
            // Token might be expired, logout
            useAuthStore.getState().logout()
          })
      }
    }
  }, [accessToken, user])

  return (
    <Router>
      <Routes>
        <Route path="/callback" element={<Callback />} />

        {!isAuthenticated ? (
          <>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="playlist" element={<PlaylistView />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>

      <ErrorMessage />
      {isGenerating && (
        <LoadingSpinner message="AI çalma listesi oluşturuyor..." />
      )}
    </Router>
  )
}

export default App
