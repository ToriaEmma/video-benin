// Version web : les prises d'une meme seance sont deja dans un seul fichier.
// Il ne reste a raccorder que les morceaux separes par la suppression d'une
// prise (chacun lu jusqu'a sa duree gardee) : on les rejoue a la suite sur
// une toile, son compris, et on enregistre le tout (le temps de la video).
import { tailles } from '../../web/expo-file-system'

const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']

export type Morceau = { uri: string; duree: number }

export async function assemblerVideos(morceaux: Morceau[]): Promise<string> {
  const toile = document.createElement('canvas')
  toile.width = 540; toile.height = 960
  const g = toile.getContext('2d')!
  const flux = toile.captureStream(30)
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  await ctx.resume().catch(() => {})
  const sortie = ctx.createMediaStreamDestination()
  sortie.stream.getAudioTracks().forEach(t => flux.addTrack(t))
  const type = TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
  const rec = new MediaRecorder(flux, { videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 96_000, ...(type ? { mimeType: type } : {}) })
  const donnees: Blob[] = []
  rec.ondataavailable = e => { if (e.data.size) donnees.push(e.data) }
  const fini = new Promise<void>(r => { rec.onstop = () => r() })

  const v = document.createElement('video')
  v.playsInline = true
  v.crossOrigin = 'anonymous'
  ctx.createMediaElementSource(v).connect(sortie)
  let dessine = true
  const dessiner = () => {
    if (!dessine) return
    if (v.videoWidth) {
      const e = Math.max(540 / v.videoWidth, 960 / v.videoHeight)
      const w = v.videoWidth * e, h = v.videoHeight * e
      g.drawImage(v, (540 - w) / 2, (960 - h) / 2, w, h)
    }
    requestAnimationFrame(dessiner)
  }
  dessiner()

  for (let i = 0; i < morceaux.length; i++) {
    const { uri, duree } = morceaux[i]
    v.src = uri
    await new Promise<void>((ok, ko) => { v.onloadeddata = () => ok(); v.onerror = () => ko(new Error('Morceau illisible')) })
    await v.play()
    if (i === 0) rec.start(250)
    else if (rec.state === 'paused') rec.resume()
    // Fin du morceau, ou de la partie gardee (prise supprimee au-dela).
    await new Promise<void>(ok => {
      const fin = () => { v.onended = null; clearInterval(t); ok() }
      v.onended = fin
      const t = setInterval(() => { if (v.currentTime >= duree - 0.02) fin() }, 20)
    })
    v.pause()
    if (i < morceaux.length - 1) rec.pause()
  }
  rec.stop()
  await fini
  dessine = false
  flux.getVideoTracks().forEach(t => t.stop())
  ctx.close().catch(() => {})
  const blob = new Blob(donnees, { type: (rec.mimeType || type || 'video/webm').split(';')[0] })
  const uri = URL.createObjectURL(blob)
  tailles.set(uri, blob.size)
  return uri
}
