import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { enrollmentApi } from '../../api/enrollmentApi';
import { liveApi } from '../../api/liveApi';

const formatLiveTime = (value) => {
  if (!value) return 'Scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Scheduled';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const UpcomingLive = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const enrollRes = await enrollmentApi.getMyEnrollments();
        const enrolledCourses = enrollRes.data.enrollments
          .filter((enrollment) => enrollment.status === 'active')
          .map((enrollment) => enrollment.course?._id)
          .filter(Boolean);

        const results = await Promise.allSettled(
          enrolledCourses.map((courseId) => liveApi.getUpcoming(courseId))
        );
        const allSessions = results.flatMap((result) =>
          result.status === 'fulfilled' ? result.value.data.sessions || [] : []
        );
        setSessions(allSessions);
      } catch {
        toast.error('Failed to load live sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Live & Upcoming Classes</h1>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No live or upcoming sessions for your enrolled courses.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const isLive = session.liveStatus === 'live';
            return (
              <div key={session._id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="card-title">{session.title}</h2>
                    <span className={`badge ${isLive ? 'badge-success' : 'badge-ghost'}`}>
                      {isLive ? 'Live now' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{session.description}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {isLive ? 'Started:' : 'Scheduled:'}{' '}
                    {formatLiveTime(
                      isLive
                        ? session.startedAt || session.scheduledAt
                        : session.scheduledAt || session.createdAt
                    )}
                  </p>
                  <div className="card-actions justify-end mt-4">
                    {isLive ? (
                      <Link to={`/live/${session._id}`} className="btn btn-primary btn-sm">
                        Join
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-sm" disabled>
                        Upcoming
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingLive;