import React from 'react'

const ProgressBar = ({ progress, showLabel = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'progress-sm',
    md: 'progress-md',
    lg: 'progress-lg'
  }

  return (
    <div className="flex items-center gap-2">
      <progress
        className={`progress progress-primary ${sizeClasses[size]} w-full`}
        value={progress}
        max="100"
      ></progress>
      {showLabel && <span className="text-sm font-medium">{progress}%</span>}
    </div>
  )
}

export default ProgressBar