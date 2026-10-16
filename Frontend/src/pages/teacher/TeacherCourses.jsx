import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  BookOpen, PlusCircle, Edit, Video, Users, 
  CheckCircle, Clock, AlertCircle, Eye, XCircle,
  PlayCircle, Calendar
} from 'lucide-react'
import { teacherApi } from '../../api/teacherApi'
import { courseApi } from '../../api/courseApi'
import { liveApi } from '../../api/liveApi'   // 👈 liveApi import kiya

const TeacherCourses = () => {
  const [courses, setCourses] = useState([])
  const [liveSessions, setLiveSessions] = useState([])   // 👈 naya state
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [startingSessionId, setStartingSessionId] = useState(null)
  const [submittingCourseId, setSubmittingCourseId] = useState(null)
  const submissionInFlightRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()   // 👈 ab ek saath courses aur live sessions fetch honge
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await teacherApi.getMyCourses()
      const coursesList = response.data.courses || []
      setCourses(coursesList)
      
      // 🆕 Fetch live sessions for each course
      const sessionsResults = await Promise.allSettled(
        coursesList.map((course) => liveApi.getUpcoming(course._id))
      )
      const failedSessionRequests = sessionsResults.filter(
        (result) => result.status === 'rejected'
      )
      if (failedSessionRequests.length > 0) {
        console.error('Failed to load live sessions:', failedSessionRequests)
        toast.error('Some live sessions could not be loaded')
      }
      const allSessions = sessionsResults.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.data.sessions || [] : []
      )
      setLiveSessions(allSessions)
      
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load your courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async (courseId) => {
    if (submissionInFlightRef.current) return

    submissionInFlightRef.current = true
    setSubmittingCourseId(courseId)
    try {
      const response = await courseApi.submitForReview(courseId)
      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course._id === courseId
            ? { ...course, ...response.data.course }
            : course
        )
      )
      toast.success('Course submitted for review')
      await fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed')
    } finally {
      submissionInFlightRef.current = false
      setSubmittingCourseId(null)
    }
  }

  const handleStartSession = async (lectureId) => {
    if (startingSessionId) return

    setStartingSessionId(lectureId)
    try {
      const response = await liveApi.start(lectureId)
      if (response.data?.lecture?.liveStatus !== 'live') {
        throw new Error(response.data?.message || 'The session did not start')
      }
      navigate(`/live/${lectureId}`)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to start session')
    } finally {
      setStartingSessionId(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'badge-ghost', icon: Clock, text: 'Draft' },
      pending: { class: 'badge-warning', icon: AlertCircle, text: 'Pending Review' },
      published: { class: 'badge-success', icon: CheckCircle, text: 'Published' },
      rejected: { class: 'badge-error', icon: XCircle, text: 'Rejected' }
    }
    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon
    return (
      <span className={`badge ${config.class} gap-1`}>
        <Icon size={14} />
        {config.text}
      </span>
    )
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true
    return course.status === filter
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-semibold tracking-tight">My Courses</h1>
          <p className="mt-1 text-base-content/65">Manage your courses and track their status</p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <Link to="/teacher/schedule-live" className="btn btn-outline w-full sm:w-auto">
            <Calendar size={18} className="mr-2" />
            Schedule Live
          </Link>
          <Link to="/teacher/create-course" className="btn btn-primary w-full sm:w-auto">
            <PlusCircle size={20} className="mr-2" />
            Create New Course
          </Link>
        </div>
      </div>

      {/* 🆕 Live Sessions Section */}
      {liveSessions.length > 0 && (
        <div className="card bg-base-100 shadow-lg border-l-4 border-primary">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <Calendar className="text-primary" />
              Upcoming Live Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {liveSessions.map((session) => (
                <div key={session._id} className="flex min-w-0 flex-col gap-4 rounded-lg bg-base-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold">{session.title}</h4>
                    <p className="break-words text-sm text-base-content/70">
                      Course: {courses.find(c => c._id === session.course)?.title || 'Unknown'}
                    </p>
                    <p className="break-words text-sm text-base-content/60">
                      Scheduled: {session.scheduledAt
                        ? new Intl.DateTimeFormat(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(session.scheduledAt))
                        : 'Time not set'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartSession(session._id)}
                    disabled={Boolean(startingSessionId)}
                    className="btn btn-primary btn-sm w-full gap-2 sm:w-auto"
                  >
                    <PlayCircle size={16} />
                    {startingSessionId === session._id ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed w-full bg-base-200 p-1">
        <button
          className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({courses.length})
        </button>
        <button
          className={`tab ${filter === 'draft' ? 'tab-active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Draft ({courses.filter(c => c.status === 'draft').length})
        </button>
        <button
          className={`tab ${filter === 'pending' ? 'tab-active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({courses.filter(c => c.status === 'pending').length})
        </button>
        <button
          className={`tab ${filter === 'published' ? 'tab-active' : ''}`}
          onClick={() => setFilter('published')}
        >
          Published ({courses.filter(c => c.status === 'published').length})
        </button>
        <button
          className={`tab ${filter === 'rejected' ? 'tab-active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({courses.filter(c => c.status === 'rejected').length})
        </button>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body items-center text-center py-12">
            <BookOpen size={64} className="text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't created any courses yet." 
                : `You don't have any ${filter} courses.`}
            </p>
            {filter === 'all' && (
              <Link to="/teacher/create-course" className="btn btn-primary">
                Create Your First Course
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div key={course._id} className="card min-w-0 bg-base-100 transition-shadow hover:shadow-xl">
              <div className="card-body">
                {/* Header with title and status */}
                <div className="mb-2 flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <h2 className="card-title min-w-0 flex-1 text-xl">{course.title}</h2>
                  <span className="shrink-0">{getStatusBadge(course.status)}</span>
                </div>

                {/* Course details */}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Video size={16} />
                    <span>{course.lecturesCount || 0} lectures</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{course.enrolledStudents?.length || 0} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">
                      {course.isPaid ? `₹${course.price}` : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Rejection reason */}
                {course.status === 'rejected' && course.rejectionReason && (
                  <div className="mt-3 p-3 bg-error/10 text-error rounded-lg text-sm">
                    <span className="font-semibold">Rejection reason:</span> {course.rejectionReason}
                  </div>
                )}

                {/* Action buttons */}
                <div className="card-actions mt-4 flex-wrap justify-start gap-2 sm:justify-end">
                  {/* View / Edit */}
                  {course.status === 'published' && (
                    <Link to={`/course/${course._id}`} className="btn btn-sm btn-ghost">
                      <Eye size={16} className="mr-1" />
                      View
                    </Link>
                  )}
                  
                  {(course.status === 'draft' || course.status === 'rejected') && (
                    <Link to={`/teacher/course/${course._id}/edit`} className="btn btn-sm btn-primary">
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Link>
                  )}

                  {/* Add Lecture */}
                  {(course.status === 'draft' || course.status === 'rejected') && (
                    <Link to={`/teacher/course/${course._id}/create-lecture`}
                          className="btn btn-sm btn-outline">
                      <Video size={16} className="mr-1" />
                      Add Lecture
                    </Link>
                  )}

                  {/* Submit for Review */}
                  {course.status === 'draft' && course.lecturesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSubmitForReview(course._id)}
                      disabled={Boolean(submittingCourseId)}
                      className="btn btn-sm btn-success"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      {submittingCourseId === course._id ? 'Submitting...' : 'Submit for Review'}
                    </button>
                  )}

                  {/* View Students */}
                  <Link to={`/teacher/course/${course._id}/students`} className="btn btn-sm btn-ghost">
                    <Users size={16} className="mr-1" />
                    Students
                  </Link>

                  {/* Manage Lectures */}
                  {(course.status === 'published' || course.status === 'pending') && (
                    <Link to={`/teacher/course/${course._id}/lectures`} className="btn btn-sm btn-ghost">
                      <Video size={16} className="mr-1" />
                      Lectures
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeacherCourses