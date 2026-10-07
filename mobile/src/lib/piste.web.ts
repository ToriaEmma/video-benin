// Version web du lecteur de musique.
//
// Un seul son a la fois : la piste qui joue prend la main, la precedente
// s'arrete net. Une carte quittee ne peut donc pas continuer a jouer dans
// le dos de la video regardee.
//
// Les musiques (extraits Deezer, sons en memoire) passent par Web Audio et
// non par un element <audio> : sur telephone, une video en cours de lecture
// peut faire taire un autre lecteur de la page (la musique ne s'entendait
// alors qu'en quittant le site). Web Audio mixe le son independamment des
// videos ; il est debloque au premier toucher, et la session audio est
// reglee en « lecture » pour jouer meme telephone en mode silencieux.
//
// Les sons originaux (piste d'une autre video, fichiers lourds) restent lus
// par un element <audio> unique, la « platine ».
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

// Lecteur qui a la main ; il la cede quand un autre commence a jouer.
type Lecteur = { ceder: () => void }
let proprietaire: Lecteur | null = null
const prendreLaMain = (l: Lecteur) => {
  if (proprietaire && proprietaire !== l) proprietaire.ceder()
  proprietaire = l
}

// ------------------------------------------------------------
// Web Audio
// ------------------------------------------------------------

const EVENEMENTS_GESTE = ['pointerdown', 'touchend', 'click', 'keydown']
let contexte: AudioContext | null = null
let sortie: GainNode | null = null

// Indique a web/demarrage.ts qu'un son attend un toucher (bulle « activer
// le son », toucher absorbe pour ne pas mettre la video en pause).
const signalerBlocage = (bloque: boolean) => {
  ;(window as unknown as { __sonBloque?: boolean }).__sonBloque = bloque
  window.dispatchEvent(new Event(bloque ? 'tocktick:son-bloque' : 'tocktick:son-actif'))
}

// Un son attend-il de jouer ? (piste qui a la main et veut jouer)
const sonVoulu = () => proprietaire instanceof PisteAudio && proprietaire.playing

function creerContexte(): AudioContext {
  const Ctx = window.AudioContext
    || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  // iPhone (Safari 16.4+) : jouer comme un lecteur de musique, y compris
  // interrupteur sur silencieux.
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (session) { try { session.type = 'playback' } catch { /* Reglage refuse. */ } }
  const c = new Ctx()
  sortie = c.createGain()
  sortie.connect(c.destination)
  // Arret par le systeme (page quittee, appel…) alors qu'un son jouait :
  // la bulle « activer le son » revient, un toucher le relancera.
  c.addEventListener('statechange', () => {
    if (c !== contexte) return
    if (c.state === 'running') signalerBlocage(false)
    else if (sonVoulu()) signalerBlocage(true)
  })
  return c
}

// Sur iPhone, un contexte « interrompu » (page quittee puis revenue) refuse
// souvent de reprendre : on le remplace par un neuf, et la musique en cours
// repart dessus. Les extraits decodes restent valables d'un contexte a l'autre.
function recreerContexte() {
  const ancien = contexte
  contexte = creerContexte()
  ancien?.close().catch(() => { /* Deja ferme. */ })
  if (proprietaire instanceof PisteAudio) proprietaire.relancer()
}

// Un essai de reprise a deja echoue : le prochain geste recree le contexte.
let repriseEchouee = false

function obtenirContexte(): AudioContext {
  if (contexte) return contexte
  contexte = creerContexte()
  // Chaque geste relance le contexte tant qu'il n'est pas actif (refus
  // avant le premier toucher, ou mise en veille par le systeme). Tout se
  // fait pendant le geste : c'est la seule fenetre ou l'iPhone l'autorise.
  const reveiller = () => {
    let c = contexte!
    if (c.state === 'running') return
    if (c.state === ('interrupted' as AudioContextState) || repriseEchouee) {
      recreerContexte()
      c = contexte!
      repriseEchouee = false
    }
    c.resume().then(() => { if (c.state === 'running') signalerBlocage(false) }).catch(() => { /* Geste suivant. */ })
    // Sans reponse rapide, la reprise est consideree comme echouee.
    setTimeout(() => { if (c === contexte && c.state !== 'running') repriseEchouee = true }, 500)
  }
  EVENEMENTS_GESTE.forEach(e => window.addEventListener(e, reveiller, true))
  // Retour sur le site (onglet ou application revenus au premier plan) :
  // on tente la reprise ; si l'iPhone la refuse sans geste, la bulle
  // invite a toucher l'ecran.
  const auRetour = () => {
    if (document.visibilityState !== 'visible' || !contexte || !sonVoulu()) return
    const c = contexte
    c.resume().catch(() => { /* Attend un toucher. */ })
    setTimeout(() => {
      if (c !== contexte || c.state === 'running') return
      repriseEchouee = true
      signalerBlocage(true)
    }, 400)
  }
  document.addEventListener('visibilitychange', auRetour)
  window.addEventListener('pageshow', auRetour)
  return contexte
}

// Extraits decodes, gardes pour les 4 derniers sons (un extrait de 30 s
// decode pese ~10 Mo : on n'en garde pas davantage).
const tampons = new Map<string, Promise<AudioBuffer>>()
function tampon(url: string): Promise<AudioBuffer> {
  const existant = tampons.get(url)
  if (existant) {
    tampons.delete(url); tampons.set(url, existant)
    return existant
  }
  const c = obtenirContexte()
  const promesse = fetch(url)
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer() })
    // Forme a rappels : les anciens Safari ne rendent pas de promesse.
    .then(donnees => new Promise<AudioBuffer>((ok, ko) => c.decodeAudioData(donnees, ok, ko)))
  promesse.catch(() => tampons.delete(url))
  tampons.set(url, promesse)
  while (tampons.size > 4) tampons.delete(tampons.keys().next().value!)
  return promesse
}

