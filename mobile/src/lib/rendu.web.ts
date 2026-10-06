// Rendu final d'une video, cote navigateur. Les retouches du montage
// (filtre, vitesse, effet vocal, textes, stickers, sous-titres, decoupe)
// ne vivent que dans l'apercu tant qu'elles ne sont pas « gravees » : on
// rejoue donc la video sur une toile en les appliquant, son compris, et on
// enregistre le resultat. Le rendu prend le temps de la video (divise par
// la vitesse) ; la progression est remontee pour l'afficher.
//
// Sert aussi au raccord des prises de la camera (plusieurs morceaux mis
// bout a bout) et a la fabrication d'une video a partir d'une image.
import { tailles } from '../../web/expo-file-system'
import type { Morceau, Reglages } from './rendu'

export type { Calque, Morceau, Reglages } from './rendu'

const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
// Largeur de sortie : nette sur un telephone, legere a envoyer.
const LARGEUR = 540
// Meme debit que la camera : ~2 Mo pour 15 s.
const DEBITS = { videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 96_000 }

const typeSortie = () => TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? ''

const nouveauContexteAudio = () => {
  const Ctx = window.AudioContext
    || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new Ctx()
}

// Hauteur paire (les encodeurs l'exigent), au format de la source.
const dimensions = (vw: number, vh: number) => ({
  l: LARGEUR,
  h: Math.max(2, Math.round((LARGEUR * vh) / vw / 2) * 2),
})

// Mode de fusion CSS (celui de l'apercu) vers son equivalent sur toile.
const fusion = (melange: string): GlobalCompositeOperation =>
  melange === 'normal' ? 'source-over' : (melange as GlobalCompositeOperation)

// Decoupe un texte en lignes qui tiennent dans `max` pixels.
function lignes(g: CanvasRenderingContext2D, texte: string, max: number): string[] {
  const sortie: string[] = []
  for (const paragraphe of texte.split('\n')) {
    let ligne = ''
    for (const mot of paragraphe.split(/\s+/)) {
      const essai = ligne ? `${ligne} ${mot}` : mot
      if (g.measureText(essai).width > max && ligne) { sortie.push(ligne); ligne = mot } else ligne = essai
    }
    sortie.push(ligne)
  }
  return sortie
}

