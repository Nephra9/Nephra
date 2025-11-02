import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminNotifications = () => {
  const { profile, initializing, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState({})

  useEffect(() => {
    if (!isAdmin) return
    fetchMessages()
  }, [isAdmin])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await db.contactMessages.getAll()
      setMessages(data || [])
    } catch (err) {
      console.error('Failed to load contact messages:', err)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact message?')) return
    try {
      await db.contactMessages.delete(id)
      toast.success('Message deleted')
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete')
    }
  }

  const handleReply = async (message) => {
    const text = replyText[message.id]
    if (!text || text.trim().length < 1) return toast.error('Reply cannot be empty')
    try {
      // add reply record
      const reply = await db.contactMessages.addReply(message.id, profile?.id, text)
      // notify user who submitted message
      if (message.user_id) {
        await db.notifications.create({
          user_id: message.user_id,
          title: `Reply: ${message.subject || 'Your message'}`,
          message: text,
          type: 'info',
          action_url: '/user/profile',
          metadata: { contact_message_id: message.id }
        })
      }
      toast.success('Reply sent')
      // refresh messages
      fetchMessages()
      setReplyText(prev => ({ ...prev, [message.id]: '' }))
    } catch (err) {
      console.error('Reply error:', err)
      toast.error('Failed to send reply')
    }
  }

  const markRelatedNotificationsRead = async (message) => {
    try {
      // find notifications for current admin related to this message and mark read
      const notifications = await db.notifications.getAllForUser(profile?.id)
      const related = (notifications || []).filter(n => n.metadata?.contact_message_id === message.id)
      await Promise.all(related.map(r => db.notifications.markRead(r.id)))
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  if (initializing) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Checking auth..." /></div>
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Notifications & Contact Messages</h1>

          {loading ? (
            <div className="py-12"><LoadingSpinner text="Loading messages..." /></div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 && <div className="text-sm text-gray-500">No messages</div>}

              {messages.map(msg => (
                <Card key={msg.id}>
                  <Card.Content className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{msg.subject || 'No subject'}</h3>
                        <p className="text-sm text-gray-500">From: {msg.name || msg.email} • {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</p>
                        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{msg.message}</p>

                        {msg.contact_replies && msg.contact_replies.length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Replies</h4>
                            <div className="space-y-2">
                              {msg.contact_replies.map(r => (
                                <div key={r.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="text-sm text-gray-900 dark:text-white">{r.message}</div>
                                  <div className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <textarea
                            placeholder="Write a reply to the user..."
                            value={replyText[msg.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                            className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => { handleReply(msg) }}>Reply</Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(msg.id)}>Delete</Button>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => markRelatedNotificationsRead(msg)}>Mark Related Notifications Read</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminNotifications
