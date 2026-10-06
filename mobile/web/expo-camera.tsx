// Version web de expo-camera : apercu par getUserMedia, enregistrement par
// MediaRecorder. Meme interface que le module natif (CameraView, ref.recordAsync,
// ref.stopRecording, useCameraPermissions), pour que l'ecran Camera reste identique.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, type ViewProps } from 'react-native'
import { tailles } from './expo-file-system'

export type CameraType = 'front' | 'back'
type Permission = { granted: boolean; canAskAgain: boolean; status: 'granted' | 'denied' | 'undetermined'; expires: 'never' }

const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
const typeEnregistrement = () =>
  typeof MediaRecorder === 'undefined' ? '' : TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? ''

type Props = ViewProps & {
  facing?: CameraType
  mode?: 'picture' | 'video'
  enableTorch?: boolean
  mute?: boolean
  onCameraReady?: () => void
  onMountError?: (e: { message: string }) => void
}

export type CameraViewRef = {
  recordAsync: (o?: { maxDuration?: number }) => Promise<{ uri: string } | undefined>
  stopRecording: () => void
  takePictureAsync: () => Promise<{ uri: string; width: number; height: number }>
}

export const CameraView = forwardRef<CameraViewRef, Props>(function CameraView(
  { facing = 'back', enableTorch = false, mute = false, onCameraReady, onMountError, style, ...reste }, ref,
) {
  const video = useRef<HTMLVideoElement | null>(null)
  const flux = useRef<MediaStream | null>(null)
  const enregistreur = useRef<MediaRecorder | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const facingRef = useRef(facing)
  facingRef.current = facing

  // Ouvre la camera demandee ; on rouvre a chaque changement de face.
  useEffect(() => {
    let annule = false
    const ouvrir = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing === 'front' ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: !mute,
        })
        if (annule) { s.getTracks().forEach(t => t.stop()); return }
        flux.current = s
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}) }
        onCameraReady?.()
      } catch (e) {
        onMountError?.({ message: (e as Error).message })
      }
    }
    ouvrir()
    return () => {
      annule = true
      flux.current?.getTracks().forEach(t => t.stop())
      flux.current = null
    }
  }, [facing, mute])

  // Lampe : seulement si la piste video la propose (telephones Android avec Chrome).
  useEffect(() => {
    const piste = flux.current?.getVideoTracks()[0]
    const capacites = piste && 'getCapabilities' in piste ? (piste.getCapabilities() as Record<string, unknown>) : {}
    if (piste && capacites.torch) piste.applyConstraints({ advanced: [{ torch: enableTorch } as MediaTrackConstraintSet] }).catch(() => {})
  }, [enableTorch])

  useImperativeHandle(ref, () => ({
    recordAsync: ({ maxDuration } = {}) => new Promise((resoudre, rejeter) => {
      const source = flux.current
      const v = video.current
      if (!source || !v) return rejeter(new Error('Caméra indisponible'))
      // Les cameras livrent souvent une image en paysage : on enregistre une
      // image verticale 9:16 recadree au centre, comme l'apercu (object-fit: cover).
      const toile = document.createElement('canvas')
      toile.width = 720; toile.height = 1280
      const ctx = toile.getContext('2d')!
      let actif = true
      const dessiner = () => {
        if (!actif) return
        const vw = v.videoWidth, vh = v.videoHeight
        if (vw && vh) {
          const echelle = Math.max(toile.width / vw, toile.height / vh)
          const w = vw * echelle, h = vh * echelle
          ctx.save()
          // Camera avant : meme sens que l'apercu (effet miroir).
          if (facingRef.current === 'front') { ctx.translate(toile.width, 0); ctx.scale(-1, 1) }
          ctx.drawImage(v, (toile.width - w) / 2, (toile.height - h) / 2, w, h)
          ctx.restore()
        }
        requestAnimationFrame(dessiner)
      }
      dessiner()
      const s = toile.captureStream(30)
      source.getAudioTracks().forEach(t => s.addTrack(t))
      const type = typeEnregistrement()
      const morceaux: Blob[] = []
      let rec: MediaRecorder
      try { rec = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s) } catch (e) { return rejeter(e) }
      enregistreur.current = rec
      rec.ondataavailable = e => { if (e.data && e.data.size) morceaux.push(e.data) }
      rec.onerror = () => rejeter(new Error('Enregistrement impossible'))
      rec.onstop = () => {
        actif = false
        s.getVideoTracks().forEach(t => t.stop())
        if (minuteur.current) clearTimeout(minuteur.current)
        enregistreur.current = null
        const base = (rec.mimeType || type || 'video/webm').split(';')[0]
        const blob = new Blob(morceaux, { type: base })
        if (!blob.size) return resoudre(undefined)
        const uri = URL.createObjectURL(blob)
        tailles.set(uri, blob.size)
        resoudre({ uri })
      }
      rec.start(250)
      if (maxDuration) minuteur.current = setTimeout(() => { if (rec.state !== 'inactive') rec.stop() }, maxDuration * 1000)
    }),
    stopRecording: () => { const r = enregistreur.current; if (r && r.state !== 'inactive') r.stop() },
    takePictureAsync: async () => {
      const v = video.current!
      const c = document.createElement('canvas')
      c.width = v.videoWidth; c.height = v.videoHeight
      c.getContext('2d')!.drawImage(v, 0, 0)
      const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/jpeg', 0.9))
      return { uri: URL.createObjectURL(blob), width: c.width, height: c.height }
    },
  }), [])

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#000' }, style]} {...reste}>
      {React.createElement('video', {
        ref: video, autoPlay: true, muted: true, playsInline: true,
        style: {
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          transform: facing === 'front' ? 'scaleX(-1)' : undefined,
        },
      })}
    </View>
  )
})

// [permission, demander] comme dans expo-camera.
export function useCameraPermissions(): [Permission | null, () => Promise<Permission>] {
  const [etat, setEtat] = useState<Permission | null>(null)
  const fixer = (granted: boolean, refuse = false): Permission => ({
    granted, canAskAgain: !refuse, status: granted ? 'granted' : refuse ? 'denied' : 'undetermined', expires: 'never',
  })
  useEffect(() => {
    let annule = false
    const lire = async () => {
      try {
        const r = await navigator.permissions?.query({ name: 'camera' as PermissionName })
        if (annule) return
        if (r?.state === 'granted') setEtat(fixer(true))
        else if (r?.state === 'denied') setEtat(fixer(false, true))
        else setEtat(fixer(false))
      } catch { if (!annule) setEtat(fixer(false)) }
    }
    lire()
    return () => { annule = true }
  }, [])
  const demander = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      s.getTracks().forEach(t => t.stop())
      const p = fixer(true); setEtat(p); return p
    } catch {
      const p = fixer(false, true); setEtat(p); return p
    }
  }, [])
  return [etat, demander]
}

export const Camera = { requestCameraPermissionsAsync: async () => ({ granted: true }) }
