import axiosInstance from './axiosConfig'

export const courseApi = {
  // Student endpoints
  getPublishedCourses: () => axiosInstance.get('/user/courses'),
  getCourseById: (courseId) => axiosInstance.get(`/user/course/${courseId}`),
  getCourseLectures: (courseId) => axiosInstance.get(`/user/course/${courseId}/lectures`),
  
  // Teacher endpoints
  createCourse: (data) => axiosInstance.post('/course/create', data),
  editCourse: (courseId, data) => axiosInstance.patch(`/course/edit/${courseId}`, data),
  submitForReview: (courseId) => axiosInstance.patch(`/course/submit/${courseId}`),
  getTeacherCourses: () => axiosInstance.get('/teacher/my-courses'),
  getCourseStudents: (courseId) => axiosInstance.get(`/teacher/course/${courseId}/students`),
  getTeacherCourseLectures: (courseId) => axiosInstance.get(`/teacher/course/${courseId}/lectures`),
  
  // Admin endpoints
  getAllCourses: () => axiosInstance.get('/admin/courses'),
  approveCourse: (courseId) => axiosInstance.patch(`/course/admin/approve/${courseId}`),
  rejectCourse: (courseId, reason) => axiosInstance.patch(`/course/course/reject/${courseId}`, { reason })
}