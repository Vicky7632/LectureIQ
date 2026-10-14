import { useEffect, useRef } from 'react'
import { useGoogleOAuth } from '@react-oauth/google'

const identityStateKey = '__lectureIQGoogleIdentityState'

const getIdentityState = () => {
  if (!window[identityStateKey]) {
    window[identityStateKey] = {
      clientId: null,
      activeHandlers: null,
    }
  }
  return window[identityStateKey]
}

const GoogleIdentityButton = ({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'rectangular',
}) => {
  const containerRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth()

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onError, onSuccess])

  useEffect(() => {
    if (!scriptLoadedSuccessfully || !clientId || !window.google?.accounts?.id) {
      return undefined
    }

    const container = containerRef.current
    const identityState = getIdentityState()
    const handlers = {
      onSuccess: (...args) => onSuccessRef.current?.(...args),
      onError: (...args) => onErrorRef.current?.(...args),
    }
    identityState.activeHandlers = handlers

    if (identityState.clientId !== clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const activeHandlers = getIdentityState().activeHandlers
          if (!response?.credential) {
            activeHandlers?.onError?.()
            return
          }

          activeHandlers?.onSuccess?.({
            credential: response.credential,
            clientId: response.clientId || response.client_id || clientId,
            select_by: response.select_by,
          })
        },
      })
      identityState.clientId = clientId
    }

    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme,
      size,
      text,
      shape,
    })

    return () => {
      container?.replaceChildren()
      if (identityState.activeHandlers === handlers) {
        identityState.activeHandlers = null
      }
    }
  }, [clientId, scriptLoadedSuccessfully, shape, size, text, theme])

  return <div ref={containerRef} />
}

export default GoogleIdentityButton
