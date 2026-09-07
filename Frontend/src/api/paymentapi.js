import axiosInstance from './axiosConfig'

export const paymentApi = {
  createOrder: (courseId) => axiosInstance.post(`/payment/courses/${courseId}/order`),
  verifyPayment: (data) => axiosInstance.post('/payment/verify/razorpay', data),
  
  // Admin endpoints
  getAllPayments: () => axiosInstance.get('/admin/payments'),
  getCoursePayments: (courseId) => axiosInstance.get(`/admin/course/${courseId}/payments`)
}