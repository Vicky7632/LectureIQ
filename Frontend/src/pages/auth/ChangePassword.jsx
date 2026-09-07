import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

import { authApi } from '../../api/authApi'
import { logout } from '../../store/slices/authSlice'

// Zod validation schema
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/\d/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
})

const ChangePassword = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [loading, setLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await authApi.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })
      setSuccess(true)
      toast.success('Password changed successfully! Please login again.')
      
      // Logout after 2 seconds
      setTimeout(() => {
        dispatch(logout())
        navigate('/login')
      }, 2000)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password'
      setApiError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
          <div className="card-body text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-base-content">Password Changed!</h1>
            <p className="text-base-content/70 mb-6">
              Your password has been updated successfully. You will be logged out.
            </p>
            <Link to="/login" className="btn btn-primary text-primary-content">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
        <div className="card-body">
          {/* Back Button */}
          <div className="mb-2">
            <Link
              to="/profile"
              className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content"
            >
              <ArrowLeft size={16} />
              Back to Profile
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-3xl font-bold text-base-content">Change Password</h1>
            <p className="text-base-content/70 mt-2">
              {user?.firstName ? `${user.firstName}, update your password` : 'Update your password'}
            </p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error shadow-sm py-2 px-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Password */}
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                placeholder="Current password"
                className={`input input-bordered w-full pl-10 pr-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.oldPassword ? 'border-error focus:border-error' : ''
                }`}
                {...register('oldPassword')}
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              <button
                type="button"
                className="absolute right-3 top-3 text-base-content/60 hover:text-base-content"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.oldPassword && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.oldPassword.message}</span>
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New password"
                className={`input input-bordered w-full pl-10 pr-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.newPassword ? 'border-error focus:border-error' : ''
                }`}
                {...register('newPassword')}
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              <button
                type="button"
                className="absolute right-3 top-3 text-base-content/60 hover:text-base-content"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.newPassword && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.newPassword.message}</span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className={`input input-bordered w-full pl-10 pr-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.confirmPassword ? 'border-error focus:border-error' : ''
                }`}
                {...register('confirmPassword')}
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              <button
                type="button"
                className="absolute right-3 top-3 text-base-content/60 hover:text-base-content"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.confirmPassword && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.confirmPassword.message}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full font-semibold transition hover:scale-[1.02] text-primary-content mt-2"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          <p className="text-center text-sm mt-4 text-base-content/70">
            <Link to="/profile" className="link link-primary">
              Return to Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword