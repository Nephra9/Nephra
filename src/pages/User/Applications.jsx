import React from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/UI/Card'

const UserApplications = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card>
            <Card.Content className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                My Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Application tracking and management functionality will be implemented here.
              </p>
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default UserApplications
