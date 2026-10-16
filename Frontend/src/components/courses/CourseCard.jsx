import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Clock } from 'lucide-react'

const CourseCard = ({ course }) => {
  return (
    <div className="card bg-base-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <figure className="px-4 pt-4">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="h-48 w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-xl bg-[#E8EFE6]">
            <BookOpen size={42} className="text-primary" />
          </div>
        )}
      </figure>
      <div className="card-body">
        <h3 className="card-title break-words text-lg">{course.title}</h3>
        <p className="line-clamp-2 text-sm leading-6 text-base-content/65">{course.description}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-base-content/60">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{course.enrollmentCount ?? course.enrolledStudents?.length ?? 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{course.totalDuration || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="badge badge-sm border-0 bg-base-200 text-base-content/70">
              {course.level}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-4">
          <span className="text-lg font-bold">
            {course.isPaid ? `₹${course.price}` : 'Free'}
          </span>
          <Link to={`/course/${course._id}`} className="btn btn-primary btn-sm w-full sm:w-auto">
            View Course
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CourseCard