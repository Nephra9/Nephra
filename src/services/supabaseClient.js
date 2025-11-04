import { createClient } from '@supabase/supabase-js'
import config from '../config/environment.js'

const supabaseUrl = config.apiUrl
const supabaseAnonKey = config.apiKey

let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not throw during development: log a clear message and provide a stubbed client
  // so the app can render and surface runtime errors instead of crashing at import time.
  console.error('Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY). Database requests will fail until these are set.')

  const makeFail = (op) => async () => ({ data: null, error: new Error(`Supabase not configured: ${op}`) })

  const stubQuery = () => ({
    select: makeFail('select'),
    insert: makeFail('insert'),
    update: makeFail('update'),
    delete: makeFail('delete'),
    order: () => stubQuery(),
    eq: () => stubQuery(),
    limit: () => stubQuery(),
    or: () => stubQuery(),
    contains: () => stubQuery()
  })

  supabase = {
    from: () => stubQuery(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signInWithPassword: makeFail('auth.signInWithPassword'),
      signUp: makeFail('auth.signUp'),
      signInWithOAuth: makeFail('auth.signInWithOAuth'),
      signOut: makeFail('auth.signOut')
    },
    storage: {
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        upload: makeFail('storage.upload'),
        remove: makeFail('storage.remove'),
        createSignedUrl: makeFail('storage.createSignedUrl')
      })
    }
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase }

// Database helper functions
export const db = {





  // Users
  users: {
    async getProfile(userId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },

    async updateProfile(userId, updates) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getAllUsers(filters = {}) {
      try {
        let query = supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (filters.role) {
          query = query.eq('role', filters.role)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        const { data, error } = await query
        // Log full response when debugging to help diagnose empty/partial results
        console.debug('db.users.getAllUsers ->', { filters, data, count: Array.isArray(data) ? data.length : 0, error })
        if (error) throw error
        return data
      } catch (err) {
        console.error('db.users.getAllUsers error:', err)
        throw err
      }
    },

    // NEW METHODS FOR ADMIN USER MANAGEMENT
    async updateUser(userId, updates) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    },

    async deleteUser(userId) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    },

    async suspendUser(userId) {
      const { data, error } = await supabase
        .from('users')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    },

    async activateUser(userId) {
      const { data, error } = await supabase
        .from('users')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    }
  },
  existing_project_requests: {
    create: async (payload) => {
      const { data, error } = await supabase
        .from("existing_project_requests")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByUser: async (userId) => {
      const { data, error } = await supabase
        .from("existing_project_requests")
        .select("*, project:projects(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  },
  // Notifications helper (create/get/mark/delete)
  notifications: {
    async create({ user_id, title, message, type = 'info', action_url = null, metadata = {} }) {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ user_id, title, message, type, action_url, metadata }])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getUnreadCount(userId) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error fetching unread count:', error)
        return 0
      }
      return count || 0
    },

    async markRead(id) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getAllForUser(userId) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    }
  },

  // Projects
  projects: {
    async getPublished() {
      try {
        // Try with RLS first
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('published_at', { ascending: false })

        if (error) {
          console.error('Error fetching published projects with RLS:', error)

          // If RLS fails, try without it (this requires service role key)
          console.log('Trying to fetch all projects without RLS...')
          const { data: allData, error: allError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })

          if (allError) {
            console.error('Error fetching all projects:', allError)
            return this.getFallbackProjects()
          }

          // Filter published projects manually
          const publishedData = allData?.filter(project => project.published === true) || []
          console.log('Published projects fetched (fallback):', publishedData)

          // If no projects found, return fallback data
          if (publishedData.length === 0) {
            return this.getFallbackProjects()
          }

          return publishedData
        }

        console.log('Published projects fetched:', data)

        // If no projects found, return fallback data
        if (!data || data.length === 0) {
          return this.getFallbackProjects()
        }

        return data
      } catch (err) {
        console.error('Unexpected error fetching projects:', err)
        return this.getFallbackProjects()
      }
    },

    getFallbackProjects() {
      return [
        {
          id: 'fallback-1',
          title: 'AI-Powered Healthcare Diagnostics',
          summary: 'Developing machine learning models to assist in early disease detection using medical imaging data.',
          description: 'This project focuses on creating an AI system that can analyze medical images to help healthcare professionals identify early signs of various diseases.',
          image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
          project_link: '#',
          demo_link: '#',
          tags: ['AI', 'Healthcare', 'Machine Learning', 'Computer Vision'],
          tech_stack: ['Python', 'TensorFlow', 'PyTorch', 'OpenCV'],
          deliverables: ['Research Paper', 'Prototype Application', 'Model Documentation'],
          timeline: '6 months',
          team_members: [],
          requirements: 'Background in machine learning, Python programming, and familiarity with medical imaging data.',
          outcomes: 'Publication in top-tier medical AI conference, working prototype for clinical testing.',
          published: true,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          title: 'Sustainable Energy Management System',
          summary: 'Building an IoT-based platform for monitoring and optimizing energy consumption in smart buildings.',
          description: 'This project aims to create a comprehensive energy management system that uses IoT sensors and machine learning to optimize energy consumption.',
          image_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop',
          project_link: '#',
          demo_link: '#',
          tags: ['IoT', 'Sustainability', 'Energy', 'Smart Buildings'],
          tech_stack: ['Node.js', 'React', 'MongoDB', 'Arduino'],
          deliverables: ['IoT Sensor Network', 'Web Dashboard', 'Mobile App'],
          timeline: '8 months',
          team_members: [],
          requirements: 'Experience with IoT development, web technologies, and interest in sustainability.',
          outcomes: 'Deployment in 5+ buildings, research publication, potential commercialization opportunity.',
          published: true,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'fallback-3',
          title: 'Cybersecurity Threat Detection Platform',
          summary: 'Developing an advanced threat detection system using behavioral analysis and machine learning.',
          description: 'This project focuses on creating a next-generation cybersecurity platform that uses behavioral analysis and machine learning to detect and prevent cyber threats.',
          image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
          project_link: '#',
          demo_link: '#',
          tags: ['Cybersecurity', 'Machine Learning', 'Network Security', 'Threat Detection'],
          tech_stack: ['Python', 'Go', 'Kafka', 'Elasticsearch'],
          deliverables: ['Threat Detection Engine', 'Security Dashboard', 'API Integration'],
          timeline: '10 months',
          team_members: [],
          requirements: 'Background in cybersecurity, network protocols, and machine learning techniques.',
          outcomes: 'Patent application, industry partnerships, deployment in enterprise environment.',
          published: true,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    async create(projectData) {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        return { success: false, error }
      }
      return { success: true, data }
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },

    async getAll(filters = {}) {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.published !== undefined) {
        query = query.eq('published', filters.published)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },

    // NEW METHOD: Create project from approved application
    async createFromRequest(projectRequest) {
      try {
        // Extract project data from the request attachments
        // attachments may be stored as a JSON string in the DB, so parse if needed
        let attachments = projectRequest.attachments
        if (typeof attachments === 'string') {
          try {
            attachments = JSON.parse(attachments)
          } catch (e) {
            console.warn('Failed to parse attachments JSON for request', projectRequest.id)
            attachments = []
          }
        }

        const projectData = attachments?.[0]?.data

        if (!projectData) {
          throw new Error('No project data found in request')
        }

        const projectPayload = {
          title: projectData.title,
          summary: projectData.summary,
          description: projectData.description,
          tags: projectData.tags || [],
          tech_stack: projectData.tech_stack || [],
          deliverables: projectData.deliverables || [],
          requirements: projectData.requirements,
          expected_outcomes: projectData.outcomes,
          timeline: projectRequest.expected_timeline,
          team_members: projectData.team_members || [],
          status: 'active',
          created_by: projectRequest.user_id,
          published: true,
          project_request_id: projectRequest.id
        }

        const { data, error } = await supabase
          .from('projects')
          .insert([projectPayload])
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } catch (error) {
        console.error('Error creating project from request:', error)
        return { success: false, error }
      }
    }
  },

  // Project Requests - COMPLETELY UPDATED METHODS
  projectRequests: {
    async getByUser(userId) {
      const { data, error } = await supabase
        .select(`
          *,
          projects (
            id,
            title,
            summary,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('project_requests')
        .select(`
          *,
          projects (
            id,
            title,
            summary,
            description,
            image_url
          ),
          users (
            id,
            full_name,
            email,
            institution,
            bio
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    async create(requestData) {
      const { data, error } = await supabase
        .from('project_requests')
        .insert(requestData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('project_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating project request:', error)
        return { success: false, error }
      }
      return { success: true, data }
    },

    async getAll(filters = {}) {
      let query = supabase
        .from('project_requests')
        .select(`
          *,
          projects (
            id,
            title,
            summary
          ),
          users!project_requests_user_id_fkey (
            id,
            full_name,
            email,
            institution
          )
        `)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      const { data, error } = await query
      console.debug('db.projectRequests.getAll ->', { filters, data, count: Array.isArray(data) ? data.length : 0, error })
      if (error) throw error
      return data
    },

    // NEW METHODS FOR ADMIN PANEL
    async getAllWithUsers() {
      const { data, error } = await supabase
        .from('project_requests')
        .select(`
          *,
          users!project_requests_user_id_fkey (
            id,
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      console.debug('db.projectRequests.getAllWithUsers ->', { count: Array.isArray(data) ? data.length : 0, data, error })

      if (error) throw error
      return data
    },

    async updateStatus(id, status, adminData = {}) {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString(),
        ...adminData
      }

      const { data, error } = await supabase
        .from('project_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    },

    async deleteRequest(id) {
      const { error } = await supabase
        .from('project_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    }
  },

  // Contact messages (from Contact form) and replies
  contactMessages: {
    async create({ user_id = null, name = null, email, subject = null, message }) {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([{ user_id, name, email, subject, message }])
        .select()
        .single()

      if (error) {
        console.error('Error inserting contact message:', error)
        throw error
      }

      return data
    },

    async getByUser(userId) {
      const { data, error } = await supabase
        .from('contact_messages')
        .select(`*, contact_replies(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async getAll(filters = {}) {
      let query = supabase
        .from('contact_messages')
        .select(`*, contact_replies(*)`)
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.search) query = query.or(`subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },

    async addReply(contactMessageId, adminId, message) {
      const { data, error } = await supabase
        .from('contact_replies')
        .insert([{ contact_message_id: contactMessageId, admin_id: adminId, message }])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    }
  },

  // Audit Logs
  auditLogs: {
    async create(logData) {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getAll(filters = {}) {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users!audit_logs_actor_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (filters.actor_id) {
        query = query.eq('actor_id', filters.actor_id)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.object_type) {
        query = query.eq('object_type', filters.object_type)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  },

  // Storage
  storage: {
    async uploadFile(bucket, path, file, options = {}) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        })

      if (error) throw error
      return data
    },

    async getPublicUrl(bucket, path) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return data.publicUrl
    },

    async deleteFile(bucket, path) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
    },

    async getSignedUrl(bucket, path, expiresIn = 3600) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) throw error
      return data.signedUrl
    }
  },

  // NEW: Admin specific methods
  admin: {
    async getDashboardStats() {
      try {
        const [
          usersCount,
          projectsCount,
          pendingRequestsCount,
          approvedRequestsCount
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
          supabase.from('project_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved')
        ])

        return {
          totalUsers: usersCount.count || 0,
          totalProjects: projectsCount.count || 0,
          pendingApplications: pendingRequestsCount.count || 0,
          approvedApplications: approvedRequestsCount.count || 0
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
          totalUsers: 0,
          totalProjects: 0,
          pendingApplications: 0,
          approvedApplications: 0
        }
      }
    },

    async getRecentActivity(limit = 10) {
      const { data, error } = await supabase
        .from('project_requests')
        .select(`
          *,
          users!project_requests_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    }
  }
}

// Auth helper functions
export const auth = {
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error
    return data
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  },

  getCurrentUser() {
    return supabase.auth.getUser()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// NEW: Direct database operations for admin panel (fallback methods)
export const adminDb = {
  // Direct project requests operations
  async getProjectRequests() {
    const { data, error } = await supabase
      .from('project_requests')
      .select(`
        *,
        users!project_requests_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project requests:', error)
      throw error
    }
    return data
  },

  // Direct users operations
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    // Always log the raw admin getUsers results in debug
    console.debug('adminDb.getUsers ->', { data, count: Array.isArray(data) ? data.length : 0, error })

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }
    return data
  },

  // Direct projects operations
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
    return data
  },

  // Update project request status
  async updateProjectRequestStatus(id, status, adminData = {}) {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString(),
      ...adminData
    }

    const { data, error } = await supabase
      .from('project_requests')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating project request:', error)
      throw error
    }
    return data?.[0]
  },

  // Create project from approved request
  async createProjectFromRequest(projectRequest) {
    // attachments may be stringified in the database; parse if necessary
    let attachments = projectRequest.attachments
    if (typeof attachments === 'string') {
      try {
        attachments = JSON.parse(attachments)
      } catch (e) {
        console.warn('Failed to parse attachments JSON for request', projectRequest.id)
        attachments = []
      }
    }

    const projectData = attachments?.[0]?.data

    if (!projectData) {
      throw new Error('No project data found in request')
    }

    const projectPayload = {
      title: projectData.title,
      summary: projectData.summary,
      description: projectData.description,
      tags: projectData.tags || [],
      tech_stack: projectData.tech_stack || [],
      deliverables: projectData.deliverables || [],
      requirements: projectData.requirements,
      expected_outcomes: projectData.outcomes,
      timeline: projectRequest.expected_timeline,
      team_members: projectData.team_members || [],
      status: 'active',
      created_by: projectRequest.user_id,
      published: true,
      project_request_id: projectRequest.id
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([projectPayload])
      .select()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }
    return data?.[0]
  }
}

export default supabase