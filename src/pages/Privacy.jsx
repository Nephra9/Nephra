import React from 'react'
import { motion } from 'framer-motion'

const Privacy = () => {
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
              Privacy Policy
            </h1>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300">
                This privacy policy will be implemented to ensure GDPR compliance and user data protection.
                Detailed privacy policy content will be added here.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Privacy
