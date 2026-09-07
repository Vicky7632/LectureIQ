import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { BookOpen, CheckCircle, XCircle, AlertCircle, Search, Eye } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { courseApi } from '../../api/courseApi'

const AdminCourses = () => {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, published, rejected

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    let result = courses
    if (searchTerm) {
      result = result.filter(c => 
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacher?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacher?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filter !== 'all') {
      result = result.filter(c => c.status === filter)
    }
    setFilteredCourses(result)
  }, [courses, searchTerm, filter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAllCourses()
      setCourses(response.data.courses || [])
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (courseId) => {
    try {
      await courseApi.approveCourse(courseId)
      toast.success('Course approved')
      fetchCourses()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed')
    }
  }

  const handleReject = async (courseId) => {
    const reason = prompt('Please enter rejection reason:')
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required')
      return
    }
    try {
      await courseApi.rejectCourse(courseId, reason)
      toast.success('Course rejected')
      fetchCourses()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return <span className="badge badge-success gap-1"><CheckCircle size={14} /> Published</span>
      case 'pending': return <span className="badge badge-warning gap-1"><AlertCircle size={14} /> Pending</span>
      case 'rejected': return <span className="badge badge-error gap-1"><XCircle size={14} /> Rejected</span>
      default: return <span className="badge badge-ghost gap-1">Draft</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Courses</h1>
          <p className="text-gray-600 mt-1">
            {courses.length} total courses • {courses.filter(c => c.status === 'pending').length} pending approval
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses by title or instructor..."
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="tabs tabs-boxed bg-base-200 p-1">
          <button className={`tab ${filter === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`tab ${filter === 'pending' ? 'tab-active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`tab ${filter === 'published' ? 'tab-active' : ''}`} onClick={() => setFilter('published')}>Published</button>
          <button className={`tab ${filter === 'rejected' ? 'tab-active' : ''}`} onClick={() => setFilter('rejected')}>Rejected</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th>Price</th>
                <th>Lectures</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen size={20} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-bold">{course.title}</div>
                        <div className="text-xs opacity-50">ID: {course._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{course.teacher?.firstName} {course.teacher?.lastName}</td>
                  <td>{course.isPaid ? `₹${course.price}` : 'Free'}</td>
                  <td>{course.lecturesCount || 0}</td>
                  <td>{getStatusBadge(course.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/course/${course._id}`} className="btn btn-sm btn-ghost">
                        <Eye size={16} />
                      </Link>
                      {course.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(course._id)} className="btn btn-sm btn-success">Approve</button>
                          <button onClick={() => handleReject(course._id)} className="btn btn-sm btn-error">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8">No courses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminCourses