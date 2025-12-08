import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import toast from 'react-hot-toast'

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().min(20, 'Summary must be at least 20 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),

  tech_stack: z.string().min(1, 'Please enter at least one technology'),
  deliverables: z.string().min(1, 'Please enter at least one deliverable'),
  timeline: z.string().min(1, 'Timeline is required'),

  outcomes: z.string().min(10, 'Expected outcomes must be at least 10 characters')
})

const ProjectRegistration = () => {
  const [loading, setLoading] = useState(false)

  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // NOTE: we now use setValue to keep the registered 'deliverables' string in sync
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(projectSchema)
  })

  // deliverables checkbox options taken from the placeholder
  const deliverableOptions = ['Paper', 'Prototype', 'Dataset']
  const [selectedDeliverables, setSelectedDeliverables] = useState([])

  const onToggleDeliverable = (option) => {
    setSelectedDeliverables(prev => {
      const next = prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option]
      // keep the registered deliverables field (string) in sync for zod validation and submission
      setValue('deliverables', next.join(', '), { shouldValidate: true })
      return next
    })
  }

  const onSubmit = async (data) => {
    if (!user || !profile) {
      toast.error('You must be logged in to register a project')
      return
    }

    try {
      setLoading(true)

      const requestedTech = data.tech_stack.split(',').map(t => t.trim()).filter(Boolean)

      // data.deliverables is kept as a comma separated string (updated via setValue above)
      const requestedDeliverables = typeof data.deliverables === 'string'
        ? data.deliverables.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(data.deliverables)
          ? data.deliverables.map(t => String(t).trim()).filter(Boolean)
          : []


      // Prepare the project request data (do NOT create a projects row here - admin will manage projects)
      const requestPayload = {
        user_id: user.id,
        project_id: null,
        title: data.title,
        proposal: `Title: ${data.title}\n\nSummary: ${data.summary}\n\nDescription: ${data.description}\n\nExpected Outcomes: ${data.outcomes}`,
        expected_timeline: data.timeline,
        attachments: [
          {
            type: 'requested_project',
            data: {
              title: data.title,
              summary: data.summary,
              description: data.description,

              tech_stack: requestedTech,
              deliverables: requestedDeliverables,

              outcomes: data.outcomes,
              submitted_by: profile.name || user.email,
              submitted_at: new Date().toISOString()
            }
          }
        ],
        portfolio_links: [],
        skills_checklist: [],
        status: 'Pending',
        assigned_reviewers: [],
        admin_notes: null,
        rejection_reason: null,
        revision_notes: null
      }

      console.log('Submitting project request payload:', JSON.stringify(requestPayload, null, 2))

      // Use direct Supabase client for insertion
      const { data: result, error } = await supabase
        .from('project_requests')
        .insert([requestPayload])
        .select()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database error: ${error.message}`)
      }

      if (result && result.length > 0) {
        console.log('Successfully inserted project request:', result[0])
        toast.success('Project request submitted successfully! We will review it soon.')
        navigate('/dashboard/my-applications')
      } else {
        throw new Error('No data returned from insert operation - insertion may have failed')
      }
    } catch (error) {
      console.error('Complete error object:', error)
      toast.error(error.message || 'Failed to register project. Please try again.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <Card>
            <Card.Content className="p-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Register a New Project
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Submit your project for review and publication.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Basic Information
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Title *
                      </label>
                      <input 
                        {...register('title')} 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="Enter your project title" 
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Summary *
                      </label>
                      <textarea 
                        {...register('summary')} 
                        rows={3} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="Brief summary (2-3 sentences)" 
                      />
                      {errors.summary && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.summary.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Description *
                      </label>
                      <textarea 
                        {...register('description')} 
                        rows={6} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="Detailed description, methodology, and goals" 
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags and Technologies Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Tags and Technologies
                  </h2>
                  <div className="space-y-6">
                 
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Technology Stack *
                      </label>
                      <input 
                        {...register('tech_stack')} 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="Python, React, PostgreSQL (comma-separated)" 
                      />
                      {errors.tech_stack && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.tech_stack.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deliverables *
                      </label>

                      {/* Checkbox group built from placeholder options. The selected values are synced to a hidden registered input so existing validation and submission logic works unchanged. */}
                      <div className="flex flex-wrap gap-3">
                        {deliverableOptions.map(option => (
                          <label key={option} className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedDeliverables.includes(option)}
                              onChange={() => onToggleDeliverable(option)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-600 focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>

                      {/* Hidden input kept registered so zod validation (string) and the existing submit flow remain unchanged. */}
                      <input type="hidden" {...register('deliverables')} />

                      {errors.deliverables && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.deliverables.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Timeline
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timeline *
                      </label>
                      <input 
                        {...register('timeline')} 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="e.g., 6 months, 1 year" 
                      />
                      {errors.timeline && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.timeline.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              

                {/* Outcomes Section */}
                <div className="space-y-6">
               
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Outcomes *
                    </label>
                    <textarea 
                      {...register('outcomes')} 
                      rows={4} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                      placeholder="Impact and potential applications" 
                    />
                    {errors.outcomes && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.outcomes.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/projects')} 
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || isSubmitting} 
                    loading={loading || isSubmitting}
                  >
                    {loading ? 'Registering Project...' : 'Register Project'}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ProjectRegistration
