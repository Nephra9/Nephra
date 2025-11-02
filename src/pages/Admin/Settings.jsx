import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { supabase } from '../../services/supabaseClient'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    site_title: 'Nephra',
    registration_open: true,
    debug: false,
    maintenance_mode: false
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('system_settings').select('*').limit(1).single()
        if (!error && data) {
          setSettings({
            site_title: data.site_title || 'Nephra',
            registration_open: data.registration_open ?? true,
            debug: data.debug ?? false,
            maintenance_mode: data.maintenance_mode ?? false
          })
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
      // Try to upsert a singleton settings row
      const payload = {
        site_title: settings.site_title,
        registration_open: settings.registration_open,
        debug: settings.debug,
        maintenance_mode: settings.maintenance_mode,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase.from('system_settings').upsert(payload, { onConflict: 'id' }).select().single()
      if (error) throw error
      toast.success('Settings saved')
      setSettings((s) => ({ ...s, ...data }))
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card>
            <Card.Content className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                System Settings
              </h1>

              {loading ? (
                <div className="py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Title</label>
                    <input value={settings.site_title} onChange={(e) => setSettings({ ...settings, site_title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" checked={settings.registration_open} onChange={(e) => setSettings({ ...settings, registration_open: e.target.checked })} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow user registration</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" checked={settings.debug} onChange={(e) => setSettings({ ...settings, debug: e.target.checked })} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Enable debug mode</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Maintenance mode</span>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} loading={saving}>Save Settings</Button>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminSettings
