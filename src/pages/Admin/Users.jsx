import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db, adminDb } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import config from '../../config/environment'
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const AdminUsers = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const [users, setUsers] = useState([])
  const [adminUsers, setAdminUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadUsers()
    }
  }, [user, hasRole])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.debug('AdminUsers: fetching users from DB...')
      const data = await db.users.getAllUsers()
      console.debug('AdminUsers: fetched users count=', Array.isArray(data) ? data.length : 0, data)
      setUsers(data || [])

      // In debug mode also fetch the direct adminDb users list to compare results
      if (config && config.debug) {
        try {
          const adminData = await adminDb.getUsers()
          console.debug('adminDb.getUsers count=', Array.isArray(adminData) ? adminData.length : 0, adminData)
          setAdminUsers(adminData || [])
        } catch (e) {
          console.error('adminDb.getUsers error:', e)
          setAdminUsers(null)
        }
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const suspendUser = async (userId) => {
    try {
      setActionLoading(true)
      console.debug('AdminUsers: suspending user', userId)
      await db.users.suspendUser(userId)

      toast.success('User suspended successfully')
      loadUsers()
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    } finally {
      setActionLoading(false)
    }
  }

  const activateUser = async (userId) => {
    try {
      setActionLoading(true)
      console.debug('AdminUsers: activating user', userId)
      await db.users.activateUser(userId)

      toast.success('User activated successfully')
      loadUsers()
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error('Failed to activate user')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      setActionLoading(true)
      console.debug('AdminUsers: deleting user', userId)
      await db.users.deleteUser(userId)

      toast.success('User deleted successfully')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'suspended':
        return <NoSymbolIcon className="h-5 w-5 text-red-500" />
      default:
        return <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  if (!user || !profile || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    )
  }

  return (
  <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user accounts, suspend users, and maintain system security.
            </p>
          </div>

          {users.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <UserIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There are no users in the system yet.
                </p>
              </Card.Content>
            </Card>
          ) : (
            <div className="space-y-6">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <Card.Content className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {user.full_name || 'No Name'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {getStatusIcon(user.status)}
                              <span className="ml-1 capitalize">{user.status || 'unknown'}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Joined: {formatDate(user.created_at)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Role: {user.role || 'user'}</span>
                            <span>
                              Last login: {user.last_login_at ? formatDate(user.last_login_at) : (user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never')}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {user.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => suspendUser(user.id)}
                              disabled={actionLoading}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateUser(user.id)}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-700"
                            >
                              Activate
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            disabled={actionLoading || user.id === profile.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminUsers