import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/* -------------------------------------------------------------------------- */
/*                               SAMPLE DATASETS                              */
/* -------------------------------------------------------------------------- */

const sampleUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    full_name: 'Dr. Sarah Chen',
    email: 'sarah.chen@nephra.org',
    institution: 'Nephra Technology Institute',
    degree: 'Ph.D. in Computer Science',
    department: 'Research & Development',
    bio: 'Leading researcher in AI and ML with 15+ years of experience.',
    country: 'United States',
    role: 'superadmin',
    status: 'active',
    email_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    full_name: 'Prof. Michael Rodriguez',
    email: 'michael.rodriguez@nephra.org',
    institution: 'Nephra Technology Institute',
    degree: 'Ph.D. in Software Engineering',
    department: 'Engineering',
    bio: 'Specializes in distributed systems and cloud computing.',
    country: 'United States',
    role: 'admin',
    status: 'active',
    email_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    full_name: 'Dr. Emily Watson',
    email: 'emily.watson@nephra.org',
    institution: 'Nephra Technology Institute',
    degree: 'Ph.D. in Data Science',
    department: 'Analytics',
    bio: 'Expert in big data analytics and visualization techniques.',
    country: 'United States',
    role: 'reviewer',
    status: 'active',
    email_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    full_name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    institution: 'Tech University',
    degree: 'M.S. in Computer Science',
    department: 'Graduate Studies',
    bio: 'Passionate about machine learning and AI applications.',
    country: 'United States',
    role: 'user',
    status: 'active',
    email_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    full_name: 'Priya Patel',
    email: 'priya.patel@university.edu',
    institution: 'Tech University',
    degree: 'B.S. in Software Engineering',
    department: 'Computer Science',
    bio: 'Interested in web development and UX design.',
    country: 'United States',
    role: 'user',
    status: 'active',
    email_verified: true
  }
]

const sampleProjects = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    title: 'AI-Powered Healthcare Diagnostics',
    summary: 'AI models for early disease detection using imaging data.',
    description:
      'Creating an AI system for analyzing medical images (X-rays, MRIs, CTs) to detect early disease indicators.',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    project_link: 'https://github.com/nephra/ai-healthcare',
    demo_link: 'https://demo.nephra.org/healthcare-ai',
    tags: ['AI', 'Healthcare', 'Machine Learning'],
    tech_stack: ['Python', 'TensorFlow', 'Django'],
    deliverables: ['Prototype', 'Model Docs'],
    timeline: '6 months',
    team_members: [
      { name: 'Dr. Sarah Chen', role: 'Lead Researcher' },
      { name: 'Alex Johnson', role: 'ML Engineer' }
    ],
    requirements: 'Python, ML, Medical imaging familiarity',
    outcomes: 'Research publication & working prototype',
    published: true,
    published_at: '2024-01-10T00:00:00Z',
    created_by: '550e8400-e29b-41d4-a716-446655440001'
  }
]

const sampleProjectRequests = [
  {
    id: '750e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440004',
    project_id: '650e8400-e29b-41d4-a716-446655440001',
    proposal:
      'Eager to contribute my ML skills to the Healthcare Diagnostics project.',
    expected_timeline: '6 months',
    portfolio_links: [
      { name: 'GitHub', url: 'https://github.com/alexjohnson' }
    ],
    skills_checklist: [
      { skill: 'Python', level: 'Advanced' },
      { skill: 'TensorFlow', level: 'Intermediate' }
    ],
    status: 'Approved',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
]

const sampleEvents = [
  {
    id: '850e8400-e29b-41d4-a716-446655440001',
    title: 'Nephra AI Summit 2024',
    description: 'Annual summit on AI and innovation.',
    start_date: '2024-05-15T09:00:00Z',
    end_date: '2024-05-16T17:00:00Z',
    location: 'San Francisco, CA',
    image_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    tags: ['Conference', 'AI'],
    published: true,
    created_by: '550e8400-e29b-41d4-a716-446655440002'
  }
]

const sampleSiteContent = [
  {
    id: '950e8400-e29b-41d4-a716-446655440001',
    key: 'home-hero',
    title: 'Welcome to Nephra',
    content:
      'Empowering technology innovators through research and mentorship.',
    type: 'banner',
    published: true,
    created_by: '550e8400-e29b-41d4-a716-446655440001'
  }
]

const sampleNotifications = [
  {
    id: '960e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Project Request Approved',
    message:
      'Your request for "AI-Powered Healthcare Diagnostics" has been approved.',
    type: 'success',
    read: false,
    action_url: '/projects/650e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-01-16T00:00:00Z'
  },
  {
    id: '960e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'New Event Added',
    message:
      'Join the Nephra AI Summit 2024 and network with top researchers.',
    type: 'info',
    read: false,
    action_url: '/events/850e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-01-20T00:00:00Z'
  }
]

const sampleFileUploads = [
  {
    id: '970e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440004',
    filename: 'resume.pdf',
    original_name: 'Alex_Resume.pdf',
    mime_type: 'application/pdf',
    size_bytes: 102400,
    storage_path: 'storage/resumes/alex-johnson/resume.pdf',
    public_url:
      'https://example-bucket.supabase.co/storage/v1/object/public/resumes/alex-johnson/resume.pdf'
  }
]

const sampleAuditLogs = [
  {
    id: '980e8400-e29b-41d4-a716-446655440001',
    actor_id: '550e8400-e29b-41d4-a716-446655440001',
    action: 'INSERT',
    object_type: 'project',
    object_id: '650e8400-e29b-41d4-a716-446655440001',
    metadata: { note: 'Created sample project' },
    ip_address: '192.168.1.10',
    user_agent: 'NodeJS Seed Script',
    created_at: '2024-01-10T00:00:00Z'
  }
]

/* -------------------------------------------------------------------------- */
/*                                 SEED LOGIC                                 */
/* -------------------------------------------------------------------------- */

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    console.log('🧹 Clearing existing data...')

    const tables = [
      'audit_logs',
      'notifications',
      'file_uploads',
      'project_requests',
      'projects',
      'events',
      'site_content',
      'users'
    ]
    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    console.log('👥 Inserting users...')
    await supabase.from('users').insert(sampleUsers)

    console.log('📚 Inserting projects...')
    await supabase.from('projects').insert(sampleProjects)

    console.log('📝 Inserting project requests...')
    await supabase.from('project_requests').insert(sampleProjectRequests)

    console.log('📅 Inserting events...')
    await supabase.from('events').insert(sampleEvents)

    console.log('📄 Inserting site content...')
    await supabase.from('site_content').insert(sampleSiteContent)

    console.log('🔔 Inserting notifications...')
    await supabase.from('notifications').insert(sampleNotifications)

    console.log('📂 Inserting file uploads...')
    await supabase.from('file_uploads').insert(sampleFileUploads)

    console.log('🧾 Inserting audit logs...')
    await supabase.from('audit_logs').insert(sampleAuditLogs)

    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

seedDatabase()
