import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  const [summary, setSummary] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const summaryRequestId = useRef(0)

  const fetchCourseContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await courseApi.getCourseLectures(id)
      const lectureList = res.data.lectures || []

      setLectures(lectureList)
      setCurrent(lectureList[0] || null)
    } catch (err) {
      console.error('Failed to load lectures:', err)
      setError('Failed to load course content. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    summaryRequestId.current += 1
    setCurrent(null)
    setSummary('')
    setSummaryError('')
    setSummarizing(false)
    fetchCourseContent()
  }, [fetchCourseContent])


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

  const selectLecture = (lecture) => {
    summaryRequestId.current += 1
    setCurrent(lecture)
    setSummary('')
    setSummaryError('')
    setSummarizing(false)
  }

  const handleSummarize = async () => {
    if (!current) return

    const requestId = ++summaryRequestId.current
    setSummarizing(true)
    setSummary('')
    setSummaryError('')

    try {
      const response = await lectureApi.summarize(current._id)
      if (summaryRequestId.current === requestId) {
        setSummary(response.data.summary)
      }
    } catch (err) {
      if (summaryRequestId.current === requestId) {
        setSummaryError(
          err.response?.data?.message || 'Unable to summarize this lecture. Please try again.'
        )
      }
    } finally {
      if (summaryRequestId.current === requestId) {
        setSummarizing(false)
      }
    }
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
              <section className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">AI study summary</h3>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSummarize}
                    disabled={summarizing || !current.description?.trim()}
                  >
                    {summarizing ? 'Summarizing…' : 'Summarize lecture text'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Generated from this lecture's description, not its video or audio.
                </p>
                {!current.description?.trim() && (
                  <p className="text-sm text-gray-600">
                    This lecture has no description text to summarize.
                  </p>
                )}
                {summaryError && (
                  <p role="alert" className="text-sm text-error">{summaryError}</p>
                )}
                {summary && (
                  <div className="whitespace-pre-wrap text-sm" aria-live="polite">
                    {summary}
                  </div>
                )}
              </section>
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
            enrolled={true}
            currentLectureId={current?._id}
            onSelect={selectLecture}
          />
        </div>
      </div>
    </div>
  )
}

export default CoursePlayer