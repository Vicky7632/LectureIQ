import React, { useEffect, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { courseApi } from '../../api/courseApi'
import CourseCard from '../../components/courses/CourseCard'
import Loader from '../../components/common/Loader'

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = (searchParams.get('search') || '').trim()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [inputValue, setInputValue] = useState(searchTerm)

  useEffect(() => {
    setInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    let current = true
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(false)
        const response = await courseApi.getPublishedCourses(searchTerm)
        if (current) setCourses(response.data.courses || [])
      } catch (requestError) {
        console.error('Failed to fetch courses:', requestError)
        if (current) setError(true)
      } finally {
        if (current) setLoading(false)
      }
    }
    void fetchCourses()
    return () => {
      current = false
    }
  }, [retryCount, searchTerm])

  const submitSearch = (event) => {
    event.preventDefault()
    const query = inputValue.trim()
    setSearchParams(query ? { search: query } : {})
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="mx-auto max-w-7xl py-2">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Find your next step</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Explore courses</h1>
        <p className="mt-2 text-base text-base-content/65">Learn from experienced instructors and build skills that stay with you.</p>
        <form onSubmit={submitSearch} role="search" className="mt-6 flex max-w-xl gap-2">
          <input
            type="search"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search by course, topic, or level..."
            aria-label="Search published courses"
            className="input input-bordered min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary" aria-label="Search courses">
            <Search size={18} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
      </div>
      
      {error ? (
        <div role="alert" className="rounded-2xl border border-error/30 bg-base-100 px-6 py-12 text-center">
          <p className="font-medium">Unable to load courses right now.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-4"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-9 w-9 text-primary" aria-hidden="true" />
          <p className="font-medium text-base-content">
            {searchTerm ? 'No published courses match your search.' : 'No courses available yet.'}
          </p>
          <p className="mt-1 text-sm text-base-content/60">
            {searchTerm ? 'Try a different course title, topic, or level.' : 'Check back soon for new learning opportunities.'}
          </p>
          {searchTerm && (
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => setSearchParams({})}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Courses