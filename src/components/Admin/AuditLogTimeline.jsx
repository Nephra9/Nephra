// src/components/Admin/AuditLogTimeline.jsx
import React from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon,
  XCircleIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

const AuditLogTimeline = ({ logs }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <DocumentPlusIcon className="h-5 w-5 text-green-500" />
      case 'UPDATE':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
      case 'DELETE':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'APPROVE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'REJECT':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'APPROVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'REJECT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No audit logs</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No activity has been recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, logIdx) => (
          <motion.li
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: logIdx * 0.1 }}
          >
            <div className="relative pb-8">
              {logIdx !== logs.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ring-8 ring-white dark:ring-gray-900">
                    {getActionIcon(log.action)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {log.actor?.full_name || 'System'}
                      </span>{' '}
                      {log.action.toLowerCase()} {log.object_type}
                      {log.object_id && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {' '}(ID: {log.object_id})
                        </span>
                      )}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <time dateTime={log.created_at}>
                        {formatDate(log.created_at)}
                      </time>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export default AuditLogTimeline