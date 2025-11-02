import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/supabaseClient'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useAuth()

  const [recentOpen, setRecentOpen] = useState(false)
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentMessages, setRecentMessages] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Create contact message in DB (attach profile id when available)
      const created = await db.contactMessages.create({
        user_id: profile?.id || null,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message
      })

      // Notify admins: insert a notification for every admin user
      try {
        const admins = await db.users.getAllUsers({ role: 'admin' })
        if (Array.isArray(admins)) {
          await Promise.all(admins.map(ad => db.notifications.create({
            user_id: ad.id,
            title: 'New contact message',
            message: `New contact from ${data.name || data.email}: ${data.subject || '(no subject)'}`,
            type: 'info',
            action_url: '/admin/notifications',
            metadata: { contact_message_id: created.id }
          })))
        }
      } catch (notifyErr) {
        console.error('Failed to notify admins:', notifyErr)
      }

      toast.success('Message sent — we will get back to you shortly')
      reset()
    } catch (err) {
      console.error('Contact submit error:', err)
      toast.error('Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email',
      content: 'nephratech@gmail.com',
      link: 'mailto:nephra@gmail.com'
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      content: '+918297001156',
      link: 'tel:+918297001156'
    },
    {
      icon: MapPinIcon,
      title: 'Address',
      content: 'Nephra Technologies\nMangaiah Banjara,Bhadradri Kothagudem\nTelangana, 507120',
      link: null
    },
    {
      icon: ClockIcon,
      title: 'Office Hours',
      content: 'Monday - Friday\n9:00 AM - 6:00 PM PST',
      link: null
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions about our projects or need support? We're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <Card.Content className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Send us a message
                  </h2>
                  <div className="flex justify-between items-center mb-4">
                    <div />
                    <div>
                      <Button size="sm" variant="outline" onClick={async () => {
                        setRecentOpen(true)
                        // fetch messages when opening
                        try {
                          setRecentLoading(true)
                          if (!profile?.id) {
                            setRecentMessages([])
                          } else {
                            const data = await db.contactMessages.getByUser(profile.id)
                            setRecentMessages(data || [])
                          }
                        } catch (err) {
                          console.error('Failed to load recent queries:', err)
                        } finally {
                          setRecentLoading(false)
                        }
                      }}>Recent queries</Button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      {/* Recent queries modal */}
                      {recentOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your recent queries</h3>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setRecentOpen(false)}>Close</Button>
                              </div>
                            </div>

                            {recentLoading ? (
                              <div className="py-8 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
                            ) : (
                              <div className="space-y-4">
                                {!profile?.id && (
                                  <div className="text-sm text-gray-500">Sign in to view your recent queries and replies.</div>
                                )}

                                {recentMessages.length === 0 && profile?.id && (
                                  <div className="text-sm text-gray-500">No recent queries found.</div>
                                )}

                                {recentMessages.map(m => (
                                  <Card key={m.id}>
                                    <Card.Content className="p-4">
                                      <div>
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium text-gray-900 dark:text-white">{m.subject || 'No subject'}</h4>
                                          <div className="text-xs text-gray-500">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
                                        </div>
                                        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{m.message}</p>

                                        {m.contact_replies && m.contact_replies.length > 0 && (
                                          <div className="mt-3 border-t pt-3">
                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Replies</h5>
                                            <div className="space-y-2">
                                              {m.contact_replies.map(r => (
                                                <div key={r.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                  <div className="text-sm text-gray-900 dark:text-white">{r.message}</div>
                                                  <div className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </Card.Content>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject
                      </label>
                      <input
                        {...register('subject')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="What's this about?"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message
                      </label>
                      <textarea
                        {...register('message')}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell us more about your inquiry..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </Card.Content>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Get in touch
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index}>
                    <Card.Content className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <info.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {info.title}
                          </h3>
                          {info.link ? (
                            <a
                              href={info.link}
                              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              {info.content}
                            </a>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {info.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </div>

              {/* Additional Info */}
              <Card>
                <Card.Content className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Response Time
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We typically respond to all inquiries within 24 hours during business days. 
                    For urgent matters, please call us directly.
                  </p>
                </Card.Content>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
