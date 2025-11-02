// src/components/Layout/Topbar.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { db } from '../../services/supabaseClient'
import config from '../../config/environment'

const Topbar = ({ setSidebarOpen }) => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ users: [], projects: [] })
  const [loading, setLoading] = useState(false)
  const [openResults, setOpenResults] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const searchTimeout = useRef(null)
  const containerRef = useRef(null)

  // Close results dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenResults(false)
      }
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') setOpenResults(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  // Fetch unread notification count for current user (if profile present)
  useEffect(() => {
    let mounted = true
    const fetchUnread = async () => {
      try {
        if (!profile?.id) {
          setUnreadCount(0)
          return
        }
        const count = await db.notifications.getUnreadCount(profile.id)
        if (mounted) setUnreadCount(count || 0)
      } catch (err) {
        console.error('Error loading unread count:', err)
      }
    }

    fetchUnread()

    // Poll every 20s to keep badge in sync
    const interval = setInterval(fetchUnread, 20000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [profile])

  const doSearch = async (q) => {
    if (!q || q.length < 2) {
      setResults({ users: [], projects: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [users, projects] = await Promise.all([
        db.users.getAllUsers({ search: q }),
        db.projects.getAll({ search: q })
      ])
      setResults({ users: users || [], projects: projects || [] })
      setOpenResults(true)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const onChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(v.trim()), 300)
  }

  const goToUser = (id) => {
    setOpenResults(false)
    setQuery('')
    navigate(`/admin/users`)
  }

  const goToProject = (id) => {
    setOpenResults(false)
    setQuery('')
    navigate(`/projects/${id}`)
  }

  return (
    // Fixed below the header (header height is 64px), so topbar starts at top-16
    <div className="fixed top-16 left-0 right-0 lg:left-64 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      {/* <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden mb-5" aria-hidden="true" /> */}

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 mt-5" ref={containerRef}>
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              value={query}
              onChange={onChange}
              type="search"
              className="h-10 block w-full rounded-md border-0 bg-white dark:bg-gray-700 pl-10 pr-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
              placeholder="Search projects and users..."
              onFocus={() => { if (results.users.length || results.projects.length) setOpenResults(true) }}
            />

            {/* Results dropdown */}
            {openResults && (results.users.length > 0 || results.projects.length > 0) && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 overflow-hidden">
                <div className="p-2">
                  {loading && <div className="text-sm text-gray-500">Searching...</div>}

                  {results.users.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-xs text-gray-500 uppercase">Users</div>
                      {results.users.slice(0,5).map(u => (
                        <button key={u.id} onClick={() => goToUser(u.id)} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{u.full_name || u.email}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.projects.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-gray-500 uppercase">Projects</div>
                      {results.projects.slice(0,5).map(p => (
                        <button key={p.id} onClick={() => goToProject(p.id)} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{p.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{p.summary}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative" onClick={() => navigate('/admin/notifications')}>
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{unreadCount}</span>
            )}
          </button>

          {/* Separator */}
          {/* <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700" aria-hidden="true" /> */}

          {/* Sign out (simple button) */}
          {/* <div className="hidden sm:block">
            <button onClick={() => signOut()} className="text-sm text-gray-700 dark:text-gray-300 hover:text-red-600">Sign out</button>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default Topbar