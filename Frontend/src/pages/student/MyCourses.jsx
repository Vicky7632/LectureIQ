import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { enrollmentApi } from '../../api/enrollmentApi'
import { getAccessibleEnrolledCourses } from './myCoursesUtils'

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const fetchMyCourses = async () => {
      setLoading(true)
      setError('')
      setCourses([])

      try {
        const response = await enrollmentApi.getMyEnrollments()
        if (isCurrent) {
          setCourses(
            getAccessibleEnrolledCourses(response.data.enrollments || [])
          )
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load your courses right now.'
          )
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void fetchMyCourses()
    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Learning</h1>
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : error ? (
        <p className="text-error" role="alert">{error}</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">You are not enrolled in any available courses yet.</p>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course._id} className="card bg-base-100 shadow">
              <div className="card-body flex-row items-center justify-between">
                <div>
                  <h3 className="font-bold">{course.title}</h3>
                  <p className="text-sm text-gray-500">
                    Instructor: {course.teacher?.firstName} {course.teacher?.lastName}
                  </p>
                </div>
                <Link
                  to={`/student/course/${course._id}/learn`}
                  className="btn btn-primary btn-sm"
                >
                  Continue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default MyCourses