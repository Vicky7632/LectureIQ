import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Clock } from 'lucide-react'

const CourseCard = ({ course }) => {
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <figure className="px-4 pt-4">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="rounded-xl w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen size={48} className="text-primary" />
          </div>
        )}
      </figure>
      <div className="card-body">
        <h3 className="card-title">{course.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{course.enrolledStudents?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{course.totalDuration || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`badge badge-sm ${course.level === 'beginner' ? 'badge-info' : course.level === 'intermediate' ? 'badge-warning' : 'badge-accent'}`}>
              {course.level}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold">
            {course.isPaid ? `₹${course.price}` : 'Free'}
          </span>
          <Link to={`/course/${course._id}`} className="btn btn-primary btn-sm">
            View Course
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CourseCard