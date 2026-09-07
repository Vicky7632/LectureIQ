import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">About LectureIQ</h1>
      
      <div className="prose lg:prose-xl">
        <p className="text-lg mb-4">
          LectureIQ is an online learning platform that connects students with expert teachers across various domains. 
          We aim to make quality education accessible to everyone, anywhere.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p>
          To empower learners with practical knowledge and skills through engaging video lectures, interactive quizzes, 
          and real-world projects. We believe in learning by doing.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose Us?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Expert instructors from industry and academia</li>
          <li>High-quality video content with lifetime access</li>
          <li>Flexible learning at your own pace</li>
          <li>Certificates of completion</li>
          <li>Affordable pricing with free courses available</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
        <p>
          Founded in 2025, LectureIQ started as a small initiative by a group of educators who wanted to share their 
          knowledge beyond the classroom. Today, we have thousands of students worldwide and a growing library of courses.
        </p>
      </div>
    </div>
  )
}

export default About