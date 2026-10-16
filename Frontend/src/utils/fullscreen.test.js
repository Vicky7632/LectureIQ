import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isElementFullscreen,
  toggleElementFullscreen,
} from './fullscreen.js'

test('requests fullscreen on the intended classroom element', async () => {
  const calls = []
  const classroom = {
    requestFullscreen: async () => calls.push('classroom'),
  }
  const documentRef = {
    fullscreenElement: null,
    fullscreenEnabled: true,
  }

  assert.deepEqual(
    await toggleElementFullscreen(classroom, documentRef),
    { ok: true }
  )
  assert.deepEqual(calls, ['classroom'])
})

test('exits fullscreen if the intended element or another element is fullscreen', async () => {
  const currentFullscreenElement = {}
  let exitCount = 0
  const classroom = { requestFullscreen: async () => assert.fail('must exit') }
  const documentRef = {
    fullscreenElement: currentFullscreenElement,
    fullscreenEnabled: true,
    exitFullscreen: async () => {
      exitCount += 1
    },
  }

  assert.equal(isElementFullscreen(currentFullscreenElement, documentRef), true)
  assert.deepEqual(await toggleElementFullscreen(classroom, documentRef), { ok: true })
  assert.equal(exitCount, 1)
})

test('reports unsupported fullscreen and propagates rejected browser requests', async () => {
  assert.deepEqual(
    await toggleElementFullscreen({}, {
      fullscreenElement: null,
      fullscreenEnabled: false,
    }),
    { ok: false, reason: 'unsupported' }
  )

  const browserError = new Error('permission denied')
  await assert.rejects(
    toggleElementFullscreen(
      { requestFullscreen: async () => { throw browserError } },
      { fullscreenElement: null, fullscreenEnabled: true }
    ),
    browserError
  )
})
