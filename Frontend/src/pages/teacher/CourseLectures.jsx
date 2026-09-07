import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Plus, Video, Edit, Trash2, Clock, Eye } from 'lucide-react'
import { teacherApi } from '../../api/teacherApi'

const CourseLectures = () => {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const [lectures, setLectures] = useState([])
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLectures()
  }, [courseId])

  const fetchLectures = async () => {
    try {
      setLoading(true)
      const response = await teacherApi.getCourseLectures(courseId)
      setLectures(response.data.lectures || [])
      setCourseTitle(response.data.courseTitle || 'Course Lectures')
    } catch (error) {
      console.error('Failed to fetch lectures:', error)
      toast.error('Failed to load lectures')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return
    
    try {
      await teacherApi.deleteLecture(lectureId)
      toast.success('Lecture deleted successfully')
      fetchLectures() // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lecture')
    }
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
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold">{courseTitle}</h1>
          <p className="text-gray-600 mt-1">
            Manage lectures for this course
          </p>
        </div>
        <Link
          to={`/teacher/course/${courseId}/create-lecture`}
          className="btn btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Add New Lecture
        </Link>
      </div>

      {/* Lectures List */}
      {lectures.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-12">
            <Video size={64} className="text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No lectures yet</h3>
            <p className="text-gray-600 mb-6">
              Start creating lectures for this course.
            </p>
            <Link
              to={`/teacher/course/${courseId}/create-lecture`}
              className="btn btn-primary"
            >
              <Plus size={20} className="mr-2" />
              Create First Lecture
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {lectures.map((lecture, index) => (
            <div
              key={lecture._id}
              className="card bg-base-100 shadow hover:shadow-md transition-shadow"
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{lecture.title}</h3>
                      {lecture.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {lecture.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {lecture.duration || 0} mins
                        </span>
                        {lecture.isPreview && (
                          <span className="badge badge-primary badge-sm">Preview</span>
                        )}
                        <span className={`badge badge-sm ${
                          lecture.lectureType === 'live' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {lecture.lectureType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/teacher/lecture/${lecture._id}/edit`}
                      className="btn btn-sm btn-ghost"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDeleteLecture(lecture._id)}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CourseLectures