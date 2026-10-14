export const hasAllowedRole = (role, allowedRoles) =>
  Boolean(role && allowedRoles.includes(role))

export const getLecturePlayerPath = (courseId, lectureId, role) => {
  const basePath =
    role === 'teacher'
      ? `/teacher/course/${courseId}/preview`
      : `/student/course/${courseId}/learn`

  return lectureId ? `${basePath}?lecture=${encodeURIComponent(lectureId)}` : basePath
}
