import React, { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Upload, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'

const categories = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Artificial Intelligence',
  'Cyber Security',
  'Cloud Computing',
  'DevOps',
  'UI/UX Design',
  'Business',
  'Marketing',
  'Finance'
]

const CourseForm = ({
  initialData = null,
  onSubmit,
  loading = false,
  submitButtonText = 'Create Course',
  onCancel
}) => {
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail || '')
  const isEditing = Boolean(initialData)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      level: initialData?.level || 'beginner',
      price: initialData?.price || 0,
      isPaid: initialData?.isPaid || false,
      thumbnail: initialData?.thumbnail || ''
    }
  })

  const isPaid = useWatch({ control, name: 'isPaid' })

  const handleThumbnailChange = (e) => {
    if (isEditing) return
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail size should be less than 5MB')
      return
    }

    setThumbnail(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleFormSubmit = (data) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category', data.category)
    formData.append('level', data.level)
    formData.append('price', data.isPaid ? Number(data.price) : 0)
    
    if (thumbnail) {
      formData.append('thumbnail', thumbnail)
    } else if (data.thumbnail) {
      formData.append('thumbnailUrl', data.thumbnail)
    }

    onSubmit(formData, data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full space-y-6">
      {/* Basic Information Card */}
      <Card>
        <h2 className="card-title text-lg">Basic Information</h2>
        
        <Input
          label="Course Title"
          placeholder="e.g., Complete Web Development Bootcamp"
          required
          error={errors.title?.message}
          {...register('title', { 
            required: 'Title is required',
            minLength: { value: 3, message: 'Title must be at least 3 characters' }
          })}
        />

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Description <span className="text-error">*</span></span>
          </label>
          <textarea
            placeholder="Describe what students will learn in this course..."
            className={`textarea textarea-bordered h-32 w-full ${errors.description ? 'textarea-error' : ''}`}
            {...register('description', { 
              required: 'Description is required',
              minLength: { value: 20, message: 'Description must be at least 20 characters' }
            })}
          />
          {errors.description && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.description.message}</span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Category <span className="text-error">*</span></span>
            </label>
            <select
              className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.category.message}</span>
              </label>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Level <span className="text-error">*</span></span>
            </label>
            <select
              className={`select select-bordered w-full ${errors.level ? 'select-error' : ''}`}
              {...register('level', { required: 'Level is required' })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            {errors.level && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.level.message}</span>
              </label>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing Card */}
      <Card>
        <h2 className="card-title text-lg">Pricing</h2>
        
        <div className="form-control">
          <label className="cursor-pointer label justify-start gap-4">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              {...register('isPaid')}
            />
            <span className="label-text">This is a paid course</span>
          </label>
        </div>

        {isPaid && (
          <div className="mt-4">
            <Input
              label="Price (INR)"
              type="number"
              min="1"
              step="1"
              placeholder="Enter course price"
              icon={() => <span className="text-gray-500">₹</span>}
              error={errors.price?.message}
              required={isPaid}
              {...register('price', {
                required: isPaid ? 'Price is required for paid courses' : false,
                min: { value: 1, message: 'Price must be at least ₹1' }
              })}
            />
          </div>
        )}
      </Card>

      {/* Thumbnail Card */}
      <Card>
        <h2 className="card-title text-lg">Course Thumbnail</h2>
        <p className="text-sm leading-6 text-base-content/60">
          {isEditing
            ? 'The existing thumbnail can be kept or removed while editing.'
            : 'Upload a thumbnail image for your course (Optional, max 5MB)'}
        </p>
        
        <div className="form-control">
          <div className="flex items-center justify-center w-full">
            <label className={`flex h-56 w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-base-300 bg-base-200/50 transition-colors sm:h-64 ${isEditing ? '' : 'hover:bg-base-200'}`}>
              {thumbnailPreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    aria-label="Remove course thumbnail"
                    type="button"
                    onClick={() => {
                      setThumbnail(null)
                      setThumbnailPreview('')
                      setValue('thumbnail', '')
                    }}
                    className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isEditing ? (
                    <p className="text-sm text-gray-500">No thumbnail is currently set.</p>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isEditing}
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {submitButtonText}
        </Button>
      </div>
    </form>
  )
}

export default CourseForm