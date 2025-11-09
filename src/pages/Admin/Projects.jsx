// src/pages/Admin/Projects.jsx
import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useProjects'
import { useRequests } from '../../hooks/useRequests'
import { db } from '../../services/supabaseClient'
import config from '../../config/environment'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import { FolderIcon } from '@heroicons/react/24/outline'
import FileDropzone from '../../components/UI/FileDropzone'

// Simple ProjectsList component
const ProjectsList = ({ projects, onEditProject, deleteProject }) => {

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        if (deleteProject) await deleteProject(projectId)
        toast.success('Project deleted successfully')
      } catch (error) {
        console.error('Delete project error:', error)
        toast.error('Failed to delete project')
      }
    }
  }

  if (!projects.length) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new project.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {project.image_url && (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {project.summary}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {project.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/projects/${project.id}`, '_blank')}
                  >
                    View
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProject(project)}
                    >
                      Edit
                    </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

const AdminProjects = () => {
  const { user, profile, isAdmin, initializing } = useAuth()
  const { projects, loading, error, deleteProject } = useProjects()
  const { requests, fetchRequests } = useRequests()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [form, setForm] = useState({ title: '', summary: '', description: '', tags: '', published: false })
  const [image, setImage] = useState(null)

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  if (!user || !profile || !isAdmin) {
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

  const handleCreateProject = () => {
    setSelectedProject(null)
    setForm({ title: '', summary: '', description: '', tags: '', published: false })
    setImage(null)
    setShowCreateForm(true)
  }

  useEffect(() => {
    // load pending requests for admin view
    fetchRequests()
  }, [])

  // when editing a project, prefill form and image
  useEffect(() => {
    if (selectedProject) {
      setForm({
        title: selectedProject.title || '',
        summary: selectedProject.summary || '',
        description: selectedProject.description || '',
        tags: Array.isArray(selectedProject.tags) ? (selectedProject.tags || []).join(', ') : (selectedProject.tags || ''),
        published: !!selectedProject.published
      })
      if (selectedProject.image_url) {
        setImage({ url: selectedProject.image_url, path: selectedProject.image_path || null, name: selectedProject.title })
      } else {
        setImage(null)
      }
    }
  }, [selectedProject])

  const handleFormChange = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSaveProject = async () => {
    try {
      // basic validation
      if (!form.title) return toast.error('Title is required')
      const payload = {
        title: form.title,
        summary: form.summary,
        description: form.description,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        published: !!form.published,
        created_by: profile?.id || user?.id,
        created_at: new Date().toISOString()
      }

      // include image url if uploaded
      if (image && image.url) payload.image_url = image.url

      // create or update depending on selectedProject
      let result
      if (selectedProject) {
        // assume db.projects.update(id, payload) is available on the db client
        result = await db.projects.update(selectedProject.id, payload)
      } else {
        result = await db.projects.create(payload)
      }

      if (!result || !result.success) throw result.error || new Error('Failed to save')
      toast.success(selectedProject ? 'Project updated' : 'Project created')
      setShowCreateForm(false)
      setForm({ title: '', summary: '', description: '', tags: '', published: false })
      setImage(null)
      // refresh projects
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error(selectedProject ? 'Failed to update project' : 'Failed to create project')
    }
  }

  const handleEditProject = (project) => {
    setSelectedProject(project)
    setShowCreateForm(true)
  }

  const handleFormClose = () => {
    setShowCreateForm(false)
    setSelectedProject(null)
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
                Project Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create, edit, and manage all projects in the platform.
              </p>
            </div>
            <Button
              onClick={handleCreateProject}
              className="mt-4 sm:mt-0"
            >
              Create Project
            </Button>
          </div>

          {/* Projects List */}
          <Card>
            <Card.Content className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" text="Loading projects..." />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    Error loading projects: {error}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <ProjectsList
                  projects={projects}
                  onEditProject={handleEditProject}
                  deleteProject={deleteProject}
                />
              )}
            </Card.Content>
          </Card>
        </motion.div>
      </div>

      {/* Simple Project Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedProject ? 'Edit Project' : 'Create Project'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                <input value={form.summary} onChange={(e) => handleFormChange('summary', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" rows={6} />
              </div>

              {/* Image upload via dropzone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image</label>
                <div className="mt-2">
                  <FileDropzone
                    multiple={false}
                    onUploadComplete={(file) => {
                      // FileDropzone returns either an object or an array depending on `multiple`
                      const f = Array.isArray(file) ? file[0] : file
                      if (f) {
                        setImage(f)
                        toast.success('Image uploaded')
                      }
                    }}
                  />

                  {image && image.url && (
                    <div className="mt-3 flex items-center space-x-4">
                      <img src={image.url} alt={image.name || 'Project image'} className="h-20 w-20 rounded-md object-cover" />
                      <div className="flex items-start space-x-2">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{image.name || 'Uploaded image'}</div>
                        <button type="button" className="text-sm text-red-600 hover:underline ml-4" onClick={() => setImage(null)}>Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => handleFormChange('tags', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.published} onChange={(e) => handleFormChange('published', e.target.checked)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleFormClose}>Cancel</Button>
                <Button onClick={handleSaveProject}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests section (from project_requests) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Project Requests</h2>
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.filter(r => r.status === 'Pending').map((r) => {
                // parse attachments if needed
                let attachments = r.attachments
                if (typeof attachments === 'string') {
                  try { attachments = JSON.parse(attachments) } catch (e) { attachments = [] }
                }
                const attachmentData = attachments?.[0]?.data
                const title = attachmentData?.title || r.projects?.title || r.title || 'Project Request'

                return (
                  <Card key={r.id}>
                    <Card.Content className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Submitted by: {r.users?.full_name || r.user_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                          // create project from request
                          try {
                            const res = await db.projects.createFromRequest(r)
                            if (!res || !res.success) throw res.error || new Error('Create failed')
                            // mark request approved / refresh
                            await fetchRequests()
                            toast.success('Project created from request')
                            window.location.reload()
                          } catch (err) {
                            console.error(err)
                            toast.error('Failed to create project from request')
                          }
                        }}>Create Project</Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/applications`}>
                          View
                        </Button>
                      </div>
                    </Card.Content>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No pending requests</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminProjects