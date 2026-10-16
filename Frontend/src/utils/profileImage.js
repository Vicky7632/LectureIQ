export const normalizeProfileImageUrl = (value) => {
  if (typeof value !== 'string') return null
  const imageUrl = value.trim()
  if (!imageUrl || /^[a-z][a-z\d+.-]*:/i.test(imageUrl) && !/^https?:\/\//i.test(imageUrl)) {
    return null
  }
  return imageUrl
}
