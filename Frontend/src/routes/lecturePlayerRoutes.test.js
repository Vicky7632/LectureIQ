import assert from 'node:assert/strict'
import test from 'node:test'
import { getLecturePlayerPath, hasAllowedRole } from './lecturePlayerRoutes.js'

test('allows only the exact role configured for a protected route', () => {
  assert.equal(hasAllowedRole('teacher', ['teacher']), true)
  assert.equal(hasAllowedRole('student', ['student']), true)
  assert.equal(hasAllowedRole('teacher', ['student']), false)
  assert.equal(hasAllowedRole('admin', ['teacher', 'student']), false)
  assert.equal(hasAllowedRole(null, ['teacher']), false)
})

test('sends teachers and students to their separately authorized lecture players', () => {
  assert.equal(
    getLecturePlayerPath('course-1', 'lecture-1', 'teacher'),
    '/teacher/course/course-1/preview?lecture=lecture-1'
  )
  assert.equal(
    getLecturePlayerPath('course-1', 'lecture-1', 'student'),
    '/student/course/course-1/learn?lecture=lecture-1'
  )
  assert.equal(
    getLecturePlayerPath('course-1', 'lecture 1', 'teacher'),
    '/teacher/course/course-1/preview?lecture=lecture%201'
  )
})
