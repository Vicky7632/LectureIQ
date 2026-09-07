import React from 'react'

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose lg:prose-xl">
        <p className="text-sm text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>
          We collect personal information you provide to us such as name, email address, phone number, and payment details when you register, purchase a course, or contact us.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6">
          <li>To provide and maintain our services</li>
          <li>To process payments</li>
          <li>To communicate with you about updates, offers, and support</li>
          <li>To improve our platform and user experience</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Sharing Your Information</h2>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share anonymized data for analytics or with service providers who assist us in operating our platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Security</h2>
        <p>
          We implement security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. Contact us to exercise these rights.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </p>
      </div>
    </div>
  )
}

export default Privacy