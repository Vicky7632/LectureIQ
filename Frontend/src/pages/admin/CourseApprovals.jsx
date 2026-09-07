import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { adminApi, courseApi } from '../../api'
import CourseApprovalCard from '../../components/admin/CourseApprovalCard'
import Loader from '../../components/common/Loader'
import Alert from '../../components/common/Alert'
import Card from '../../components/common/Card'
import { CheckCircle } from 'lucide-react'

const CourseApprovals = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingCourses()
  }, [])

  const fetchPendingCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getAllCourses()
      const pendingCourses = (response.data.courses || []).filter(c => c.status === 'pending')
      setCourses(pendingCourses)
    } catch (err) {
      console.error('Failed to fetch pending courses:', err)
      setError('Failed to load pending courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (courseId) => {
    try {
      setProcessingId(courseId)
      await courseApi.approveCourse(courseId)
      toast.success('Course approved successfully')
      setCourses(prev => prev.filter(c => c._id !== courseId))
    } catch (err) {
      console.error('Approval failed:', err)
      toast.error(err.response?.data?.message || 'Failed to approve course')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (courseId) => {
    const reason = window.prompt('Please enter rejection reason:')
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required')
      return
    }

    try {
      setProcessingId(courseId)
      await courseApi.rejectCourse(courseId, reason)
      toast.success('Course rejected')
      setCourses(prev => prev.filter(c => c._id !== courseId))
    } catch (err) {
      console.error('Rejection failed:', err)
      toast.error(err.response?.data?.message || 'Failed to reject course')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Approvals</h1>
          <p className="text-gray-600 mt-1">
            {courses.length} course(s) pending review
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {!loading && courses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-success mb-4" />
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p className="text-gray-500">No courses pending approval.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <CourseApprovalCard
              key={course._id}
              course={course}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={processingId === course._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CourseApprovals