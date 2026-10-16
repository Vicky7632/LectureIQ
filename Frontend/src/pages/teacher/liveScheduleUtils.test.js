import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getLocalDateTimeInputValue,
  isFutureLocalDateTime,
  toScheduledAtISOString,
} from './liveScheduleUtils.js'

test('accepts future local times and rejects missing, invalid, or past values', () => {
  const now = new Date(2030, 0, 1, 10, 0).getTime()
  assert.equal(isFutureLocalDateTime('2030-01-01T10:01', now), true)
  assert.equal(isFutureLocalDateTime('', now), false)
  assert.equal(isFutureLocalDateTime('not-a-date', now), false)
  assert.equal(isFutureLocalDateTime('2030-01-01T09:59', now), false)
})

test('converts browser-local date/time to an absolute ISO timestamp', () => {
  const localTime = '2030-06-15T14:30'
  assert.equal(
    toScheduledAtISOString(localTime),
    new Date(localTime).toISOString()
  )
  assert.match(toScheduledAtISOString(localTime), /Z$/)
})

test('formats the minimum schedule value using local date/time fields', () => {
  const timestamp = new Date(2030, 0, 2, 3, 4, 59).getTime()
  assert.equal(getLocalDateTimeInputValue(timestamp), '2030-01-02T03:04')
})
