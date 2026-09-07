import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { 
  User, Mail, Phone, BookOpen, Lock, Save, 
  Edit2, Calendar, Award,Users, AlertCircle, Briefcase, CheckCircle 
} from 'lucide-react'

import { profileApi } from '../../api/profileApi'   // 👈 naya import
import { setUser } from '../../store/slices/authSlice'

// Zod validation schema for profile update
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional(),
})

const Profile = () => {
  const dispatch = useDispatch()
  const { user: reduxUser, role } = useSelector((state) => state.auth)
  
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState(null)   // API se aaya data

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      bio: '',
    }
  })

  // Fetch fresh profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileApi.getProfile()   // 👈 sahi API call
      const { role: userRole, profile } = response.data

      setProfileData(profile)
       const updatedUser = { ...profile, role: userRole }
      // Pre-fill form
      setValue('firstName', profile.firstName || '')
      setValue('lastName', profile.lastName || '')
      setValue('phoneNumber', profile.phoneNumber || '')
      setValue('bio', profile.bio || '')

      // Optionally update Redux state with fresh data
       dispatch(setUser({ user: updatedUser }))
    } catch (error) {
      console.error('Profile fetch error:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const onUpdateProfile = async (data) => {
  try {
    setLoading(true)
    const response = await profileApi.updateProfile(data)
    
    //  Response mein role aur profile alag aate hain
    const { role: userRole, profile } = response.data
    
    //  Dono ko merge karo – complete user object
    const updatedUser = { ...profile, role: userRole }
    
    //  Redux store update karo
    dispatch(setUser({ user: updatedUser }))
    setProfileData(profile)
    
    toast.success('Profile updated successfully')
    setEditMode(false)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Update failed')
  } finally {
    setLoading(false)
  }
}

  // Dynamic statistics based on role
  const getStats = () => {
    if (!profileData) return {}

    if (role === 'student') {
      return {
        icon1: <BookOpen size={16} className="text-primary" />,
        label1: 'Enrolled Courses',
        value1: profileData.enrolledCourses || 0,
        icon2: <Award size={16} className="text-secondary" />,
        label2: 'Completed Lectures',
        value2: profileData.completedLectures || 0,
        icon3: <Calendar size={16} className="text-accent" />,
        label3: 'Member Since',
        value3: new Date(profileData.createdAt).toLocaleDateString(),
      }
    } else if (role === 'teacher') {
      return {
        icon1: <BookOpen size={16} className="text-primary" />,
        label1: 'Total Courses',
        value1: profileData.totalCourses || 0,
        icon2: <CheckCircle size={16} className="text-secondary" />,
        label2: 'Published',
        value2: profileData.publishedCourses || 0,
        icon3: <Calendar size={16} className="text-accent" />,
        label3: 'Member Since',
        value3: new Date(profileData.createdAt).toLocaleDateString(),
      }
    } else if (role === 'admin') {
      return {
        icon1: <Users size={16} className="text-primary" />,
        label1: 'Total Users',
        value1: profileData.totalUsers || 0,
        icon2: <BookOpen size={16} className="text-secondary" />,
        label2: 'Total Courses',
        value2: profileData.totalCourses || 0,
        icon3: <Calendar size={16} className="text-accent" />,
        label3: 'Member Since',
        value3: new Date(profileData.createdAt).toLocaleDateString(),
      }
    }
    return {}
  }

  const stats = getStats()

  if (loading && !editMode) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // Use profileData if available, else fallback to redux user
  const displayUser = profileData || reduxUser

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content">My Profile</h1>
          <p className="text-base-content/70 mt-1">
            Manage your personal information and account settings
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-primary text-primary-content"
          >
            <Edit2 size={18} className="mr-2" />
            Edit Profile
          </button>
        ) : (
          <button
            onClick={() => {
              setEditMode(false)
              reset() // Reset form to original values
            }}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Stats */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body items-center text-center">
              <div className="avatar">
                <div className="w-32 h-32 rounded-full bg-primary text-primary-content flex items-center justify-center text-4xl font-bold">
                  {displayUser?.firstName?.charAt(0)}{displayUser?.lastName?.charAt(0)}
                </div>
              </div>
              <h2 className="text-2xl font-bold mt-4 text-base-content">
                {displayUser?.firstName} {displayUser?.lastName}
              </h2>
              <p className="text-base-content/70 capitalize">{role}</p>
              <div className={`badge mt-2 ${
                displayUser?.isEmailVerified ? 'badge-success' : 'badge-warning'
              }`}>
                {displayUser?.isEmailVerified ? 'Email Verified' : 'Verification Pending'}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-base-content mb-4">Account Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base-content/70">
                    {stats.icon1}
                    <span>{stats.label1}</span>
                  </div>
                  <span className="font-semibold text-base-content">{stats.value1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base-content/70">
                    {stats.icon2}
                    <span>{stats.label2}</span>
                  </div>
                  <span className="font-semibold text-base-content">{stats.value2}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base-content/70">
                    {stats.icon3}
                    <span>{stats.label3}</span>
                  </div>
                  <span className="font-semibold text-base-content">{stats.value3}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Form */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-base-content mb-4">Personal Information</h2>
              
              <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="label">
                    <span className="label-text text-base-content/80">First Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className={`input input-bordered w-full pl-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                        !editMode ? 'bg-base-200/50' : ''
                      } ${errors.firstName ? 'border-error focus:border-error' : ''}`}
                      disabled={!editMode}
                      {...register('firstName')}
                    />
                  </div>
                  {errors.firstName && editMode && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                      <span className="text-error font-medium">{errors.firstName.message}</span>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="label">
                    <span className="label-text text-base-content/80">Last Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className={`input input-bordered w-full pl-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                        !editMode ? 'bg-base-200/50' : ''
                      } ${errors.lastName ? 'border-error focus:border-error' : ''}`}
                      disabled={!editMode}
                      {...register('lastName')}
                    />
                  </div>
                  {errors.lastName && editMode && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                      <span className="text-error font-medium">{errors.lastName.message}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="label">
                    <span className="label-text text-base-content/80">Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-base-content/40" />
                    </div>
                    <input
                      type="email"
                      className="input input-bordered w-full pl-10 bg-base-200/50 text-base-content/70 border-base-300"
                      disabled={true}
                      value={displayUser?.email || ''}
                    />
                  </div>
                  <p className="text-xs text-base-content/50 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="label">
                    <span className="label-text text-base-content/80">Phone Number</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-base-content/40" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      className={`input input-bordered w-full pl-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                        !editMode ? 'bg-base-200/50' : ''
                      }`}
                      disabled={!editMode}
                      {...register('phoneNumber')}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="label">
                    <span className="label-text text-base-content/80">Bio</span>
                  </label>
                  <textarea
                    placeholder="Tell us a little about yourself..."
                    className={`textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                      !editMode ? 'bg-base-200/50' : ''
                    } h-24`}
                    disabled={!editMode}
                    {...register('bio')}
                  />
                  {errors.bio && editMode && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                      <span className="text-error font-medium">{errors.bio.message}</span>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      className="btn btn-primary text-primary-content"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <Save size={18} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="card-title text-base-content">Security</h2>
                  <p className="text-sm text-base-content/70 mt-1">
                    Update your password to keep your account secure
                  </p>
                </div>
                <Link
                  to="/change-password"
                  className="btn btn-outline btn-sm"
                >
                  <Lock size={16} className="mr-2" />
                  Change Password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile