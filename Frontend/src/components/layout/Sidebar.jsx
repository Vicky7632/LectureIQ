import React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Users,
  DollarSign,
  CheckCircle,
  PlusCircle,
  BarChart,
  Settings,
  X,
  UserPlus,
  Shield
} from 'lucide-react'

const Sidebar = ({ isOpen, setSidebarOpen }) => {   // 👈 prop aaya
  const { role } = useSelector((state) => state.auth)

  const studentLinks = [
    { to: '/student/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/student/my-courses', icon: BookOpen, label: 'My Courses' },
    { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
    { to: '/profile', icon: Settings, label: 'Profile' },
  ]

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/teacher/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/teacher/create-course', icon: PlusCircle, label: 'Create Course' },
    { to: '/teacher/analytics', icon: BarChart, label: 'Analytics' },
    { to: '/profile', icon: Settings, label: 'Profile' },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin/teachers', icon: Users, label: 'Teachers' },
    { to: '/admin/create-teacher', icon: UserPlus, label: 'Add Teacher' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/approvals', icon: CheckCircle, label: 'Approvals' },
    { to: '/admin/payments', icon: DollarSign, label: 'Payments' },
    { to: '/admin/create-admin', icon: Shield, label: 'Add Admin' },
    { to: '/profile', icon: Settings, label: 'Profile' },
  ]

  const getLinks = () => {
    if (role === 'admin') return adminLinks
    if (role === 'teacher') return teacherLinks
    return studentLinks
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          h-screen w-64 bg-base-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-xl font-bold">LectureIQ</span>
          <button
            onClick={closeSidebar}
            className="btn btn-ghost btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <ul className="menu bg-base-200 w-full gap-1">
            {getLinks().map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    isActive ? 'active' : ''
                  }
                  end={link.to === '/student/dashboard' || link.to === '/teacher/dashboard' || link.to === '/admin/dashboard'}
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