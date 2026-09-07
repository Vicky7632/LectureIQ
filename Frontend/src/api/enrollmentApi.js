import axiosInstance from './axiosConfig';

export const enrollmentApi = {
  // Get all enrollments for the logged-in student
  getMyEnrollments: () => axiosInstance.get('/student/enrollments'), // adjust endpoint as per your backend
};