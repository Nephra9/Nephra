// src/pages/Admin/AuditLogs.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useAuditLogs } from '../../hooks/useAuditLogs'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import AuditLogTimeline from '../../components/Admin/AuditLogTimeline'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

const AdminAuditLogs = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const { logs, loading, error, fetchAuditLogs } = useAuditLogs()

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

  return (
  <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Audit Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track all administrative actions and system activities.
              </p>
            </div>
            <Button
              onClick={fetchAuditLogs}
              variant="outline"
              className="mt-4 sm:mt-0"
            >
              Refresh Logs
            </Button>
          </div>

          {/* Audit Logs */}
          <Card>
            <Card.Content className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading audit logs..." />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Error Loading Logs
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <Button onClick={fetchAuditLogs}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <AuditLogTimeline logs={logs} />
              )}
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminAuditLogs