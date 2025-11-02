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

  const fetchRequests = async (filters = {}) => {
    if (!isAdmin) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('project_requests')
        .select(`
          *,
          users (id, full_name, email),
          projects (id, title)
        `)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.or(`proposal.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      console.debug('useRequests: fetched requests', { filters, data, error })

      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching requests:', err)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const updateRequest = async (requestId, updates) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('project_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      await logAuditAction('UPDATE', 'project_requests', requestId, { updates })
      
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
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error updating request:', err)
      toast.error('Failed to update request')
      throw err
    }
  }

  const approveRequest = async (requestId, adminNotes = '') => {
    return updateRequest(requestId, {
      status: 'Approved',
      admin_notes: adminNotes
    })
  }

  const rejectRequest = async (requestId, rejectionReason = '') => {
    return updateRequest(requestId, {
      status: 'Rejected',
      rejection_reason: rejectionReason
    })
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