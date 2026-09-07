import { useEffect } from 'react'
// import { BrowserRouter } from 'react-router-dom'   // 👈 REMOVE THIS LINE
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AppRoutes from './routes/AppRoutes'
import Layout from './components/layout/Layout'
import SocketService from './utils/socket'
import { setUser } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        dispatch(setUser({ user: JSON.parse(storedUser) }))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      if (typeof SocketService?.connect === 'function') {
        SocketService.connect()
      }
    } else {
      if (typeof SocketService?.disconnect === 'function') {
        SocketService.disconnect()
      }
    }
    return () => {
      if (typeof SocketService?.disconnect === 'function') {
        SocketService.disconnect()
      }
    }
  }, [isAuthenticated])

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div>
      {/* <BrowserRouter> removed from here */}
      <Layout>
        <AppRoutes />
        <Toaster position="top-right" />
      </Layout>
      {/* </BrowserRouter> removed */}
    </div>
      
   
  )
}

export default App