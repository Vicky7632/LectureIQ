import React from 'react'
import { PlayCircle, Lock } from 'lucide-react'

const LectureList = ({ 
  lectures, 
  courseId, 
  enrolled = false, 
  currentLectureId = null,
  onSelect = null 
}) => {
  return (
    <div className="space-y-2">
      {lectures.map((lecture, index) => {
        const isActive = lecture._id === currentLectureId
        const canWatch = enrolled || lecture.isPreview
        
        return (
          <div
            key={lecture._id}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
              ${isActive ? 'bg-primary/20 border border-primary' : 'bg-base-100 hover:bg-base-300'}`}
            onClick={() => onSelect && onSelect(lecture)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">{index + 1}</span>
              {canWatch ? (
                <PlayCircle size={18} className={isActive ? 'text-primary' : 'text-gray-500'} />
              ) : (
                <Lock size={18} className="text-gray-400" />
              )}
              <div>
                <p className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                  {lecture.title}
                </p>
                <p className="text-xs text-gray-500">{lecture.duration || 0} min</p>
              </div>
            </div>
            {canWatch && (
              <span className="text-xs badge badge-sm badge-ghost">
                {lecture.isPreview ? 'Preview' : 'Enrolled'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default LectureList