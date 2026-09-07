import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Search } from 'lucide-react'

import { adminApi } from '../../api/adminApi'
import { authApi } from '../../api/authApi'
import TeacherVerificationCard from '../../components/admin/TeacherVerificationCard'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import Alert from '../../components/common/Alert'
import Card from '../../components/common/Card'

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    let result = teachers
    if (searchTerm) {
      result = result.filter(t => 
        t.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filter === 'pending') {
      result = result.filter(t => !t.isEmailVerified)
    } else if (filter === 'verified') {
      result = result.filter(t => t.isEmailVerified)
    }
    setFilteredTeachers(result)
  }, [teachers, searchTerm, filter])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getAllTeachers()
      setTeachers(response.data.teachers || [])
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
      setError('Failed to load teachers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTeacher = async (teacherId) => {
    try {
      setProcessingId(teacherId)
      await authApi.adminVerifyTeacher(teacherId)
      toast.success('Teacher verified successfully')
      await fetchTeachers() // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectTeacher = async (teacherId) => {
    // Optional: implement reject functionality if your backend supports it
    toast.error('Reject functionality not implemented')
  }

  const pendingCount = teachers.filter(t => !t.isEmailVerified).length
  const verifiedCount = teachers.filter(t => t.isEmailVerified).length

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Teachers</h1>
          <p className="text-gray-600 mt-1">
            {teachers.length} total teachers • {pendingCount} pending verification • {verifiedCount} verified
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search teachers by name or email..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tabs tabs-boxed bg-base-200 p-1">
          <button
            className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({teachers.length})
          </button>
          <button
            className={`tab ${filter === 'pending' ? 'tab-active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`tab ${filter === 'verified' ? 'tab-active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            Verified ({verifiedCount})
          </button>
        </div>
      </div>

      {/* Teachers List */}
      {filteredTeachers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No teachers found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No teachers have registered yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTeachers.map((teacher) => (
            <TeacherVerificationCard
              key={teacher._id}
              teacher={teacher}
              onVerify={handleVerifyTeacher}
              onReject={handleRejectTeacher}
              isProcessing={processingId === teacher._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminTeachers