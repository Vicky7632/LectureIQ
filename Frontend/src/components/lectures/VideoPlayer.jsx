import React, { useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'

const VideoPlayer = ({ url, onProgress, onComplete, autoPlay = false }) => {
  const playerRef = useRef(null)

  const handleProgress = (state) => {
    if (onProgress) onProgress(state)
    if (onComplete && state.played > 0.9) {
      onComplete()
    }
  }

  return (
    <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        controls
        playing={autoPlay}
        onProgress={handleProgress}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload'
            }
          }
        }}
      />
    </div>
  )
}

export default VideoPlayer