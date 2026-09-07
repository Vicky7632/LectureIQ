import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

import { authApi } from '../../api/authApi'

// Zod validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/\d/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isValidToken, setIsValidToken] = useState(true)
  const [resetSuccess, setResetSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const urlToken = queryParams.get('token')
    if (!urlToken) {
      setIsValidToken(false)
      setApiError('Invalid or missing reset token')
    } else {
      setToken(urlToken)
    }
  }, [location])

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await authApi.resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword
      })
      setResetSuccess(true)
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 3000)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password'
      setApiError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
          <div className="card-body text-center">
            <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-error" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-base-content">Invalid Reset Link</h1>
            <p className="text-base-content/70 mb-6">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-primary text-primary-content">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
          <div className="card-body text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-base-content">Password Reset Successfully!</h1>
            <p className="text-base-content/70 mb-6">
              Your password has been updated. Redirecting to login...
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
              to="/login"
              className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-3xl font-bold text-base-content">Reset Password</h1>
            <p className="text-base-content/70 mt-2">
              Enter your new password below.
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
            {/* New Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                className={`input input-bordered w-full pl-10 pr-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.password ? 'border-error focus:border-error' : ''
                }`}
                {...register('password')}
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              <button
                type="button"
                className="absolute right-3 top-3 text-base-content/60 hover:text-base-content"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword