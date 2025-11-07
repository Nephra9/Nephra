import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import formatDate from '../../utils/formatDate'
import { useAuth } from '../../context/AuthContext'
// import { db } from '../../services/supabaseClient'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

const MyApplications = () => {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

const loadApplications = async () => {
  try {
    setLoading(true)

    if (!user?.id) return

    console.log("Fetching applications for:", user.id)

    // Fetch from both tables
    const [projectRequestsRes, existingRequestsRes] = await Promise.all([
      supabase
        .from('project_requests')
        .select('id, status, proposal, expected_timeline, attachments, portfolio_links, skills_checklist, admin_notes, rejection_reason, revision_notes, created_at, updated_at, project:projects(id, title, summary)')
        .eq('user_id', user.id),

      supabase
        .from('existing_project_requests')
        .select('id, status, purpose, semester, created_at, updated_at, project:projects(id, title, summary)')
        .eq('user_id', user.id),
    ])

    if (projectRequestsRes.error) console.error('Error fetching project_requests:', projectRequestsRes.error)
    if (existingRequestsRes.error) console.error('Error fetching existing_project_requests:', existingRequestsRes.error)

    // Normalize both tables to the same structure
    const normalizeExistingRequests = (rows) => rows.map(req => ({
      ...req,
      proposal: req.purpose || 'Existing Project Request',
      expected_timeline: req.semester || null,
      attachments: [],
      portfolio_links: [],
      skills_checklist: [],
      admin_notes: null,
      rejection_reason: null,
      revision_notes: null,
    }))

    // Merge data
    const combinedData = [
      ...(projectRequestsRes.data || []),
      ...normalizeExistingRequests(existingRequestsRes.data || []),
    ]

    console.log("Combined applications:", combinedData)
    setApplications(combinedData)
  } catch (error) {
    console.error('Error loading applications:', error)
    setApplications([])
  } finally {
    setLoading(false)
  }
}


  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'Pending':
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (selectedStatus === 'all') return true
    return app.status === selectedStatus
  })

  const statusCounts = {
    all: applications.length,
    Pending: applications.filter(app => app.status === 'Pending').length,
    Approved: applications.filter(app => app.status === 'Approved').length,
    Rejected: applications.filter(app => app.status === 'Rejected').length
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to view your applications.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your applications..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track the status of your project applications and requests.
            </p>
          </div>

          {/* Status Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {status} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <ClockIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedStatus === 'all' ? 'No applications found' : `No ${selectedStatus.toLowerCase()} applications`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedStatus === 'all' 
                    ? "You haven't applied to any projects yet. Browse available projects to get started."
                    : `You don't have any ${selectedStatus.toLowerCase()} applications at the moment.`
                  }
                </p>
                {selectedStatus === 'all' && (
                  <Button onClick={() => window.location.href = '/projects'}>
                    Browse Projects
                  </Button>
                )}
              </Card.Content>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <Card.Content className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {application.project?.title || 'Project Application'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-1">{application.status}</span>
                            </span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {application.project?.summary || 'No project summary available'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Application Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Applied: {formatDate(application.created_at)}
                            </div>
                            {application.expected_timeline && (
                              <div className="text-gray-600 dark:text-gray-400">
                                Expected Timeline: {application.expected_timeline}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proposal
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {application.proposal}
                          </p>
                        </div>
                      </div>

                      {/* Skills and Attachments */}
                      {(application.skills_checklist?.length > 0 || application.attachments?.length > 0) && (
                        <div className="mb-6">
                          {application.skills_checklist?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Skills Checklist
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {application.skills_checklist.map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {application.attachments?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Attachments
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {application.attachments.map((attachment, attachIndex) => (
                                  <a
                                    key={attachIndex}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                  >
                                    <EyeIcon className="h-3 w-3 mr-1" />
                                    {attachment.name || `Attachment ${attachIndex + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Notes */}
                      {application.admin_notes && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Admin Notes
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {application.admin_notes}
                          </p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {application.rejection_reason && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Rejection Reason
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {application.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Revision Notes */}
                      {application.revision_notes && (
                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            Revision Notes
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {application.revision_notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Last updated: {formatDate(application.updated_at)}
                        </div>
                        <div className="flex space-x-2">
                          {application.project && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/projects/${application.project.id}`}
                            >
                              View Project
                            </Button>
                          )}
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

export default MyApplications
