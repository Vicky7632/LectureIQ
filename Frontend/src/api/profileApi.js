import axiosInstance from './axiosConfig'

export const profileApi = {
  getProfile: () => axiosInstance.get('/profile/me'),
  updateProfile: (data) => axiosInstance.put('/profile/me', data), // agar update endpoint bana hai to
}