import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...')

    // Clear all data in reverse order of dependencies
    console.log('🧹 Clearing all data...')
    
    // Clear project requests first (has foreign keys)
    const { error: requestsError } = await supabase
      .from('project_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (requestsError) {
      console.error('Error clearing project requests:', requestsError)
    } else {
      console.log('✅ Cleared project requests')
    }

    // Clear projects
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (projectsError) {
      console.error('Error clearing projects:', projectsError)
    } else {
      console.log('✅ Cleared projects')
    }

    // Clear users (except system users)
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (usersError) {
      console.error('Error clearing users:', usersError)
    } else {
      console.log('✅ Cleared users')
    }

    // Clear events
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (eventsError) {
      console.error('Error clearing events:', eventsError)
    } else {
      console.log('✅ Cleared events')
    }

    // Clear site content
    const { error: contentError } = await supabase
      .from('site_content')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (contentError) {
      console.error('Error clearing site content:', contentError)
    } else {
      console.log('✅ Cleared site content')
    }

    // Clear notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (notificationsError) {
      console.error('Error clearing notifications:', notificationsError)
    } else {
      console.log('✅ Cleared notifications')
    }

    // Clear file uploads
    const { error: uploadsError } = await supabase
      .from('file_uploads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (uploadsError) {
      console.error('Error clearing file uploads:', uploadsError)
    } else {
      console.log('✅ Cleared file uploads')
    }

    // Clear audit logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (auditError) {
      console.error('Error clearing audit logs:', auditError)
    } else {
      console.log('✅ Cleared audit logs')
    }

    // Clear storage buckets (optional - uncomment if needed)
    // console.log('🗑️  Clearing storage buckets...')
    // const buckets = ['avatars', 'project-images', 'resumes', 'attachments', 'documents']
    // for (const bucket of buckets) {
    //   const { error: storageError } = await supabase.storage
    //     .from(bucket)
    //     .remove([])
    //   
    //   if (storageError) {
    //     console.error(`Error clearing ${bucket} bucket:`, storageError)
    //   } else {
    //     console.log(`✅ Cleared ${bucket} bucket`)
    //   }
    // }

    console.log('✅ Database reset completed successfully!')
    console.log('💡 Run "npm run db:seed" to populate with sample data')

  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }
}

// Run the reset
resetDatabase()
