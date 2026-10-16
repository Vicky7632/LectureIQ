import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import { liveApi } from '../../api/liveApi';
import {
  getLocalDateTimeInputValue,
  isFutureLocalDateTime,
  toScheduledAtISOString,
} from './liveScheduleUtils';

const schema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  scheduledAt: z
    .string()
    .min(1, 'Schedule date and time are required')
    .refine(
      (value) => isFutureLocalDateTime(value),
      'Choose a valid time in the future'
    ),
});

const ScheduleLive = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlightRef = useRef(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let isCurrent = true;
    const fetchCourses = async () => {
      try {
        const res = await courseApi.getTeacherCourses();
        if (isCurrent) {
          setCourses(
            (res.data.courses || []).filter(
              (course) => course.status !== 'rejected'
            )
          );
        }
      } catch (error) {
        if (isCurrent) {
          setCoursesError(
            error.response?.data?.message || 'Failed to load courses'
          );
        }
      } finally {
        if (isCurrent) setCoursesLoading(false);
      }
    };
    void fetchCourses();
    return () => {
      isCurrent = false;
    };
  }, []);

  const onSubmit = async (data) => {
    if (submissionInFlightRef.current) return;

    submissionInFlightRef.current = true;
    setSubmitting(true);
    try {
      await liveApi.schedule({
        courseId: data.courseId,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        scheduledAt: toScheduledAtISOString(data.scheduledAt),
        lectureType: 'live',
        isPreview: false,
      });
      toast.success('Live lecture scheduled');
      navigate('/teacher/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scheduling failed');
    } finally {
      submissionInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-4 sm:py-8">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl">Schedule Live Lecture</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">Select Course</label>
              <select className={`select select-bordered w-full ${errors.courseId ? 'select-error' : ''}`} {...register('courseId')}>
                <option value="">Choose a course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              {errors.courseId && <p className="text-error text-sm mt-1">{errors.courseId.message}</p>}
              {!coursesLoading && !coursesError && courses.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Create a course before scheduling a live lecture.
                </p>
              )}
              {coursesLoading && (
                <p className="mt-1 text-sm text-gray-500">Loading your courses...</p>
              )}
              {coursesError && (
                <p className="mt-1 text-sm text-error" role="alert">{coursesError}</p>
              )}
            </div>
            <div className="form-control">
              <label className="label">Title</label>
              <input className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`} {...register('title')} />
              {errors.title && <p className="text-error text-sm mt-1">{errors.title.message}</p>}
            </div>
            <div className="form-control">
              <label className="label" htmlFor="scheduledAt">Date and time</label>
              <input
                id="scheduledAt"
                type="datetime-local"
                min={getLocalDateTimeInputValue()}
                className={`input input-bordered w-full ${errors.scheduledAt ? 'input-error' : ''}`}
                {...register('scheduledAt')}
              />
              {errors.scheduledAt && (
                <p className="mt-1 text-sm text-error">{errors.scheduledAt.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Times are scheduled in your local time zone.
              </p>
            </div>
            <div className="form-control">
              <label className="label">Description (optional)</label>
              <textarea className="textarea textarea-bordered w-full" {...register('description')} rows="3" />
            </div>
            <div className="mt-6 flex w-full justify-end">
              <button
                type="submit"
                className="btn btn-primary w-full sm:w-auto"
                disabled={submitting || coursesLoading || courses.length === 0}
              >
                {submitting ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleLive;