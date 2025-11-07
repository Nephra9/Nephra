// src/hooks/useRequests.js
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const useRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()

  // Helper to normalize rows with a source tag
  const normalize = (row, source) => ({ ...row, _source: source })

  // Fetch both project_requests and existing_project_requests and merge them
  const fetchRequests = async (filters = {}) => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)

      const prQuery = (() => {
        let q = supabase
          .from('project_requests')
          .select(`
            *,
            users (id, full_name, email),
            projects (id, title)
          `)
          .order('created_at', { ascending: false })

        if (filters.status) q = q.eq('status', filters.status)
        if (filters.search) q = q.or(`proposal.ilike.%${filters.search}%`)
        return q
      })()

      const eprQuery = (() => {
        // Avoid selecting the users relationship directly (schema cache FK lookup can fail).
        // We'll fetch users separately and attach them to the rows.
        let q = supabase
          .from('existing_project_requests')
          .select(`*, projects (id, title)`)
          .order('created_at', { ascending: false })

        if (filters.status) q = q.eq('status', filters.status)
        if (filters.search) q = q.or(`purpose.ilike.%${filters.search}%`)
        return q
      })()

      const [prRes, eprRes] = await Promise.all([prQuery, eprQuery])

      console.debug('useRequests: fetched project_requests and existing_project_requests', { prRes, eprRes })

      if (prRes.error && prRes.error.message) throw prRes.error
      if (eprRes.error && eprRes.error.message) throw eprRes.error

      const pr = (prRes.data || []).map((r) => normalize(r, 'project_requests'))
      const epr = (eprRes.data || []).map((r) => normalize(r, 'existing_project_requests'))

      // Merge and sort by created_at desc
      let merged = [...pr, ...epr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      // Find any rows missing a users object and fetch them in batch
      const missingUserIds = Array.from(new Set(
        merged.filter(m => !m.users && m.user_id).map(m => m.user_id)
      ))

      if (missingUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', missingUserIds)

        if (!usersError && Array.isArray(usersData)) {
          const usersMap = usersData.reduce((acc, u) => { acc[u.id] = u; return acc }, {})
          merged = merged.map(row => ({ ...row, users: row.users || usersMap[row.user_id] || null }))
        }
      }

      setRequests(merged)
    } catch (err) {
      setError(err.message || String(err))
      console.error('Error fetching requests:', err)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  // Generic update that respects the source table
  const updateRequest = async (requestId, updates, source = 'project_requests') => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from(source)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      await logAuditAction('UPDATE', source, requestId, { updates })

      // Create notification if status changed
      if (updates.status) {
        await createNotification(
          data.user_id,
          `Application ${updates.status}`,
          `Your project application has been ${updates.status.toLowerCase()}`,
          updates.status === 'Approved' ? 'success' : 'warning'
        )
      }

      toast.success('Request updated successfully')
      // Refresh list
      await fetchRequests()
      return data
    } catch (err) {
      setError(err.message || String(err))
      console.error('Error updating request:', err)
      toast.error('Failed to update request')
      throw err
    }
  }

  const approveRequest = async (requestId, adminNotes = '', source = 'project_requests') => {
    return updateRequest(requestId, {
      status: 'Approved',
      admin_notes: adminNotes
    }, source)
  }

  const rejectRequest = async (requestId, rejectionReason = '', source = 'project_requests') => {
    return updateRequest(requestId, {
      status: 'Rejected',
      rejection_reason: rejectionReason
    }, source)
  }

  const createNotification = async (userId, title, message, type = 'info') => {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error creating notification:', error)
    }
  }

  const logAuditAction = async (action, objectType, objectId, metadata = {}) => {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        actor_id: user.id,
        action,
        object_type: objectType,
        object_id: objectId,
        metadata,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error logging audit action:', error)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchRequests()
    }
  }, [isAdmin])

  return {
    requests,
    loading,
    error,
    fetchRequests,
    updateRequest,
    approveRequest,
    rejectRequest
  }
}