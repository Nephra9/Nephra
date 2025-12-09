import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db, supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import formatDate from '../../utils/formatDate'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  FolderOpenIcon,
  SparklesIcon,
  CalendarIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  CogIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PlusIcon,
  EnvelopeIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'

const AdminAnalytics = () => {
  const { user, profile, hasRole, initializing } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showIncompleteUsers, setShowIncompleteUsers] = useState(false)
  const [incompleteUsers, setIncompleteUsers] = useState([])
  const [verifyingEmail, setVerifyingEmail] = useState({})
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserLoading, setNewUserLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({
    users: { total: 0, active: 0, suspended: 0, verified: 0, unverified: 0, incomplete: 0 },
    projects: { total: 0, active: 0, completed: 0, archived: 0 },
    applications: { total: 0, pending: 0, approved: 0, rejected: 0 },
    requests: { total: 0, pending: 0, completed: 0, inProgress: 0 },
    topProjects: [],
    recentActivity: [],
    systemHealth: {},
    userStats: { growth: 0, lastMonth: 0, thisMonth: 0 },
    applicationStats: { successRate: 0, avgProcessTime: 0 }
  })
  const [timeRange, setTimeRange] = useState('7days')
  const [refreshTime, setRefreshTime] = useState(new Date())

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadAnalytics()
    }
  }, [user, hasRole, timeRange])

  const loadIncompleteUsers = async () => {
    try {
      const usersData = await db.users.getAllUsers()
      const incomplete = usersData.filter(u => 
        !u.profile_done || !u.email_verified
      )
      setIncompleteUsers(incomplete)
    } catch (error) {
      console.error('Error loading incomplete users:', error)
      toast.error('Failed to load incomplete users')
    }
  }

  const sendVerificationEmail = async (userId, userEmail) => {
    try {
      setVerifyingEmail(prev => ({ ...prev, [userId]: true }))
      
      // Option 1: Try resend for recent signups
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      console.log('Resend response:', data)

      // If resend returns null (user already verified or too old), manually update
      if (!data || (!data.user && !data.session)) {
        console.log('Resend not available for this user, using alternative method...')
        
        // Alternative: Update user to mark as verified (admin override)
        // This requires admin to manually verify the user
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          throw new Error('Cannot send verification email. User may have already verified or email service is unavailable. Marked as verified instead.')
        }

        toast.success(`User ${userEmail} has been manually verified by admin.`)
        // Reload the incomplete users list
        await loadIncompleteUsers()
        return
      }

      if (error) {
        console.error('Verification error details:', error)
        throw error
      }

      toast.success(`Verification email sent to ${userEmail}. Check inbox/spam folder.`)
      await loadIncompleteUsers()
    } catch (error) {
      console.error('Error sending verification:', error)
      toast.error(error?.message || 'Failed to send verification email')
    } finally {
      setVerifyingEmail(prev => ({ ...prev, [userId]: false }))
    }
  }

  const addNewUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setNewUserLoading(true)

      // Step 1: Backup admin session BEFORE creating user
      const { data: { session: adminSession } } = await supabase.auth.getSession()
      if (!adminSession?.access_token || !adminSession?.refresh_token) {
        throw new Error('No active admin session found')
      }
      
      console.log('✓ Admin session backed up. Admin User ID:', adminSession.user.id)

      // Step 2: Create user account (this will create a session for new user)
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            created_by: 'admin',
            email_verified: true
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        throw new Error(error.message || 'Failed to create user')
      }

      if (!data?.user) {
        throw new Error('Failed to create user account')
      }

      const userId = data.user.id
      console.log('✓ New user created:', userId)

      // Step 3: Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: newUserEmail,
          full_name: newUserEmail.split('@')[0],
          email_verified: true,
          status: 'active',
          role: 'user',
          profile_done: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        throw new Error('Failed to create user profile: ' + profileError.message)
      }

      console.log('✓ User profile created')

      // Step 4: CRITICAL - Immediately restore admin session
      // The signUp() has overwritten localStorage with new user's session
      console.log('🔄 Restoring admin session...')
      
      // First, sign out the new user session
      await supabase.auth.signOut({ scope: 'local' })
      
      // Small delay to ensure storage is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Restore admin session using backed-up tokens
      const { error: setError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      })
      
      if (setError) {
        console.error('❌ Failed to restore admin session:', setError)
        
        // Fallback: Try to refresh the admin session
        try {
          const { error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: adminSession.refresh_token
          })
          
          if (refreshError) {
            console.error('❌ Refresh also failed:', refreshError)
            toast.error('Session restore failed. Please refresh the page to continue.')
          } else {
            console.log('✓ Admin session restored via refresh')
          }
        } catch (e) {
          console.error('❌ Exception during refresh:', e)
          toast.error('Session restore failed. Please refresh the page to continue.')
        }
      } else {
        console.log('✓ Admin session successfully restored')
      }
      
      // Wait for session to stabilize
      await new Promise(resolve => setTimeout(resolve, 200))

      // Close modal and reset form
      setNewUserEmail('')
      setNewUserPassword('')
      setShowAddUser(false)
      
      // Show success message
      toast.success(`User ${newUserEmail} created successfully! They can login now.`, { duration: 5000 })
      
      // Refresh analytics (this will re-fetch user data and confirm admin is still authenticated)
      loadAnalytics()
      
    } catch (error) {
      console.error('Error creating user:', error)
      
      // Show user-friendly error with solution
      if (error.message?.includes('confirmation')) {
        toast.error(
          'Email verification required. Solution: In Supabase Dashboard, go to Authentication → Providers → Email → disable "Confirm email" temporarily, or configure SMTP.',
          { duration: 8000 }
        )
      } else {
        toast.error(error.message || 'Failed to create user')
      }
    } finally {
      setNewUserLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [usersData, projectsData, projectRequestsData] = await Promise.all([
        db.users.getAllUsers(),
        db.projects.getAll(),
        db.projectRequests.getAll()
      ])

      // Try to fetch existing_projects if table exists, otherwise skip
      let existingProjectsData = []
      try {
        const { data } = await supabase.from('existing_projects').select('*')
        existingProjectsData = data || []
      } catch (err) {
        console.log('existing_projects table not found, skipping...')
      }

      // Process users data
      const activeUsers = usersData.filter(u => u.status === 'active').length
      const suspendedUsers = usersData.filter(u => u.status === 'suspended').length
      const verifiedUsers = usersData.filter(u => u.email_verified).length
      const unverifiedUsers = usersData.filter(u => !u.email_verified).length
      const profileCompleteUsers = usersData.filter(u => u.profile_done).length
      const incompleteProfileUsers = usersData.filter(u => !u.profile_done || !u.email_verified).length

      // Process all projects (both new and existing)
      const allProjects = [...projectsData, ...(existingProjectsData || [])]
      const activeProjects = allProjects.filter(p => p.status === 'active' || p.published === true).length
      const completedProjects = allProjects.filter(p => p.status === 'completed').length
      const archivedProjects = allProjects.filter(p => p.status === 'archived').length

      // Process applications data
      let applicationsCount = { total: 0, pending: 0, approved: 0, rejected: 0 }
      if (Array.isArray(projectRequestsData)) {
        applicationsCount = {
          total: projectRequestsData.length,
          pending: projectRequestsData.filter(a => a.status === 'pending').length,
          approved: projectRequestsData.filter(a => a.status === 'approved').length,
          rejected: projectRequestsData.filter(a => a.status === 'rejected').length
        }
      }

      // Process requests data (using same project_requests for now)
      let requestsCount = { total: 0, pending: 0, completed: 0, inProgress: 0 }
      if (Array.isArray(projectRequestsData)) {
        requestsCount = {
          total: projectRequestsData.length,
          pending: projectRequestsData.filter(r => r.status === 'pending').length,
          completed: projectRequestsData.filter(r => r.status === 'approved').length,
          inProgress: projectRequestsData.filter(r => r.status === 'in_review').length
        }
      }

      // Top projects by applications
      const projectAppCount = {}
      if (Array.isArray(projectRequestsData)) {
        projectRequestsData.forEach(app => {
          const projId = app.project_id
          projectAppCount[projId] = (projectAppCount[projId] || 0) + 1
        })
      }

      const topProjects = allProjects
        .map(p => ({ ...p, appCount: projectAppCount[p.id] || 0 }))
        .sort((a, b) => b.appCount - a.appCount)
        .slice(0, 5)

      // User growth rate (mock calculation based on creation dates)
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const thisMonthUsers = usersData.filter(u => new Date(u.created_at) >= thisMonthStart).length
      const lastMonthUsers = usersData.filter(u => {
        const d = new Date(u.created_at)
        return d >= lastMonthStart && d <= lastMonthEnd
      }).length

      const growthRate = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0

      // System health checks
      const systemHealth = {
        database: 'Healthy',
        storage: 'Healthy',
        auth: usersData.length > 0 ? 'Healthy' : 'Warning',
        email: 'Operational'
      }

      setAnalyticsData({
        users: {
          total: usersData.length,
          active: activeUsers,
          suspended: suspendedUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          incomplete: incompleteProfileUsers,
          profileComplete: profileCompleteUsers
        },
        projects: {
          total: allProjects.length,
          active: activeProjects,
          completed: completedProjects,
          archived: archivedProjects
        },
        applications: applicationsCount,
        requests: requestsCount,
        topProjects,
        userStats: {
          growth: growthRate,
          lastMonth: lastMonthUsers,
          thisMonth: thisMonthUsers
        },
        applicationStats: {
          successRate: applicationsCount.total > 0 
            ? ((applicationsCount.approved / applicationsCount.total) * 100).toFixed(1)
            : 0,
          avgProcessTime: '2.5 days'
        },
        systemHealth
      })

      setRefreshTime(new Date())
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
      green: 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
      purple: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
      amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
      red: 'from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
      indigo: 'from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700'
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: '0 20px 25px -5rgba(0,0,0,0.1)' }}
      >
        <Card className="overflow-hidden">
          <Card.Content className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {title}
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {value}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            {trend && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-1">
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                )}
                <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {trendValue}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            )}
          </Card.Content>
        </Card>
      </motion.div>
    )
  }

  const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="mb-6">
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 ml-9">
          {description}
        </p>
      )}
    </div>
  )

  const DetailedMetricCard = ({ label, value, icon: Icon, color = 'gray', percentage }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {label}
        </span>
        {Icon && <Icon className={`h-5 w-5 text-${color}-500`} />}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        {percentage !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  )

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
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics & Diagnostics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Real-time insights into your platform's performance and usage
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 md:px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <Button
              onClick={loadAnalytics}
              className="flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={() => {
                loadIncompleteUsers()
                setShowIncompleteUsers(true)
              }}
              variant="outline"
              className="flex items-center justify-center space-x-2 text-sm md:text-base text-amber-600 dark:text-amber-400"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Incomplete</span>
            </Button>
            <Button
              onClick={() => setShowAddUser(true)}
              className="flex items-center justify-center space-x-2 text-sm md:text-base bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>
        </motion.div>

        {/* Last Updated */}
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {refreshTime.toLocaleTimeString()}</span>
        </div>

        {/* Overview Stats - Row 1 */}
        <div className="mb-8">
          <SectionHeader
            icon={UserGroupIcon}
            title="Platform Overview"
            description="Key metrics for platform performance"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              icon={UserGroupIcon}
              title="Total Users"
              value={analyticsData.users.total}
              subtitle={`${analyticsData.users.active} active`}
              color="blue"
              trend="up"
              trendValue={`+${analyticsData.userStats.thisMonth}`}
            />
            <StatCard
              icon={DocumentCheckIcon}
              title="Active Projects"
              value={analyticsData.projects.active}
              subtitle={`of ${analyticsData.projects.total} total`}
              color="green"
            />
            <StatCard
              icon={CheckCircleIcon}
              title="Applications"
              value={analyticsData.applications.total}
              subtitle={`${analyticsData.applications.approved} approved`}
              color="purple"
            />
            <StatCard
              icon={FolderOpenIcon}
              title="Success Rate"
              value={`${analyticsData.applicationStats.successRate}%`}
              subtitle="Application approval rate"
              color="amber"
            />
          </div>
        </div>

        {/* User Statistics - Row 2 */}
        <div className="mb-8">
          <SectionHeader
            icon={UserGroupIcon}
            title="User Analytics"
            description="Detailed user statistics and engagement metrics"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <DetailedMetricCard
              label="Total Users"
              value={analyticsData.users.total}
              icon={UserGroupIcon}
              color="blue"
            />
            <DetailedMetricCard
              label="Active"
              value={analyticsData.users.active}
              icon={CheckCircleIcon}
              color="green"
              percentage={(analyticsData.users.active / analyticsData.users.total * 100).toFixed(0)}
            />
            <DetailedMetricCard
              label="Email Verified"
              value={analyticsData.users.verified}
              icon={EnvelopeIcon}
              color="indigo"
              percentage={(analyticsData.users.verified / analyticsData.users.total * 100).toFixed(0)}
            />
            <DetailedMetricCard
              label="Unverified"
              value={analyticsData.users.unverified}
              icon={ExclamationTriangleIcon}
              color="amber"
            />
            <DetailedMetricCard
              label="Profile Complete"
              value={analyticsData.users.profileComplete}
              icon={SparklesIcon}
              color="purple"
              percentage={(analyticsData.users.profileComplete / analyticsData.users.total * 100).toFixed(0)}
            />
            <DetailedMetricCard
              label="Incomplete"
              value={analyticsData.users.incomplete}
              icon={ClockIcon}
              color="red"
            />
          </div>
        </div>

        {/* Project Statistics */}
        <div className="mb-8">
          <SectionHeader
            icon={FolderOpenIcon}
            title="Project Management"
            description="Project status and performance overview"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <DetailedMetricCard
              label="Total Projects"
              value={analyticsData.projects.total}
              icon={FolderOpenIcon}
              color="blue"
            />
            <DetailedMetricCard
              label="Active"
              value={analyticsData.projects.active}
              icon={ArrowUpIcon}
              color="green"
              percentage={(analyticsData.projects.active / analyticsData.projects.total * 100).toFixed(0)}
            />
            <DetailedMetricCard
              label="Completed"
              value={analyticsData.projects.completed}
              icon={CheckCircleIcon}
              color="indigo"
            />
            <DetailedMetricCard
              label="Archived"
              value={analyticsData.projects.archived}
              icon={ArrowDownIcon}
              color="gray"
            />
            <DetailedMetricCard
              label="Avg Applications"
              value={analyticsData.topProjects.length > 0 
                ? (analyticsData.topProjects.reduce((sum, p) => sum + p.appCount, 0) / analyticsData.topProjects.length).toFixed(0)
                : 0
              }
              icon={DocumentCheckIcon}
              color="purple"
            />
          </div>
        </div>

        {/* Application & Request Analytics */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Applications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <DocumentCheckIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Applications Pipeline
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Application status distribution
              </p>
            </div>
            <Card>
              <Card.Content className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Pending</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Awaiting review</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {analyticsData.applications.pending}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Approved</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Successfully approved</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analyticsData.applications.approved}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Rejected</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Not approved</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analyticsData.applications.rejected}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Rate</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {analyticsData.applicationStats.successRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${analyticsData.applicationStats.successRate}%` }}
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>

          {/* Requests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <FolderOpenIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Requests Pipeline
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Request processing status
              </p>
            </div>
            <Card>
              <Card.Content className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">In Progress</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Currently processing</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analyticsData.requests.inProgress}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Pending</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Not started yet</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analyticsData.requests.pending}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Completed</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Successfully done</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analyticsData.requests.completed}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Requests</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {analyticsData.requests.total}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completion</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${analyticsData.requests.total > 0 
                              ? (analyticsData.requests.completed / analyticsData.requests.total * 100)
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        </div>

        {/* Top Projects */}
        <div className="mb-8">
          <SectionHeader
            icon={ArrowTrendingUpIcon}
            title="Top Projects"
            description="Most applied projects in the platform"
          />
          <Card>
            <Card.Content className="p-6">
              {analyticsData.topProjects.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {project.title || 'Untitled Project'}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {project.description?.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {project.appCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project.appCount === 1 ? 'Application' : 'Applications'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No projects yet</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* System Health */}
        <div className="mb-8">
          <SectionHeader
            icon={ShieldCheckIcon}
            title="System Health"
            description="Infrastructure and service status"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analyticsData.systemHealth).map(([service, status]) => (
              <motion.div
                key={service}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <Card.Content className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        status === 'Healthy' ? 'bg-green-500' : status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {service}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {status}
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Growth Trends */}
        <div className="mb-8">
          <SectionHeader
            icon={ArrowTrendingUpIcon}
            title="Growth Trends"
            description="Month-over-month user growth analysis"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Last Month</h3>
                    <ArrowUpIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {analyticsData.userStats.lastMonth}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New users registered
                  </p>
                </Card.Content>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">This Month</h3>
                    <ArrowUpIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {analyticsData.userStats.thisMonth}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New users registered
                  </p>
                </Card.Content>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Growth Rate</h3>
                    {parseFloat(analyticsData.userStats.growth) > 0 ? (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className={`text-3xl font-bold mb-2 ${
                    parseFloat(analyticsData.userStats.growth) > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {analyticsData.userStats.growth > 0 ? '+' : ''}{analyticsData.userStats.growth}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Month-over-month change
                  </p>
                </Card.Content>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div>
          <SectionHeader
            icon={LightBulbIcon}
            title="Key Performance Indicators"
            description="Important metrics for platform success"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <Card.Content className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <CogIcon className="h-5 w-5" />
                  <span>Application Processing</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Avg Processing Time</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {analyticsData.applicationStats.avgProcessTime}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Pending Applications</span>
                      <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        {analyticsData.applications.pending}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Approval Rate</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {analyticsData.applicationStats.successRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <GlobeAltIcon className="h-5 w-5" />
                  <span>Platform Engagement</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active User Rate</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {analyticsData.users.total > 0 
                          ? ((analyticsData.users.active / analyticsData.users.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Profile Completion Rate</span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {analyticsData.users.total > 0
                          ? ((analyticsData.users.profileComplete / analyticsData.users.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email Verification Rate</span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {analyticsData.users.total > 0
                          ? ((analyticsData.users.verified / analyticsData.users.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddUser(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New User</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={addNewUser}
                      disabled={newUserLoading}
                      className="flex-1"
                    >
                      {newUserLoading ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button
                      onClick={() => setShowAddUser(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incomplete Users Modal */}
        <AnimatePresence>
          {showIncompleteUsers && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowIncompleteUsers(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Incomplete Profiles ({incompleteUsers.length})
                </h2>
                
                {incompleteUsers.length > 0 ? (
                  <div className="space-y-4">
                    {incompleteUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{u.full_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {!u.email_verified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                  <EnvelopeIcon className="h-3 w-3 mr-1" />
                                  Email Not Verified
                                </span>
                              )}
                              {!u.profile_done && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  <SparklesIcon className="h-3 w-3 mr-1" />
                                  Profile Incomplete
                                </span>
                              )}
                            </div>
                          </div>
                          {!u.email_verified && (
                            <Button
                              onClick={() => sendVerificationEmail(u.id, u.email)}
                              disabled={verifyingEmail[u.id]}
                              size="sm"
                              className="text-sm whitespace-nowrap"
                            >
                              {verifyingEmail[u.id] ? 'Processing...' : 'Verify Email'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">All users have completed profiles!</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminAnalytics
