export const createLiveNotification = (eventName, payload) => {
  if (!payload?.lectureId || !payload?.courseId) return null

  const isStarted = eventName === 'lecture:started'
  const isEnded = eventName === 'lecture:ended'
  if (!isStarted && !isEnded) return null

  const occurredAt = isStarted ? payload.startedAt : payload.endedAt
  if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) return null

  return {
    id: `${payload.lectureId}:${eventName}`,
    lectureId: String(payload.lectureId),
    courseId: String(payload.courseId),
    title: payload.title || 'Live class',
    message: isStarted ? 'Live class started' : 'Live class ended',
    eventName,
    canJoin: isStarted,
    occurredAt,
    read: false,
  }
}

export const appendLiveNotification = (notifications, notification, limit = 25) => {
  if (!notification || notifications.some(({ id }) => id === notification.id)) {
    return notifications
  }
  const current =
    notification.eventName === 'lecture:ended'
      ? notifications.map((item) =>
          item.lectureId === notification.lectureId && item.eventName === 'lecture:started'
            ? { ...item, canJoin: false }
            : item
        )
      : notifications
  return [notification, ...current].slice(0, limit)
}

export const markNotificationsRead = (notifications) =>
  notifications.map((notification) =>
    notification.read ? notification : { ...notification, read: true }
  )
