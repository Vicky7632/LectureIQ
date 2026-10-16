export const isElementFullscreen = (element, documentRef = document) =>
  Boolean(element && documentRef.fullscreenElement === element)

export const toggleElementFullscreen = async (
  element,
  documentRef = document
) => {
  if (!element) return { ok: false, reason: 'missing-element' }

  if (documentRef.fullscreenElement) {
    if (typeof documentRef.exitFullscreen !== 'function') {
      return { ok: false, reason: 'unsupported' }
    }
    await documentRef.exitFullscreen()
    return { ok: true }
  }

  if (
    !documentRef.fullscreenEnabled ||
    typeof element.requestFullscreen !== 'function'
  ) {
    return { ok: false, reason: 'unsupported' }
  }

  await element.requestFullscreen()
  return { ok: true }
}
