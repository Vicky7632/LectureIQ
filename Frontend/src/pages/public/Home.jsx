import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, PlayCircle, Award, ChevronRight } from 'lucide-react'
import { courseApi } from '../../api/courseApi'

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true)
      const response = await courseApi.getPublishedCourses()
      setFeaturedCourses(response.data.courses.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Learn from the Best, Anytime, Anywhere
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students and teachers on LectureIQ – the ultimate platform for interactive learning.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/courses" className="btn btn-accent btn-lg">
                Explore Courses
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg btn-accent">
                Start Teaching
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose LectureIQ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body items-center text-center">
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <h3 className="card-title">Expert Instructors</h3>
                <p>Learn from industry professionals with years of experience.</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body items-center text-center">
                <PlayCircle className="w-12 h-12 text-secondary mb-4" />
                <h3 className="card-title">HD Video Lectures</h3>
                <p>High-quality video content that you can stream anywhere.</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body items-center text-center">
                <Users className="w-12 h-12 text-accent mb-4" />
                <h3 className="card-title">Live Interaction</h3>
                <p>Engage with instructors and peers in real time.</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body items-center text-center">
                <Award className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="card-title">Certification</h3>
                <p>Earn certificates to showcase your skills.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link to="/courses" className="btn btn-primary">
              View All Courses
              <ChevronRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div key={course._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <figure className="px-4 pt-4">
                    <div className="w-full h-48 bg-primary/10 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-primary" />
                    </div>
                  </figure>
                  <div className="card-body">
                    <h3 className="card-title">{course.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-sm">{course.level}</span>
                      <span className="badge badge-sm badge-outline">
                        {course.isPaid ? `₹${course.price}` : 'Free'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Instructor: {course.teacher?.firstName} {course.teacher?.lastName}
                    </p>
                    <div className="card-actions justify-end mt-4">
                      <Link to={`/course/${course._id}`} className="btn btn-primary btn-sm">
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join LectureIQ today and unlock thousands of courses.
          </p>
          <Link to="/register" className="btn btn-accent btn-lg">
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home