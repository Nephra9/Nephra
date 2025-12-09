import React, { useEffect, useState } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import toast from 'react-hot-toast'
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import {
  PlusIcon,
  DocumentTextIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const UserDashboard = () => {
  // NEW STATE
  const [expanded, setExpanded] = useState(false);
  const { profile, loading, isAuthenticated, user, updateProfile } = useAuth()
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [progressData, setProgressData] = useState([])
  const [progressModalOpen, setProgressModalOpen] = useState(false)

  // Fetch user applications and progress
  useEffect(() => {
    const loadApplications = async () => {
      if (!user?.id) return
      setApplicationsLoading(true)
      try {
        const [projRes, existingRes] = await Promise.all([
          supabase
            .from('project_requests')
            .select('id, status, created_at, title, progress_project,progress_notes')
            .eq('user_id', user.id),
          supabase
            .from('existing_project_requests')
            .select('id, status, created_at, title, progress_project,progress_notes')
            .eq('user_id', user.id)
        ])

        const combined = [...(projRes.data || []), ...(existingRes.data || [])]
        setApplications(combined)

        // ✅ Only approved projects for progress
        const approvedProjects = combined.filter((p) => p.status === 'Approved')
        setProgressData(approvedProjects)
      } catch (err) {
        console.error('Error fetching applications:', err)
      } finally {
        setApplicationsLoading(false)
      }
    }
    loadApplications()
  }, [user?.id])

  // Handle profile image upload
  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Select a valid image')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be below 5MB')

    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    await uploadAndSaveImage(file)
  }

  const uploadAndSaveImage = async (file) => {
    try {
      setUploadingImage(true)
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const filePath = `avatars/${fileName}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      const result = await updateProfile({ profile_url: publicUrl })
      if (result.success) toast.success('Profile updated successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  // Convert DB value (0.22 or 22) to display 22%
  const normalizeProgress = (value) => {
    if (value === null || value === undefined) return 0
    if (value <= 1) return Math.round(value * 100)
    return Math.round(value)
  }

  // Progress Modal (only Approved Projects)
  const ProgressModal = ({ projects, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Approved Project Progress
        </h2>
        {projects.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center">
            No approved projects yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {projects.map((p) => {
              const progressValue = normalizeProgress(p.progress_project)
              return (
                <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{p.title || 'Project'}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{p.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        
                         'bg-green-600'
                      }`}
                      style={{ width: `${progressValue}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {progressValue}% complete
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    )

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to continue.</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>

          {/* Profile + Progress Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-8">
            {/* Profile Image & Name */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img
                  src={profile?.profile_url || imagePreview || '/default-avatar.png'}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
                <label
                  htmlFor="profileImage"
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition"
                >
                  <PencilIcon className="h-6 w-6 text-white" />
                </label>
                <input id="profileImage" type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white text-sm">
                    Uploading...
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile?.full_name || 'User'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
              </div>
            </div>

            {/* Progress Section */}
           {/* Progress Section */}
<div className="mt-6 lg:mt-0 w-full lg:w-1/2">
  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
    Approved Project Progress
  </h3>

  {progressData.length > 0 ? (
    <>
      {/* show only the first project */}
      {(() => {
        const p = progressData[0];
        const progressValue = normalizeProgress(p.progress_project);
        return (
          <div key={p.id} className="rounded-xl p-3">
            {/* title, percentage & down arrow */}
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>{p.title || "Project"}</span>

              <div className="flex items-center space-x-2">
                <span>{progressValue}%</span>

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="hover:scale-110 transition"
                >
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-700 dark:text-gray-100 transition-transform duration-300 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-green-600"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>

            {/* expanded notes */}
         {expanded && (
  <div className="mt-4 space-y-3 transition-all duration-300 ease-in-out">
    {p.progress_notes && p.progress_notes.length > 0 ? (
      [...p.progress_notes]
        .sort((a, b) => new Date(b.at) - new Date(a.at))
        .slice(0, 3)
        .map((n, idx) => (
          <div
            key={idx}
            className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl"
          >
            <div className="font-semibold">{n.value}% — {n.note}</div>
            <p className="text-[11px] opacity-70 mt-1">
              {new Date(n.at).toLocaleString()} • {n.author}
            </p>
          </div>
        ))
    ) : (
      <p className="text-xs text-gray-500 dark:text-gray-300 italic">
        No notes from admin yet.
      </p>
    )}
  <div className="pt-2 w-20">
  <Link to="/dashboard/all-progress">
    <Button variant="outline" size="sm" className="w-full">
      View All
    </Button>
  </Link>
</div>

 
  </div>
)}

          </div>
        );
      })()}

    </>
  ) : (
    <p className="text-gray-500 dark:text-gray-400">No approved projects yet.</p>
  )}
</div>

          </div>

          {/* Application Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <Card.Content className="p-6 text-center">
                <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {applicationsLoading ? '...' : applications.length}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Applications</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6 text-center">
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {applicationsLoading ? '...' : applications.filter((a) => a.status === 'Approved').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Approved</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6 text-center">
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {applicationsLoading
                    ? '...'
                    : applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Pending</p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6 text-center">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</h3>
                <p className="text-gray-600 dark:text-gray-400">Messages</p>
              </Card.Content>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/projects/register">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <PlusIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Register Project</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Submit a new research project</p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/dashboard/my-applications">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">My Applications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Track your project applications</p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/dashboard/profile">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <UserIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Edit Profile</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile information</p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/projects">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <EyeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Browse Projects</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Explore available projects</p>
                  </Card.Content>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Applications */}
          {applications.length > 0 && (
            <Card className="mt-8">
              <Card.Content className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
                  <Link to="/dashboard/my-applications">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {a.title || 'Project Application'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Applied: {formatDate(a.created_at)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.status === 'Approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : a.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {progressModalOpen && (
            <ProgressModal projects={progressData} onClose={() => setProgressModalOpen(false)} />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default UserDashboard
