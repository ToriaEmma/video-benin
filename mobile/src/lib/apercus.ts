// Images reprises par les vignettes des filtres : l'image vivante de la
// camera, ou une image tiree de la video en cours de montage. Sur le web
// elles sont fabriquees par le navigateur ; sur telephone, la vignette garde
// sa teinte seule.
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

export function useApercuCamera(): string | null {
  const lire = () => (Platform.OS === 'web'
    ? (window as unknown as { __apercuCamera?: string }).__apercuCamera ?? null : null)
  const [image, setImage] = useState<string | null>(lire)
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const maj = () => setImage(lire())
    window.addEventListener('apercu-camera', maj)
    return () => window.removeEventListener('apercu-camera', maj)
  }, [])
  return image
}

const vignettes = new Map<string, Promise<string | null>>()
function vignetteWeb(uri: string): Promise<string | null> {
  if (!vignettes.has(uri)) {
    vignettes.set(uri, new Promise(resoudre => {
      const v = document.createElement('video')
      v.muted = true; v.playsInline = true; v.preload = 'auto'
      if (!uri.startsWith('blob:') && !uri.startsWith('data:')) v.crossOrigin = 'anonymous'
      v.src = uri
      const abandon = setTimeout(() => resoudre(null), 8000)
      v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2) }
      v.onseeked = () => {
        try {
          const t = document.createElement('canvas'); t.width = 120; t.height = 120
          const c = Math.min(v.videoWidth, v.videoHeight)
          t.getContext('2d')!.drawImage(v, (v.videoWidth - c) / 2, (v.videoHeight - c) / 2, c, c, 0, 0, 120, 120)
          resoudre(t.toDataURL('image/jpeg', 0.7))
        } catch { resoudre(null) }
        clearTimeout(abandon)
      }
      v.onerror = () => { clearTimeout(abandon); resoudre(null) }
    }))
  }
  return vignettes.get(uri)!
}

export function useVignetteVideo(uri: string | null | undefined): string | null {
  const [image, setImage] = useState<string | null>(null)
  useEffect(() => {
    if (Platform.OS !== 'web' || !uri) return
    let actif = true
    vignetteWeb(uri).then(i => { if (actif) setImage(i) })
    return () => { actif = false }
  }, [uri])
  return image
}

// Plusieurs images reparties sur la video (bande de la couverture), sur le
// web ou generateThumbnailsAsync n'existe pas.
export async function imagesVideoWeb(uri: string, nombre: number): Promise<string[]> {
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; v.preload = 'auto'
  if (!uri.startsWith('blob:') && !uri.startsWith('data:')) v.crossOrigin = 'anonymous'
  v.src = uri
  await new Promise<void>((ok, ko) => { v.onloadeddata = () => ok(); v.onerror = () => ko(new Error('video illisible')) })
  const duree = isFinite(v.duration) && v.duration > 0 ? v.duration : 1
  const t = document.createElement('canvas')
  const largeur = 180
  t.width = largeur; t.height = Math.round(largeur * (v.videoHeight || 16) / (v.videoWidth || 9))
  const g = t.getContext('2d')!
  const images: string[] = []
  for (let i = 0; i < nombre; i++) {
    v.currentTime = Math.min(duree - 0.05, (duree * i) / nombre + 0.05)
    await new Promise<void>(ok => { v.onseeked = () => ok() })
    g.drawImage(v, 0, 0, t.width, t.height)
    images.push(t.toDataURL('image/jpeg', 0.75))
  }
  return images
}
