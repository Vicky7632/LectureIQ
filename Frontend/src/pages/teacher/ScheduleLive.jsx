import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import { liveApi } from '../../api/liveApi';

const schema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
});

const ScheduleLive = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseApi.getTeacherCourses();
        setCourses(res.data.courses || []);
      } catch (err) {
        toast.error('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await liveApi.schedule({
        ...data,
        lectureType: 'live',
        isPreview: false,
        order: 1, // backend will adjust based on lectures count
      });
      toast.success('Live lecture scheduled');
      navigate('/teacher/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scheduling failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back
      </button>
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Schedule Live Lecture</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-control">
              <label className="label">Select Course</label>
              <select className={`select select-bordered ${errors.courseId ? 'select-error' : ''}`} {...register('courseId')}>
                <option value="">Choose a course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              {errors.courseId && <p className="text-error text-sm mt-1">{errors.courseId.message}</p>}
            </div>
            <div className="form-control mt-4">
              <label className="label">Title</label>
              <input className={`input input-bordered ${errors.title ? 'input-error' : ''}`} {...register('title')} />
              {errors.title && <p className="text-error text-sm mt-1">{errors.title.message}</p>}
            </div>
            <div className="form-control mt-4">
              <label className="label">Description (optional)</label>
              <textarea className="textarea textarea-bordered" {...register('description')} rows="3" />
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleLive;