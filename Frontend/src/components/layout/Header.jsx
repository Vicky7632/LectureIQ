import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, BookOpen } from 'lucide-react'
import { logout } from '../../store/slices/authSlice'
import { getRoleNavigationLinks } from './navigationLinks'
import { useSocket } from '../../contexts/socketContextHooks'
import { enrollmentApi } from '../../api/enrollmentApi'
import { teacherApi } from '../../api/teacherApi'
import { adminApi } from '../../api/adminApi'
import { syncCourseSubscriptions } from '../../contexts/socketClientConfig'
import {
  appendLiveNotification,
  createLiveNotification,
  markNotificationsRead,
} from '../../contexts/liveNotificationUtils'

const NotificationDetails = ({ notification }) => (
  <span className="min-w-0 flex-1">
    <span className="block font-medium">{notification.message}</span>
    <span className="block truncate text-xs">{notification.title}</span>
    <time className="block text-xs text-base-content/60">
      {new Date(notification.occurredAt).toLocaleString()}
    </time>
  </span>
)

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const socket = useSocket()
  const { user, isAuthenticated, role } = useSelector((state) => state.auth)
  const [notificationState, setNotificationState] = useState({
    userId: user?._id || null,
    items: [],
  })
  const searchInputRef = useRef(null)
  const subscribedCoursesRef = useRef(new Set())
  const subscriptionAttemptsRef = useRef(new Map())
  const subscriptionVersionRef = useRef(0)
  const currentUserId = user?._id || null
  const notifications =
    notificationState.userId === currentUserId ? notificationState.items : []
  const unreadCount = notifications.filter(({ read }) => !read).length

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchInputRef.current?.value.trim() || ''
    navigate(query ? `/courses?search=${encodeURIComponent(query)}` : '/courses')
  }

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/student/dashboard'
  }

  const loadNotificationCourses = useCallback(async () => {
    const version = ++subscriptionVersionRef.current
    let courseIds = []
    try {
      if (role === 'student') {
        const response = await enrollmentApi.getMyEnrollments()
        courseIds = (response.data.enrollments || [])
          .filter((enrollment) => enrollment.status === 'active')
          .map((enrollment) => enrollment.course?._id)
          .filter(Boolean)
      } else if (role === 'teacher') {
        const response = await teacherApi.getMyCourses()
        courseIds = (response.data.courses || []).map((course) => course._id)
      } else if (role === 'admin') {
        const response = await adminApi.getAllCourses()
        courseIds = (response.data.courses || []).map((course) => course._id)
      }
    } catch (error) {
      console.error('Failed to load notification subscriptions:', error)
      return
    }
    if (version !== subscriptionVersionRef.current) return

    syncCourseSubscriptions(
      socket,
      subscribedCoursesRef.current,
      subscriptionAttemptsRef.current,
      courseIds,
      (error) => console.warn('Failed to subscribe to live notifications:', error)
    )
  }, [role, socket])

  useEffect(() => {
    if (!socket || !isAuthenticated) return undefined
    const subscribedCourses = subscribedCoursesRef.current
    const subscriptionAttempts = subscriptionAttemptsRef.current

    const handleEvent = (eventName) => (payload) => {
      const notification = createLiveNotification(eventName, payload)
      if (!notification) return
      setNotificationState((current) => {
        const items = current.userId === currentUserId ? current.items : []
        return {
          userId: currentUserId,
          items: appendLiveNotification(items, notification),
        }
      })
    }
    const handleStarted = handleEvent('lecture:started')
    const handleEnded = handleEvent('lecture:ended')
    const handleConnect = () => {
      void loadNotificationCourses()
    }
    const handleDisconnect = () => {
      subscribedCourses.clear()
      subscriptionAttempts.clear()
    }

    socket.on('lecture:started', handleStarted)
    socket.on('lecture:ended', handleEnded)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    if (socket.connected) handleConnect()

    return () => {
      socket.off('lecture:started', handleStarted)
      socket.off('lecture:ended', handleEnded)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      subscriptionVersionRef.current += 1
      syncCourseSubscriptions(socket, subscribedCourses, subscriptionAttempts, [])
      subscribedCourses.clear()
      subscriptionAttempts.clear()
    }
  }, [currentUserId, isAuthenticated, loadNotificationCourses, socket])

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
        <form onSubmit={handleSearch} role="search" className="form-control hidden md:block">
          <div className="join">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search courses..."
              className="input input-bordered input-sm join-item"
              aria-label="Search published courses"
              defaultValue={new URLSearchParams(location.search).get('search') || ''}
              key={location.search}
            />
            <button type="submit" aria-label="Search courses" className="btn btn-square btn-sm join-item">
              <Search size={16} />
            </button>
          </div>
        </form>
        {isAuthenticated ? (
          <>
            <div className="dropdown dropdown-end">
              <details>
                <summary
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                  className="btn btn-ghost btn-circle btn-sm relative list-none"
                  onClick={() => setNotificationState((current) => ({
                    userId: currentUserId,
                    items: markNotificationsRead(
                      current.userId === currentUserId ? current.items : []
                    ),
                  }))}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="badge badge-xs badge-primary absolute -top-1 -right-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </summary>
                <ul className="menu dropdown-content z-[1] mt-3 max-h-80 w-80 flex-nowrap overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow">
                  {notifications.length === 0 ? (
                    <li className="menu-title"><span>No recent notifications</span></li>
                  ) : (
                    notifications.map((notification) => (
                      <li key={notification.id}>
                        {notification.canJoin ? (
                          <Link to={`/live/${notification.lectureId}`}>
                            <NotificationDetails notification={notification} />
                          </Link>
                        ) : (
                          <NotificationDetails notification={notification} />
                        )}
                        {!notification.read && (
                          <span className="badge badge-primary badge-xs" aria-label="Unread" />
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </details>
            </div>

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