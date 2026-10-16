import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { BookOpen, Users, TrendingUp, PlayCircle, ChevronRight, Calendar } from 'lucide-react'
import { courseApi } from '../../api/courseApi'
import { enrollmentApi } from '../../api/enrollmentApi'
import { liveApi } from '../../api/liveApi'
import { useSocket } from '../../contexts/socketContextHooks'
import {
  mergeLiveSessionSnapshot,
  notifyLiveLectureOnce,
  syncCourseSubscriptions,
} from '../../contexts/socketClientConfig'

const formatLiveTime = (value) => {
  if (!value) return 'Scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Scheduled'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const socket = useSocket()
  const [courses, setCourses] = useState([])
  const [liveSessions, setLiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedLectures: 0,
    inProgressCourses: 0,
    progress: 0
  })
  const subscribedCoursesRef = useRef(new Set())
  const subscriptionAttemptsRef = useRef(new Map())
  const notifiedLectureIdsRef = useRef(new Set())
  const knownLiveStatusesRef = useRef(new Map())
  const liveSnapshotInitializedRef = useRef(false)

  const notifyLectureStarted = useCallback((session) => {
    notifyLiveLectureOnce(session, notifiedLectureIdsRef.current, (lecture) => {
      toast.success(`A live class is now starting: ${lecture.title || 'Live class'}`)
    })
  }, [])

  const refreshLiveSessions = useCallback(async () => {
    try {
      const enrollRes = await enrollmentApi.getMyEnrollments();
      const enrollments = (enrollRes.data.enrollments || []).filter(
        (enrollment) => enrollment.status === 'active'
      )
      const courseIds = enrollments
        .map((enrollment) => enrollment.course?._id)
        .filter(Boolean)

      const results = await Promise.allSettled(
        courseIds.map((courseId) => liveApi.getUpcoming(courseId))
      )

      const sessions = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.data.sessions || [] : []
      )

      setLiveSessions(
        mergeLiveSessionSnapshot(
          sessions,
          knownLiveStatusesRef.current,
          (session) => {
            if (liveSnapshotInitializedRef.current) {
              notifyLectureStarted(session)
            }
          }
        )
      )
      liveSnapshotInitializedRef.current = true

      syncCourseSubscriptions(
        socket,
        subscribedCoursesRef.current,
        subscriptionAttemptsRef.current,
        courseIds,
        (error) => console.warn('Failed to subscribe to course live updates:', error)
      )
    } catch (error) {
      console.error('Failed to fetch live sessions:', error)
      toast.error('Unable to load live classrooms right now')
    }
  }, [notifyLectureStarted, socket])

  useEffect(() => {
    if (!socket) return undefined
    const subscribedCourses = subscribedCoursesRef.current
    const subscriptionAttempts = subscriptionAttemptsRef.current

    const updateSessionState = (payload) => {
      if (!payload?.lectureId) return
      const lectureId = String(payload.lectureId)
      const status = payload.liveStatus
      if (status) knownLiveStatusesRef.current.set(lectureId, status)
      if (status === 'live') {
        notifyLectureStarted({ ...payload, _id: lectureId })
      }

      setLiveSessions((previous) => {
        const existingIndex = previous.findIndex((session) => String(session._id) === lectureId)
        if (existingIndex >= 0) {
          return previous.map((session) =>
            String(session._id) === lectureId
              ? { ...session, ...payload, liveStatus: payload.liveStatus || session.liveStatus }
              : session
          )
        }

        return [
          {
            _id: payload.lectureId,
            title: payload.title || 'Live class',
            description: payload.description || '',
            liveStatus: payload.liveStatus || 'live',
            createdAt: payload.startedAt || payload.endedAt || new Date().toISOString(),
            course: payload.courseId,
          },
          ...previous,
        ]
      })

    }

    const handleStarted = (payload) => updateSessionState({ ...payload, liveStatus: 'live' })
    const handleEnded = (payload) => updateSessionState({ ...payload, liveStatus: 'ended' })
    const handleConnect = () => {
      void refreshLiveSessions()
    }
    const handleDisconnect = () => {
      subscribedCoursesRef.current.clear()
      subscriptionAttemptsRef.current.clear()
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
      subscribedCourses.clear()
      subscriptionAttempts.clear()
    }
  }, [notifyLectureStarted, refreshLiveSessions, socket])

  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setStatsError(false)
      const [coursesRes, dashboardRes] = await Promise.all([
        courseApi.getPublishedCourses(),
        enrollmentApi.getMyCoursesDashboard(),
        refreshLiveSessions(),
      ])

      setCourses(coursesRes.data.courses.slice(0, 4))
      const enrolledCourses = dashboardRes.data.courses || []
      const totalLectures = enrolledCourses.reduce(
        (total, course) => total + (Number(course.totalLectures) || 0),
        0
      )
      const completedLectures = enrolledCourses.reduce(
        (total, course) => total + (Number(course.completedLectures) || 0),
        0
      )
      setStats({
        enrolledCourses: enrolledCourses.length,
        completedLectures,
        inProgressCourses: enrolledCourses.filter(
          (course) => course.lastWatchedLecture && course.progressPercent < 100
        ).length,
        progress:
          totalLectures === 0
            ? 0
            : Math.round((completedLectures / totalLectures) * 100),
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setStatsError(true)
      setStats({
        enrolledCourses: 0,
        completedLectures: 0,
        inProgressCourses: 0,
        progress: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [refreshLiveSessions])
  const displayStat = (value) =>
    loading || statsError ? '—' : Number(value || 0).toLocaleString()

  return (
    <div className="space-y-6">
      <div className="dashboard-banner rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="opacity-90">Continue your learning journey</p>
          </div>
          <Link to="/courses" className="btn btn-accent mt-4 md:mt-0">
            Browse Courses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.enrolledCourses)}</h3>
                <p className="text-sm text-gray-500 mt-1">Active courses</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Lectures</p>
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.completedLectures)}</h3>
                <p className="text-sm text-gray-500 mt-1">Across your courses</p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <PlayCircle className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Courses in Progress</p>
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.inProgressCourses)}</h3>
                <p className="text-sm text-gray-500 mt-1">Started, not yet completed</p>
              </div>
              <div className="p-3 rounded-full bg-accent/10">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <h3 className="text-2xl font-bold mt-2">{statsError || loading ? '—' : `${stats.progress}%`}</h3>
                <p className="text-sm text-gray-500 mt-1">Completed lectures / total lectures</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {statsError && (
        <p role="alert" className="text-sm text-error">
          Dashboard statistics are temporarily unavailable.
        </p>
      )}

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Live & Upcoming Classes</h2>
            <Link to="/student/upcoming-live" className="link link-primary text-sm">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : liveSessions.length === 0 ? (
            <p className="text-gray-500">No live or upcoming classes right now.</p>
          ) : (
            <div className="space-y-3">
              {liveSessions.map((session) => {
                const isLive = session.liveStatus === 'live'
                return (
                  <div key={session._id} className="rounded-xl border border-base-300 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`badge ${isLive ? 'badge-success' : 'badge-ghost'}`}>
                            {isLive ? 'Live now' : 'Upcoming'}
                          </span>
                          <span className="text-xs text-gray-500">{session.course ? 'Course session' : 'Live classroom'}</span>
                        </div>
                        <h3 className="font-semibold">{session.title}</h3>
                        <p className="text-sm text-gray-500">
                          {session.description || 'Live classroom session'}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {isLive ? 'Started' : 'Scheduled'}:{' '}
                          {formatLiveTime(
                            isLive
                              ? session.startedAt || session.scheduledAt
                              : session.scheduledAt || session.createdAt
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <Link to={`/live/${session._id}`} className="btn btn-primary btn-sm">
                            Join now
                          </Link>
                        ) : (
                          <button type="button" className="btn btn-outline btn-sm" disabled>
                            Upcoming
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Recommended Courses</h2>
              <Link to="/courses" className="link link-primary text-sm">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course._id} className="flex min-w-0 items-center gap-3 rounded-lg p-3 transition-colors hover:bg-base-200 sm:gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-16 sm:w-16">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words font-semibold">{course.title}</h4>
                      <p className="text-sm text-gray-500">{course.teacher?.firstName} {course.teacher?.lastName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="badge badge-sm">{course.level}</span>
                        <span className="text-sm">{course.price > 0 ? `₹${course.price}` : 'Free'}</span>
                      </div>
                    </div>
                    <Link aria-label={`View ${course.title}`} to={`/course/${course._id}`} className="btn btn-sm btn-ghost btn-circle shrink-0">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/courses" className="btn btn-primary w-full justify-start">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse All Courses
              </Link>
              <Link to="/student/upcoming-live" className="btn btn-outline w-full justify-start">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Live Sessions
              </Link>
              <Link to="/student/my-courses" className="btn btn-outline w-full justify-start">
                <PlayCircle className="w-5 h-5 mr-2" />
                My Learning Path
              </Link>
              <Link to="/profile" className="btn btn-outline w-full justify-start">
                <Users className="w-5 h-5 mr-2" />
                Complete Profile
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard