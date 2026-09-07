import axiosInstance from './axiosConfig'

export const teacherApi = {
  // Get all courses created by the teacher
  getMyCourses: () => axiosInstance.get('/teacher/my-courses'),

  // Get students enrolled in a specific course
  getCourseStudents: (courseId) => axiosInstance.get(`/teacher/course/${courseId}/students`),

  // Get dashboard statistics (total courses, students, revenue)
  getDashboardStats: () => axiosInstance.get('/teacher/dashboard-stats'),

  // Get all lectures of a course (for the teacher)
  getCourseLectures: (courseId) => axiosInstance.get(`/teacher/course/${courseId}/lectures`),

  // Submit course for admin review
  submitCourseForReview: (courseId) => axiosInstance.patch(`/course/submit/${courseId}`),

  // Edit course details
  editCourse: (courseId, data) => axiosInstance.patch(`/course/edit/${courseId}`, data),

  getCourseLectures: (courseId) => axiosInstance.get(`/teacher/course/${courseId}/lectures`),
  // Create a new lecture
  createLecture: (formData) => axiosInstance.post('/lecture/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}