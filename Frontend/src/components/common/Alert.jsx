import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

const Alert = ({ type = 'info', message, onClose }) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  }

  const classes = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  }

  return (
    <div className={`alert ${classes[type]} shadow-lg mb-4`}>
      <div>
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
      )}
    </div>
  )
}

export default Alert