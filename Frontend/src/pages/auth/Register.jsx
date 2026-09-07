import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, AlertCircle, User, Mail, Lock } from 'lucide-react'

import { register as registerUser, googleLogin } from '../../store/slices/authSlice'

// Zod validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      setApiError(error)
      toast.error(error)
    }
  }, [error])

  const onSubmit = async (data) => {
    try {
      setApiError('')
      await dispatch(registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })).unwrap()
      toast.success('Registration successful! Please verify your email.')
      navigate('/login')
    } catch (err) {
      // Error already set in Redux state
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap()
      toast.success('Google signup successful!')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err || 'Google signup failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="text-sm uppercase tracking-wide text-base-content/70">
              Join
            </p>
            <h1 className="text-3xl font-extrabold tracking-wide">
              <span className="text-primary">Lecture</span>
              <span className="text-secondary">IQ</span>
            </h1>
            <p className="text-base-content/60 text-sm mt-1">Create your account</p>
          </div>

          <h2 className="text-xl font-semibold text-center mb-2 text-base-content/80">
            Register
          </h2>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error shadow-sm py-2 px-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="First name"
                  className={`input input-bordered w-full pl-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                    errors.firstName ? 'border-error focus:border-error' : ''
                  }`}
                  {...register('firstName')}
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              </div>
              {errors.firstName && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.firstName.message}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Last name"
                  className={`input input-bordered w-full pl-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                    errors.lastName ? 'border-error focus:border-error' : ''
                  }`}
                  {...register('lastName')}
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              </div>
              {errors.lastName && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.lastName.message}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email address"
                  className={`input input-bordered w-full pl-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
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

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`input input-bordered w-full pl-10 pr-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
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
                placeholder="Confirm password"
                className={`input input-bordered w-full pl-10 pr-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Google Login */}
          <div className="divider text-base-content/50">OR</div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError('Google signup failed')}
              theme="filled_blue"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm mt-4 text-base-content/70">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register