import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { courseApi, lectureApi, teacherApi } from '../../api'
import VideoPlayer from '../../components/lectures/VideoPlayer'
import LectureList from '../../components/courses/LectureList'
import ProgressBar from '../../components/lectures/ProgressBar'
import Loader from '../../components/common/Loader'


const CoursePlayer = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedLectureId = searchParams.get('lecture')
  const role = useSelector((state) => state.auth.user?.role)
  const [lectures, setLectures] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const summaryRequestId = useRef(0)
  const progressLastSentAt = useRef(0)
  const progressRequestInFlight = useRef(false)
  const completionSent = useRef(false)
  const progressFailedLectureId = useRef(null)
  const [progressError, setProgressError] = useState('')

  const fetchCourseContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res =
        role === 'teacher'
          ? await teacherApi.getCourseLectures(id)
          : await courseApi.getCourseLectures(id)
      const lectureList = res.data.lectures || []

      setLectures(lectureList)
      setCurrent(
        lectureList.find((lecture) => lecture._id === requestedLectureId) ||
          lectureList[0] ||
          null
      )
    } catch (err) {
      console.error('Failed to load lectures:', err)
      setError('Failed to load course content. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id, requestedLectureId, role])

  useEffect(() => {
    summaryRequestId.current += 1
    setCurrent(null)
    setSummary('')
    setSummaryError('')
    setSummarizing(false)
    fetchCourseContent()
  }, [fetchCourseContent])


  const handleProgress = (state) => {
    if (
      role !== 'student' ||
      !/^[a-f\d]{24}$/i.test(current?._id || '') ||
      !Number.isFinite(state.playedSeconds)
    ) {
      return
    }

    const watchedSeconds = Math.floor(state.playedSeconds)
    const completed = state.played > 0.9

    setProgress(Math.round(state.played * 100))

    if (
      progressRequestInFlight.current ||
      progressFailedLectureId.current === current._id ||
      (completed && completionSent.current) ||
      (!completed && Date.now() - progressLastSentAt.current < 10000)
    ) {
      return
    }

    progressLastSentAt.current = Date.now()
    progressRequestInFlight.current = true
    if (completed) completionSent.current = true

    lectureApi.updateProgress(current._id, {
      watchedDuration: watchedSeconds,
      completed
    }).catch(() => {
      progressFailedLectureId.current = current._id
      setProgressError('Unable to save learning progress. Video playback is not affected.')
    }).finally(() => {
      progressRequestInFlight.current = false
    })
  }

  const handleComplete = () => {
    // Optional: mark lecture as completed, show congratulation, etc.
    console.log('Lecture completed!')
  }

  const selectLecture = (lecture) => {
    summaryRequestId.current += 1
    progressLastSentAt.current = 0
    completionSent.current = false
    progressFailedLectureId.current = null
    setProgressError('')
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
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
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
            <div className="mt-5 space-y-4">
              <div className="border-b border-base-300 pb-4">
                <h2 className="text-2xl font-semibold tracking-tight">{current.title}</h2>
                <p className="mt-2 leading-7 text-base-content/70">{current.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="badge badge-primary">Lecture {current.order}</span>
                  <span className="text-sm text-base-content/60">{current.duration || 0} min</span>
                </div>
              </div>
              <section className="space-y-3 rounded-xl border border-base-300 bg-base-100 p-5 sm:p-6">
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
                <p className="text-sm text-base-content/60">
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
              {progressError && (
                <p role="status" className="text-sm text-warning">
                  {progressError}
                </p>
              )}
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
        <div className="rounded-xl border border-base-300 bg-base-100 p-4 xl:sticky xl:top-24">
          <h3 className="mb-4 flex items-center gap-2 border-b border-base-300 pb-3 text-lg font-semibold">
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