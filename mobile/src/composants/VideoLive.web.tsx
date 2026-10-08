// Image d'un direct : un element <video> que la salle LiveKit alimente.
import React from 'react'

export default function VideoLive({ refVideo, miroir = false, ajuster = 'cover' }: {
  refVideo: (e: HTMLVideoElement | null) => void
  // Camera avant du diffuseur : vue en miroir, comme dans un selfie.
  miroir?: boolean
  ajuster?: 'cover' | 'contain'
}) {
  return React.createElement('video', {
    ref: refVideo, autoPlay: true, playsInline: true, muted: true,
    style: {
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: ajuster,
      background: '#000', transform: miroir ? 'scaleX(-1)' : undefined,
    },
  })
}
