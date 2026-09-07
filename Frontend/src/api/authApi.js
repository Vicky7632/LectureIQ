import axiosInstance from './axiosConfig'

export const authApi = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  googleAuth: (credential) => axiosInstance.post('/auth/google-auth', { credential }),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
  changePassword: (data) => axiosInstance.post('/auth/change-password', data),
  verifyEmail: (token) => axiosInstance.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => axiosInstance.post('/auth/resend-verification', { email }),
  adminRegister: (data) => axiosInstance.post('/auth/admin/register', data),
  teacherRegister: (data) => axiosInstance.post('/auth/teacher/register', data),
  adminVerifyTeacher: (teacherId) => axiosInstance.patch(`/auth/admin/teacher/verify/${teacherId}`),
  
  //  NEW METHODS
  getProfile: () => axiosInstance.get('/auth/profile'),
  updateProfile: (userData) => axiosInstance.put('/auth/profile', userData),
}