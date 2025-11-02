import React from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Button from './Button'

const ErrorFallback = ({ 
  error, 
  resetError, 
  title = "Something went wrong",
  message = "We're sorry, but something unexpected happened. Please try again.",
  showRetry = true 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {showRetry && (
              <Button
                onClick={resetError}
                className="w-full flex justify-center items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Development Error Details:
              </h3>
              <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40">
                {error.toString()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorFallback
