// src/components/Admin/UsersList.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useUsers } from '../../hooks/useUsers'
import Button from '../UI/Button'
import Modal from '../UI/Modal'
import { 
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const UsersList = () => {
  const { users, loading, suspendUser, activateUser, deleteUser } = useUsers()
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', user: null })

  const handleUserAction = (user, action) => {
    setActionModal({ isOpen: true, action, user })
  }

  const confirmAction = async () => {
    if (!actionModal.user) return

    try {
      switch (actionModal.action) {
        case 'suspend':
          await suspendUser(actionModal.user.id)
          break
        case 'activate':
          await activateUser(actionModal.user.id)
          break
        case 'delete':
          await deleteUser(actionModal.user.id)
          break
      }
      setActionModal({ isOpen: false, action: '', user: null })
    } catch (error) {
      console.error('Error performing user action:', error)
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          There are no users in the system yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user.full_name || 'No Name'}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1 capitalize">{user.status || 'unknown'}</span>
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {user.role || 'user'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {user.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user, 'suspend')}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user, 'activate')}
                      className="text-green-600 hover:text-green-700"
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction(user, 'delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: '', user: null })}
        title={`${actionModal.action === 'suspend' ? 'Suspend' : actionModal.action === 'activate' ? 'Activate' : 'Delete'} User`}
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to {actionModal.action} {actionModal.user?.full_name || 'this user'}?
            {actionModal.action === 'delete' && ' This action cannot be undone.'}
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setActionModal({ isOpen: false, action: '', user: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={
                actionModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                actionModal.action === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-green-600 hover:bg-green-700'
              }
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default UsersList