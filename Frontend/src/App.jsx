import { useEffect } from 'react'
// import { BrowserRouter } from 'react-router-dom'   // 👈 REMOVE THIS LINE
import { useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes'
import Layout from './components/layout/Layout'
import { setUser } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        dispatch(setUser({ user: JSON.parse(storedUser) }))
      } catch {
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

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