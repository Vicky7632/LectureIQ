import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  PlayCircle, Clock, Users, BookOpen, CheckCircle, Star, 
  ChevronRight, Calendar, Globe, Award, Shield
} from 'lucide-react'
import { courseApi } from '../../api/courseApi'
import { paymentApi } from '../../api/paymentapi'
import { toast } from 'react-hot-toast'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchCourseDetails()
  }, [id])

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      const [courseRes, lecturesRes] = await Promise.all([
        courseApi.getCourseById(id),
        courseApi.getCourseLectures(id)
      ])
      
      setCourse(courseRes.data.course)
      setLectures(lecturesRes.data.lectures || [])
      
      // Check if user is enrolled (you would call an enrollment API)
      setEnrolled(false) // Mock - implement actual check
    } catch (error) {
      console.error('Failed to fetch course details:', error)
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${id}` } })
      return
    }

    try {
      setProcessingPayment(true)
      
      if (course.isPaid) {
        // Create payment order
        const orderRes = await paymentApi.createOrder(id)
        const { orderId, amount, currency, key } = orderRes.data
        
        // Initialize Razorpay
        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: 'LectureIQ',
          description: `Payment for ${course.title}`,
          order_id: orderId,
          handler: async function(response) {
            try {
              await paymentApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
              
              toast.success('Payment successful! Course enrolled.')
              setEnrolled(true)
            } catch (error) {
              toast.error('Payment verification failed')
            }
          },
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          },
          theme: {
            color: '#4f46e5'
          }
        }
        
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } else {
        // Free course enrollment
        // Call your free enrollment API
        toast.success('Successfully enrolled in free course!')
        setEnrolled(true)
      }
    } catch (error) {
      console.error('Enrollment failed:', error)
      toast.error(error.response?.data?.message || 'Enrollment failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="btn btn-primary">
          Browse Courses
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-accent">{course.level}</span>
                  <span className="badge badge-outline badge-accent">
                    {course.isPaid ? 'Premium' : 'Free'}
                  </span>
                  <span className="badge badge-ghost">{course.category}</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl opacity-90 mb-6">{course.description}</p>
                
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Users size={20} />
                    <span>{course.enrolledStudents?.length || 0} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={20} />
                    <span>{course.lecturesCount || 0} lectures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    <span>{course.totalDuration || 0} total hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={20} />
                    <span>4.8 (1,234 ratings)</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-base-100 text-primary flex items-center justify-center">
                      {course.teacher?.firstName?.charAt(0)}{course.teacher?.lastName?.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Created by</p>
                    <p>{course.teacher?.firstName} {course.teacher?.lastName}</p>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="card bg-base-100 text-base-content shadow-2xl">
                  <div className="card-body">
                    <div className="text-center mb-6">
                      {course.isPaid ? (
                        <>
                          <div className="text-4xl font-bold mb-2">₹{course.price}</div>
                          <p className="text-sm text-gray-500">One-time payment</p>
                        </>
                      ) : (
                        <div className="text-4xl font-bold text-success">Free</div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-success" />
                        <span>Full lifetime access</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-success" />
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-success" />
                        <span>Access on mobile and TV</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-success" />
                        <span>Downloadable resources</span>
                      </div>
                    </div>

                    {enrolled ? (
                      <button
                        onClick={() => navigate(`/student/course/${id}/learn`)}
                        className="btn btn-primary w-full"
                      >
                        <PlayCircle size={20} className="mr-2" />
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={processingPayment}
                        className="btn btn-primary w-full"
                      >
                        {processingPayment ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            {course.isPaid ? 'Enroll Now' : 'Enroll for Free'}
                          </>
                        )}
                      </button>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-4">
                      30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Curriculum */}
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title mb-6">Course Curriculum</h2>
                  
                  <div className="space-y-4">
                    {lectures.length > 0 ? (
                      lectures.map((lecture, index) => (
                        <div key={lecture._id} className="collapse collapse-arrow bg-base-200">
                          <input type="radio" name="curriculum" />
                          <div className="collapse-title font-medium">
                            <div className="flex items-center justify-between">
                              <span>
                                {index + 1}. {lecture.title}
                                {lecture.isPreview && (
                                  <span className="badge badge-sm badge-info ml-2">Preview</span>
                                )}
                              </span>
                              <span className="text-sm text-gray-500">
                                {lecture.duration || 0} min
                              </span>
                            </div>
                          </div>
                          <div className="collapse-content">
                            <p className="text-gray-600 mb-3">{lecture.description}</p>
                            {enrolled || lecture.isPreview ? (
                              <button
                                onClick={() => navigate(`/student/course/${id}/learn?lecture=${lecture._id}`)}
                                className="btn btn-sm btn-primary"
                              >
                                <PlayCircle size={16} className="mr-2" />
                                Watch Lecture
                              </button>
                            ) : (
                              <span className="text-sm text-warning">
                                Enroll to access this lecture
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No lectures available yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements & Description */}
              <div className="card bg-base-100 shadow mt-8">
                <div className="card-body">
                  <h2 className="card-title mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={20} className="text-primary mt-1" />
                      <span>Basic computer knowledge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={20} className="text-primary mt-1" />
                      <span>Internet connection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={20} className="text-primary mt-1" />
                      <span>Willingness to learn</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-6">
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="font-bold mb-4">This course includes:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PlayCircle size={20} className="text-primary" />
                      <span>{course.totalDuration || 0} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-primary" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe size={20} className="text-primary" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award size={20} className="text-primary" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-primary" />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="font-bold mb-4">Instructor</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl">
                        {course.teacher?.firstName?.charAt(0)}{course.teacher?.lastName?.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold">{course.teacher?.firstName} {course.teacher?.lastName}</h4>
                      <p className="text-sm text-gray-500">Senior Instructor</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    With over 10 years of teaching experience, {course.teacher?.firstName} has helped thousands of students achieve their learning goals.
                  </p>
                  <div className="stats stats-vertical shadow">
                    <div className="stat">
                      <div className="stat-title">Students</div>
                      <div className="stat-value">12.5K</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Courses</div>
                      <div className="stat-value">8</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Rating</div>
                      <div className="stat-value">4.8</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail