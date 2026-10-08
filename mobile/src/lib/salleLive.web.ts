// Salle d'un direct (LIVE), cote navigateur, avec LiveKit.
//
// - diffuseur : camera et micro publies dans la salle ;
// - spectateur : recoit l'image et le son du diffuseur.
// Le tchat et les coeurs passent par les messages de donnees de la salle
// (rien n'est stocke : un direct se vit en direct).
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Room, RoomEvent, Track, VideoPresets,
  createLocalTracks, type LocalVideoTrack, type LocalTrack, type RemoteTrack,
} from 'livekit-client'
import type { AccesLive } from './api'

export type MessageSalle = { id: string; pseudo: string; texte: string; systeme?: boolean }

export type EtatSalle = 'connexion' | 'direct' | 'termine' | 'erreur' | 'indisponible'

type Donnee = { t: 'msg'; texte: string } | { t: 'coeur' } | { t: 'fin' }

const MESSAGES_GARDES = 30
const encodeur = new TextEncoder()
const decodeur = new TextDecoder()

// Session audio de l'iPhone : « lecture et enregistrement » pendant que le
// diffuseur filme, sinon le micro est coupe (voir web/expo-camera.tsx).
function sessionCapture(actif: boolean) {
  ;(window as unknown as { __captureActive?: boolean }).__captureActive = actif
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (session) { try { session.type = actif ? 'play-and-record' : 'auto' } catch { /* Reglage refuse. */ } }
}

// Camera et micro du diffuseur, demandes avant de lancer le direct : il
// voit son image et peut renoncer avant que quiconque ne la voie.
export async function preparerCamera(face: 'user' | 'environment'): Promise<LocalTrack[]> {
  sessionCapture(true)
  try {
    return await createLocalTracks({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { facingMode: face, resolution: VideoPresets.h720.resolution },
    })
  } catch (e) {
    sessionCapture(false)
    throw e
  }
}

export function libererCamera(pistes: LocalTrack[]) {
  pistes.forEach(p => p.stop())
  sessionCapture(false)
}

export function useSalleLive(acces: AccesLive | null, options: {
  diffuseur: boolean
  pistes?: LocalTrack[]
  moi: string
}) {
  const [etat, setEtat] = useState<EtatSalle>('connexion')
  const [spectateurs, setSpectateurs] = useState(0)
  const [messages, setMessages] = useState<MessageSalle[]>([])
  const [coeurs, setCoeurs] = useState(0)
  const [sonBloque, setSonBloque] = useState(false)
  const salle = useRef<Room | null>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const pisteVideo = useRef<{ attach: (e: HTMLMediaElement) => void; detach: (e?: HTMLMediaElement) => void } | null>(null)
  const { diffuseur, pistes, moi } = options

  const ajouter = useCallback((m: Omit<MessageSalle, 'id'>) =>
    setMessages(l => [...l, { ...m, id: `${Date.now()}-${Math.random()}` }].slice(-MESSAGES_GARDES)), [])

  // Element <video> ou s'affiche le direct (pose par VideoLive).
  const refVideo = useCallback((e: HTMLVideoElement | null) => {
    if (video.current && pisteVideo.current) pisteVideo.current.detach(video.current)
    video.current = e
    if (e && pisteVideo.current) pisteVideo.current.attach(e)
  }, [])

  useEffect(() => {
    if (!acces) return
    let fini = false
    const room = new Room({ adaptiveStream: true, dynacast: true })
    salle.current = room

    const compter = () => {
      // Diffuseur : les autres sont tous spectateurs. Spectateur : les
      // autres moins le diffuseur, plus soi-meme, soit le meme nombre.
      setSpectateurs(room.remoteParticipants.size)
    }
    const montrer = (piste: RemoteTrack | LocalVideoTrack) => {
      pisteVideo.current = piste
      if (video.current) piste.attach(video.current)
    }
    const diffusionPresente = () => [...room.remoteParticipants.values()]
      .some(p => p.getTrackPublication(Track.Source.Camera))

    room
      .on(RoomEvent.TrackSubscribed, (piste) => {
        if (piste.kind === Track.Kind.Video) { montrer(piste); setEtat('direct') }
        else if (piste.kind === Track.Kind.Audio) {
          const el = piste.attach()
          el.style.display = 'none'
          document.body.appendChild(el)
        }
      })
      .on(RoomEvent.TrackUnsubscribed, (piste) => { piste.detach().forEach(el => { if (el !== video.current) el.remove() }) })
      .on(RoomEvent.ParticipantConnected, (p) => {
        compter()
        if (diffuseur) ajouter({ pseudo: p.name || 'visiteur', texte: 'a rejoint le LIVE', systeme: true })
      })
      .on(RoomEvent.ParticipantDisconnected, () => {
        compter()
        if (!diffuseur && !diffusionPresente()) setEtat('termine')
      })
      .on(RoomEvent.TrackUnpublished, () => {
        if (!diffuseur && !diffusionPresente()) setEtat('termine')
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setSonBloque(!room.canPlaybackAudio))
      .on(RoomEvent.DataReceived, (octets, participant) => {
        let d: Donnee
        try { d = JSON.parse(decodeur.decode(octets)) } catch { return }
        if (d.t === 'msg' && typeof d.texte === 'string') {
          ajouter({ pseudo: participant?.name || 'visiteur', texte: d.texte.slice(0, 150) })
        } else if (d.t === 'coeur') setCoeurs(n => n + 1)
        else if (d.t === 'fin' && !diffuseur) setEtat('termine')
      })
      .on(RoomEvent.Disconnected, () => { if (!fini) setEtat(e => e === 'erreur' ? e : 'termine') })

    ;(async () => {
      try {
        await room.connect(acces.url, acces.jeton)
        if (fini) return
        compter()
        if (diffuseur) {
          for (const p of pistes ?? []) {
            await room.localParticipant.publishTrack(p, p.kind === Track.Kind.Video
              ? { simulcast: true, videoCodec: 'h264' } : undefined)
            if (p.kind === Track.Kind.Video) montrer(p as LocalVideoTrack)
          }
          setEtat('direct')
        } else {
          setSonBloque(!room.canPlaybackAudio)
          // Direct deja termine (le diffuseur est parti entre-temps).
          setTimeout(() => {
            if (!fini && !diffusionPresente()) setEtat(e => e === 'connexion' ? 'termine' : e)
          }, 8000)
        }
      } catch {
        if (!fini) setEtat('erreur')
      }
    })()

    return () => {
      fini = true
      if (diffuseur) {
        // Previent les spectateurs avant de partir.
        room.localParticipant.publishData(encodeur.encode(JSON.stringify({ t: 'fin' })), { reliable: true })
          .catch(() => { /* Salle deja fermee. */ })
          .finally(() => room.disconnect())
      } else room.disconnect()
      salle.current = null
      pisteVideo.current = null
    }
  }, [acces, diffuseur, pistes, ajouter])

  const envoyer = useCallback((texte: string) => {
    const t = texte.trim().slice(0, 150)
    const room = salle.current
    if (!t || !room) return
    room.localParticipant.publishData(encodeur.encode(JSON.stringify({ t: 'msg', texte: t })), { reliable: true })
      .catch(() => { /* Hors ligne. */ })
    ajouter({ pseudo: moi, texte: t })
  }, [ajouter, moi])

  const envoyerCoeur = useCallback(() => {
    setCoeurs(n => n + 1)
    salle.current?.localParticipant.publishData(encodeur.encode(JSON.stringify({ t: 'coeur' })), { reliable: false })
      .catch(() => { /* Hors ligne. */ })
  }, [])

  const activerSon = useCallback(() => {
    salle.current?.startAudio().then(() => setSonBloque(false)).catch(() => { /* Geste suivant. */ })
  }, [])

  return { etat, spectateurs, messages, coeurs, sonBloque, refVideo, envoyer, envoyerCoeur, activerSon }
}

// Changer de camera (avant/arriere) pendant le direct.
export async function basculerCamera(pistes: LocalTrack[], face: 'user' | 'environment') {
  const v = pistes.find(p => p.kind === Track.Kind.Video) as LocalVideoTrack | undefined
  await v?.restartTrack({ facingMode: face })
}

