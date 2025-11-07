// src/pages/Admin/ProjectManagement.jsx - FULLY UPDATED
import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const ProjectManagement = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const [applications, setApplications] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('applications')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadData()
    }
  }, [user, hasRole])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading project management data...')

      // Load project requests
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('project_requests')
        .select(`
          *,
          users (
            id,
            email,
            full_name
          ),
          projects (
            id,
            title,
            summary
          )
        `)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        console.error('Applications error:', applicationsError)
        throw applicationsError
      }

      console.log('Applications data:', applicationsData)

      // Load existing project requests (don't select users relation to avoid FK alias issues)
      const { data: existingData, error: existingError } = await supabase
        .from('existing_project_requests')
        .select('*, projects (id, title, summary)')
        .order('created_at', { ascending: false })

      if (existingError) {
        console.error('Existing requests error:', existingError)
        throw existingError
      }

      console.log('Existing requests data:', existingData)

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Projects error:', projectsError)
        throw projectsError
      }

      console.log('Projects data:', projectsData)

      // Normalize by adding a _source field so UI/actions can handle both tables
      const pr = (applicationsData || []).map(r => ({ ...r, _source: 'project_requests' }))
      const epr = (existingData || []).map(r => ({ ...r, _source: 'existing_project_requests' }))

      let merged = [...pr, ...epr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      // Fetch users for any rows missing a users object
      const missingUserIds = Array.from(new Set(merged.filter(m => !m.users && m.user_id).map(m => m.user_id)))
      if (missingUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', missingUserIds)

        if (!usersError && Array.isArray(usersData)) {
          const usersMap = usersData.reduce((acc, u) => { acc[u.id] = u; return acc }, {})
          merged = merged.map(row => ({ ...row, users: row.users || usersMap[row.user_id] || null }))
        }
      }

      setApplications(merged)
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  

  const handleApplicationAction = async (applicationId, action) => {
    try {
      setActionLoading(true)
      const application = applications.find(a => a.id === applicationId)
      if (!application) throw new Error('Application not found')

      const source = application._source || 'project_requests'

      const updateData = {
        status: action,
        updated_at: new Date().toISOString()
      }

      if (action === 'Approved') {
        updateData.admin_notes = adminNotes || application.admin_notes || ''
        // NOTE: approval no longer creates a new project. We only update the request status.
      } else if (action === 'Rejected') {
        updateData.rejection_reason = rejectionReason || application.rejection_reason || ''
      }

      const { error } = await supabase
        .from(source)
        .update(updateData)
        .eq('id', applicationId)

      if (error) throw error

      toast.success(`Application ${action.toLowerCase()} successfully`)
      setShowModal(false)
      setSelectedApplication(null)
      setAdminNotes('')
      setRejectionReason('')
      loadData() // Reload data
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application')
    } finally {
      setActionLoading(false)
    }
  }

  // Previously the admin approval flow created a project from an application.
  // This has been intentionally removed: approving a request now only updates its status and admin notes.

  const deleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return

    try {
      const application = applications.find(a => a.id === applicationId)
      if (!application) throw new Error('Application not found')

      const source = application._source || 'project_requests'

      const { error } = await supabase
        .from(source)
        .delete()
        .eq('id', applicationId)

      if (error) throw error

      toast.success('Application deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }

  const openModal = (application, action) => {
    setSelectedApplication({ ...application, action })
    setShowModal(true)
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
        <LoadingSpinner size="lg" text="Loading admin panel..." />
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Project Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage project applications and approve/reject projects.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSelectedTab('applications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'applications'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Applications ({applications.length})
                </button>
                <button
                  onClick={() => setSelectedTab('projects')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'projects'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Approved Projects ({projects.length})
                </button>
              </nav>
            </div>
          </div>

          {selectedTab === 'applications' && (
            <>
              {/* Status Filter */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedStatus === status
                          ? 'bg-blue-600 text-white'
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
                      <DocumentTextIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No applications found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedStatus === 'all' 
                        ? "There are no project applications at the moment."
                        : `There are no ${selectedStatus.toLowerCase()} applications.`
                      }
                    </p>
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
                                    {application.projects?.title || application.purpose || application.proposal || 'Project Application'}
                                  </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1">{application.status}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {application.users?.full_name || application.users?.email || 'Unknown User'}
                                </div>
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {formatDate(application.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Proposal Summary
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {(application.proposal || application.purpose || '').substring(0, 200)}{(application.proposal || application.purpose || '').length > 200 ? '...' : ''}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project Details
                              </h4>
                              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {application.projects?.summary && (
                                  <div className="line-clamp-2">{application.projects.summary}</div>
                                )}
                                {application.expected_timeline && (
                                  <div>Timeline: {application.expected_timeline}</div>
                                )}
                                {application.semester && (
                                  <div>Semester: {application.semester}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Admin Notes */}
                          {application.admin_notes && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                Admin Notes
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {application.admin_notes}
                              </p>
                            </div>
                          )}

                          {/* Rejection Reason */}
                          {application.rejection_reason && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                Rejection Reason
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {application.rejection_reason}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Submitted: {formatDate(application.created_at)}
                            </div>
                            <div className="flex space-x-2">
                              {application.status === 'Pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModal(application, 'Approved')}
                                    className="text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModal(application, 'Rejected')}
                                    className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteApplication(application.id)}
                                className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50"
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
            </>
          )}

          {selectedTab === 'projects' && (
            <div className="space-y-6">
              {projects.length === 0 ? (
                <Card>
                  <Card.Content className="p-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <DocumentTextIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No projects found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      There are no approved projects yet.
                    </p>
                  </Card.Content>
                </Card>
              ) : (
                projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card>
                      <Card.Content className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {project.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {project.summary}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                project.published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {project.published ? 'Published' : 'Draft'}
                              </span>
                              <span>Created: {formatDate(project.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/projects/${project.id}`, '_blank')}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedApplication.action === 'Approved' ? 'Approve Application' : 'Reject Application'}
            </h3>
            
            <div className="space-y-4">
              {selectedApplication.action === 'Approved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes for the applicant..."
                  />
                </div>
              )}

              {selectedApplication.action === 'Rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  setSelectedApplication(null)
                  setAdminNotes('')
                  setRejectionReason('')
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleApplicationAction(selectedApplication.id, selectedApplication.action)}
                disabled={actionLoading || (selectedApplication.action === 'Rejected' && !rejectionReason)}
                loading={actionLoading}
                className={selectedApplication.action === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {selectedApplication.action === 'Approved' ? 'Approve Project' : 'Reject Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManagement