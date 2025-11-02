// components/Layout/AppLayout.jsx
import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout