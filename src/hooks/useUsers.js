import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import toast from 'react-hot-toast'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching users from Supabase...')
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching users:', fetchError)
        throw fetchError
      }

      console.log('Users fetched successfully:', data)
      setUsers(data || [])
    } catch (err) {
      console.error('Error in fetchUsers:', err)
      setError(err.message)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const suspendUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' } : u))
      toast.success('User suspended successfully')
    } catch (err) {
      console.error('Error suspending user:', err)
      throw err
    }
  }

  const activateUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
      toast.success('User activated successfully')
    } catch (err) {
      console.error('Error activating user:', err)
      throw err
    }
  }

  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('User deleted successfully')
    } catch (err) {
      console.error('Error deleting user:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    suspendUser,
    activateUser,
    deleteUser
  }
}