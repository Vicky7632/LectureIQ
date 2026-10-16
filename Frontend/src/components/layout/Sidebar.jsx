import React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { getRoleNavigationLinks } from './navigationLinks'

const Sidebar = ({ isOpen, setSidebarOpen }) => {   // 👈 prop aaya
  const { role } = useSelector((state) => state.auth)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-base-content/30 backdrop-blur-[2px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          h-screen w-64 border-r border-base-300 bg-base-100
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between border-b border-base-300 p-4 lg:hidden">
          <span className="text-lg font-bold tracking-tight">Lecture<span className="text-primary">IQ</span></span>
          <button
            onClick={closeSidebar}
            className="btn btn-ghost btn-circle"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-base-content/50">
            Workspace
          </p>
          <ul className="menu w-full gap-1 p-0">
            {getRoleNavigationLinks(role).map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    isActive
                      ? 'active border border-primary/10 bg-primary/10 font-semibold text-primary'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                  }
                  end={link.label === 'Dashboard'}
                >
                  <link.icon size={18} />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  )
}

export default Sidebar