// Version web : toute la musique passe par une seule platine (un element
// Audio unique).
// - Un seul son a la fois : la piste qui joue prend la platine, les autres
//   n'y touchent plus. Une carte quittee ne peut donc pas continuer a jouer
//   dans le dos de la video regardee.
// - Les navigateurs mobiles (iPhone surtout) n'autorisent le son qu'aux
//   lecteurs deja demarres par un toucher : la platine est debloquee au
//   premier geste, et le reste ensuite pour tous les sons.
import { useEffect, useMemo, useState } from 'react'

export type Piste = {
  readonly currentTime: number
  readonly playing: boolean
  readonly isLoaded: boolean
  play: () => void
  pause: () => void
  seekTo: (secondes: number) => Promise<void>
  // Vitesse de lecture (0,5 = deux fois plus lent).
  regler: (debit: number) => void
}

// Silence de 0,1 s (WAV 8 kHz) : de quoi demarrer la platine pendant le
// premier geste.
function silence(): string {
  const n = 800
  const o = new Uint8Array(44 + n)
  const v = new DataView(o.buffer)
  const ecrire = (pos: number, t: string) => { for (let i = 0; i < t.length; i++) o[pos + i] = t.charCodeAt(i) }
  ecrire(0, 'RIFF'); v.setUint32(4, 36 + n, true); ecrire(8, 'WAVEfmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
  ecrire(36, 'data'); v.setUint32(40, n, true); o.fill(128, 44)
  let b = ''
  o.forEach(x => { b += String.fromCharCode(x) })
  return 'data:audio/wav;base64,' + btoa(b)
}

let platine: HTMLAudioElement | null = null
let proprietaire: PisteWeb | null = null

function obtenirPlatine(): HTMLAudioElement {
  if (platine) return platine
  platine = new Audio()
  platine.preload = 'auto'
  platine.loop = true
  // Premiers gestes : la platine joue un instant de silence, ce qui
  // l'autorise pour la suite. Les ecouteurs ne sont retires qu'apres un
  // essai reussi : sur iPhone, le contact du doigt (pointerdown) est refuse,
  // seule la fin du toucher (touchend, click) autorise le son.
  const EVENEMENTS = ['pointerdown', 'touchend', 'click', 'keydown']
  let debloquee = false
  const debloquer = () => {
    const p = platine!
    // Une vraie piste occupe la platine : la sourdine automatique
    // (web/demarrage.ts) se charge de lui rendre le son.
    if (debloquee || proprietaire) return
    p.src = silence()
    p.play()
      .then(() => {
        debloquee = true
        EVENEMENTS.forEach(e => window.removeEventListener(e, debloquer, true))
        if (!proprietaire) p.pause()
      })
      .catch(() => { /* Refus : le geste suivant reessaiera. */ })
  }
  EVENEMENTS.forEach(e => window.addEventListener(e, debloquer, true))
  return platine
}
if (typeof window !== 'undefined') obtenirPlatine()

class PisteWeb implements Piste {
  // Position voulue avant d'avoir la platine (ex. carte remise au debut).
  private depart = 0
  private debit = 1

  constructor(private readonly url: string | null) {}

  private get aLaMain() { return proprietaire === this }

  // Prend la platine : la piste precedente s'arrete net.
  private prendre(): HTMLAudioElement | null {
    if (!this.url) return null
    const p = obtenirPlatine()
    if (!this.aLaMain) {
      proprietaire = this
      p.loop = true
      if (p.src !== this.url) { p.src = this.url; p.load() }
      p.playbackRate = this.debit
      const position = this.depart
      if (p.readyState >= 1) p.currentTime = position
      else p.addEventListener('loadedmetadata', () => { if (this.aLaMain) p.currentTime = position }, { once: true })
    }
    return p
  }

  get currentTime() { return this.aLaMain ? platine!.currentTime : this.depart }
  get playing() { return this.aLaMain && !platine!.paused }
  get isLoaded() { return this.aLaMain && platine!.readyState >= 2 }

  play() {
    const p = this.prendre()
    p?.play().catch(() => { /* Refus du navigateur : rattrape au prochain geste. */ })
  }

  pause() {
    if (this.aLaMain) platine!.pause()
  }

  async seekTo(secondes: number) {
    if (!this.aLaMain) { this.depart = secondes; return }
    const p = platine!
    if (p.readyState >= 1) p.currentTime = secondes
    else p.addEventListener('loadedmetadata', () => { if (this.aLaMain) p.currentTime = secondes }, { once: true })
  }

  regler(debit: number) {
    this.debit = debit
    if (this.aLaMain) platine!.playbackRate = debit
  }

  // Ecran demonte : on rend la platine, silencieuse.
  liberer() {
    if (!this.aLaMain) return
    platine!.pause()
    platine!.playbackRate = 1
    proprietaire = null
  }
}

export function usePiste(url: string | null): Piste {
  const piste = useMemo(() => new PisteWeb(url), [url])
  useEffect(() => () => piste.liberer(), [piste])
  return piste
}

// Etat « en lecture », relu regulierement pour l'affichage.
export function usePisteJoue(piste: Piste): boolean {
  const [joue, setJoue] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setJoue(piste.playing && (platine?.readyState ?? 0) >= 3), 150)
    return () => clearInterval(t)
  }, [piste])
  return joue
}
