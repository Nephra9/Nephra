import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // General Settings
    site_title: 'Nephra',
    site_description: 'Project Management Platform',
    site_url: '',
    admin_email: '',
    contact_email: '',
    support_email: '',
    
    // Registration & Access
    registration_open: true,
    require_email_verification: true,
    allow_social_login: false,
    auto_approve_users: false,
    
    // Projects
    require_project_approval: true,
    max_projects_per_user: 10,
    allow_project_comments: true,
    allow_project_ratings: false,
    project_auto_publish: false,
    
    // Applications
    max_applications_per_user: 5,
    application_review_period_days: 30,
    auto_reject_incomplete: false,
    require_application_documents: true,
    
    // Email Notifications
    email_notifications_enabled: true,
    notify_new_user: true,
    notify_new_project: true,
    notify_new_application: true,
    notify_status_change: true,
    email_digest_frequency: 'daily',
    
    // Security
    session_timeout_minutes: 480,
    max_login_attempts: 5,
    password_min_length: 8,
    require_strong_password: true,
    enable_2fa: false,
    ip_whitelist_enabled: false,
    
    // Appearance
    theme_mode: 'system',
    primary_color: '#3B82F6',
    enable_dark_mode: true,
    custom_logo_url: '',
    custom_favicon_url: '',
    
    // Maintenance
    maintenance_mode: false,
    maintenance_message: 'We are currently performing maintenance. Please check back soon.',
    debug: false,
    error_reporting: true,
    
    // Analytics
    analytics_enabled: true,
    track_page_views: true,
    track_user_events: true,
    data_retention_days: 90,
    
    // Storage
    max_file_size_mb: 10,
    allowed_file_types: 'pdf,doc,docx,jpg,png,jpeg',
    storage_limit_gb: 100,
    
    // API & Integrations
    api_rate_limit: 100,
    webhook_url: '',
    enable_webhooks: false,
    
    // Content Moderation
    enable_profanity_filter: true,
    auto_moderate_content: false,
    require_admin_review: true,
    
    // Performance
    cache_enabled: true,
    cache_duration_minutes: 60,
    lazy_load_images: true,
    compress_responses: true
  })

  const [loading, setLoading] = useState(true)

  // Load settings from database
  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        setSettings(prev => ({ ...prev, ...data }))
        
        // Apply theme settings immediately
        applyThemeSettings(data)
        
        // Apply primary color
        if (data.primary_color) {
          applyPrimaryColor(data.primary_color)
        }
        
        // Apply custom logo/favicon
        if (data.custom_logo_url || data.custom_favicon_url) {
          applyCustomBranding(data)
        }
        
        // Update document title
        if (data.site_title) {
          document.title = data.site_title
        }
      }
    } catch (err) {
      console.warn('Could not load system settings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply theme settings
  const applyThemeSettings = (settings) => {
    const html = document.documentElement
    
    // Store enable_dark_mode in localStorage for ThemeContext to check
    localStorage.setItem('enable_dark_mode', settings.enable_dark_mode)
    
    if (!settings.enable_dark_mode) {
      // Force light mode if dark mode is disabled
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      // Apply theme based on theme_mode setting
      switch (settings.theme_mode) {
        case 'light':
          html.classList.remove('dark')
          localStorage.setItem('theme', 'light')
          break
        case 'dark':
          html.classList.add('dark')
          localStorage.setItem('theme', 'dark')
          break
        case 'system':
        default:
          // Use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            html.classList.add('dark')
          } else {
            html.classList.remove('dark')
          }
          localStorage.setItem('theme', 'system')
          break
      }
    }
  }

  // Apply primary color
  const applyPrimaryColor = (color) => {
    const root = document.documentElement
    
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Set CSS custom properties
    root.style.setProperty('--color-primary', `${r} ${g} ${b}`)
    root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`)
    
    // Update Tailwind blue color classes dynamically
    const style = document.createElement('style')
    style.id = 'dynamic-primary-color'
    
    // Remove existing dynamic style if present
    const existing = document.getElementById('dynamic-primary-color')
    if (existing) {
      existing.remove()
    }
    
    style.textContent = `
      :root {
        --tw-color-primary-50: ${lighten(color, 95)};
        --tw-color-primary-100: ${lighten(color, 90)};
        --tw-color-primary-200: ${lighten(color, 80)};
        --tw-color-primary-300: ${lighten(color, 60)};
        --tw-color-primary-400: ${lighten(color, 40)};
        --tw-color-primary-500: ${color};
        --tw-color-primary-600: ${darken(color, 10)};
        --tw-color-primary-700: ${darken(color, 20)};
        --tw-color-primary-800: ${darken(color, 30)};
        --tw-color-primary-900: ${darken(color, 40)};
      }
      
      .bg-blue-600, .bg-primary-600 {
        background-color: ${color} !important;
      }
      
      .hover\\:bg-blue-700:hover, .hover\\:bg-primary-700:hover {
        background-color: ${darken(color, 10)} !important;
      }
      
      .text-blue-600, .text-primary-600 {
        color: ${color} !important;
      }
      
      .border-blue-600, .border-primary-600 {
        border-color: ${color} !important;
      }
      
      .ring-blue-500 {
        --tw-ring-color: ${color} !important;
      }
      
      .focus\\:ring-blue-500:focus {
        --tw-ring-color: ${color} !important;
      }
    `
    
    document.head.appendChild(style)
  }

  // Helper functions for color manipulation
  const lighten = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }

  const darken = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0))
      .toString(16).slice(1)
  }

  // Apply custom branding
  const applyCustomBranding = (settings) => {
    // Update favicon
    if (settings.custom_favicon_url) {
      let favicon = document.querySelector("link[rel*='icon']")
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = settings.custom_favicon_url
    }
    
    // Store custom logo URL for components to use
    if (settings.custom_logo_url) {
      localStorage.setItem('custom_logo_url', settings.custom_logo_url)
    } else {
      localStorage.removeItem('custom_logo_url')
    }
    
    // Update page title if site_title is provided
    if (settings.site_title) {
      document.title = settings.site_title
    }
  }

  // Refresh settings (call this after updating settings in admin panel)
  const refreshSettings = async () => {
    await loadSettings()
  }

  useEffect(() => {
    loadSettings()

    // Subscribe to settings changes
    const subscription = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'system_settings' 
        }, 
        (payload) => {
          console.log('Settings changed:', payload)
          if (payload.new) {
            setSettings(prev => ({ ...prev, ...payload.new }))
            applyThemeSettings(payload.new)
            if (payload.new.primary_color) {
              applyPrimaryColor(payload.new.primary_color)
            }
            if (payload.new.custom_logo_url || payload.new.custom_favicon_url) {
              applyCustomBranding(payload.new)
            }
            if (payload.new.site_title) {
              document.title = payload.new.site_title
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    settings,
    loading,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
