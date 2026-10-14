import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        <main className="min-w-0 flex-1 px-4 py-6 transition-all duration-300 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
          {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout