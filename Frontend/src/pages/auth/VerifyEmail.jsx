import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { authApi } from '../../api/authApi'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyEmailToken = async () => {
      const queryParams = new URLSearchParams(location.search)
      const token = queryParams.get('token')

      if (!token) {
        setError('No verification token provided')
        setLoading(false)
        return
      }

      try {
        const response = await authApi.verifyEmail(token)
        // If verification is successful, the backend returns a success message
        // and also sets a login cookie automatically
        setSuccess(true)
        toast.success('Email verified successfully! You are now logged in.')
        
        // Wait a moment then redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      } catch (err) {
        const message = err.response?.data?.message || 'Email verification failed'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    verifyEmailToken()
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10 px-4">
      <div className="card bg-base-100 w-full max-w-md shadow-2xl">
        <div className="card-body text-center">
          {loading && (
            <>
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Verifying Your Email</h1>
              <p className="text-gray-600 mb-6">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {success && (
            <>
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You are now logged in.
                Redirecting to dashboard...
              </p>
            </>
          )}

          {error && !loading && (
            <>
              <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-error" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col gap-3">
                <Link to="/resend-verification" className="btn btn-primary">
                  Resend Verification Email
                </Link>
                <Link to="/" className="btn btn-ghost">
                  Go to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail