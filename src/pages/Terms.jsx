import React from 'react'
import { motion } from 'framer-motion'

const Terms = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
              Terms of Service
            </h1>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300">
                Terms of service content will be implemented here to ensure legal compliance.
                Detailed terms and conditions will be added here.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Terms
