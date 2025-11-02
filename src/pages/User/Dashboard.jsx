import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import { 
  PlusIcon, 
  DocumentTextIcon, 
  UserIcon, 
  BellIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const UserDashboard = () => {
  const { profile, loading, isAuthenticated, user } = useAuth()
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard - Auth state:', { 
      isAuthenticated, 
      loading, 
      user: user?.id, 
      profile: profile?.id 
    })
  }, [isAuthenticated, loading, user, profile])

  useEffect(() => {
    const loadApplications = async () => {
      if (!user?.id) return
      
      try {
        setApplicationsLoading(true)
        const data = await db.projectRequests.getByUser(user.id)
        setApplications(data || [])
      } catch (error) {
        console.error('Error loading applications:', error)
        setApplications([])
      } finally {
        setApplicationsLoading(false)
      }
    }

    loadApplications()
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to access this page.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Sign In
          </Button>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          
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
                  {applicationsLoading ? '...' : applications.filter(app => app.status === 'Approved').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Approved</p>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-6 text-center">
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {applicationsLoading ? '...' : applications.filter(app => app.status === 'Pending' || app.status === 'Under Review').length}
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/projects/register">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <PlusIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Register Project
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Submit a new research project
                    </p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/dashboard/my-applications">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      My Applications
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track your project applications
                    </p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/dashboard/profile">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <UserIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Edit Profile
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Update your profile information
                    </p>
                  </Card.Content>
                </Card>
              </Link>

              <Link to="/projects">
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <Card.Content className="p-6 text-center">
                    <EyeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Browse Projects
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explore available projects
                    </p>
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Recent Applications
                  </h2>
                  <Link to="/dashboard/my-applications">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {application.project?.title || 'Project Application'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Applied: {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'Approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : application.status === 'Rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default UserDashboard
