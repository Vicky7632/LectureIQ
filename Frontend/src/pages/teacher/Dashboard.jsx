import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { BookOpen, Users, DollarSign, TrendingUp, Plus ,Calendar} from 'lucide-react'
import { teacherApi } from '../../api/teacherApi'
import { logout } from '../../store/slices/authSlice'

const TeacherDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    pendingCourses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)
      const [coursesRes, statsRes] = await Promise.all([
        teacherApi.getMyCourses(),
        teacherApi.getDashboardStats()
      ])
      
      setCourses(coursesRes.data.courses || [])
      setStats(statsRes.data || {})
    } catch (error) {
      console.error('Failed to fetch teacher data:', error)
      
      if (error.response?.status === 401) {
        dispatch(logout())
        navigate('/login')
        toast.error('Session expired. Please login again.')
      } else {
        toast.error('Failed to load dashboard data')
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          pendingCourses: 0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-primary to-purple-600 text-primary-content p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="opacity-90">Manage your courses and track performance</p>
          </div>
          <Link to="/teacher/create-course" className="btn btn-accent mt-4 md:mt-0">
            <Plus size={20} className="mr-2" />
            Create New Course
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courses</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalCourses}</h3>
                <p className="text-sm text-success mt-1">
                  {stats.pendingCourses > 0 ? `${stats.pendingCourses} pending` : 'All published'}
                </p>
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
                <p className="text-sm text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalStudents}</h3>
                <p className="text-sm text-success mt-1">+12 this month</p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString()}</h3>
                <p className="text-sm text-success mt-1">+15% this month</p>
              </div>
              <div className="p-3 rounded-full bg-accent/10">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-2">78%</h3>
                <p className="text-sm text-success mt-1">+8% this month</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Management & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">My Courses</h2>
              <Link to="/teacher/courses" className="link link-primary text-sm">
                View all
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-3 hover:bg-base-200 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge badge-sm ${
                            course.status === 'published' ? 'badge-success' :
                            course.status === 'pending' ? 'badge-warning' :
                            course.status === 'draft' ? 'badge-info' : 'badge-error'
                          }`}>
                            {course.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {course.price > 0 ? `₹${course.price}` : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/teacher/course/${course._id}`} className="btn btn-sm btn-ghost">
                        View
                      </Link>
                      {course.status === 'draft' && (
                        <button className="btn btn-sm btn-primary">
                          Submit for Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No courses created yet</p>
                <Link to="/teacher/create-course" className="btn btn-primary">
                  Create Your First Course
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - cleaned up */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/teacher/create-course" className="btn btn-primary w-full justify-start">
                <Plus className="w-5 h-5 mr-2" />
                Create New Course
              </Link>
              <Link to="/teacher/schedule-live" className="btn btn-outline w-full justify-start">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Live Lecture
              </Link>
              {/* 🚫 Inhe hata diya – kyunki inme course ID chahiye */}
              {/* <Link to="/teacher/create-lecture" className="btn btn-outline w-full justify-start">
                <FileText className="w-5 h-5 mr-2" />
                Add Lecture
              </Link>
              <Link to="/teacher/students" className="btn btn-outline w-full justify-start">
                <Users className="w-5 h-5 mr-2" />
                View Students
              </Link>
              <Link to="/teacher/analytics" className="btn btn-outline w-full justify-start">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Analytics
              </Link> */}
            </div>

            {/* Pending Actions */}
            <div className="mt-8">
              <h3 className="font-semibold mb-4">Pending Actions</h3>
              <div className="space-y-3">
                {stats.pendingCourses > 0 && (
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Course Review</p>
                        <p className="text-sm opacity-75">{stats.pendingCourses} course(s) pending admin approval</p>
                      </div>
                      <Link to="/teacher/courses?status=pending" className="btn btn-sm btn-warning">
                        Review
                      </Link>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-info/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Student Questions</p>
                      <p className="text-sm opacity-75">5 new questions awaiting response</p>
                    </div>
                    <button className="btn btn-sm btn-info">Respond</button>
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

export default TeacherDashboard