import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

import { courseApi } from '../../api/courseApi'
import CourseForm from '../../components/teacher/CourseForm'
import Button from '../../components/common/Button'

const CreateCourse = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      const response = await courseApi.createCourse(formData)
      toast.success('Course created successfully!')
      navigate(`/teacher/course/${response.data.course._id}/edit`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <h1 className="pt-2 text-3xl font-semibold tracking-tight">Create New Course</h1>
        <p className="text-base-content/65">Fill in the details to create your course</p>
      </div>

      <CourseForm
        onSubmit={handleSubmit}
        loading={loading}
        submitButtonText="Create Course"
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}

export default CreateCourse