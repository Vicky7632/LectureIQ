import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, BookOpen } from 'lucide-react'
import { logout } from '../../store/slices/authSlice'

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
    <header className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="flex-1">
        <button
          className="btn btn-ghost btn-circle lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="btn btn-ghost text-xl">
          <BookOpen className="mr-2" />
         <h1 className="text-3xl font-extrabold tracking-wide">
              <span className="text-primary">Lecture</span>
              <span className="text-secondary">IQ</span>
            </h1>
        </Link>
      </div>

      <div className="flex-none gap-4">
        {isAuthenticated ? (
          <>
            <div className="form-control hidden md:block">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="input input-bordered input-sm"
                />
                <button className="btn btn-square btn-sm">
                  <Search size={16} />
                </button>
              </div>
            </div>

            <button className="btn btn-ghost btn-circle btn-sm relative">
              <Bell size={20} />
              <span className="badge badge-xs badge-primary absolute -top-1 -right-1"></span>
            </button>

            {/* DaisyUI dropdown – NO manual state */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
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
                <li><Link to="/settings">Settings</Link></li>
                <div className="divider my-1" />
                {role === 'teacher' && (
                  <>
                    <li><Link to="/teacher/courses">My Courses</Link></li>
                    <li><Link to="/teacher/create-course">Create Course</Link></li>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <li><Link to="/admin/teachers">Teachers</Link></li>
                    <li><Link to="/admin/courses">Courses</Link></li>
                    <li><Link to="/admin/approvals">Approvals</Link></li>
                  </>
                )}
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