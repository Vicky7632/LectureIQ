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
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-xl font-semibold">{course.title}</h3>
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

        <div className="flex gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={() => onApprove(course._id)}
            loading={isProcessing}
            disabled={isProcessing}
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