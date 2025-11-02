import React, { useState, useEffect } from 'react'
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2`}>
      {isOnline ? (
        <>
          <WifiIcon className="h-5 w-5" />
          <span>Connection restored</span>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>No internet connection</span>
        </>
      )}
    </div>
  )
}

export default NetworkStatus
