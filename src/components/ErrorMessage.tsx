import React from 'react'
import { usePlaylistStore } from '../stores/playlistStore'

const ErrorMessage: React.FC = () => {
  const { error, setError } = usePlaylistStore()

  if (!error) return null

  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>❌</span>
          <span>{error}</span>
        </div>
        <button
          onClick={() => setError(null)}
          className="text-white hover:text-gray-200 ml-4"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default ErrorMessage
