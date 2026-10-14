import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, PlayCircle, Award, ChevronRight } from 'lucide-react'
import { courseApi } from '../../api/courseApi'

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true)
      const response = await courseApi.getPublishedCourses()
      setFeaturedCourses(response.data.courses.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="-mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mx-8">
      <section className="relative isolate overflow-hidden border-b border-base-300 bg-[#FAF8F3]">
        <div className="absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-[#E8EFE6] blur-3xl" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:py-28">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-base-300 bg-white px-3.5 py-1.5 text-sm font-medium text-base-content/70">
              <span className="h-2 w-2 rounded-full bg-primary" />
              A more thoughtful way to learn
            </span>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-base-content sm:text-5xl lg:text-[3.65rem]">
              Make room for what you want to <span className="text-primary">learn next.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-base-content/70 sm:text-lg">
              Explore expert-led courses, learn at your own pace, and connect with instructors who care about your progress.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/courses" className="btn btn-primary btn-lg">
                Explore courses
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Start teaching
              </Link>
            </div>
            <p className="mt-5 text-sm text-base-content/55">
              Learn on your schedule. Grow at your own pace.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#E8EFE6]/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-base-300 bg-white p-5 shadow-[0_20px_60px_rgba(36,39,32,0.09)] sm:p-7">
              <div className="flex items-center justify-between border-b border-base-300 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-base-content">Your learning space</p>
                    <p className="text-sm text-base-content/55">A little progress, every day</p>
                  </div>
                </div>
                <span className="badge badge-outline border-base-300 bg-base-200 text-base-content/70">Learn</span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-base-200 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Discover</p>
                      <h2 className="mt-1 text-lg font-semibold text-base-content">Find a course worth your time</h2>
                    </div>
                    <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-base-content/70">Expert instructors</span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-base-content/70">Learn at your pace</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-base-300 bg-white p-4">
                    <PlayCircle className="mb-3 h-5 w-5 text-primary" />
                    <p className="font-semibold text-base-content">On-demand lessons</p>
                    <p className="mt-1 text-xs leading-5 text-base-content/60">Come back whenever it works for you.</p>
                  </div>
                  <div className="rounded-2xl border border-base-300 bg-white p-4">
                    <Users className="mb-3 h-5 w-5 text-primary" />
                    <p className="font-semibold text-base-content">Real connection</p>
                    <p className="mt-1 text-xs leading-5 text-base-content/60">Learn alongside a community of teachers and peers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-base-100 px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto mb-10 max-w-xl text-center sm:mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">The LectureIQ difference</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Learning that fits real life</h2>
            <p className="mt-3 text-base leading-7 text-base-content/65">Everything you need to build knowledge with confidence, in one welcoming place.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><BookOpen className="h-6 w-6 text-primary" /></span>
                <h3 className="card-title">Expert instructors</h3>
                <p className="text-sm leading-6 text-base-content/65">Learn from industry professionals with years of experience.</p>
              </div>
            </div>
            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><PlayCircle className="h-6 w-6 text-primary" /></span>
                <h3 className="card-title">HD video lectures</h3>
                <p className="text-sm leading-6 text-base-content/65">High-quality video content that you can stream anywhere.</p>
              </div>
            </div>
            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></span>
                <h3 className="card-title">Live interaction</h3>
                <p className="text-sm leading-6 text-base-content/65">Engage with instructors and peers in real time.</p>
              </div>
            </div>
            <div className="card bg-base-100">
              <div className="card-body items-center text-center">
                <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Award className="h-6 w-6 text-primary" /></span>
                <h3 className="card-title">Certification</h3>
                <p className="text-sm leading-6 text-base-content/65">Build useful skills and feel good about how far you’ve come.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-base-200 px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">A place to begin</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Explore featured courses</h2>
              <p className="mt-2 text-base text-base-content/65">Find a subject that sparks your curiosity.</p>
            </div>
            <Link to="/courses" className="btn btn-outline">
              View all courses
              <ChevronRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading courses"></span>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
              <p className="font-medium text-base-content">New courses are on their way.</p>
              <p className="mt-1 text-sm text-base-content/60">Explore the course catalog to see what’s available.</p>
              <Link to="/courses" className="btn btn-outline btn-sm mt-5">Browse all courses</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div key={course._id} className="card bg-base-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <figure className="px-4 pt-4">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="h-48 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center rounded-xl bg-[#E8EFE6]">
                        <BookOpen className="h-14 w-14 text-primary" />
                      </div>
                    )}
                  </figure>
                  <div className="card-body">
                    <h3 className="card-title text-lg">{course.title}</h3>
                    <p className="line-clamp-2 text-sm leading-6 text-base-content/65">{course.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-sm border-0 bg-base-200 text-base-content/70">{course.level}</span>
                      <span className="badge badge-sm border-base-300 bg-white text-base-content/70">
                        {course.isPaid ? `₹${course.price}` : 'Free'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-base-content/60">
                      Instructor: {course.teacher?.firstName} {course.teacher?.lastName}
                    </p>
                    <div className="card-actions justify-end mt-4">
                      <Link to={`/course/${course._id}`} className="btn btn-primary btn-sm">
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#365C45] px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to start learning?</h2>
          <p className="mb-8 text-lg text-white/80">
            Join LectureIQ today and unlock thousands of courses.
          </p>
          <Link to="/register" className="btn btn-lg border-white bg-white text-[#365C45] hover:border-[#F5F2EA] hover:bg-[#F5F2EA]">
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home