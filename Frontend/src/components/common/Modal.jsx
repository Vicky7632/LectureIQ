import React, { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <button
          type="button"
          aria-label="Close dialog"
          className="fixed inset-0 cursor-default transition-opacity"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70"></div>
        </button>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div role="dialog" aria-modal="true" aria-label={title} className={`relative inline-block max-h-[calc(100dvh-2rem)] w-full max-w-full overflow-y-auto align-bottom rounded-lg bg-base-100 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]}`}>
          <div className="bg-base-100 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
              <h3 className="min-w-0 text-lg font-semibold">{title}</h3>
              <button type="button" aria-label="Close dialog" onClick={onClose} className="btn btn-sm btn-circle btn-ghost shrink-0">✕</button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal