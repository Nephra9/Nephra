import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import config from '../../config/environment.js'
import { adminDb, supabase } from '../../services/supabaseClient'
import Button from './Button'

const SysDebug = () => {
  const { user, profile, initializing, hasRole } = useAuth()
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)

  const runTests = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const results = {}
      results.config = {
        apiUrl: config.apiUrl || null,
        apiKeyConfigured: !!config.apiKey,
        debug: config.debug
      }

      // Try a light-weight query to check connectivity
      try {
        const stats = await adminDb.getDashboardStats()
        results.stats = stats
      } catch (err) {
        results.statsError = String(err?.message || err)
      }

      // Try fetching a small list of users
      try {
        const users = await adminDb.getUsers()
        results.users = Array.isArray(users) ? users.slice(0, 3) : users
      } catch (err) {
        results.usersError = String(err?.message || err)
      }

      setOutput(results)
    } catch (err) {
      setOutput({ error: String(err?.message || err) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mb-6 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">System Debug</h4>
      <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
        <div>Auth initializing: {String(!!initializing)}</div>
        <div>Signed-in: {String(!!user)}</div>
        <div>Profile id: {profile?.id || 'N/A'}</div>
        <div>Profile role: {profile?.role || 'N/A'}</div>
        <div>Has admin role: {String(!!hasRole && hasRole('admin'))}</div>
        <div>Supabase URL: {config.apiUrl ? config.apiUrl : 'NOT SET'}</div>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={runTests} disabled={running} size="sm">
          {running ? 'Running...' : 'Run quick checks'}
        </Button>
      </div>

      {output && (
        <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
          <pre className="whitespace-pre-wrap max-h-48 overflow-auto">{JSON.stringify(output, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default SysDebug
