import React from 'react'
import { Link } from 'react-router-dom'

const VerifyEmail = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Verify your email</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm">
          <p className="text-gray-700 dark:text-gray-300">
            If you haven't received the email, wait a few minutes then try again or go back to the login page.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              to="/auth/login"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
