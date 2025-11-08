import React, { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import Button from '../../components/UI/Button'
import Card from '../../components/UI/Card'

const TABLES_TO_EXPORT = [
  'users',
  'projects',
  'project_requests',
  'existing_project_requests',
  'audit_logs',
  'notifications',
  'contact_messages'
]

const DataMigration = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = {}
      // Fetch each table in parallel
      await Promise.all(TABLES_TO_EXPORT.map(async (table) => {
        try {
          const { data: rows, error: e } = await supabase.from(table).select('*')
          if (e) {
            console.error(`Error fetching ${table}:`, e)
            results[table] = { error: e.message || String(e), rows: [] }
          } else {
            results[table] = { rows: rows || [] }
          }
        } catch (e) {
          console.error('Fetch error', e)
          results[table] = { error: e.message || String(e), rows: [] }
        }
      }))

      setData(results)
      return results
    } catch (e) {
      console.error('Unexpected fetchAll error', e)
      setError(String(e))
      setData(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = async () => {
    const results = data || await fetchAll()
    if (!results) return
    const timestamp = new Date().toISOString()
    const payload = { metadata: { exported_at: timestamp }, data: results }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nephra-backup-${timestamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Save the backup to a file on the user's device. Uses the File System Access API
  // (available in Chromium-based browsers) with a download fallback for other browsers.
  const saveToDevice = async () => {
    const results = data || await fetchAll()
    if (!results) return
    const timestamp = new Date().toISOString()
    const payload = { metadata: { exported_at: timestamp }, data: results }
    const content = JSON.stringify(payload, null, 2)

    // Modern file picker API (Chromium): showSaveFilePicker
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const opts = {
          suggestedName: `nephra-backup-${timestamp}.json`,
          types: [
            {
              description: 'JSON file',
              accept: { 'application/json': ['.json'] }
            }
          ]
        }
        // @ts-ignore - some environments may not have types for showSaveFilePicker
        const handle = await window.showSaveFilePicker(opts)
        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
        alert('Backup saved to device: ' + (handle.name || opts.suggestedName))
        return
      } catch (e) {
        console.error('Save to device failed', e)
        // fall through to download fallback
      }
    }

    // Fallback: trigger a normal download
    try {
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nephra-backup-${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download fallback failed', e)
      alert('Failed to save backup to device: ' + (e.message || String(e)))
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Migration</h1>
            <p className="text-gray-600 dark:text-gray-400">Export application data as a JSON backup or save it to your browser localStorage.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchAll} disabled={loading}>{loading ? 'Fetching...' : 'Fetch Data'}</Button>
            <Button variant="outline" onClick={downloadBackup} disabled={loading || !data}>Download JSON</Button>
            <Button variant="ghost" onClick={saveToDevice} disabled={loading || !data}>Save to device</Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600">Error: {error}</div>
        )}

        {data && (
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(data).map((table) => (
              <Card key={table}>
                <Card.Content className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{table}</div>
                    <div className="text-xl font-medium text-gray-900 dark:text-white">{Array.isArray(data[table].rows) ? data[table].rows.length : 0} rows</div>
                    {data[table].error && (<div className="text-sm text-red-500 mt-1">{data[table].error}</div>)}
                  </div>
                  <div className="text-sm text-gray-500">Preview</div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}

        {!data && !loading && (
          <div className="mt-6 text-sm text-gray-500">No data fetched yet. Click "Fetch Data" to load tables and then download or save.</div>
        )}
      </div>
    </div>
  )
}

export default DataMigration
