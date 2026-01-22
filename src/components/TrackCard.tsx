import React from 'react'
import type { Track } from '../types'

interface TrackCardProps {
  track: Track
  index: number
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-4 p-4 hover:bg-gray-800 hover:bg-opacity-50 rounded-lg transition-colors">
      <div className="text-gray-400 text-sm w-8">{index + 1}</div>

      <div className="flex-shrink-0">
        <img
          src={track.album.images[0]?.url}
          alt={track.album.name}
          className="w-12 h-12 rounded"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{track.name}</div>
        <div className="text-gray-400 text-sm truncate">
          {track.artists.map((artist) => artist.name).join(', ')}
        </div>
      </div>

      <div className="text-gray-400 text-sm">
        {formatDuration(track.duration_ms)}
      </div>

      {track.preview_url && (
        <button
          onClick={() => {
            const audio = new Audio(track.preview_url!)
            audio.play()
          }}
          className="text-green-500 hover:text-green-400 transition-colors"
        >
          ▶
        </button>
      )}
    </div>
  )
}

export default TrackCard
