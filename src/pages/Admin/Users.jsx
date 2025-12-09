import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db, adminDb, supabase } from '../../services/supabaseClient'
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
  XCircleIcon,
  ChevronDownIcon,
  MapPinIcon,
  AcademicCapIcon,
  DocumentIcon,
  PhoneIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const AdminUsers = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const [users, setUsers] = useState([])
  const [adminUsers, setAdminUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

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

  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const deleteUser = async () => {
    if (!userToDelete) return

    try {
      setActionLoading(true)
      console.debug('AdminUsers: deleting user', userToDelete.id)
      
      // Call the database function that deletes from both users table and auth.users
      // This function runs with elevated privileges (SECURITY DEFINER)
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_id: userToDelete.id
      })
      
      if (error) {
        console.error('Error deleting user:', error)
        throw error
      }
      
      toast.success('User deleted successfully from all systems')
      closeDeleteModal()
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      
      // Fallback: Try to at least delete from users table
      try {
        await db.users.deleteUser(userToDelete.id)
        toast.error('User deleted from database only. Authentication account may still exist. Contact system administrator.')
      } catch (fallbackError) {
        toast.error('Failed to delete user: ' + (error.message || 'Unknown error'))
      }
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
            <div className="space-y-4">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 ${expandedUserId === user.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
                    <Card.Content className="p-0">
                      {/* Header Section - Always Visible */}
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex items-center space-x-4">
                            {/* User Avatar/Icon */}
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
                                {user.profile_url ? (
                                  <img 
                                    src={user.profile_url} 
                                    alt={user.full_name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <UserIcon className="h-6 w-6 text-white" />
                                )}
                              </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                  {user.full_name || 'No Name'}
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(user.status)}`}>
                                  {getStatusIcon(user.status)}
                                  <span className="ml-1 capitalize">{user.status || 'unknown'}</span>
                                </span>
                                {user.profile_done && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex-shrink-0">
                                    <CheckIcon className="h-3 w-3 mr-1" />
                                    Profile Complete
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {formatDate(user.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expand Button */}
                          <motion.button
                            animate={{ rotate: expandedUserId === user.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-4 flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Expanded Details Section */}
                      <AnimatePresence>
                        {expandedUserId === user.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                              {/* User Details Grid */}
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                                    Personal Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Full Name</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.full_name || '—'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Email</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                                        {user.email || '—'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        <PhoneIcon className="h-3 w-3 inline mr-1" />
                                        Phone
                                      </p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.phone ? (
                                          <a href={`tel:${user.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                            {user.phone}
                                          </a>
                                        ) : '—'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        <MapPinIcon className="h-3 w-3 inline mr-1" />
                                        Country
                                      </p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.country || '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Academic Information */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <AcademicCapIcon className="h-4 w-4 mr-2 text-purple-500" />
                                    Academic Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Institution</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.institution || '—'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Degree</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.degree || '—'}
                                      </p>
                                    </div>
                                    <div className="md:col-span-2 bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Department</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.department || '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Bio Section */}
                                {user.bio && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                      <SparklesIcon className="h-4 w-4 mr-2 text-amber-500" />
                                      Biography
                                    </h4>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                                        {user.bio}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Account Information */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <ShieldCheckIcon className="h-4 w-4 mr-2 text-indigo-500" />
                                    Account Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Role</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                        {user.role || 'user'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Status</p>
                                      <div className="flex items-center">
                                        {getStatusIcon(user.status)}
                                        <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                          {user.status || 'unknown'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Email Verified</p>
                                      <div className="flex items-center">
                                        {user.email_verified ? (
                                          <>
                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            <span className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">Yes</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircleIcon className="h-4 w-4 text-red-500" />
                                            <span className="ml-2 text-sm font-semibold text-red-600 dark:text-red-400">No</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Profile Completed</p>
                                      <div className="flex items-center">
                                        {user.profile_done ? (
                                          <>
                                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            <span className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">Yes</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircleIcon className="h-4 w-4 text-yellow-500" />
                                            <span className="ml-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">No</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Timestamps */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-green-500" />
                                    Timeline
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Account Created</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDate(user.created_at)}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Last Updated</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDate(user.updated_at)}
                                      </p>
                                    </div>
                                    <div className="md:col-span-2 bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Last Login</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {user.last_login_at ? formatDate(user.last_login_at) : (user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never')}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Resume Section */}
                                {user.resume_url && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                      <DocumentIcon className="h-4 w-4 mr-2 text-red-500" />
                                      Resume
                                    </h4>
                                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                      <a
                                        href={user.resume_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                      >
                                        <DocumentIcon className="h-4 w-4 mr-2" />
                                        View Resume
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 flex space-x-3">
                                {user.status === 'active' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => suspendUser(user.id)}
                                    disabled={actionLoading}
                                    className="text-yellow-600 hover:text-yellow-700 flex-1"
                                  >
                                    <NoSymbolIcon className="h-4 w-4 mr-2 inline" />
                                    Suspend User
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => activateUser(user.id)}
                                    disabled={actionLoading}
                                    className="text-green-600 hover:text-green-700 flex-1"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                                    Activate User
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteModal(user)}
                                  disabled={actionLoading || user.id === profile.id}
                                  className="text-red-600 hover:text-red-700 flex-1"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2 inline" />
                                  Delete User
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && userToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={closeDeleteModal}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Delete User?
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                  Are you sure you want to delete <strong>{userToDelete.full_name || userToDelete.email}</strong>?
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-semibold mb-1">This action cannot be undone</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>User will be deleted from the database</li>
                        <li>User will be deleted from authentication system</li>
                        <li>All user data will be permanently removed</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={closeDeleteModal}
                    variant="outline"
                    className="flex-1"
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={deleteUser}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete User'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminUsers