import React from 'react'
import { Mail, CheckCircle, Calendar } from 'lucide-react'

import Card from '../common/Card'
import Button from '../common/Button'

const TeacherVerificationCard = ({ 
  teacher, 
  onVerify, 
  isProcessing = false 
}) => {
  return (
    <Card className="mb-4">
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12">
              <span className="text-lg">
                {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <a 
              href={`mailto:${teacher.email}`} 
              className="mt-1 flex min-w-0 items-center gap-1 break-all text-sm link link-primary"
            >
              <Mail size={14} /> {teacher.email}
            </a>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 sm:gap-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined: {new Date(teacher.createdAt).toLocaleDateString()}
              </span>
              <span className={`badge badge-sm ${
                teacher.isEmailVerified ? 'badge-success' : 'badge-warning'
              }`}>
                {teacher.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {!teacher.isEmailVerified && (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
            <Button
              variant="success"
              size="sm"
              onClick={() => onVerify(teacher._id)}
              loading={isProcessing}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              <CheckCircle size={16} className="mr-1" />
              Verify
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default TeacherVerificationCard