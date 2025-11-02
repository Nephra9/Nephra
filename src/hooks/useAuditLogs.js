// src/hooks/useAuditLogs.js
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useAuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { hasRole } = useAuth()

  const fetchAuditLogs = async (options = {}) => {
    if (!hasRole('admin')) {
      setError('Admin access required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch logs when the user has admin privileges
    try {
      if (hasRole && hasRole('admin')) {
        fetchAuditLogs()
      }
    } catch (e) {
      // hasRole may not be available on initial render
    }
  }, [hasRole])

  return {
    logs,
    loading,
    error,
    fetchAuditLogs
  }
}