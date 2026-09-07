import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, Clock } from 'lucide-react';
import { enrollmentApi } from '../../api/enrollmentApi';
import { liveApi } from '../../api/liveApi';

const UpcomingLive = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Get enrolled courses first, then fetch live sessions for each
        const enrollRes = await enrollmentApi.getMyEnrollments();
        const enrolledCourses = enrollRes.data.enrollments.map(e => e.course._id);
        
        // For each course, fetch live sessions
        const promises = enrolledCourses.map(courseId => liveApi.getUpcoming(courseId));
        const results = await Promise.all(promises);
        const allSessions = results.flatMap(res => res.data.sessions || []);
        setSessions(allSessions);
      } catch (err) {
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
      <h1 className="text-3xl font-bold mb-6">Upcoming Live Sessions</h1>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No upcoming live sessions.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(session => (
            <div key={session._id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">{session.title}</h2>
                <p className="text-sm text-gray-600">{session.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(session.scheduledTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    {new Date(session.scheduledTime).toLocaleTimeString()}
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <Link to={`/live/${session._id}`} className="btn btn-primary btn-sm">
                    Join
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingLive;