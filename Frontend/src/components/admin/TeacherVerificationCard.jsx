import React from 'react'
import { Mail, CheckCircle, XCircle, Calendar } from 'lucide-react'

import Card from '../common/Card'
import Button from '../common/Button'

const TeacherVerificationCard = ({ 
  teacher, 
  onVerify, 
  onReject,
  isProcessing = false 
}) => {
  return (
    <Card className="mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12">
              <span className="text-lg">
                {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <a 
              href={`mailto:${teacher.email}`} 
              className="text-sm link link-primary flex items-center gap-1 mt-1"
            >
              <Mail size={14} /> {teacher.email}
            </a>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => onVerify(teacher._id)}
              loading={isProcessing}
              disabled={isProcessing}
            >
              <CheckCircle size={16} className="mr-1" />
              Verify
            </Button>
            {onReject && (
              <Button
                variant="error"
                size="sm"
                onClick={() => onReject(teacher._id)}
                loading={isProcessing}
                disabled={isProcessing}
              >
                <XCircle size={16} className="mr-1" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default TeacherVerificationCard