// Miniature d'une video (web) : l'image de couverture choisie, ou a defaut
// une image prise au debut de la video, en JPEG 540 × 960 (~50 Ko). Elle sert
// a l'apercu des liens partages et a la grille du profil (une image au lieu
// d'une video par case : bien moins de donnees).
import type { ChoixCouverture } from '../ecrans/Couverture'

const L = 540
const H = 960

function charger<T extends HTMLImageElement | HTMLVideoElement>(el: T, uri: string, evenement: string): Promise<T> {
  return new Promise((ok, ko) => {
    el.addEventListener(evenement, () => ok(el), { once: true })
    el.addEventListener('error', () => ko(new Error('Image illisible')), { once: true })
    if (!uri.startsWith('blob:') && !uri.startsWith('data:')) el.crossOrigin = 'anonymous'
    el.src = uri
  })
}

// Image « cover » : remplit le cadre 9:16, recadree au centre.
function dessiner(g: CanvasRenderingContext2D, source: CanvasImageSource, l: number, h: number) {
  const e = Math.max(L / l, H / h)
  const w = l * e, hh = h * e
  g.drawImage(source, (L - w) / 2, (H - hh) / 2, w, hh)
}

export async function fabriquerMiniature(video: string, choix?: ChoixCouverture | null): Promise<Blob | null> {
  const toile = document.createElement('canvas')
  toile.width = L; toile.height = H
  const g = toile.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, L, H)

  if (choix?.image) {
    const img = await charger(new Image(), choix.image, 'load')
    dessiner(g, img, img.naturalWidth, img.naturalHeight)
  } else {
    const v = document.createElement('video')
    v.muted = true; v.playsInline = true; v.preload = 'auto'
    await charger(v, video, 'loadeddata')
    const duree = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1
    // Sans choix : un peu apres le debut (la premiere image est souvent noire).
    v.currentTime = Math.min(duree - 0.05, Math.max(0.05, duree * (choix?.position ?? 0.1)))
    await new Promise(ok => v.addEventListener('seeked', ok, { once: true }))
    dessiner(g, v, v.videoWidth, v.videoHeight)
    v.removeAttribute('src'); v.load()
  }

  const titre = choix?.titre?.trim()
  if (titre) {
    g.font = '800 54px -apple-system, "Segoe UI", Roboto, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = choix?.couleur ?? '#fff'
    g.shadowColor = 'rgba(0,0,0,.5)'
    g.shadowBlur = 10
    g.fillText(titre.slice(0, 40), L / 2, H / 2, L * 0.9)
  }

  return new Promise(ok => toile.toBlob(b => ok(b), 'image/jpeg', 0.8))
}
