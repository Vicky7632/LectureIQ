import React, { useState } from 'react'
import { User } from 'lucide-react'
import { normalizeProfileImageUrl } from '../../utils/profileImage'

const UserAvatar = ({
  user,
  sizeClass = 'h-10 w-10',
  textClass = 'text-sm',
  className = '',
}) => {
  const imageUrl = normalizeProfileImageUrl(user?.profileImage)
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const showImage = imageUrl && failedImageUrl !== imageUrl
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`

  return (
    <div className={`avatar ${className}`.trim()} aria-label={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}>
      <div className={`${sizeClass} overflow-hidden rounded-full bg-primary text-primary-content`}>
        {showImage ? (
          <img
            src={imageUrl}
            alt={`${user?.firstName || 'User'} profile`}
            className="h-full w-full object-cover"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <span className={`flex h-full w-full items-center justify-center font-semibold ${textClass}`}>
            {initials || <User size={16} aria-hidden="true" />}
          </span>
        )}
      </div>
    </div>
  )
}

export default UserAvatar
