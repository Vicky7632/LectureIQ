import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { courseApi, lectureApi } from '../../api'
import VideoPlayer from '../../components/lectures/VideoPlayer'
import LectureList from '../../components/courses/LectureList'
import ProgressBar from '../../components/lectures/ProgressBar'
import Loader from '../../components/common/Loader'

const CoursePlayer = () => {
  const { id } = useParams()
  const [lectures, setLectures] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCourseContent()
  }, [id])

  const fetchCourseContent = async () => {
    try {
      setLoading(true)
      const res = await courseApi.getCourseLectures(id)
      const lectureList = res.data.lectures || []
      setLectures(lectureList)
      if (lectureList.length > 0) {
        setCurrent(lectureList[0])
      }
    } catch (err) {
      console.error('Failed to load lectures:', err)
      setError('Failed to load course content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProgress = (state) => {
    if (!current) return
    const watchedSeconds = Math.floor(state.playedSeconds)
    const completed = state.played > 0.9
    
    setProgress(Math.round(state.played * 100))
    
    // Throttle API calls (optional – implement debounce if needed)
    lectureApi.updateProgress(current._id, {
      watchedDuration: watchedSeconds,
      completed
    }).catch(err => console.error('Progress update failed:', err))
  }

  const handleComplete = () => {
    // Optional: mark lecture as completed, show congratulation, etc.
    console.log('Lecture completed!')
  }

  if (loading) return <Loader fullScreen />
  if (error) return <div className="text-center text-error p-8">{error}</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Video Player */}
      <div className="lg:col-span-2">
        {current ? (
          <>
            <VideoPlayer
              url={current.videoUrl}
              onProgress={handleProgress}
              onComplete={handleComplete}
              autoPlay={false}
            />
            <div className="mt-4 space-y-2">
              <h2 className="text-2xl font-bold">{current.title}</h2>
              <p className="text-gray-600">{current.description}</p>
              <div className="flex items-center gap-4">
                <span className="badge badge-primary">Lecture {current.order}</span>
                <span className="text-sm text-gray-500">{current.duration || 0} min</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          </>
        ) : (
          <div className="bg-base-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No lecture selected</p>
          </div>
        )}
      </div>

      {/* Lecture List Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-base-200 p-4 rounded-lg sticky top-20">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>Course Content</span>
            <span className="badge badge-sm">{lectures.length} lectures</span>
          </h3>
          <LectureList
            lectures={lectures}
            courseId={id}
            enrolled={true}
            currentLectureId={current?._id}
            onSelect={setCurrent}
          />
        </div>
      </div>
    </div>
  )
}

export default CoursePlayer