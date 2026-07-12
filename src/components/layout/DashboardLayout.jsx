import { useState } from 'react'
import { Outlet }    from 'react-router-dom'
import { Navbar }    from './Navbar.jsx'
import { Sidebar }   from './Sidebar.jsx'
import { Menu }      from 'lucide-react'

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobile]   = useState(false)

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col relative">
          <Sidebar collapsed={collapsed} />
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-surface border border-border
                       rounded-full flex items-center justify-center z-10
                       hover:border-brass hover:text-brass transition-colors text-text-m"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-3 h-3" />
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-midnight/70"
              onClick={() => setMobile(false)}
            />
            <div className="relative w-56 h-full">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobile(true)}
            className="md:hidden mb-4 btn-icon"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Outlet />
        </main>
      </div>
    </div>
  )
}
