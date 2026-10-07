// Version web de expo-camera : apercu par getUserMedia, enregistrement par
// MediaRecorder. Meme interface que le module natif (CameraView, ref.recordAsync,
// ref.stopRecording, useCameraPermissions), pour que l'ecran Camera reste identique.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, type ViewProps } from 'react-native'
import { tailles } from './expo-file-system'

export type CameraType = 'front' | 'back'
type Permission = {
  granted: boolean; canAskAgain: boolean; status: 'granted' | 'denied' | 'undetermined'; expires: 'never'
  // Web : explication du refus, a montrer a l'utilisateur.
  raison?: string
}

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
  // Web : filtre et retouche graves dans l'enregistrement (l'apercu les
  // montre deja ; sans ceci, la video sortirait sans eux).
  voile?: { couleur: string; melange: string }
  retouche?: boolean
}

type Habillage = { voile?: { couleur: string; melange: string }; retouche?: boolean }
// Retouche du teint : lumiere un peu relevee, contraste adouci, grain lisse.
const FILTRE_RETOUCHE = 'brightness(1.06) contrast(.94) saturate(1.06) blur(.5px)'

export type CameraViewRef = {
  recordAsync: (o?: { maxDuration?: number }) => Promise<{ uri: string } | undefined>
  stopRecording: () => void
  // Web : les prises s'enchainent dans un seul enregistrement, en pause
  // entre deux prises (Chrome n'ecrit un MP4 lisible qu'a l'arret). Une prise
  // rend donc une adresse provisoire ; `terminerSession` arrete
  // l'enregistrement et rend la video de toutes les prises.
  terminerSession: () => Promise<string | undefined>
  takePictureAsync: () => Promise<{ uri: string; width: number; height: number }>
}

export const CameraView = forwardRef<CameraViewRef, Props>(function CameraView(
  { facing = 'back', enableTorch = false, mute = false, onCameraReady, onMountError, voile, retouche, style, ...reste }, ref,
) {
  const habillage = useRef<Habillage>({})
  useEffect(() => { habillage.current = { voile, retouche } }, [voile, retouche])
  const video = useRef<HTMLVideoElement | null>(null)
  const flux = useRef<MediaStream | null>(null)
  const session = useRef<Session | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const facingRef = useRef(facing)
  const apercu = useRef<ReturnType<typeof setInterval> | null>(null)
  facingRef.current = facing
  useEffect(() => () => { session.current?.terminer(); session.current = null }, [])

  // Ouvre la camera demandee ; on rouvre a chaque changement de face.
  useEffect(() => {
    let annule = false
    const ouvrir = async () => {
      try {
        if (!mute) sessionCapture(true)
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing === 'front' ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: !mute,
        })
        if (annule) { s.getTracks().forEach(t => t.stop()); return }
        flux.current = s
        session.current?.brancherMicro(s)
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}) }
        onCameraReady?.()
        // Petite image vivante, reprise par les vignettes des filtres.
        const capturer = () => {
          const v = video.current
          if (!v || !v.videoWidth) return
          const t = document.createElement('canvas'); t.width = 120; t.height = 120
          const c = Math.min(v.videoWidth, v.videoHeight)
          const g = t.getContext('2d')!
          if (facing === 'front') { g.translate(120, 0); g.scale(-1, 1) }
          g.drawImage(v, (v.videoWidth - c) / 2, (v.videoHeight - c) / 2, c, c, 0, 0, 120, 120)
          ;(window as unknown as { __apercuCamera?: string }).__apercuCamera = t.toDataURL('image/jpeg', 0.7)
          window.dispatchEvent(new Event('apercu-camera'))
        }
        setTimeout(capturer, 400)
        apercu.current = setInterval(capturer, 1500)
      } catch (e) {
        onMountError?.({ message: (e as Error).message })
      }
    }
    ouvrir()
    return () => {
      annule = true
      if (apercu.current) clearInterval(apercu.current)
      flux.current?.getTracks().forEach(t => t.stop())
      flux.current = null
      sessionCapture(false)
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
      let ses = session.current
      if (!ses || ses.fini) {
        try { ses = new Session(v, source, facingRef, habillage) } catch (e) { return rejeter(e) }
        session.current = ses
      }
      ses.prise(resoudre, rejeter)
      if (minuteur.current) clearTimeout(minuteur.current)
      if (maxDuration) minuteur.current = setTimeout(() => session.current?.pause(), maxDuration * 1000)
    }),
    stopRecording: () => {
      if (minuteur.current) clearTimeout(minuteur.current)
      session.current?.pause()
    },
    terminerSession: async () => {
      const ses = session.current
      session.current = null
      if (minuteur.current) clearTimeout(minuteur.current)
      return ses ? ses.arreter() : undefined
    },
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
          filter: retouche ? FILTRE_RETOUCHE : undefined,
        },
      })}
    </View>
  )
})

// Session audio de l'iPhone : le fil la regle en « lecture » (son meme en
// mode silencieux), mais ce mode interdit le micro. Pendant que la camera
// est ouverte, on passe en « lecture et enregistrement » ; le fil la remet
// en « lecture » ensuite (src/lib/piste.web.ts).
function sessionCapture(actif: boolean) {
  ;(window as unknown as { __captureActive?: boolean }).__captureActive = actif
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (session) { try { session.type = actif ? 'play-and-record' : 'auto' } catch { /* Reglage refuse. */ } }
}

// [permission, demander] comme dans expo-camera.
// Pourquoi la camera n'est pas accessible, et quoi faire : affiche sous le
// bouton « Autoriser » (sinon un refus du navigateur passe inapercu).
const estIPhone = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const RAISONS_CAMERA = {
  get indisponible() {
    return 'Ce navigateur ne donne pas accès à la caméra. Si tu as ouvert TockTick depuis WhatsApp, Instagram ou Facebook, '
      + 'touche ⋯ puis « Ouvrir dans le navigateur » (Safari ou Chrome).'
  },
  // Refus sans fenetre de demande : Safari applique un reglage deja pose
  // (site regle sur « Refuser », ou refus plus tot dans cet onglet).
  get bloquee() {
    return estIPhone()
      ? 'Safari a bloqué l’accès sans te demander : la caméra ou le micro est réglé sur « Refuser » pour ce site, '
        + 'ou un refus a été donné plus tôt. Touche « aA » (ou l’icône à gauche de l’adresse) › Réglages du site web › '
        + 'Caméra et Micro › « Demander » ou « Autoriser », puis recharge la page. Vérifie aussi Réglages › Safari › Caméra et Micro.'
      : 'Le navigateur a bloqué l’accès sans te demander. Touche le cadenas à gauche de l’adresse du site › Autorisations › '
        + 'Caméra et micro › Autoriser, puis recharge la page.'
  },
  get refusee() {
    return 'Tu as répondu « Ne pas autoriser ». Recharge la page puis touche à nouveau « Autoriser » et accepte la caméra et le micro.'
  },
  get microRefuse() {
    return 'La caméra est autorisée mais pas le micro (il faut les deux pour filmer avec le son). '
      + (estIPhone()
        ? 'Touche « aA › Réglages du site web › Micro › Autoriser », puis recharge la page.'
        : 'Touche le cadenas › Autorisations › Micro › Autoriser, puis recharge la page.')
  },
  absente: 'Aucune caméra n’a été trouvée sur cet appareil.',
  occupee: 'La caméra est déjà utilisée par une autre application. Ferme-la, puis touche à nouveau « Autoriser ».',
}

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
        else if (r?.state === 'denied') setEtat({ ...fixer(false, true), raison: RAISONS_CAMERA.bloquee })
        else setEtat(fixer(false))
      } catch { if (!annule) setEtat(fixer(false)) }
    }
    lire()
    return () => { annule = true }
  }, [])
  const demander = useCallback(async () => {
    // Navigateur integre (WhatsApp, Instagram, Facebook…) ou page non
    // securisee : l'acces a la camera n'existe meme pas.
    if (!navigator.mediaDevices?.getUserMedia) {
      const p = { ...fixer(false, true), raison: RAISONS_CAMERA.indisponible }
      setEtat(p); return p
    }
    sessionCapture(true)
    const debut = Date.now()
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      s.getTracks().forEach(t => t.stop())
      const p = fixer(true); setEtat(p); return p
    } catch (e) {
      const nom = (e as DOMException)?.name
      let raison: string
      if (nom === 'NotFoundError' || nom === 'OverconstrainedError') raison = RAISONS_CAMERA.absente
      else if (nom === 'NotReadableError' || nom === 'AbortError') raison = RAISONS_CAMERA.occupee
      else if (nom === 'NotAllowedError' || nom === 'SecurityError') {
        // Une reponse quasi immediate veut dire qu'aucune fenetre n'a ete
        // montree : le refus vient d'un reglage, pas d'un choix a l'instant.
        const sansDemande = Date.now() - debut < 500
        // Camera seule : distingue un micro refuse d'une camera refusee.
        const cameraSeule = await navigator.mediaDevices.getUserMedia({ video: true })
          .then(f => { f.getTracks().forEach(t => t.stop()); return true }, () => false)
        raison = cameraSeule ? RAISONS_CAMERA.microRefuse
          : sansDemande ? RAISONS_CAMERA.bloquee : RAISONS_CAMERA.refusee
      } else raison = `La caméra n’a pas pu démarrer (${nom || 'erreur inconnue'}). Recharge la page et réessaie.`
      sessionCapture(false)
      const p = { ...fixer(false, true), raison }
      setEtat(p); return p
    }
  }, [])
  return [etat, demander]
}

export const Camera = { requestCameraPermissionsAsync: async () => ({ granted: true }) }

// Un enregistrement qui couvre toutes les prises d'une video. Image : la
// camera recadree en 9:16 sur une toile. Son : le micro passe par Web Audio,
// ce qui garde une piste stable quand on change de camera entre deux prises.
class Session {
  fini = false
  private actif = true
  private rec: MediaRecorder
  private morceaux: Blob[] = []
  private type: string
  private ctx: AudioContext | null = null
  private sortie: MediaStreamAudioDestinationNode | null = null
  private micro: MediaStreamAudioSourceNode | null = null
  private flux: MediaStream
  private enCours: { resoudre: (r: { uri: string } | undefined) => void; rejeter: (e: Error) => void } | null = null

  constructor(
    private v: HTMLVideoElement, source: MediaStream,
    private face: { current: CameraType }, private habillage: { current: Habillage },
  ) {
    // 540x960 : net sur un telephone, et leger a envoyer (cahier des charges :
    // donnees mobiles cheres au Benin).
    const toile = document.createElement('canvas')
    toile.width = 540; toile.height = 960
    const g = toile.getContext('2d')!
    const dessiner = () => {
      if (!this.actif) return
      const vw = v.videoWidth, vh = v.videoHeight
      if (vw && vh) {
        const echelle = Math.max(toile.width / vw, toile.height / vh)
        const w = vw * echelle, h = vh * echelle
        const { voile, retouche } = this.habillage.current
        g.save()
        // Camera avant : meme sens que l'apercu (effet miroir).
        if (this.face.current === 'front') { g.translate(toile.width, 0); g.scale(-1, 1) }
        if (retouche) g.filter = FILTRE_RETOUCHE
        g.drawImage(v, (toile.width - w) / 2, (toile.height - h) / 2, w, h)
        g.restore()
        if (voile && voile.couleur !== 'transparent') {
          g.save()
          g.globalCompositeOperation = (voile.melange === 'normal' ? 'source-over' : voile.melange) as GlobalCompositeOperation
          g.fillStyle = voile.couleur
          g.fillRect(0, 0, toile.width, toile.height)
          g.restore()
        }
      }
      requestAnimationFrame(dessiner)
    }
    dessiner()
    this.flux = toile.captureStream(30)
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx && source.getAudioTracks().length) {
      this.ctx = new Ctx()
      this.ctx.resume().catch(() => {})
      this.sortie = this.ctx.createMediaStreamDestination()
      this.brancherMicro(source)
      this.sortie.stream.getAudioTracks().forEach(t => this.flux.addTrack(t))
    } else {
      source.getAudioTracks().forEach(t => this.flux.addTrack(t))
    }
    this.type = typeEnregistrement()
    // Debit fixe : sans lui, Chrome enregistrait a ~37 Mbit/s (70 Mo pour
    // quelques secondes). 1 Mbit/s donne ~2 Mo pour 15 s.
    const reglages: MediaRecorderOptions = { videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 96_000 }
    this.rec = new MediaRecorder(this.flux, this.type ? { ...reglages, mimeType: this.type } : reglages)
    this.rec.ondataavailable = e => { if (e.data && e.data.size) this.morceaux.push(e.data) }
    this.rec.onerror = () => { this.enCours?.rejeter(new Error('Enregistrement impossible')); this.enCours = null; this.terminer() }
  }

  brancherMicro(source: MediaStream) {
    if (!this.ctx || !this.sortie || !source.getAudioTracks().length) return
    this.micro?.disconnect()
    this.micro = this.ctx.createMediaStreamSource(source)
    this.micro.connect(this.sortie)
  }

  prise(resoudre: (r: { uri: string } | undefined) => void, rejeter: (e: Error) => void) {
    this.enCours = { resoudre, rejeter }
    this.ctx?.resume().catch(() => {})
    if (this.rec.state === 'inactive') this.rec.start(250)
    else if (this.rec.state === 'paused') this.rec.resume()
  }

  // Fin d'une prise : l'enregistrement se met en pause. L'adresse rendue
  // n'est qu'un repere ; la video s'obtient a l'arret (`arreter`).
  pause() {
    const attente = this.enCours
    if (!attente || this.rec.state !== 'recording') return
    this.enCours = null
    this.rec.pause()
    attente.resoudre({ uri: `seance:${Date.now()}` })
  }

  // Arret definitif : rend la video de toutes les prises.
  arreter(): Promise<string | undefined> {
    if (this.enCours) this.pause()
    return new Promise(resoudre => {
      if (this.fini || this.rec.state === 'inactive') { this.terminer(); return resoudre(undefined) }
      this.rec.addEventListener('stop', () => {
        const base = (this.rec.mimeType || this.type || 'video/webm').split(';')[0]
        const blob = new Blob(this.morceaux, { type: base })
        this.terminer()
        if (!blob.size) return resoudre(undefined)
        const uri = URL.createObjectURL(blob)
        tailles.set(uri, blob.size)
        resoudre(uri)
      }, { once: true })
      this.rec.stop()
    })
  }

  terminer() {
    if (this.fini) return
    this.fini = true
    this.actif = false
    if (this.enCours) this.pause()
    if (this.rec.state !== 'inactive') { try { this.rec.stop() } catch { /* Deja arrete. */ } }
    this.flux.getVideoTracks().forEach(t => t.stop())
    this.micro?.disconnect()
    this.ctx?.close().catch(() => {})
  }
}
