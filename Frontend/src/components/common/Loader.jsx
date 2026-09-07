import React from 'react'

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className={`loading loading-spinner ${sizeClasses[size]}`}></span>
      </div>
    )
  }

  return <span className={`loading loading-spinner ${sizeClasses[size]}`}></span>
}

export default Loader