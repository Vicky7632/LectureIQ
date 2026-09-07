import React from 'react'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

const Contact = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-lg mb-6">
            Have questions or feedback? We'd love to hear from you. Fill out the form or reach us directly.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="text-primary" size={20} />
              <a href="mailto:support@lectureiq.com" className="link link-primary">
                support@lectureiq.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-primary" size={20} />
              <span>+91 123 456 7890</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-primary" size={20} />
              <span>123 Edu Street, Tech Park, Bangalore, India</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <span>Monday - Friday, 9 AM - 6 PM IST</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Send a Message</h2>
            <form>
              <div className="form-control">
                <label className="label">Name</label>
                <input type="text" placeholder="Your name" className="input input-bordered" />
              </div>
              <div className="form-control mt-2">
                <label className="label">Email</label>
                <input type="email" placeholder="your@email.com" className="input input-bordered" />
              </div>
              <div className="form-control mt-2">
                <label className="label">Message</label>
                <textarea className="textarea textarea-bordered" rows="4" placeholder="Your message..."></textarea>
              </div>
              <button className="btn btn-primary mt-4">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact