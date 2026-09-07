import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

import { teacherApi } from '../../api/teacherApi'
import { courseApi } from '../../api/courseApi'
import CourseForm from '../../components/teacher/CourseForm'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'

const EditCourse = () => {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await teacherApi.getMyCourses()
      const courses = response.data.courses || []
      const foundCourse = courses.find(c => c._id === courseId)
      
      if (!foundCourse) {
        toast.error('Course not found or you do not have permission')
        navigate('/teacher/courses')
        return
      }

      // Check if editable
      if (!['draft', 'rejected'].includes(foundCourse.status)) {
        toast.error('This course cannot be edited at its current stage')
        navigate('/teacher/courses')
        return
      }

      setCourse(foundCourse)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Failed to load course details')
      navigate('/teacher/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true)
      const response = await courseApi.editCourse(courseId, formData)
      toast.success('Course updated successfully!')
      navigate('/teacher/courses')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader fullScreen />
  if (!course) return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">Edit Course</h1>
        <p className="text-gray-600">
          Update your course details – changes will be saved as a draft.
        </p>
        {course.status === 'rejected' && course.rejectionReason && (
          <div className="mt-4 p-4 bg-error/10 text-error rounded-lg">
            <p className="font-semibold">Rejection reason:</p>
            <p>{course.rejectionReason}</p>
          </div>
        )}
      </div>

      <CourseForm
        initialData={course}
        onSubmit={handleSubmit}
        loading={submitting}
        submitButtonText="Save Changes"
        onCancel={() => navigate('/teacher/courses')}
      />
    </div>
  )
}

export default EditCourse