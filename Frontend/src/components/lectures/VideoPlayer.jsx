import React, { useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player'

const VideoPlayer = ({ url, onProgress, onComplete, autoPlay = false }) => {
  const playerRef = useRef(null)
  const sourceRef = useRef(url)
  const [playbackErrorState, setPlaybackErrorState] = useState(null)
  const playbackError =
    playbackErrorState?.url === url ? playbackErrorState.message : ''

  useEffect(() => {
    sourceRef.current = url
  }, [url])

  useEffect(() => {
    const video = playerRef.current
    if (import.meta.env.DEV) {
      console.debug('[VideoPlayer] mounted', { src: sourceRef.current })
    }
    return () => {
      if (import.meta.env.DEV) {
        console.debug('[VideoPlayer] unmounted', {
          src: sourceRef.current,
          currentTime: video?.currentTime,
          paused: video?.paused,
        })
      }
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[VideoPlayer] source changed', { src: url })
    }
  }, [url])

  const logPlaybackEvent = (name, event) => {
    if (!import.meta.env.DEV) return

    const video = playerRef.current || event?.currentTarget
    console.debug(`[VideoPlayer] ${name}`, {
      src: url,
      currentTime: video?.currentTime,
      paused: video?.paused,
      eventType: event?.type,
      eventTargetPaused: event?.currentTarget?.paused,
      eventTargetCurrentTime: event?.currentTarget?.currentTime,
      event,
    })
  }

  const handleTimeUpdate = (event) => {
    const video = event.currentTarget
    const state = {
      played: video.duration ? video.currentTime / video.duration : 0,
      playedSeconds: video.currentTime,
    }

    if (onProgress) onProgress(state)
    if (onComplete && state.played > 0.9) {
      onComplete()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black pt-[56.25%]">
      <ReactPlayer
        ref={playerRef}
        src={url}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        controls
        {...(autoPlay ? { playing: true } : {})}
        playsInline
        controlsList="nodownload"
        onTimeUpdate={handleTimeUpdate}
        onPlay={(event) => logPlaybackEvent('play', event)}
        onPlaying={(event) => logPlaybackEvent('playing', event)}
        onPause={(event) => logPlaybackEvent('pause', event)}
        onWaiting={(event) => logPlaybackEvent('waiting', event)}
        onError={(event) => {
          logPlaybackEvent('error', event)
          setPlaybackErrorState({
            url,
            message: 'The video could not be loaded or played. Please try again later.',
          })
        }}
      />
      {playbackError && (
        <p role="alert" className="absolute inset-x-0 bottom-0 bg-black/80 px-4 py-3 text-sm text-white">
          {playbackError}
        </p>
      )}
    </div>
  )
}

export default VideoPlayer