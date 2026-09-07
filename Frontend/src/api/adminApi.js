import axiosInstance from './axiosConfig'

export const adminApi = {
  // Teachers
  getAllTeachers: () => axiosInstance.get('/admin/teachers'),

  // Courses
  getAllCourses: () => axiosInstance.get('/admin/courses'),

  // Students
  getAllStudents: () => axiosInstance.get('/admin/students'),

  // Payments
  getAllPayments: () => axiosInstance.get('/admin/payments'),
  getCoursePayments: (courseId) => axiosInstance.get(`/admin/course/${courseId}/payments`),

  // Enrollments
  getCourseEnrollments: (courseId) => axiosInstance.get(`/admin/course/${courseId}/enrollments`),

  // Revenue
  getRevenueStats: () => axiosInstance.get('/admin/revenue')
}