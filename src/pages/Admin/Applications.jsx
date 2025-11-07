import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from '../../components/UI/Card'
import config from '../../config/environment'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useRequests } from '../../hooks/useRequests'
import toast from 'react-hot-toast'

const AdminApplications = () => {
  const { requests, loading, error, fetchRequests, approveRequest, rejectRequest } = useRequests()
  const [selected, setSelected] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const openDetails = (req) => {
    // Parse attachments if stored as a string
    let attachments = req.attachments
    if (typeof attachments === 'string') {
      try {
        attachments = JSON.parse(attachments)
      } catch (e) {
        attachments = []
      }
    }

    setSelected({ ...req, attachments: attachments || [] })
    setAdminNotes(req.admin_notes || '')
    setRejectionReason(req.rejection_reason || '')
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setSelected(null)
    setAdminNotes('')
    setRejectionReason('')
  }

  const handleApprove = async () => {
    if (!selected) return
    try {
      setProcessing(true)
      await approveRequest(selected.id, adminNotes, selected._source || 'project_requests')
      toast.success('Application approved')
      await fetchRequests()
      close()
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    if (!rejectionReason) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setProcessing(true)
      await rejectRequest(selected.id, rejectionReason, selected._source || 'project_requests')
      toast.success('Application rejected')
      await fetchRequests()
      close()
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Application Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review and process project applications. Click "View" to inspect details and approve or reject.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">Error loading applications: {error}</div>
              ) : requests.length === 0 ? (
                <div className="py-8 text-center text-gray-600">No applications found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Applicant</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Project</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Submitted</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {requests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                            {req.users?.full_name || req.user_id}
                            <div className="text-xs text-gray-400">{req.users?.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{req.project_title || req.projects?.title || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{new Date(req.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : req.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <Button variant="outline" size="sm" onClick={() => openDetails(req)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Content>
          </Card>
        </motion.div>
      </div>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={close} title={selected ? `Application by ${selected.users?.full_name || selected.user_id}` : 'Details'} size="lg">
        {selected && (
          <>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project / Proposal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">{selected.proposal || selected.message || 'No proposal text provided.'}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Applicant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selected.users?.full_name} — {selected.users?.email}</p>
              {selected.users?.institution && <p className="text-sm text-gray-500">{selected.users.institution}</p>}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Submitted</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(selected.created_at).toLocaleString()}</p>
            </div>

            {selected.attachments && selected.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments</h3>
                <div className="mt-2 space-y-2">
                  {selected.attachments.map((a, i) => (
                    <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                      <a href={a.url || a.path} target="_blank" rel="noreferrer" className="text-primary-600 dark:text-primary-400 underline">{a.name || a.filename || `Attachment ${i + 1}`}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Notes (optional)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rejection Reason (when rejecting)</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2" rows={2} />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={close}>Close</Button>
              <Button variant="danger" onClick={handleReject} loading={processing}>Reject</Button>
              <Button variant="success" onClick={handleApprove} loading={processing}>Approve</Button>
            </div>
            </div>

            {config && config.debug && (
              <Card className="mt-4">
                <Card.Content className="p-4">
                  <strong>DEBUG: requests (project_requests + existing_project_requests)</strong>
                  <pre className="text-xs overflow-auto max-h-48 mt-2">{JSON.stringify(requests, null, 2)}</pre>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default AdminApplications
