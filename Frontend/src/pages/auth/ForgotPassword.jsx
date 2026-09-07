import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

import { authApi } from '../../api/authApi'

// Zod validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    try {
      setApiError('')
      setLoading(true)
      await authApi.forgotPassword(data.email)
      setEmailSent(true)
      toast.success('Password reset link sent to your email!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email'
      setApiError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
          <div className="card-body text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-base-content">Check Your Email</h1>
            <p className="text-base-content/70 mb-6">
              We've sent a password reset link to your email address. 
              The link will expire in 10 minutes.
            </p>
            <Link to="/login" className="btn btn-primary text-primary-content">
              Return to Login
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
            <h1 className="text-3xl font-bold text-base-content">Forgot Password?</h1>
            <p className="text-base-content/70 mt-2">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error shadow-sm py-2 px-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email address"
                  className={`input input-bordered w-full pl-10 bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                    errors.email ? 'border-error focus:border-error' : ''
                  }`}
                  {...register('email')}
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              </div>
              {errors.email && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full font-semibold transition hover:scale-[1.02] text-primary-content"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm mt-6 text-base-content/70">
            Remember your password?{' '}
            <Link to="/login" className="link link-primary font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword