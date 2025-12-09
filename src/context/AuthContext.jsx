// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import toast from 'react-hot-toast'

// Export AuthContext
export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [skipNextSignOut, setSkipNextSignOut] = useState(false) // Flag to prevent unwanted SIGNED_OUT events
  const [sessionRestorationInProgress, setSessionRestorationInProgress] = useState(false) // Track ongoing restoration

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check if there's a valid session in storage
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Session found, user:', session.user.id)
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          // Try to get the user (this will attempt token refresh)
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('Error getting user:', error)
            setInitializing(false)
            setLoading(false)
            return
          }

          if (user) {
            setUser(user)
            await loadUserProfile(user.id)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setInitializing(false)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)

          // Do not attempt DB writes here (may be blocked by RLS). Load profile
          // after a short delay to allow auth state to settle.
          setTimeout(async () => {
            await loadUserProfile(session.user.id)
          }, 500)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh - update user to maintain session
          console.log('Token refreshed for user:', session.user.id)
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          // Skip SIGNED_OUT events if:
          // 1. skipNextSignOut flag is set (admin operation in progress)
          // 2. Session restoration is in progress
          if (skipNextSignOut || sessionRestorationInProgress) {
            console.log('Ignoring SIGNED_OUT event (skipNextSignOut:', skipNextSignOut, ', restorationInProgress:', sessionRestorationInProgress, ')')
            setSkipNextSignOut(false)
            // Don't reset sessionRestorationInProgress here - let the component control its lifecycle
            return
          }
          
          console.log('Processing SIGNED_OUT event - clearing user and profile')
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe?.()
  }, [])

  // Session refresh effect - keeps session alive
  useEffect(() => {
    if (!user) return

    // Refresh token every 45 minutes (before 60 minute default expiry)
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Attempting session refresh...')
        const { data: { session }, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('Session refresh error:', error)
          return
        }

        if (session?.user) {
          console.log('Session refreshed successfully')
          setUser(session.user)
        }
      } catch (error) {
        console.error('Failed to refresh session:', error)
      }
    }, 45 * 60 * 1000) // 45 minutes

    return () => clearInterval(refreshInterval)
  }, [user])

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile for user:', userId)
          await createUserProfile(userId)
          return
        }
        console.warn('Falling back to temporary profile')
        await buildFallbackProfile(userId)
        return
      }

      console.log('Profile loaded successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Profile loading error:', error)
      // Use the passed userId parameter, not the state
      await buildFallbackProfile(userId)
    }
  }

  const createUserProfile = async (userId) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.error('No auth user found for profile creation')
        return
      }

      const profileData = {
        id: userId,
        full_name: authUser?.user_metadata?.full_name || 
                  authUser?.user_metadata?.name || 
                  authUser?.email?.split('@')[0] || 
                  'User',
        email: authUser?.email || '',
        role: 'user',
        status: 'active',
        email_verified: authUser?.email_confirmed_at ? true : false
      }

      console.log('Creating profile with data:', profileData)

      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        await buildFallbackProfile(userId)
        return
      }

      console.log('Profile created successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Profile creation error:', error)
      await buildFallbackProfile(userId)
    }
  }

  const buildFallbackProfile = async (userId) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.error('No auth user found, cannot build fallback profile')
        return
      }

      // Always use the provided userId or fall back to authUser.id
      const profileId = userId || authUser.id
      if (!profileId) return

      const fallback = {
        id: profileId,
        full_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
        email: authUser?.email || '',
        role: 'user',
        status: 'active',
        email_verified: !!authUser?.email_confirmed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('Using fallback profile:', fallback)
      setProfile(fallback)
    } catch (e) {
      console.error('Failed to build fallback profile:', e)
    }
  }

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      toast.success('Account created successfully! Please check your email to verify your account.')
      return { success: true, data }
    } catch (error) {
      toast.error('Failed to create account')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      toast.success('Welcome back!')
      return { success: true, data }
    } catch (error) {
      toast.error('Failed to sign in')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      toast.error('Failed to sign in with Google')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signout error:', error)
      }

      setUser(null)
      setProfile(null)
      
      toast.success('Signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
      return { success: true }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      toast.success('Password reset email sent!')
      return { success: true, data }
    } catch (error) {
      toast.error('Failed to send reset email')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      toast.success('Password updated successfully!')
      return { success: true, data }
    } catch (error) {
      toast.error('Failed to update password')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        if (error.code === '42P17' || error.message?.toLowerCase?.().includes('infinite recursion')) {
          console.warn('RLS error during profile update, updating fallback profile')
          const updatedFallback = { ...profile, ...updates }
          setProfile(updatedFallback)
          toast.success('Profile updated locally (database sync pending)')
          return { success: true, data: updatedFallback }
        }
        
        toast.error(error.message)
        return { success: false, error }
      }

      setProfile(data)
      toast.success('Profile updated successfully!')
      return { success: true, data }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (requiredRole) => {
    if (!profile) return false
    
    const roleHierarchy = {
      'user': 1,
      'mentor': 2,
      'reviewer': 3,
      'admin': 4,
      'superadmin': 5
    }

    const userRoleLevel = roleHierarchy[profile.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0

    return userRoleLevel >= requiredRoleLevel
  }

  // Add the missing isActive function
  const isActive = () => {
    return profile?.status === 'active'
  }

  const value = {
    user,
    profile,
    loading,
    initializing,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    isActive, // Include the isActive function
    setSkipNextSignOut, // Expose flag setter for admin operations
    setSessionRestorationInProgress, // Expose restoration flag
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('superadmin'),
    isMentor: hasRole('mentor'),
    isReviewer: hasRole('reviewer')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}