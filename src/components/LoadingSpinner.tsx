import React from 'react'

interface LoadingSpinnerProps {
  message?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Yükleniyor...',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg text-center space-y-4">
        <div className="animate-spin text-green-500 text-4xl">🎵</div>
        <p className="text-white">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
