export const isFutureLocalDateTime = (value, now = Date.now()) => {
  if (typeof value !== 'string' || !value) return false
  const scheduledTime = new Date(value).getTime()
  return Number.isFinite(scheduledTime) && scheduledTime > now
}

export const toScheduledAtISOString = (value) => {
  const scheduledDate = new Date(value)
  if (!Number.isFinite(scheduledDate.getTime())) {
    throw new Error('Choose a valid schedule date and time.')
  }
  return scheduledDate.toISOString()
}

export const getLocalDateTimeInputValue = (timestamp = Date.now()) => {
  const date = new Date(timestamp)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
