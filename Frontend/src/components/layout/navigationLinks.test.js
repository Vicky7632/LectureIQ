import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { roleNavigationLinks } from './navigationLinks.js'

const routesSource = await readFile(
  new URL('../../routes/AppRoutes.jsx', import.meta.url),
  'utf8'
)
const registeredRoutes = new Set(
  [...routesSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(
    ([, path]) => `/${path.replace(/^\/+/, '')}`
  )
)

test('every role navigation link targets a registered route', () => {
  for (const [role, links] of Object.entries(roleNavigationLinks)) {
    const seenTargets = new Set()
    for (const { to, label } of links) {
      assert.equal(
        registeredRoutes.has(to),
        true,
        `${role} navigation "${label}" points to unregistered route ${to}`
      )
      assert.equal(
        seenTargets.has(to),
        false,
        `${role} navigation contains duplicate target ${to}`
      )
      seenTargets.add(to)
    }
  }
})

test('role navigation exposes the relevant student, teacher, and admin destinations', () => {
  const destinations = (role) =>
    roleNavigationLinks[role].map(({ to }) => to)

  assert.ok(destinations('student').includes('/student/my-courses'))
  assert.ok(destinations('student').includes('/student/upcoming-live'))
  assert.ok(destinations('teacher').includes('/teacher/schedule-live'))
  assert.ok(destinations('admin').includes('/admin/students'))
  assert.ok(destinations('admin').includes('/admin/payments'))
})
