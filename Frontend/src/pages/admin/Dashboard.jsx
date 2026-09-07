import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, BookOpen, DollarSign, CheckCircle, XCircle, AlertCircle,
  UserPlus, Shield  // 👈 naye icons import kiye
} from 'lucide-react'
import { adminApi } from '../../api/adminApi'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    totalRevenue: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      // Mock data - you would integrate with actual APIs
      setStats({
        totalStudents: 1245,
        totalTeachers: 45,
        totalCourses: 89,
        pendingApprovals: 7,
        totalRevenue: 1250000
      })
      
      setRecentActivities([
        { type: 'course_approved', title: 'React Masterclass', user: 'John Doe', time: '2 hours ago' },
        { type: 'teacher_verified', title: 'Teacher Verification', user: 'Jane Smith', time: '4 hours ago' },
        { type: 'payment_received', title: 'Course Purchase', user: 'Bob Wilson', amount: 2999, time: '1 day ago' },
        { type: 'course_submitted', title: 'Python for Beginners', user: 'Mike Johnson', time: '2 days ago' }
      ])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'course_approved': return <CheckCircle className="w-5 h-5 text-success" />
      case 'teacher_verified': return <Users className="w-5 h-5 text-info" />
      case 'payment_received': return <DollarSign className="w-5 h-5 text-success" />
      case 'course_submitted': return <AlertCircle className="w-5 h-5 text-warning" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-primary to-red-600 text-primary-content p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="opacity-90">Manage platform activities and monitor performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* ... stats cards (same as before) ... */}
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalStudents.toLocaleString()}</h3>
                <p className="text-sm text-success mt-1">+124 this month</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Teachers</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalTeachers}</h3>
                <p className="text-sm text-success mt-1">+3 this month</p>
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
                <p className="text-sm text-gray-500">Total Courses</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalCourses}</h3>
                <p className="text-sm text-success mt-1">+8 this month</p>
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
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <h3 className="text-2xl font-bold mt-2">{stats.pendingApprovals}</h3>
                <p className="text-sm text-warning mt-1">Requires attention</p>
              </div>
              <div className="p-3 rounded-full bg-warning/10">
                <AlertCircle className="w-6 h-6 text-warning" />
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
              <div className="p-3 rounded-full bg-success/10">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Recent Activities</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.type === 'payment_received' 
                          ? `${activity.user} purchased a course - ₹${activity.amount}`
                          : `${activity.user} - ${activity.type.replace('_', ' ')}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Pending Approvals */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Existing buttons */}
                <Link to="/admin/teachers" className="btn btn-outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Teachers
                </Link>
                <Link to="/admin/courses" className="btn btn-outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage Courses
                </Link>
                <Link to="/admin/approvals" className="btn btn-outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Course Approvals
                </Link>
                <Link to="/admin/payments" className="btn btn-outline">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Payments
                </Link>
                
                {/* 👇 Naye buttons yahan add kiye */}
                <Link to="/admin/create-teacher" className="btn btn-outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Link>
                <Link to="/admin/create-admin" className="btn btn-outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Add Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Pending Approvals</h2>
                <span className="badge badge-warning">{stats.pendingApprovals} pending</span>
              </div>
              
              <div className="space-y-3">
                {stats.pendingApprovals > 0 ? (
                  <>
                    <div className="p-3 bg-warning/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Course Submissions</p>
                          <p className="text-sm opacity-75">3 courses awaiting review</p>
                        </div>
                        <Link to="/admin/approvals" className="btn btn-sm btn-warning">
                          Review
                        </Link>
                      </div>
                    </div>
                    <div className="p-3 bg-info/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Teacher Verifications</p>
                          <p className="text-sm opacity-75">4 teachers awaiting approval</p>
                        </div>
                        <Link to="/admin/teachers?status=pending" className="btn btn-sm btn-info">
                          Verify
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 mx-auto text-success mb-2" />
                    <p className="text-gray-500">No pending approvals</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard