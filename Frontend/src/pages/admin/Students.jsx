import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Mail, Search, Calendar } from 'lucide-react'
import { adminApi } from '../../api/adminApi'

const AdminStudents = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredStudents(students.filter(s => 
        s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    } else {
      setFilteredStudents(students)
    }
  }, [students, searchTerm])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAllStudents()
      setStudents(response.data.students || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-gray-600 mt-1">{students.length} total students</p>
        </div>
      </div>

      <div className="form-control w-full md:w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search students by name or email..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          <span>{student.firstName?.charAt(0)}{student.lastName?.charAt(0)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{student.firstName} {student.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a href={`mailto:${student.email}`} className="link link-primary">
                      {student.email}
                    </a>
                  </td>
                  <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  <td>
                    {student.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-error">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan="4" className="text-center py-8">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminStudents