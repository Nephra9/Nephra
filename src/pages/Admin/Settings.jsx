import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { supabase } from '../../services/supabaseClient'
import { useSettings } from '../../context/SettingsContext'
import { imageUploadService } from '../../services/imageUploadService'
import toast from 'react-hot-toast'
import { 
  Cog6ToothIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  EnvelopeIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ServerIcon,
  ChartBarIcon,
  KeyIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const AdminSettings = () => {
  const { settings: globalSettings, refreshSettings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
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

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'access', name: 'Access & Registration', icon: UserGroupIcon },
    { id: 'projects', name: 'Projects', icon: DocumentTextIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'storage', name: 'Storage', icon: CloudArrowUpIcon },
    { id: 'performance', name: 'Performance', icon: ChartBarIcon },
    { id: 'advanced', name: 'Advanced', icon: ServerIcon }
  ]

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('system_settings').select('*').limit(1).single()
        if (!error && data) {
          setSettings(prev => ({ ...prev, ...data }))
        }
      } catch (err) {
        console.warn('Could not load system settings from DB:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // First, try to get the existing settings row
      const { data: existingSettings, error: fetchError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .single()

      const payload = {
        ...settings,
        updated_at: new Date().toISOString()
      }

      let result
      if (existingSettings?.id) {
        // Update existing settings
        result = await supabase
          .from('system_settings')
          .update(payload)
          .eq('id', existingSettings.id)
          .select()
          .single()
      } else {
        // Insert new settings (shouldn't happen often due to singleton)
        result = await supabase
          .from('system_settings')
          .insert(payload)
          .select()
          .single()
      }

      const { data, error } = result
      if (error) throw error
      
      toast.success('Settings saved successfully')
      setSettings((s) => ({ ...s, ...data }))
      
      // Refresh global settings to apply changes immediately
      await refreshSettings()
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Failed to save settings: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const url = await imageUploadService.uploadImage(file, 'branding/logos')
      updateSetting('custom_logo_url', url)
      toast.success('Logo uploaded successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFavicon(true)
      const url = await imageUploadService.uploadImage(file, 'branding/favicons')
      updateSetting('custom_favicon_url', url)
      toast.success('Favicon uploaded successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to upload favicon')
    } finally {
      setUploadingFavicon(false)
    }
  }

  const SettingField = ({ label, description, children }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="mt-2">{children}</div>
    </div>
  )

  const Toggle = ({ checked, onChange, label, description }) => (
    <label className="flex items-start space-x-3 cursor-pointer group">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  )

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingField 
        label="Site Title" 
        description="The name of your platform displayed across the site"
      >
        <input
          type="text"
          value={settings.site_title}
          onChange={(e) => updateSetting('site_title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </SettingField>

      <SettingField 
        label="Site Description" 
        description="Brief description of your platform for SEO and social sharing"
      >
        <textarea
          value={settings.site_description}
          onChange={(e) => updateSetting('site_description', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </SettingField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField label="Site URL" description="Your platform's primary URL">
          <input
            type="url"
            value={settings.site_url}
            onChange={(e) => updateSetting('site_url', e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField label="Admin Email" description="Primary admin contact email">
          <input
            type="email"
            value={settings.admin_email}
            onChange={(e) => updateSetting('admin_email', e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField label="Contact Email" description="Public contact email">
          <input
            type="email"
            value={settings.contact_email}
            onChange={(e) => updateSetting('contact_email', e.target.value)}
            placeholder="contact@example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField label="Support Email" description="Support email for users">
          <input
            type="email"
            value={settings.support_email}
            onChange={(e) => updateSetting('support_email', e.target.value)}
            placeholder="support@example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      </div>
    </div>
  )

  const renderAccessSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Toggle
          checked={settings.registration_open}
          onChange={(val) => updateSetting('registration_open', val)}
          label="Allow User Registration"
          description="Enable new users to register on the platform"
        />
        
        <Toggle
          checked={settings.require_email_verification}
          onChange={(val) => updateSetting('require_email_verification', val)}
          label="Require Email Verification"
          description="Users must verify their email before accessing the platform"
        />
        
        <Toggle
          checked={settings.allow_social_login}
          onChange={(val) => updateSetting('allow_social_login', val)}
          label="Allow Social Login"
          description="Enable login via Google, GitHub, etc."
        />
        
        <Toggle
          checked={settings.auto_approve_users}
          onChange={(val) => updateSetting('auto_approve_users', val)}
          label="Auto-Approve Users"
          description="Automatically approve new user registrations without admin review"
        />
      </div>
    </div>
  )

  const renderProjectSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Toggle
          checked={settings.require_project_approval}
          onChange={(val) => updateSetting('require_project_approval', val)}
          label="Require Project Approval"
          description="Projects must be approved by admin before being published"
        />
        
        <Toggle
          checked={settings.allow_project_comments}
          onChange={(val) => updateSetting('allow_project_comments', val)}
          label="Allow Project Comments"
          description="Enable users to comment on projects"
        />
        
        <Toggle
          checked={settings.allow_project_ratings}
          onChange={(val) => updateSetting('allow_project_ratings', val)}
          label="Allow Project Ratings"
          description="Enable users to rate projects"
        />
        
        <Toggle
          checked={settings.project_auto_publish}
          onChange={(val) => updateSetting('project_auto_publish', val)}
          label="Auto-Publish Projects"
          description="Automatically publish approved projects"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Max Projects Per User" 
          description="Maximum number of projects a user can create"
        >
          <input
            type="number"
            min="1"
            max="100"
            value={settings.max_projects_per_user}
            onChange={(e) => updateSetting('max_projects_per_user', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="Max Applications Per User" 
          description="Maximum number of applications a user can submit"
        >
          <input
            type="number"
            min="1"
            max="50"
            value={settings.max_applications_per_user}
            onChange={(e) => updateSetting('max_applications_per_user', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="Application Review Period (Days)" 
          description="Days before applications are auto-archived"
        >
          <input
            type="number"
            min="1"
            max="365"
            value={settings.application_review_period_days}
            onChange={(e) => updateSetting('application_review_period_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      </div>

      <div className="space-y-4">
        <Toggle
          checked={settings.auto_reject_incomplete}
          onChange={(val) => updateSetting('auto_reject_incomplete', val)}
          label="Auto-Reject Incomplete Applications"
          description="Automatically reject applications missing required information"
        />
        
        <Toggle
          checked={settings.require_application_documents}
          onChange={(val) => updateSetting('require_application_documents', val)}
          label="Require Application Documents"
          description="Users must upload supporting documents with applications"
        />
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Toggle
          checked={settings.email_notifications_enabled}
          onChange={(val) => updateSetting('email_notifications_enabled', val)}
          label="Enable Email Notifications"
          description="Send email notifications for important events"
        />
        
        <Toggle
          checked={settings.notify_new_user}
          onChange={(val) => updateSetting('notify_new_user', val)}
          label="Notify on New User Registration"
          description="Send email when a new user registers"
        />
        
        <Toggle
          checked={settings.notify_new_project}
          onChange={(val) => updateSetting('notify_new_project', val)}
          label="Notify on New Project"
          description="Send email when a new project is created"
        />
        
        <Toggle
          checked={settings.notify_new_application}
          onChange={(val) => updateSetting('notify_new_application', val)}
          label="Notify on New Application"
          description="Send email when a new application is submitted"
        />
        
        <Toggle
          checked={settings.notify_status_change}
          onChange={(val) => updateSetting('notify_status_change', val)}
          label="Notify on Status Changes"
          description="Send email when application/project status changes"
        />
      </div>

      <SettingField 
        label="Email Digest Frequency" 
        description="How often to send email digests"
      >
        <select
          value={settings.email_digest_frequency}
          onChange={(e) => updateSetting('email_digest_frequency', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="realtime">Real-time</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="never">Never</option>
        </select>
      </SettingField>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Session Timeout (Minutes)" 
          description="Auto-logout after inactivity"
        >
          <input
            type="number"
            min="5"
            max="1440"
            value={settings.session_timeout_minutes}
            onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="Max Login Attempts" 
          description="Block after failed login attempts"
        >
          <input
            type="number"
            min="3"
            max="10"
            value={settings.max_login_attempts}
            onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="Minimum Password Length" 
          description="Required password length"
        >
          <input
            type="number"
            min="6"
            max="32"
            value={settings.password_min_length}
            onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      </div>

      <div className="space-y-4">
        <Toggle
          checked={settings.require_strong_password}
          onChange={(val) => updateSetting('require_strong_password', val)}
          label="Require Strong Passwords"
          description="Passwords must include uppercase, lowercase, numbers, and symbols"
        />
        
        <Toggle
          checked={settings.enable_2fa}
          onChange={(val) => updateSetting('enable_2fa', val)}
          label="Enable Two-Factor Authentication"
          description="Allow users to enable 2FA for enhanced security"
        />
        
        <Toggle
          checked={settings.ip_whitelist_enabled}
          onChange={(val) => updateSetting('ip_whitelist_enabled', val)}
          label="Enable IP Whitelist"
          description="Restrict admin access to specific IP addresses"
        />
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <SettingField 
        label="Theme Mode" 
        description="Default theme for the platform"
      >
        <select
          value={settings.theme_mode}
          onChange={(e) => updateSetting('theme_mode', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System Default</option>
        </select>
      </SettingField>

      <SettingField 
        label="Primary Color" 
        description="Main brand color for the platform"
      >
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={settings.primary_color}
            onChange={(e) => updateSetting('primary_color', e.target.value)}
            className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={settings.primary_color}
            onChange={(e) => updateSetting('primary_color', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </SettingField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Custom Logo" 
          description="Upload your custom logo image (JPG, PNG, GIF, WebP, SVG - Max 5MB)"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="flex-1 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="sr-only"
                />
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-50">
                  <PhotoIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadingLogo ? 'Uploading...' : 'Choose Logo Image'}
                  </span>
                </div>
              </label>
            </div>
            {settings.custom_logo_url && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <img src={settings.custom_logo_url} alt="Logo preview" className="h-10 w-auto" />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">{settings.custom_logo_url}</span>
                <button
                  onClick={() => updateSetting('custom_logo_url', '')}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </SettingField>

        <SettingField 
          label="Custom Favicon" 
          description="Upload your custom favicon image (ICO, PNG, SVG - Max 5MB)"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="flex-1 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  disabled={uploadingFavicon}
                  className="sr-only"
                />
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors disabled:opacity-50">
                  <PhotoIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadingFavicon ? 'Uploading...' : 'Choose Favicon Image'}
                  </span>
                </div>
              </label>
            </div>
            {settings.custom_favicon_url && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <img src={settings.custom_favicon_url} alt="Favicon preview" className="h-5 w-5" />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">{settings.custom_favicon_url}</span>
                <button
                  onClick={() => updateSetting('custom_favicon_url', '')}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </SettingField>
      </div>

      <Toggle
        checked={settings.enable_dark_mode}
        onChange={(val) => updateSetting('enable_dark_mode', val)}
        label="Enable Dark Mode Toggle"
        description="Allow users to switch between light and dark themes"
      />
    </div>
  )

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Email settings are managed through Supabase Auth configuration. Update SMTP settings in your Supabase project dashboard.
        </p>
      </div>

      <SettingField 
        label="From Email Address" 
        description="Email address used for sending notifications"
      >
        <input
          type="email"
          value={settings.admin_email}
          onChange={(e) => updateSetting('admin_email', e.target.value)}
          placeholder="noreply@example.com"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </SettingField>
    </div>
  )

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Max File Size (MB)" 
          description="Maximum upload file size"
        >
          <input
            type="number"
            min="1"
            max="100"
            value={settings.max_file_size_mb}
            onChange={(e) => updateSetting('max_file_size_mb', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="Storage Limit (GB)" 
          description="Total storage quota"
        >
          <input
            type="number"
            min="1"
            max="1000"
            value={settings.storage_limit_gb}
            onChange={(e) => updateSetting('storage_limit_gb', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      </div>

      <SettingField 
        label="Allowed File Types" 
        description="Comma-separated list of allowed file extensions"
      >
        <input
          type="text"
          value={settings.allowed_file_types}
          onChange={(e) => updateSetting('allowed_file_types', e.target.value)}
          placeholder="pdf,doc,docx,jpg,png,jpeg"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </SettingField>
    </div>
  )

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Toggle
          checked={settings.cache_enabled}
          onChange={(val) => updateSetting('cache_enabled', val)}
          label="Enable Caching"
          description="Cache database queries and API responses for better performance"
        />
        
        <Toggle
          checked={settings.lazy_load_images}
          onChange={(val) => updateSetting('lazy_load_images', val)}
          label="Lazy Load Images"
          description="Load images only when they appear in viewport"
        />
        
        <Toggle
          checked={settings.compress_responses}
          onChange={(val) => updateSetting('compress_responses', val)}
          label="Compress Responses"
          description="Compress API responses to reduce bandwidth usage"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Cache Duration (Minutes)" 
          description="How long to cache data"
        >
          <input
            type="number"
            min="1"
            max="1440"
            value={settings.cache_duration_minutes}
            onChange={(e) => updateSetting('cache_duration_minutes', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        <SettingField 
          label="API Rate Limit" 
          description="Requests per minute per user"
        >
          <input
            type="number"
            min="10"
            max="1000"
            value={settings.api_rate_limit}
            onChange={(e) => updateSetting('api_rate_limit', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>⚠️ Warning:</strong> Advanced settings can affect platform stability. Change only if you know what you're doing.
        </p>
      </div>

      <div className="space-y-4">
        <Toggle
          checked={settings.maintenance_mode}
          onChange={(val) => updateSetting('maintenance_mode', val)}
          label="Maintenance Mode"
          description="Temporarily disable public access to the platform"
        />
        
        <Toggle
          checked={settings.debug}
          onChange={(val) => updateSetting('debug', val)}
          label="Debug Mode"
          description="Enable verbose logging for troubleshooting"
        />
        
        <Toggle
          checked={settings.error_reporting}
          onChange={(val) => updateSetting('error_reporting', val)}
          label="Error Reporting"
          description="Send error reports to admin email"
        />
        
        <Toggle
          checked={settings.analytics_enabled}
          onChange={(val) => updateSetting('analytics_enabled', val)}
          label="Enable Analytics"
          description="Track user behavior and platform usage"
        />
        
        <Toggle
          checked={settings.track_page_views}
          onChange={(val) => updateSetting('track_page_views', val)}
          label="Track Page Views"
          description="Record page view analytics"
        />
        
        <Toggle
          checked={settings.track_user_events}
          onChange={(val) => updateSetting('track_user_events', val)}
          label="Track User Events"
          description="Record user interaction events"
        />
        
        <Toggle
          checked={settings.enable_profanity_filter}
          onChange={(val) => updateSetting('enable_profanity_filter', val)}
          label="Enable Profanity Filter"
          description="Automatically filter inappropriate content"
        />
        
        <Toggle
          checked={settings.auto_moderate_content}
          onChange={(val) => updateSetting('auto_moderate_content', val)}
          label="Auto-Moderate Content"
          description="Automatically review and flag suspicious content"
        />
        
        <Toggle
          checked={settings.enable_webhooks}
          onChange={(val) => updateSetting('enable_webhooks', val)}
          label="Enable Webhooks"
          description="Send event notifications to external URLs"
        />
      </div>

      {settings.maintenance_mode && (
        <SettingField 
          label="Maintenance Message" 
          description="Message shown to users during maintenance"
        >
          <textarea
            value={settings.maintenance_message}
            onChange={(e) => updateSetting('maintenance_message', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField 
          label="Data Retention (Days)" 
          description="How long to keep analytics data"
        >
          <input
            type="number"
            min="7"
            max="365"
            value={settings.data_retention_days}
            onChange={(e) => updateSetting('data_retention_days', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </SettingField>

        {settings.enable_webhooks && (
          <SettingField 
            label="Webhook URL" 
            description="URL to receive webhook events"
          >
            <input
              type="url"
              value={settings.webhook_url}
              onChange={(e) => updateSetting('webhook_url', e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </SettingField>
        )}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings()
      case 'access': return renderAccessSettings()
      case 'projects': return renderProjectSettings()
      case 'notifications': return renderNotificationSettings()
      case 'security': return renderSecuritySettings()
      case 'appearance': return renderAppearanceSettings()
      case 'email': return renderEmailSettings()
      case 'storage': return renderStorageSettings()
      case 'performance': return renderPerformanceSettings()
      case 'advanced': return renderAdvancedSettings()
      default: return null
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your platform settings and preferences
            </p>
            
            {/* Active Settings Indicator */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <PaintBrushIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Theme Mode</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 capitalize">{globalSettings.theme_mode || 'System'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Dark Mode</p>
                  <p className="text-sm text-green-800 dark:text-green-200">{globalSettings.enable_dark_mode ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Registration</p>
                  <p className="text-sm text-purple-800 dark:text-purple-200">{globalSettings.registration_open ? 'Open' : 'Closed'}</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <LoadingSpinner size="lg" text="Loading settings..." />
              </Card.Content>
            </Card>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <Card className="sticky top-6">
                  <Card.Content className="p-4">
                    <nav className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{tab.name}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </Card.Content>
                </Card>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <Card>
                  <Card.Content className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {tabs.find(t => t.id === activeTab)?.name}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your {tabs.find(t => t.id === activeTab)?.name.toLowerCase()} settings
                      </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      {renderTabContent()}
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-sm">
                        {saving ? (
                          <span className="text-gray-500 dark:text-gray-400">Saving changes...</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              <span className="text-gray-500 dark:text-gray-400">Changes are saved to the database</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Settings are applied in real-time across the platform
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => window.location.reload()}
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={handleSave}
                          loading={saving}
                          disabled={saving}
                          className="flex items-center space-x-2"
                        >
                          <CheckIcon className="h-4 w-4" />
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminSettings
