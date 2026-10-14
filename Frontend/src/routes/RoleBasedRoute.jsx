// import { Navigate, Outlet } from 'react-router-dom'
// import { useSelector } from 'react-redux'

// const RoleBasedRoute = ({ allowedRoles }) => {
//   const { role, loading } = useSelector((state) => state.auth)

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <span className="loading loading-spinner loading-lg"></span>
//       </div>
//     )
//   }

//   if (!role || !allowedRoles.includes(role)) {
//     return <Navigate to="/" replace />
//   }

//   // Important: Nested routes ke liye Outlet render karo
//   return <Outlet />
// }

// export default RoleBasedRoute
import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { hasAllowedRole } from './lecturePlayerRoutes'

const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth)
  const role = user?.role
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!isAuthenticated || !hasAllowedRole(role, allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleBasedRoute