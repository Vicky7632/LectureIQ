import axiosInstance from './axiosConfig';

export const enrollmentApi = {
  // Get all enrollments for the logged-in student
  getMyEnrollments: () => axiosInstance.get('/student/enrollments'),
  getMyCoursesDashboard: () => axiosInstance.get('/student/my-courses'),
  enrollInCourse: (courseId) =>
    axiosInstance.post(`/user/course/${courseId}/enroll`),
};