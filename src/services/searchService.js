// src/services/searchService.js
import { supabase } from './supabaseClient'

export const searchService = {
  // Search everything
  async searchAll(query) {
    if (!query || query.length < 2) {
      return { users: [], projects: [], applications: [], notifications: [], settings: [], analytics: [] }
    }

    const searchQuery = query.toLowerCase()

    try {
      // Parallel searches
      const [usersRes, projectsRes, applicationsRes, notificationsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, email, role, created_at')
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5),
        
        supabase
          .from('projects')
          .select('id, title, summary, published, created_at')
          .or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
          .limit(5),
        
        supabase
          .from('project_requests')
          .select('id, title, status, created_at, users(full_name, email)')
          .or(`title.ilike.%${searchQuery}%`)
          .limit(5),
        
        supabase
          .from('notifications')
          .select('id, title, message, type, read, created_at')
          .or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
          .limit(5)
      ])

      return {
        users: usersRes.data || [],
        projects: projectsRes.data || [],
        applications: applicationsRes.data || [],
        notifications: notificationsRes.data || [],
        settings: [], // Settings are static, no need to search DB
        analytics: []
      }
    } catch (error) {
      console.error('Search error:', error)
      return { users: [], projects: [], applications: [], notifications: [], settings: [], analytics: [] }
    }
  },

  // Search users
  async searchUsers(query) {
    if (!query || query.length < 2) return []
    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)
      return data || []
    } catch (error) {
      console.error('User search error:', error)
      return []
    }
  },

  // Search projects
  async searchProjects(query) {
    if (!query || query.length < 2) return []
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, title, summary, published, created_at')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(10)
      return data || []
    } catch (error) {
      console.error('Project search error:', error)
      return []
    }
  },

  // Search applications
  async searchApplications(query) {
    if (!query || query.length < 2) return []
    try {
      const { data } = await supabase
        .from('project_requests')
        .select('id, title, status, created_at, users(full_name, email)')
        .or(`title.ilike.%${query}%`)
        .limit(10)
      return data || []
    } catch (error) {
      console.error('Application search error:', error)
      return []
    }
  },

  // Search notifications
  async searchNotifications(query) {
    if (!query || query.length < 2) return []
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, type, read, created_at')
        .or(`title.ilike.%${query}%,message.ilike.%${query}%`)
        .limit(10)
      return data || []
    } catch (error) {
      console.error('Notification search error:', error)
      return []
    }
  },

  // Search in local settings data
  searchSettings(query, settingsData) {
    if (!query || query.length < 2) return []

    const searchQuery = query.toLowerCase()
    const results = []

    // Search through settings keys and values
    Object.entries(settingsData).forEach(([key, value]) => {
      if (key.toLowerCase().includes(searchQuery) || String(value).toLowerCase().includes(searchQuery)) {
        results.push({
          id: key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value,
          type: typeof value === 'boolean' ? 'toggle' : 'setting'
        })
      }
    })

    return results.slice(0, 5)
  }
}