// Dessine les reglages d'image sur la toile, par-dessus l'image deja posee.
export function dessinerHabillage(g: CanvasRenderingContext2D, l: number, h: number, r: Reglages) {
  if (r.voile && r.voile.couleur !== 'transparent') {
    g.save()
    g.globalCompositeOperation = fusion(r.voile.melange)
    g.fillStyle = r.voile.couleur
    g.fillRect(0, 0, l, h)
    g.restore()
  }
  for (const c of r.calques ?? []) {
    const taille = c.taille * l
    g.save()
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    if (c.genre === 'sticker') {
      g.font = `${taille}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
      g.fillText(c.contenu, c.x * l, c.y * h)
    } else {
      g.font = `700 ${taille}px -apple-system, "Segoe UI", Roboto, sans-serif`
      g.fillStyle = c.couleur
      g.shadowColor = 'rgba(0,0,0,.45)'
      g.shadowBlur = taille * 0.15
      const ls = lignes(g, c.contenu, l * 0.9)
      ls.forEach((t, i) => g.fillText(t, c.x * l, c.y * h + (i - (ls.length - 1) / 2) * taille * 1.2))
    }
    g.restore()
  }
  const sousTitre = r.sousTitre?.trim()
  if (sousTitre) {
    const taille = l * 0.04
    g.save()
    g.font = `600 ${taille}px -apple-system, "Segoe UI", Roboto, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const ls = lignes(g, sousTitre, l * 0.8)
    const haut = ls.length * taille * 1.3 + taille
    const y = h - h * 0.1 - haut
    g.fillStyle = 'rgba(0,0,0,.52)'
    g.beginPath()
    g.roundRect(l * 0.07, y, l * 0.86, haut, taille * 0.5)
    g.fill()
    g.fillStyle = '#fff'
    ls.forEach((t, i) => g.fillText(t, l / 2, y + taille * 0.5 + (i + 0.5) * taille * 1.3))
    g.restore()
  }
}

// Enregistreur d'une toile et d'une sortie audio ; `arreter` rend le fichier.
function enregistreur(toile: HTMLCanvasElement, audio: MediaStreamAudioDestinationNode | null) {
  const flux = toile.captureStream(30)
  audio?.stream.getAudioTracks().forEach(t => flux.addTrack(t))
  const type = typeSortie()
  const rec = new MediaRecorder(flux, { ...DEBITS, ...(type ? { mimeType: type } : {}) })
  const donnees: Blob[] = []
  rec.ondataavailable = e => { if (e.data.size) donnees.push(e.data) }
  return {
    rec,
    arreter: () => new Promise<string>(resoudre => {
      rec.onstop = () => {
        flux.getVideoTracks().forEach(t => t.stop())
        const blob = new Blob(donnees, { type: (rec.mimeType || type || 'video/webm').split(';')[0] })
        const uri = URL.createObjectURL(blob)
        tailles.set(uri, blob.size)
        resoudre(uri)
      }
      rec.stop()
    }),
  }
}

// Effets vocaux traites en direct par Web Audio :
// - Écho : la voix revient 250 ms plus tard, en s'eteignant ;
// - Robot : modulation en anneau (la voix multipliee par une onde a 60 Hz).
function brancherVoix(ctx: AudioContext, source: AudioNode, vers: AudioNode, voix?: 'robot' | 'echo') {
  if (voix === 'echo') {
    const retard = ctx.createDelay(1)
    retard.delayTime.value = 0.25
    const retour = ctx.createGain()
    retour.gain.value = 0.35
    const humide = ctx.createGain()
    humide.gain.value = 0.5
    source.connect(vers)
    source.connect(retard)
    retard.connect(retour); retour.connect(retard)
    retard.connect(humide); humide.connect(vers)
    return
  }
  if (voix === 'robot') {
    const anneau = ctx.createGain()
    anneau.gain.value = 0
    const onde = ctx.createOscillator()
    onde.frequency.value = 60
    onde.connect(anneau.gain)
    onde.start()
    source.connect(anneau)
    anneau.connect(vers)
    return
  }
  source.connect(vers)
}

// Dimensions naturelles d'une video, lues sans la jouer.
export function dimensionsVideo(uri: string): Promise<{ l: number; h: number } | null> {
  return new Promise(resoudre => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.onloadedmetadata = () => { resoudre(v.videoWidth ? { l: v.videoWidth, h: v.videoHeight } : null); v.removeAttribute('src'); v.load() }
    v.onerror = () => resoudre(null)
    v.src = uri
  })
}

const charger = (v: HTMLVideoElement, uri: string) => new Promise<void>((ok, ko) => {
  v.onloadeddata = () => ok()
  v.onerror = () => ko(new Error('Vidéo illisible'))
  v.src = uri
})

export async function rendreVideo(morceaux: Morceau[], r: Reglages = {}): Promise<string> {
  if (!morceaux.length) throw new Error('Aucune vidéo à rendre')
  const debit = r.debit ?? 1
  const v = document.createElement('video')
  v.playsInline = true
  v.crossOrigin = 'anonymous'
  v.preload = 'auto'
  await charger(v, morceaux[0].uri)
  const { l, h } = dimensions(v.videoWidth || 540, v.videoHeight || 960)
  const toile = document.createElement('canvas')
  toile.width = l; toile.height = h
  const g = toile.getContext('2d')!

  const ctx = nouveauContexteAudio()
  await ctx.resume().catch(() => {})
  const sortie = ctx.createMediaStreamDestination()
  const volume = ctx.createGain()
  volume.gain.value = r.sansSon ? 0 : 1
  brancherVoix(ctx, ctx.createMediaElementSource(v), volume, r.voix)
  volume.connect(sortie)
  const { rec, arreter } = enregistreur(toile, sortie)

  // Duree totale en secondes de sortie, pour la progression.
  const durees = morceaux.map(m => {
    const fin = m.fin ?? m.duree
    return Math.max(0, (fin ?? 0) - (m.debut ?? 0))
  })
  let total = durees.reduce((a, b) => a + b, 0)
  let ecoule = 0

  let actif = true
  const dessiner = () => {
    if (!actif) return
    if (v.videoWidth) {
      // L'image remplit la toile au format de la source (contain si un
      // morceau a un autre format que le premier).
      const e = Math.min(l / v.videoWidth, h / v.videoHeight)
      const w = v.videoWidth * e, hh = v.videoHeight * e
      g.fillStyle = '#000'
      g.fillRect(0, 0, l, h)
      if (r.retouche) g.filter = 'brightness(1.06) contrast(.94) saturate(1.06) blur(.5px)'
      g.drawImage(v, (l - w) / 2, (h - hh) / 2, w, hh)
      g.filter = 'none'
      dessinerHabillage(g, l, h, r)
    }
    requestAnimationFrame(dessiner)
  }

  try {
    for (let i = 0; i < morceaux.length; i++) {
      const m = morceaux[i]
      if (i > 0) await charger(v, m.uri)
      // Duree inconnue a l'avance (morceau entier) : lue sur la video.
      const fin = m.fin ?? m.duree ?? (Number.isFinite(v.duration) ? v.duration : Infinity)
      if (!durees[i] && Number.isFinite(fin)) { durees[i] = fin - (m.debut ?? 0); total += durees[i] }
      v.currentTime = m.debut ?? 0
      if (m.debut) await new Promise(ok => { v.onseeked = ok })
      v.playbackRate = debit
      v.preservesPitch = r.hauteurPreservee ?? true
      await v.play()
      if (i === 0) { dessiner(); rec.start(250) } else if (rec.state === 'paused') rec.resume()
      await new Promise<void>(ok => {
        const terminer = () => { v.onended = null; clearInterval(t); ok() }
        v.onended = terminer
        const t = setInterval(() => {
          const lu = v.currentTime - (m.debut ?? 0)
          if (total > 0) r.surProgression?.(Math.min(1, (ecoule + lu) / total))
          if (v.currentTime >= fin - 0.02) terminer()
        }, 50)
      })
      v.pause()
      ecoule += durees[i]
      if (i < morceaux.length - 1) rec.pause()
    }
    r.surProgression?.(1)
    return await arreter()
  } finally {
    actif = false
    v.removeAttribute('src'); v.load()
    ctx.close().catch(() => {})
  }
}

// Image chargee et decodee, prete a dessiner.
export async function chargerImage(uri: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = uri
  await img.decode()
  return img
}

// Video fixe a partir d'une image (mode PHOTO) ou d'un dessin (mode
// TEXTE) : `peindre` dessine chaque image, `t` allant de 0 a 1, ce qui
// permet un leger zoom. Pas de piste son : la musique choisie s'ajoute
// a la lecture, comme pour toute video.
export async function videoFixe(
  peindre: (g: CanvasRenderingContext2D, l: number, h: number, t: number) => void,
  duree = 5,
  surProgression?: (p: number) => void,
): Promise<string> {
  const toile = document.createElement('canvas')
  toile.width = LARGEUR; toile.height = 960
  const g = toile.getContext('2d')!
  const { rec, arreter } = enregistreur(toile, null)
  const debut = performance.now()
  peindre(g, toile.width, toile.height, 0)
  rec.start(250)
  await new Promise<void>(ok => {
    const pas = () => {
      const t = Math.min(1, (performance.now() - debut) / (duree * 1000))
      peindre(g, toile.width, toile.height, t)
      surProgression?.(t)
      if (t >= 1) ok(); else requestAnimationFrame(pas)
    }
    requestAnimationFrame(pas)
  })
  return arreter()
}
