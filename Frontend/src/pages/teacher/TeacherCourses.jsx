import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  BookOpen, PlusCircle, Edit, Video, Users, 
  CheckCircle, Clock, AlertCircle, Eye, XCircle,
  PlayCircle, Calendar   // 👈 naye icons import kiye
} from 'lucide-react'
import { teacherApi } from '../../api/teacherApi'
import { courseApi } from '../../api/courseApi'
import { liveApi } from '../../api/liveApi'   // 👈 liveApi import kiya

const TeacherCourses = () => {
  const [courses, setCourses] = useState([])
  const [liveSessions, setLiveSessions] = useState([])   // 👈 naya state
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()   // 👈 ab ek saath courses aur live sessions fetch honge
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await teacherApi.getMyCourses()
      console.log('📦 API Response:', response.data)
      const coursesList = response.data.courses || []
      setCourses(coursesList)
      
      // 🆕 Fetch live sessions for each course
      const sessionsPromises = coursesList.map(course => 
        liveApi.getUpcoming(course._id).catch(() => ({ data: { sessions: [] } }))
      )
      const sessionsResults = await Promise.all(sessionsPromises)
      const allSessions = sessionsResults.flatMap(res => res.data.sessions || [])
      setLiveSessions(allSessions)
      
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load your courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async (courseId) => {
    try {
      await courseApi.submitForReview(courseId)
      toast.success('Course submitted for review')
      fetchData()   // 👈 refresh after submit
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed')
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-gray-600 mt-1">Manage your courses and track their status</p>
        </div>
        <Link to="/teacher/create-course" className="btn btn-primary">
          <PlusCircle size={20} className="mr-2" />
          Create New Course
        </Link>
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
                <div key={session._id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold">{session.title}</h4>
                    <p className="text-sm text-gray-600">
                      Course: {courses.find(c => c._id === session.course)?.title || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Scheduled: {new Date(session.scheduledTime).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/live/${session._id}`}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <PlayCircle size={16} />
                    Start Live
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
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
            <div key={course._id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                {/* Header with title and status */}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="card-title text-xl">{course.title}</h2>
                  {getStatusBadge(course.status)}
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
                <div className="card-actions justify-end mt-4 gap-2">
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
                          onClick={() => console.log('Course ID:', course._id)} 
                          className="btn btn-sm btn-outline">
                      <Video size={16} className="mr-1" />
                      Add Lecture
                    </Link>
                  )}

                  {/* Submit for Review */}
                  {course.status === 'draft' && course.lecturesCount > 0 && (
                    <button onClick={() => handleSubmitForReview(course._id)} className="btn btn-sm btn-success">
                      <CheckCircle size={16} className="mr-1" />
                      Submit for Review
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