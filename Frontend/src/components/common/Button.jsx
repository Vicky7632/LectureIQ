import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Direct DaisyUI classes – no complex merging
  const variantClass = variant ? `btn-${variant}` : ''
  const sizeClass = size !== 'md' ? `btn-${size}` : ''
  
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${loading ? 'loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {!loading && children}
    </button>
  )
}

export default Button