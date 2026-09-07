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

const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth)
  const role = user?.role   // 👈 user object se role nikaalo
//  console.log('========== ROLE BASED ROUTE DEBUG ==========')
//   console.log('isAuthenticated:', isAuthenticated)
//   console.log('user object:', user)
//   console.log('role from user:', role)
//   console.log('allowedRoles:', allowedRoles)
//   console.log('loading:', loading)
//   console.log('============================================')
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    console.log('❌ Redirecting to home because:', {
      isAuthenticatedMissing: !isAuthenticated,
      roleMissing: !role,
      roleNotAllowed: role ? !allowedRoles.includes(role) : false
    })
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleBasedRoute