import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeProfileImageUrl } from './profileImage.js'

test('preserves absolute and relative image paths without adding URL prefixes', () => {
  assert.equal(
    normalizeProfileImageUrl(' https://images.example.test/avatar.png '),
    'https://images.example.test/avatar.png'
  )
  assert.equal(normalizeProfileImageUrl('/uploads/avatar.png'), '/uploads/avatar.png')
  assert.equal(normalizeProfileImageUrl('uploads/avatar.png'), 'uploads/avatar.png')
})

test('rejects empty values and non-web URL schemes', () => {
  assert.equal(normalizeProfileImageUrl(null), null)
  assert.equal(normalizeProfileImageUrl('  '), null)
  assert.equal(normalizeProfileImageUrl('javascript:alert(1)'), null)
  assert.equal(normalizeProfileImageUrl('data:image/png;base64,abc'), null)
})
