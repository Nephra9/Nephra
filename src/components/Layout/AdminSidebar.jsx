// src/components/Layout/AdminSidebar.jsx
import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { 
  HomeIcon, 
  FolderIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  XMarkIcon,
  BellIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Projects', href: '/admin/projects', icon: FolderIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Applications', href: '/admin/applications', icon: DocumentMagnifyingGlassIcon },
  { name: 'Project Management', href: '/admin/project-management', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheckIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
  { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
  { name: 'Data Migration', href: '/admin/data-migration', icon: DocumentTextIcon },
]

const AdminSidebar = ({ open, setOpen }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${open ? 'fixed inset-0 z-40 flex' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        isActive
                          ? 'text-primary-500'
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {/* Make desktop sidebar fixed so it aligns with the fixed Topbar */}
        <div className="fixed left-0 top-0 h-full w-64 z-20">
          <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 pt-5 pb-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700 h-full">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
            </div>
            <nav className="mt-5 flex-1 flex flex-col divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
              <div className="px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive
                            ? 'text-primary-500'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar