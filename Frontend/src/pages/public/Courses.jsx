import React, { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { courseApi } from '../../api/courseApi'
import CourseCard from '../../components/courses/CourseCard'
import Loader from '../../components/common/Loader'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await courseApi.getPublishedCourses()
      setCourses(res.data.courses || [])
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="mx-auto max-w-7xl py-2">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Find your next step</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Explore courses</h1>
        <p className="mt-2 text-base text-base-content/65">Learn from experienced instructors and build skills that stay with you.</p>
      </div>
      
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-9 w-9 text-primary" aria-hidden="true" />
          <p className="font-medium text-base-content">No courses available yet.</p>
          <p className="mt-1 text-sm text-base-content/60">Check back soon for new learning opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Courses