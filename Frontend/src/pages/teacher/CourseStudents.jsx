import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Users, Mail, Calendar, Download } from 'lucide-react'
import { teacherApi } from '../../api/teacherApi'

const CourseStudents = () => {
  const { id: courseId } = useParams()
  const [students, setStudents] = useState([])
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [courseId])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await teacherApi.getCourseStudents(courseId)
      setStudents(response.data.students || [])
      if (response.data.courseTitle) {
        setCourseTitle(response.data.courseTitle)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to load enrolled students')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Email', 'Enrolled Date', 'Status']
    const rows = students.map(s => [
      `${s.student?.firstName || ''} ${s.student?.lastName || ''}`,
      s.student?.email || '',
      new Date(s.enrolledAt).toLocaleDateString(),
      s.status || 'active'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${courseTitle || 'course'}_students.csv`
    a.click()
  }

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
          <div className="flex items-center gap-2 mb-2">
            <Link to="/teacher/courses" className="btn btn-ghost btn-sm">
              <ArrowLeft size={16} />
              Back to Courses
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{courseTitle || 'Course Students'}</h1>
          <p className="text-gray-600 mt-1">
            {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-outline btn-sm">
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-12">
            <Users size={64} className="text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No students yet</h3>
            <p className="text-gray-600">
              This course doesn't have any enrolled students.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Enrolled Date</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          <span>
                            {item.student?.firstName?.charAt(0) || '?'}
                            {item.student?.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">
                          {item.student?.firstName} {item.student?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a href={`mailto:${item.student?.email}`} className="link link-primary">
                      {item.student?.email}
                    </a>
                  </td>
                  <td>{new Date(item.enrolledAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      item.status === 'active' ? 'badge-success' : 'badge-ghost'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress 
                        className="progress progress-primary w-20" 
                        value={item.progress || 0} 
                        max="100"
                      ></progress>
                      <span className="text-sm">{item.progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CourseStudents