import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { courseApi } from '../../api/courseApi'

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  useEffect(() => {
    // Mock - replace with actual enrolled courses API
    courseApi.getPublishedCourses().then(res => setCourses(res.data.courses.slice(0,3)))
  }, [])
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Learning</h1>
      <div className="grid gap-6">
        {courses.map(course => (
          <div key={course._id} className="card bg-base-100 shadow">
            <div className="card-body flex-row items-center justify-between">
              <div>
                <h3 className="font-bold">{course.title}</h3>
                <p className="text-sm text-gray-500">Instructor: {course.teacher?.firstName} {course.teacher?.lastName}</p>
              </div>
              <Link to={`/student/course/${course._id}/learn`} className="btn btn-primary btn-sm">Continue</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default MyCourses