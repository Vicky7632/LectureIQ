import {
  BookOpen,
  Calendar,
  CheckCircle,
  DollarSign,
  Home,
  PlusCircle,
  Settings,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'

const accountLinks = [
  { to: '/profile', icon: Settings, label: 'Profile' },
  { to: '/change-password', icon: Shield, label: 'Change Password' },
]

export const roleNavigationLinks = {
  student: [
    { to: '/student/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/student/my-courses', icon: BookOpen, label: 'My Courses' },
    { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
    { to: '/student/upcoming-live', icon: Calendar, label: 'Upcoming Live' },
    ...accountLinks,
  ],
  teacher: [
    { to: '/teacher/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/teacher/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/teacher/create-course', icon: PlusCircle, label: 'Create Course' },
    { to: '/teacher/schedule-live', icon: Calendar, label: 'Schedule Live' },
    ...accountLinks,
  ],
  admin: [
    { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin/teachers', icon: Users, label: 'Teachers' },
    { to: '/admin/create-teacher', icon: UserPlus, label: 'Add Teacher' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/approvals', icon: CheckCircle, label: 'Approvals' },
    { to: '/admin/payments', icon: DollarSign, label: 'Payments' },
    { to: '/admin/create-admin', icon: Shield, label: 'Add Admin' },
    ...accountLinks,
  ],
}

export const getRoleNavigationLinks = (role) =>
  roleNavigationLinks[role] || roleNavigationLinks.student
