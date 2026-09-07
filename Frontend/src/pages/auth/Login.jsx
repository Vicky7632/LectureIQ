import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

import { login, googleLogin } from '../../store/slices/authSlice'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth)

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
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
      await dispatch(login(data)).unwrap()
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      // Error already set in Redux state
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap()
      toast.success('Google login successful!')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err || 'Google login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Card - Original DaisyUI bg-base-100 */}
      <div className="card w-full max-w-md shadow-2xl bg-base-100 text-base-content">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="text-sm uppercase tracking-wide text-base-content/70">
              Welcome back to
            </p>
            <h1 className="text-3xl font-extrabold tracking-wide">
              <span className="text-primary">Lecture</span>
              <span className="text-secondary">IQ</span>
            </h1>
          </div>

          <h2 className="text-xl font-semibold text-center mb-4 text-base-content/80">
            Login
          </h2>

          {/* API Error Alert */}
          {apiError && (
            <div className="alert alert-error shadow-sm py-2 px-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                className={`input input-bordered  p-2 w-full bg-gray-900 text-base-content border-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.email ? 'border-error focus:border-error' : ''
                }`}
                {...register('email')}
              />
              {errors.email && (
                <div className="flex items-start gap-1.5 mt-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                  <span className="text-error font-medium">{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className={`input p-2 input-bordered w-full pr-10 bg-gray-900 text-base-content border-base-300 placeholder:text-base-content/50 focus:border-primary ${
                  errors.password ? 'border-error focus:border-error' : ''
                }`}
                {...register('password')}
              />
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

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm link link-hover link-secondary"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full font-semibold transition hover:scale-[1.02] text-primary-content"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Google Login */}
          <div className="divider text-base-content/50">OR</div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError('Google login failed')}
              theme="filled_blue"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm mt-4 text-base-content/70">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary font-semibold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login