import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Upload, Video, Clock } from 'lucide-react'
import { lectureApi } from '../../api/lectureApi'
import { courseApi } from '../../api/courseApi'

// Zod validation schema
const lectureSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  lectureType: z.enum(['recorded', 'live']),
  order: z.number().min(1, 'Order must be at least 1'),
  duration: z.number().min(0).default(0),
  isPreview: z.boolean().default(false),
})

const CreateLecture = () => {
  const { id: courseId } = useParams()
  console.log('Course ID from URL:', courseId)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [course, setCourse] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      title: '',
      description: '',
      lectureType: 'recorded',
      order: 1,
      duration: 0,
      isPreview: false,
    },
  })

  const lectureType = watch('lectureType')

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  const fetchCourseDetails = async () => {
    try {
      const response = await courseApi.getTeacherCourseLectures(courseId)
      const lectures = response.data.lectures || []
      setValue('order', lectures.length + 1)
      setCourse(response.data.courseTitle)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Failed to load course details')
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file must be less than 500MB')
      return
    }

    setVideoFile(file)

    // Get video duration
    const videoUrl = URL.createObjectURL(file)
    const videoElement = document.createElement('video')
    videoElement.preload = 'metadata'
    videoElement.onloadedmetadata = () => {
      const duration = Math.round(videoElement.duration / 60) // minutes
      setValue('duration', duration)
      URL.revokeObjectURL(videoUrl)
    }
    videoElement.src = videoUrl
  }

  const simulateUploadProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 95) {
        progress = 95
        clearInterval(interval)
      }
      setUploadProgress(Math.min(progress, 95))
    }, 200)
    return () => clearInterval(interval)
  }

  const onSubmit = async (data) => {
    console.log('Submitting with courseId:', courseId, data)
    if (!videoFile) {
      toast.error('Please select a video file')
      return
    }

    try {
      setLoading(true)
      setUploading(true)
      const cleanupProgress = simulateUploadProgress()

      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('courseId', courseId)
      formData.append('isPreview', data.isPreview)
      formData.append('lectureType', data.lectureType)
      formData.append('order', data.order)
      formData.append('duration', data.duration)

      await lectureApi.createLecture(formData)
      setUploadProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Lecture created successfully!')
      navigate(`/teacher/course/${courseId}`)
    } catch (error) {
      console.error('Failed to create lecture:', error)
      toast.error(error.response?.data?.message || 'Failed to create lecture')
    } finally {
      setLoading(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-3xl font-bold mt-4">Add New Lecture</h1>
        {course && (
          <p className="text-gray-600 mt-1">
            Course: <span className="font-medium">{course}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Lecture Details Card */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Lecture Details</h2>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Lecture Title</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Introduction to React"
                className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                {...register('title')}
              />
              {errors.title && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.title.message}</span>
                </label>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Description</span>
                <span className="label-text-alt text-gray-400">(optional)</span>
              </label>
              <textarea
                placeholder="Brief description of what this lecture covers..."
                className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`}
                {...register('description')}
              />
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.description.message}</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Lecture Type</span>
                </label>
                <select
                  className={`select select-bordered ${errors.lectureType ? 'select-error' : ''}`}
                  {...register('lectureType')}
                >
                  <option value="recorded">Recorded Video</option>
                  <option value="live">Live Session</option>
                </select>
                {errors.lectureType && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.lectureType.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Order</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`input input-bordered ${errors.order ? 'input-error' : ''}`}
                  {...register('order', { valueAsNumber: true })}
                />
                {errors.order && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.order.message}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Duration (minutes)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className={`input input-bordered w-full pl-10 ${errors.duration ? 'input-error' : ''}`}
                    {...register('duration', { valueAsNumber: true })}
                  />
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                {errors.duration && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.duration.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    {...register('isPreview')}
                  />
                  <span className="label-text font-medium">Available as preview</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Students can watch this lecture before enrolling
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Upload Card */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Video Content</h2>

            {uploading ? (
              <div className="text-center py-8">
                <div
                  className="radial-progress text-primary mb-4"
                  style={{ '--value': uploadProgress, '--size': '8rem' }}
                >
                  {Math.round(uploadProgress)}%
                </div>
                <p className="text-gray-600">Uploading video... Please wait</p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few minutes depending on file size
                </p>
              </div>
            ) : (
              <div className="form-control">
                <div className="flex items-center justify-center w-full">
                  <label
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-base-200 transition-colors ${
                      videoFile ? 'border-primary' : 'border-base-300'
                    }`}
                  >
                    {videoFile ? (
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <Video className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded">
                          <p className="font-medium truncate">{videoFile.name}</p>
                          <p className="text-sm opacity-75">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVideoFile(null)}
                          className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          MP4, AVI, MOV up to 500MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoChange}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Supported formats: MP4, AVI, MOV, WMV, FLV | Max size: 500MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
            disabled={loading || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary px-8"
            disabled={loading || uploading || !videoFile}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Creating...
              </>
            ) : (
              'Create Lecture'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateLecture