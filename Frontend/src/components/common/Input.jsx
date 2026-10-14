import React from 'react'

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label justify-start">
          <span className="label-text">{label}{required && <span className="text-error ml-1" aria-hidden="true">*</span>}</span>
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={18} className="text-gray-400" />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`input input-bordered w-full min-w-0 ${Icon ? 'pl-10' : ''} ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <label className="label justify-start">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  )
}

export default Input