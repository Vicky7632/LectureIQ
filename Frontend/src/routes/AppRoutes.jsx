import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleBasedRoute from './RoleBasedRoute'
import ScheduleLive from '../pages/teacher/ScheduleLive';
import UpcomingLive from '../pages/student/UpcomingLive';
import LiveSessionRoom from '../pages/live/LiveSessionRoom';

// Public
import Home from '../pages/public/Home'
import Courses from '../pages/public/Courses'
import CourseDetail from '../pages/public/CourseDetail'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import VerifyEmail from '../pages/auth/VerifyEmail'

// Common Auth (accessible to all authenticated users)
import Profile from '../pages/student/Profile'    // ✅ Profile works for all roles
import ChangePassword from '../pages/auth/ChangePassword'

// Student
import StudentDashboard from '../pages/student/Dashboard'
import MyCourses from '../pages/student/MyCourses'
import CoursePlayer from '../pages/student/CoursePlayer'

// Teacher
import TeacherDashboard from '../pages/teacher/Dashboard'
import TeacherCourses from '../pages/teacher/TeacherCourses'
import CreateCourse from '../pages/teacher/CreateCourse'
import EditCourse from '../pages/teacher/EditCourse'
import CreateLecture from '../pages/teacher/CreateLecture'
import CourseStudents from '../pages/teacher/CourseStudents'
import CourseLectures from '../pages/teacher/CourseLectures'

// Admin
import AdminDashboard from '../pages/admin/Dashboard'
import AdminTeachers from '../pages/admin/Teachers'
import AdminCourses from '../pages/admin/Courses'
import AdminStudents from '../pages/admin/Students'
import AdminPayments from '../pages/admin/Payments'
import CourseApprovals from '../pages/admin/CourseApprovals'
import CreateTeacher from '../pages/admin/CreateTeacher'
import CreateAdmin from '../pages/admin/CreateAdmin'
import About from '../pages/public/About'
import Contact from '../pages/public/Contact'
import Privacy from '../pages/public/Privacy'
import Terms from '../pages/public/Terms'

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/course/:id" element={<CourseDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* ===== COMMON PROTECTED ROUTES (All authenticated users) ===== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
         <Route path="/live/:lectureId" element={<LiveSessionRoom />} />
      </Route>

      {/* ===== STUDENT ROUTES ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleBasedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/my-courses" element={<MyCourses />} />
          <Route path="/student/course/:id/learn" element={<CoursePlayer />} />
          <Route path="/student/upcoming-live" element={<UpcomingLive />} />
         
        </Route>
      </Route>

      {/* ===== TEACHER ROUTES ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleBasedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/create-course" element={<CreateCourse />} />
          <Route path="/teacher/course/:id/edit" element={<EditCourse />} />
          <Route path="/teacher/course/:id/students" element={<CourseStudents />} />
          <Route path="/teacher/course/:id/lectures" element={<CourseLectures />} />   {/* 👈 New */}
          <Route path="/teacher/course/:id/create-lecture" element={<CreateLecture />} />
          <Route path="/teacher/schedule-live" element={<ScheduleLive />} />
          
        </Route>
      </Route>

      {/* ===== ADMIN ROUTES ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/approvals" element={<CourseApprovals />} />
          <Route path="/admin/create-teacher" element={<CreateTeacher />} />
          <Route path="/admin/create-admin" element={<CreateAdmin />} />
        </Route>
      </Route>

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes