import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Clock, TrendingUp, PlayCircle, ChevronRight, Calendar } from 'lucide-react'
import { courseApi } from '../../api/courseApi'

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedLectures: 0,
    totalHours: 0,
    progress: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [coursesRes] = await Promise.all([
        courseApi.getPublishedCourses()
      ])

      setCourses(coursesRes.data.courses.slice(0, 4))

      // Mock stats - you would get these from your backend
      setStats({
        enrolledCourses: 5,
        completedLectures: 12,
        totalHours: 24,
        progress: 65
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-primary to-secondary text-primary-content p-6 rounded-2xl shadow-lg">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
                <h3 className="text-2xl font-bold mt-2">{stats.enrolledCourses}</h3>
                <p className="text-sm text-success mt-1">+2 this month</p>
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
                <h3 className="text-2xl font-bold mt-2">{stats.completedLectures}</h3>
                <p className="text-sm text-success mt-1">+5 this week</p>
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
                <p className="text-sm text-gray-500">Learning Hours</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalHours}h</h3>
                <p className="text-sm text-success mt-1">+8h this month</p>
              </div>
              <div className="p-3 rounded-full bg-accent/10">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <h3 className="text-2xl font-bold mt-2">{stats.progress}%</h3>
                <p className="text-sm text-success mt-1">+12% this month</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Courses & Continue Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Courses */}
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
                  <div key={course._id} className="flex items-center gap-4 p-3 hover:bg-base-200 rounded-lg transition-colors">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{course.title}</h4>
                      <p className="text-sm text-gray-500">{course.teacher?.firstName} {course.teacher?.lastName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="badge badge-sm">{course.level}</span>
                        <span className="text-sm">{course.price > 0 ? `₹${course.price}` : 'Free'}</span>
                      </div>
                    </div>
                    <Link to={`/course/${course._id}`} className="btn btn-sm btn-ghost">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
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
              <Link to="/my-courses" className="btn btn-outline w-full justify-start">
                <PlayCircle className="w-5 h-5 mr-2" />
                My Learning Path
              </Link>
              <Link to="/profile" className="btn btn-outline w-full justify-start">
                <Users className="w-5 h-5 mr-2" />
                Complete Profile
              </Link>
            </div>

            {/* Upcoming Deadlines */}
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Advanced JavaScript</p>
                      <p className="text-sm opacity-75">Assignment due tomorrow</p>
                    </div>
                    <span className="badge badge-warning">Urgent</span>
                  </div>
                </div>
                <div className="p-3 bg-info/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">React Project</p>
                      <p className="text-sm opacity-75">Submission in 3 days</p>
                    </div>
                    <span className="badge badge-info">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard