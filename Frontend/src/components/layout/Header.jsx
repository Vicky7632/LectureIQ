import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, BookOpen } from 'lucide-react'
import { logout } from '../../store/slices/authSlice'
import { getRoleNavigationLinks } from './navigationLinks'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, role } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/student/dashboard'
  }

  return (
    <header className="navbar sticky top-0 z-50 min-h-16 border-b border-base-300 bg-base-100/95 px-3 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center">
        {isAuthenticated && (
          <button
            className="btn btn-ghost btn-circle lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <Menu size={24} />
          </button>
        )}
        <Link to="/" className="btn btn-ghost h-auto gap-2 px-2 text-xl hover:bg-transparent">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-content">
            <BookOpen size={19} />
          </span>
          <span className="text-xl font-bold tracking-tight text-base-content">
            Lecture<span className="text-primary">IQ</span>
          </span>
        </Link>
      </div>

      <div className="flex-none gap-1 sm:gap-3">
        {isAuthenticated ? (
          <>
            <div className="form-control hidden md:block">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="input input-bordered input-sm"
                />
                <button aria-label="Search courses" className="btn btn-square btn-sm">
                  <Search size={16} />
                </button>
              </div>
            </div>

            <button aria-label="Notifications" className="btn btn-ghost btn-circle btn-sm relative">
              <Bell size={20} />
              <span className="badge badge-xs badge-primary absolute -top-1 -right-1"></span>
            </button>

            {/* DaisyUI dropdown – NO manual state */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" aria-label="Open account menu" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  {user?.firstName?.charAt(0) || <User size={16} />}
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                <li className="menu-title">
                  <span>{user?.firstName} {user?.lastName}</span>
                  <span className="badge badge-sm badge-ghost">{role}</span>
                </li>
                <li><Link to={getDashboardLink()}>Dashboard</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/change-password">Change Password</Link></li>
                <div className="divider my-1" />
                {getRoleNavigationLinks(role)
                  .filter(({ label }) => !['Dashboard', 'Profile', 'Change Password'].includes(label))
                  .map(({ to, label }) => (
                    <li key={to}><Link to={to}>{label}</Link></li>
                  ))}
                <div className="divider my-1" />
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <LogOut size={16} />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header