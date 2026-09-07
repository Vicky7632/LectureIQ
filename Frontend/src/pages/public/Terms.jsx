import React from 'react'

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <div className="prose lg:prose-xl">
        <p className="text-sm text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using LectureIQ, you agree to be bound by these Terms. If you do not agree, please do not use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Course Enrollment and Payments</h2>
        <p>
          Courses are available for a fee or free. Payments are processed securely. Refunds are subject to our refund policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Intellectual Property</h2>
        <p>
          All content on LectureIQ, including videos, text, and graphics, is owned by us or our instructors and is protected by copyright laws. You may not redistribute or resell any content.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Conduct</h2>
        <ul className="list-disc pl-6">
          <li>Impersonating another person</li>
          <li>Interfering with the security of the platform</li>
          <li>Uploading malicious content</li>
          <li>Harassing other users</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access if you violate these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
        <p>
          LectureIQ shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact</h2>
        <p>
          For any questions regarding these Terms, please contact us at support@lectureiq.com.
        </p>
      </div>
    </div>
  )
}

export default Terms