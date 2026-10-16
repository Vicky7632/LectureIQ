import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, DollarSign, CheckCircle, AlertCircle, UserPlus, Shield } from 'lucide-react'
import { adminApi } from '../../api/adminApi'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError(false)
      const response = await adminApi.getDashboardStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const displayStat = (value) =>
    loading || error ? '—' : Number(value || 0).toLocaleString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-banner rounded-2xl p-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="opacity-90">Manage platform activities and monitor performance</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          Dashboard statistics are temporarily unavailable.
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.totalStudents)}</h3>
                <p className="text-sm text-gray-500 mt-1">Registered student accounts</p>
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
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.totalTeachers)}</h3>
                <p className="text-sm text-gray-500 mt-1">Registered teacher accounts</p>
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
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.totalCourses)}</h3>
                <p className="text-sm text-gray-500 mt-1">All course statuses</p>
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
                <h3 className="text-2xl font-bold mt-2">{displayStat(stats.pendingApprovals)}</h3>
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
                <h3 className="text-2xl font-bold mt-2">
                  {loading || error ? '—' : `₹${Number(stats.totalRevenue || 0).toLocaleString()}`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">All-time successful payments</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
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
                <span className="badge badge-warning">{displayStat(stats.pendingApprovals)} pending</span>
              </div>
              
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : error ? (
                  <p className="text-sm text-error">Unable to load approval statistics.</p>
                ) : stats.pendingApprovals > 0 ? (
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Course Submissions</p>
                        <p className="text-sm opacity-75">{stats.pendingApprovals} courses awaiting review</p>
                      </div>
                      <Link to="/admin/approvals" className="btn btn-sm btn-warning">
                        Review
                      </Link>
                    </div>
                  </div>
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