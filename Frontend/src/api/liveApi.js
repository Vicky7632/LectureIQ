import axiosInstance from './axiosConfig';

export const liveApi = {
  // Create live lecture (reuse lectureApi.createLecture with type 'live')
  schedule: (data) => axiosInstance.post('/lecture/create-live', data),

  // Get upcoming live lectures for a course
  getUpcoming: (courseId) => axiosInstance.get(`/lecture/upcoming/${courseId}`),

  // Start live session (teacher)
  start: (lectureId) => axiosInstance.patch(`/lecture/${lectureId}/start`),

  // End live session (teacher) with thumbnail
  end: (lectureId, thumbnail) => axiosInstance.patch(`/lecture/${lectureId}/end`, { thumbnail }),

  // Join live session (returns session details)
  join: (lectureId) => axiosInstance.get(`/lecture/${lectureId}/join`),
};