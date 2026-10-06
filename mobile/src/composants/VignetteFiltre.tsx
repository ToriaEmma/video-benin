// Vignette d'un filtre : une image (camera ou video) sous le voile du filtre.
import React from 'react'
import { Image, StyleSheet, View } from 'react-native'

export default function VignetteFiltre({ image, voile, melange }: {
  image: string | null
  voile: string
  melange: string
}) {
  return (
    <>
      {image && <Image source={{ uri: image }} style={StyleSheet.absoluteFill} />}
      {voile !== 'transparent' && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill,
          { backgroundColor: voile, mixBlendMode: melange } as object]} />
      )}
    </>
  )
}
