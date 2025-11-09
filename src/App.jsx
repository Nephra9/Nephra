// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import AdminLayout from './components/Layout/AdminLayout'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Projects from './pages/Projects/ProjectsList'
import ProjectDetail from './pages/Projects/ProjectDetail'
import ProjectApplyForm from './pages/Projects/ProjectApplyForm'
import Team from './pages/Team'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

// Auth Pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import AuthCallback from './pages/Auth/AuthCallback'

// User Pages
import UserDashboard from './pages/User/Dashboard'
import UserProfile from './pages/User/Profile'
import UserApplications from './pages/User/Applications'
import MyApplications from './pages/User/MyApplications'

// Project Pages
import ProjectRegistration from './pages/Projects/ProjectRegistration'

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard'
import AdminProjects from './pages/Admin/Projects'
import AdminUsers from './pages/Admin/Users'
import AdminApplications from './pages/Admin/Applications'
import AdminAnalytics from './pages/Admin/Analytics'
import AdminSettings from './pages/Admin/Settings'
import ProjectManagement from './pages/Admin/ProjectManagement'
import AdminAuditLogs from './pages/Admin/AuditLogs'
import AdminNotifications from './pages/Admin/Notifications'
import AdminDataMigration from './pages/Admin/DataMigration'

// Error Pages
import NotFound from './pages/NotFound'

// Fixed Protected Route Component
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isAuthenticated, hasRole, loading, profile, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  // If user is authenticated but profile is still loading, show loading
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Setting up your profile...
          </p>
        </div>
      </div>
    )
  }

  // FIXED: Check active status directly
  if (profile && profile.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Account Inactive
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {profile.status === 'suspended'
              ? 'Your account has been suspended. Please contact support.'
              : 'Your account is inactive. Please contact support to reactivate.'
            }
          </p>
        </div>
      </div>
    )
  }

  // Check role permissions
  if (profile && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
            {requiredRole && requiredRole !== 'user' && ` Required role: ${requiredRole}`}
          </p>
        </div>
      </div>
    )
  }

  return children
}

// Public Route Component (redirects if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Page Transition Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
)

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={
          <PageTransition>
            <Home />
          </PageTransition>
        } />
        <Route path="about" element={
          <PageTransition>
            <About />
          </PageTransition>
        } />
        <Route path="projects" element={
          <PageTransition>
            <Projects />
          </PageTransition>
        } />
        <Route path="projects/:id" element={
          <PageTransition>
            <ProjectDetail />
          </PageTransition>
        } />
        <Route
          path="projects/:id/apply"
          element={
            <PageTransition>
              <ProjectApplyForm />
            </PageTransition>
          }
        />

        <Route path="team" element={
          <PageTransition>
            <Team />
          </PageTransition>
        } />
        <Route path="contact" element={
          <PageTransition>
            <Contact />
          </PageTransition>
        } />
        <Route path="privacy" element={
          <PageTransition>
            <Privacy />
          </PageTransition>
        } />
        <Route path="terms" element={
          <PageTransition>
            <Terms />
          </PageTransition>
        } />
      </Route>

      {/* Auth Routes */}
      <Route path="/auth" element={<PublicRoute><Layout /></PublicRoute>}>
        <Route path="login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="signup" element={
          <PageTransition>
            <Signup />
          </PageTransition>
        } />
        <Route path="forgot-password" element={
          <PageTransition>
            <ForgotPassword />
          </PageTransition>
        } />
        <Route path="reset-password" element={
          <PageTransition>
            <ResetPassword />
          </PageTransition>
        } />
        <Route path="callback" element={<AuthCallback />} />
      </Route>

      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="user">
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <PageTransition>
            <UserDashboard />
          </PageTransition>
        } />
        <Route path="profile" element={
          <PageTransition>
            <UserProfile />
          </PageTransition>
        } />
        <Route path="applications" element={
          <PageTransition>
            <UserApplications />
          </PageTransition>
        } />
        <Route path="my-applications" element={
          <PageTransition>
            <MyApplications />
          </PageTransition>
        } />
      </Route>

      {/* Project Routes */}
      <Route path="/projects" element={<Layout />}>
        <Route path="register" element={
          <ProtectedRoute requiredRole="user">
            <PageTransition>
              <ProjectRegistration />
            </PageTransition>
          </ProtectedRoute>
        } />
      </Route>

      {/* Admin Routes - Using AdminLayout for separate admin interface */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={
          <PageTransition>
            <AdminDashboard />
          </PageTransition>
        } />
        <Route path="projects" element={
          <PageTransition>
            <AdminProjects />
          </PageTransition>
        } />
        <Route path="users" element={
          <PageTransition>
            <AdminUsers />
          </PageTransition>
        } />
        <Route path="applications" element={
          <PageTransition>
            <AdminApplications />
          </PageTransition>
        } />
        <Route path="analytics" element={
          <PageTransition>
            <AdminAnalytics />
          </PageTransition>
        } />
        <Route path="settings" element={
          <PageTransition>
            <AdminSettings />
          </PageTransition>
        } />
        <Route path="project-management" element={
          <PageTransition>
            <ProjectManagement />
          </PageTransition>
        } />
        <Route path="audit-logs" element={
          <PageTransition>
            <AdminAuditLogs />
          </PageTransition>
        } />
        <Route path="notifications" element={
          <PageTransition>
            <AdminNotifications />
          </PageTransition>
        } />
        <Route path="data-migration" element={
          <PageTransition>
            <AdminDataMigration />
          </PageTransition>
        } />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={
        <Layout>
          <PageTransition>
            <NotFound />
          </PageTransition>
        </Layout>
      } />
    </Routes>
  )
}

export default App