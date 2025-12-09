// pages/Admin/Dashboard.jsx - FULLY UPDATED
import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { 
  UserIcon, 
  FolderIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  UsersIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline'
import SysDebug from '../../components/UI/SysDebug'
import config from '../../config/environment.js'

const AdminDashboard = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    publishedProjects: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    recentProjects: [],
    userChange: 0,
    projectChange: 0,
    publishedChange: 0,
    pendingChange: 0,
    approvedChange: 0
  })
  const [recentLogs, setRecentLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadDashboardData()
    }
  }, [user, hasRole])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setLogsLoading(true)

      console.log('Loading dashboard data...')

      // Calculate date 30 days ago for comparison
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

      // Load current users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) {
        console.error('Users count error:', usersError)
      } else {
        console.log('Users count:', usersCount)
      }

      // Load users from 30 days ago
      const { count: usersCountOld, error: usersOldError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', thirtyDaysAgoISO)

      if (usersOldError) {
        console.error('Old users count error:', usersOldError)
      }

      // Calculate user growth percentage
      const usersOld = usersCountOld || 0
      const userChange = usersOld > 0 
        ? Math.round(((usersCount - usersOld) / usersOld) * 100)
        : usersCount > 0 ? 100 : 0

      // Load current projects count
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      if (projectsError) {
        console.error('Projects count error:', projectsError)
      } else {
        console.log('Projects count:', projectsCount)
      }

      // Load projects from 30 days ago
      const { count: projectsCountOld, error: projectsOldError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', thirtyDaysAgoISO)

      if (projectsOldError) {
        console.error('Old projects count error:', projectsOldError)
      }

      // Calculate project growth percentage
      const projectsOld = projectsCountOld || 0
      const projectChange = projectsOld > 0
        ? Math.round(((projectsCount - projectsOld) / projectsOld) * 100)
        : projectsCount > 0 ? 100 : 0

      // Load current published projects count
      const { count: publishedCount, error: publishedError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)

      if (publishedError) {
        console.error('Published count error:', publishedError)
      } else {
        console.log('Published projects count:', publishedCount)
      }

      // Load published projects from 30 days ago
      const { count: publishedCountOld, error: publishedOldError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)
        .lt('created_at', thirtyDaysAgoISO)

      if (publishedOldError) {
        console.error('Old published count error:', publishedOldError)
      }

      // Calculate published growth percentage
      const publishedOld = publishedCountOld || 0
      const publishedChange = publishedOld > 0
        ? Math.round(((publishedCount - publishedOld) / publishedOld) * 100)
        : publishedCount > 0 ? 100 : 0

      // Load pending/approved counts from both project_requests and existing_project_requests
      const [prPendingRes, prApprovedRes, eprPendingRes, eprApprovedRes] = await Promise.all([
        supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
        supabase.from('existing_project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('existing_project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved')
      ])

      const prPendingCount = prPendingRes?.count || 0
      const prApprovedCount = prApprovedRes?.count || 0
      const eprPendingCount = eprPendingRes?.count || 0
      const eprApprovedCount = eprApprovedRes?.count || 0

      if (prPendingRes?.error) console.error('project_requests pending count error:', prPendingRes.error)
      if (prApprovedRes?.error) console.error('project_requests approved count error:', prApprovedRes.error)
      if (eprPendingRes?.error) console.error('existing_project_requests pending count error:', eprPendingRes.error)
      if (eprApprovedRes?.error) console.error('existing_project_requests approved count error:', eprApprovedRes.error)

      const pendingCount = (prPendingCount || 0) + (eprPendingCount || 0)
      const approvedCount = (prApprovedCount || 0) + (eprApprovedCount || 0)

      // Load old pending/approved counts for comparison
      const [prPendingOldRes, prApprovedOldRes, eprPendingOldRes, eprApprovedOldRes] = await Promise.all([
        supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending').lt('created_at', thirtyDaysAgoISO),
        supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved').lt('updated_at', thirtyDaysAgoISO),
        supabase.from('existing_project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending').lt('created_at', thirtyDaysAgoISO),
        supabase.from('existing_project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved').lt('updated_at', thirtyDaysAgoISO)
      ])

      const pendingCountOld = (prPendingOldRes?.count || 0) + (eprPendingOldRes?.count || 0)
      const approvedCountOld = (prApprovedOldRes?.count || 0) + (eprApprovedOldRes?.count || 0)

      // Calculate application changes
      const pendingChange = pendingCountOld > 0
        ? Math.round(((pendingCount - pendingCountOld) / pendingCountOld) * 100)
        : pendingCount > 0 ? 100 : 0

      const approvedChange = approvedCountOld > 0
        ? Math.round(((approvedCount - approvedCountOld) / approvedCountOld) * 100)
        : approvedCount > 0 ? 100 : 0

      console.log('Pending applications count (both tables):', pendingCount)
      console.log('Approved applications count (both tables):', approvedCount)

      // Load recent projects
      const { data: recentProjects, error: recentError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) {
        console.error('Recent projects error:', recentError)
      } else {
        console.log('Recent projects:', recentProjects)
      }

      // Load recent audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsError) {
        console.error('Audit logs error:', logsError)
      } else {
        console.log('Audit logs:', logsData)
      }

      setStats({
        totalUsers: usersCount || 0,
        totalProjects: projectsCount || 0,
        publishedProjects: publishedCount || 0,
        pendingApplications: pendingCount || 0,
        approvedApplications: approvedCount || 0,
        recentProjects: recentProjects || [],
        userChange,
        projectChange,
        publishedChange,
        pendingChange,
        approvedChange
      })

      setRecentLogs(logsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setLogsLoading(false)
    }
  }

  // Navigation cards for quick access
  const navigationCards = [
    {
      title: 'Project Management',
      description: 'Create, edit, and manage all projects',
      icon: FolderIcon,
      href: '/admin/projects',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      buttonText: 'Manage Projects'
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      buttonText: 'Manage Users'
    },
    {
      title: 'Applications',
      description: 'Review and process project applications',
      icon: DocumentMagnifyingGlassIcon,
      href: '/admin/applications',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      buttonText: 'Review Applications'
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: ChartBarSquareIcon,
      href: '/admin/analytics',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      buttonText: 'View Analytics'
    }
  ]

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      change: stats.userChange
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      change: stats.projectChange
    },
    {
      title: 'Published Projects',
      value: stats.publishedProjects,
      icon: CheckCircleIcon,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900',
      change: stats.publishedChange
    },
    {
      title: 'Pending Applications',
      value: stats.pendingApplications,
      icon: ClockIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      change: stats.pendingChange
    },
    {
      title: 'Approved Applications',
      value: stats.approvedApplications,
      icon: DocumentTextIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      change: stats.approvedChange
    }
  ]

  // Simple log display component
  const SimpleLogDisplay = ({ logs }) => {
    if (!logs || logs.length === 0) {
      return (
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {log.users?.full_name || 'System'} • {log.action}
              </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                {log.object_type} • {formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
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
        <LoadingSpinner size="lg" text="Loading dashboard..." />
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
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {profile?.full_name || 'Admin'}. Here's what's happening with your platform.
            </p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <Card.Content className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-lg ${stat.bgColor} inline-flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-full">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                        {stat.value}
                      </p>
                      {stat.change !== undefined && stat.change !== 0 && (
                        <span className={`mt-2 text-sm font-medium ${
                          stat.change > 0
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {stat.change > 0 ? '+' : ''}{stat.change}%
                        </span>
                      )}
                      {(stat.change === undefined || stat.change === 0) && (
                        <span className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                          No change
                        </span>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Navigation */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Navigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {navigationCards.map((nav, index) => (
                <motion.div
                  key={nav.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Card.Content className="p-6">
                      <div className={`flex-shrink-0 p-3 rounded-lg w-12 h-12 flex items-center justify-center ${nav.bgColor} mb-4`}>
                        <nav.icon className={`h-6 w-6 ${nav.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {nav.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {nav.description}
                      </p>
                      <Button
                        onClick={() => window.location.href = nav.href}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between group"
                      >
                        {nav.buttonText}
                        <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity & Audit Logs */}
            <div className="space-y-8">
              {/* Recent Projects */}
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Projects
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = '/admin/projects'}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentProjects && stats.recentProjects.length > 0 ? (
                      stats.recentProjects.map((project, index) => (
                        <div key={project.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div className="flex items-center space-x-3">
                            {project.image_url ? (
                              <img
                                src={project.image_url}
                                alt={project.title}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FolderIcon className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(project.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.published
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {project.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <FolderIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No projects yet</p>
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>

              {/* Quick Actions */}
              <Card>
                <Card.Content className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => window.location.href = '/admin/projects?create=true'}
                      className="justify-center"
                    >
                      <FolderIcon className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/admin/users'}
                      variant="outline"
                      className="justify-center"
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/admin/applications'}
                      variant="outline"
                      className="justify-center"
                    >
                      <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2" />
                      Review Applications
                    </Button>
                    <Button
                      onClick={loadDashboardData}
                      variant="outline"
                      className="justify-center"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Audit Logs */}
            <div className="space-y-8">
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = '/admin/audit-logs'}
                    >
                      View All
                    </Button>
                  </div>
                  {logsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" text="Loading activity..." />
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <SimpleLogDisplay logs={recentLogs.slice(0, 5)} />
                    </div>
                  )}
                </Card.Content>
              </Card>

              {/* System Status */}
              <Card>
                <Card.Content className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">Normal</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API</span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">Stable</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uptime</span>
                      </div>
                      <span className="text-sm text-blue-600 dark:text-blue-400">99.9%</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard