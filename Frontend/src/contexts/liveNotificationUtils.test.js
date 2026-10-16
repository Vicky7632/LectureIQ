import assert from 'node:assert/strict'
import test from 'node:test'
import {
  appendLiveNotification,
  createLiveNotification,
  markNotificationsRead,
} from './liveNotificationUtils.js'

test('creates notifications only from real live lecture start/end event payloads', () => {
  const started = createLiveNotification('lecture:started', {
    lectureId: 'lecture-1',
    courseId: 'course-1',
    title: 'Web APIs',
    startedAt: '2026-10-16T12:00:00.000Z',
  })
  assert.equal(started.message, 'Live class started')
  assert.equal(started.canJoin, true)
  assert.equal(started.read, false)
  assert.equal(
    createLiveNotification('lecture:started', { lectureId: 'lecture-1' }),
    null
  )
  assert.equal(
    createLiveNotification('payment:success', {
      lectureId: 'lecture-1',
      courseId: 'course-1',
      startedAt: '2026-10-16T12:00:00.000Z',
    }),
    null
  )
  assert.equal(
    createLiveNotification('lecture:ended', {
      lectureId: 'lecture-1',
      courseId: 'course-1',
      endedAt: 'not-a-date',
    }),
    null
  )
})

test('live end events disable the earlier join action and remain deduplicated', () => {
  const started = createLiveNotification('lecture:started', {
    lectureId: 'lecture-1',
    courseId: 'course-1',
    startedAt: '2026-10-16T12:00:00.000Z',
  })
  const ended = createLiveNotification('lecture:ended', {
    lectureId: 'lecture-1',
    courseId: 'course-1',
    endedAt: '2026-10-16T13:00:00.000Z',
  })
  const state = appendLiveNotification([started], ended)
  assert.equal(state[1].canJoin, false)
  assert.equal(state[0].message, 'Live class ended')
  assert.equal(appendLiveNotification(state, { ...ended }), state)
})

test('deduplicates repeated room delivery and caps notification history', () => {
  const first = createLiveNotification('lecture:started', {
    lectureId: 'lecture-1',
    courseId: 'course-1',
    startedAt: '2026-10-16T12:00:00.000Z',
  })
  const duplicate = { ...first }
  const afterFirst = appendLiveNotification([], first)
  const afterDuplicate = appendLiveNotification(afterFirst, duplicate)
  assert.equal(afterDuplicate, afterFirst)

  const capped = Array.from({ length: 30 }, (_, index) =>
    createLiveNotification('lecture:ended', {
      lectureId: `lecture-${index}`,
      courseId: 'course-1',
      endedAt: '2026-10-16T12:00:00.000Z',
    })
  ).reduce((items, notification) => appendLiveNotification(items, notification, 5), [])
  assert.equal(capped.length, 5)
})

test('marks existing notifications as read without mutating the originals', () => {
  const notification = {
    id: 'lecture-1:lecture:started',
    read: false,
  }
  const result = markNotificationsRead([notification])
  assert.equal(result[0].read, true)
  assert.equal(notification.read, false)
})
