import axiosInstance from './axiosConfig'

export const lectureApi = {
  createLecture: (formData) => {
    return axiosInstance.post('/lecture/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  updateProgress: (lectureId, data) => axiosInstance.put(`/student/lecture/${lectureId}/progress`, data)
}