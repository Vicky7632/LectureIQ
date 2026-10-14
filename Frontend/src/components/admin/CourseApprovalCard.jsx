import React from 'react'
import { CheckCircle, XCircle, BookOpen, User } from 'lucide-react'

import Card from '../common/Card'
import Button from '../common/Button'

const CourseApprovalCard = ({ 
  course, 
  onApprove, 
  onReject, 
  isProcessing = false 
}) => {
  return (
    <Card className="mb-4">
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} className="text-primary" />
            <h3 className="break-words text-xl font-semibold">{course.title}</h3>
          </div>
          
          <p className="text-gray-600 line-clamp-2 mb-3">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User size={16} className="text-gray-400" />
              <span className="font-medium">Instructor:</span>
              <span>{course.teacher?.firstName} {course.teacher?.lastName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Category:</span>
              <span>{course.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Level:</span>
              <span className="capitalize">{course.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Price:</span>
              <span>{course.isPaid ? `₹${course.price}` : 'Free'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Lectures:</span>
              <span>{course.lecturesCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
          <Button
            variant="success"
            size="sm"
            onClick={() => onApprove(course._id)}
            loading={isProcessing}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <CheckCircle size={16} className="mr-1" />
            Approve
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => onReject(course._id)}
            loading={isProcessing}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <XCircle size={16} className="mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default CourseApprovalCard