class PisteAudio implements Piste, Lecteur {
  private tampon: AudioBuffer | null = null
  private source: AudioBufferSourceNode | null = null
  // Position (s) au dernier depart, et heure du contexte a ce moment-la.
  private position = 0
  private depart = 0
  private debit = 1
  private voulu = false

  constructor(private readonly url: string) {
    // Decodage lance des la creation : la piste est prete quand on la joue.
    tampon(url).then(t => { this.tampon = t; if (this.voulu && proprietaire === this) this.demarrer() })
      .catch(() => { /* Extrait illisible : la video reste sans musique. */ })
  }

  private get duree() { return this.tampon?.duration ?? 0 }

  private maintenant(): number {
    if (!this.source || !contexte) return this.position
    const p = this.position + (contexte.currentTime - this.depart) * this.debit
    return this.duree > 0 ? p % this.duree : p
  }

  private demarrer() {
    if (!this.tampon || this.source || !contexte || !sortie) return
    const s = contexte.createBufferSource()
    s.buffer = this.tampon
    s.loop = true
    s.playbackRate.value = this.debit
    s.connect(sortie)
    s.start(0, this.duree > 0 ? this.position % this.duree : 0)
    this.depart = contexte.currentTime
    this.source = s
  }

  private arreterSource() {
    if (!this.source) return
    this.position = this.maintenant()
    try { this.source.stop() } catch { /* Deja arretee. */ }
    this.source.disconnect()
    this.source = null
  }

  ceder() { this.voulu = false; this.arreterSource() }

  // Contexte remplace : la source de l'ancien est abandonnee et la musique
  // repart du meme endroit sur le nouveau.
  relancer() {
    if (this.source) {
      this.position = this.maintenant()
      try { this.source.disconnect() } catch { /* Contexte ferme. */ }
      this.source = null
    }
    if (this.voulu) this.demarrer()
  }

  get currentTime() { return this.maintenant() }
  get playing() { return this.voulu && proprietaire === this }
  get isLoaded() { return !!this.tampon }

  play() {
    const c = obtenirContexte()
    prendreLaMain(this)
    this.voulu = true
    if (c.state !== 'running') {
      signalerBlocage(true)
      c.resume().then(() => { if (c.state === 'running') signalerBlocage(false) }).catch(() => { /* Attend un toucher. */ })
    }
    this.demarrer()
  }

  pause() {
    this.voulu = false
    this.arreterSource()
  }

  async seekTo(secondes: number) {
    const relancer = !!this.source
    this.arreterSource()
    this.position = Math.max(0, secondes)
    if (relancer) this.demarrer()
  }

  regler(debit: number) {
    if (this.source && contexte) {
      this.position = this.maintenant()
      this.depart = contexte.currentTime
      this.source.playbackRate.value = debit
    }
    this.debit = debit
  }

  liberer() {
    if (proprietaire !== this) return
    this.ceder()
    proprietaire = null
  }
}

// ------------------------------------------------------------
// Platine (element <audio>), pour les sons originaux
// ------------------------------------------------------------

let platine: HTMLAudioElement | null = null
function obtenirPlatine(): HTMLAudioElement {
  if (!platine) {
    platine = new Audio()
    platine.preload = 'auto'
    platine.loop = true
  }
  return platine
}

class PisteElement implements Piste, Lecteur {
  // Position voulue avant d'avoir la platine (ex. carte remise au debut).
  private depart = 0
  private debit = 1

  constructor(private readonly url: string | null) {}

  private get aLaMain() { return proprietaire === this }

  ceder() { platine?.pause() }

  private prendre(): HTMLAudioElement | null {
    if (!this.url) return null
    const p = obtenirPlatine()
    if (!this.aLaMain) {
      prendreLaMain(this)
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
    this.prendre()?.play().catch(() => { /* Refus : rattrape au prochain geste (web/demarrage.ts). */ })
  }

  pause() { if (this.aLaMain) platine!.pause() }

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

  liberer() {
    if (!this.aLaMain) return
    platine!.pause()
    platine!.playbackRate = 1
    proprietaire = null
  }
}

// ------------------------------------------------------------

// Musiques legeres (extrait Deezer, son deja en memoire) : Web Audio.
// Piste d'une video (son original) : la platine.
const decodable = (url: string) =>
  url.startsWith('blob:') || url.startsWith('data:') || /dzcdn\.net|\.mp3(\?|$)/.test(url)

type PisteLiberable = Piste & { liberer: () => void }

const PISTE_MUETTE: PisteLiberable = {
  currentTime: 0, playing: false, isLoaded: false,
  play: () => {}, pause: () => {}, seekTo: async () => {}, regler: () => {}, liberer: () => {},
}

export function usePiste(url: string | null): Piste {
  const piste = useMemo<PisteLiberable>(
    () => (!url ? PISTE_MUETTE : decodable(url) ? new PisteAudio(url) : new PisteElement(url)),
    [url],
  )
  useEffect(() => () => piste.liberer(), [piste])
  return piste
}

// Etat « en lecture » (son reellement audible), relu pour l'affichage.
export function usePisteJoue(piste: Piste): boolean {
  const [joue, setJoue] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      const audible = piste instanceof PisteAudio
        ? piste.playing && piste.isLoaded && contexte?.state === 'running'
        : piste.playing && (platine?.readyState ?? 0) >= 3
      setJoue(audible)
    }, 150)
    return () => clearInterval(t)
  }, [piste])
  return joue
}
