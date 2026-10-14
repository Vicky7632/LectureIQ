import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer footer-center mt-auto gap-3 border-t border-base-300 bg-base-100 px-6 py-8 text-sm text-base-content/65">
      {/* Links: mobile par vertical, medium screens par horizontal */}
      <div className="grid grid-flow-row md:grid-flow-col gap-4">
        <Link to="/about" className="link link-hover">About</Link>
        <Link to="/contact" className="link link-hover">Contact</Link>
        <Link to="/privacy" className="link link-hover">Privacy</Link>
        <Link to="/terms" className="link link-hover">Terms</Link>
      </div>
      <div>
        <p>Copyright © {new Date().getFullYear()} LectureIQ. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer