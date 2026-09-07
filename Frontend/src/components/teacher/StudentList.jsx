import React from 'react'
import { Mail, Clock } from 'lucide-react'

const StudentList = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No students enrolled yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>Enrolled On</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {students.map((enrollment) => (
            <tr key={enrollment._id}>
              <td>
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-8">
                      <span>
                        {enrollment.student?.firstName?.charAt(0)}
                        {enrollment.student?.lastName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">
                      {enrollment.student?.firstName} {enrollment.student?.lastName}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <a href={`mailto:${enrollment.student?.email}`} className="link link-primary">
                  {enrollment.student?.email}
                </a>
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <progress className="progress progress-primary w-20" value={enrollment.progress || 0} max="100"></progress>
                  <span className="text-sm">{enrollment.progress || 0}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StudentList