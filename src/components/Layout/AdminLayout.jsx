// src/components/Layout/AdminLayout.jsx
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import Header from './Header'
import Topbar from './Topbar'

// AdminLayout supports both direct children and nested routes via <Outlet />
const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Global site header (navigation) placed above the admin topbar */}
        <Header />
        <Topbar setSidebarOpen={setSidebarOpen} />
  {/* Add top padding equal to the Header + Topbar heights so content isn't hidden behind the fixed bars */}
  <main className="flex-1 pt-32">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout