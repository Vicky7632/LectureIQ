import React from 'react'

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`} {...props}>
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

export const CardTitle = ({ children, className = '' }) => (
  <h2 className={`card-title ${className}`}>{children}</h2>
)

export const CardActions = ({ children, className = '' }) => (
  <div className={`card-actions justify-end ${className}`}>{children}</div>
)

export default Card