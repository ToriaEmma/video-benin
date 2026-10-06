// Garde la musique calee sur la video : la video commande, la musique suit.
// - video figee (chargement, pause) : la musique s'arrete et attend ;
// - video qui repart : la musique reprend au meme instant ;
// - retour au debut de la boucle : la musique repart aussitot avec elle ;
// - ecart de plus de 0,3 s : on recale.
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

type Video = { currentTime: number }
type Musique = {
  currentTime: number
  playing: boolean
  play: () => void
  pause: () => void
  seekTo: (secondes: number) => Promise<void>
}

// Releve frequent : un bouclage est rattrape en moins de 0,1 s.
const PAS = 100
// Sans progression pendant ce delai, la video est consideree figee.
const FIGEE_MS = 400

export function useMusiqueCalee(video: Video, musique: Musique | null, actif: boolean, duree: number) {
  useEffect(() => {
    if (!actif || !musique) return
    let dernier = -1
    let immobile = 0
    const minuteur = setInterval(() => {
      const v = video.currentTime
      const avance = Math.abs(v - dernier) > 0.005
      // La video est revenue en arriere : elle vient de boucler.
      const boucle = dernier >= 0 && v < dernier - 0.3
      dernier = v
      if (!avance) {
        immobile += PAS
        if (immobile >= FIGEE_MS && musique.playing) musique.pause()
        return
      }
      immobile = 0
      // Extrait plus court que la video : la musique repart en boucle.
      const cible = duree > 0 ? v % duree : v
      if (boucle || Math.abs(musique.currentTime - cible) > 0.3) {
        musique.seekTo(cible).catch(() => { /* Position refusee. */ })
      }
      if (!musique.playing) musique.play()
    }, PAS)
    return () => clearInterval(minuteur)
  }, [actif, video, musique, duree])
}

// Musique chargee entierement en memoire (web) : les retours au debut de la
// boucle sont instantanes, sans nouvelle requete ni silence. Le fichier est
// garde pour la session : la camera le precharge, l'apercu le retrouve pret.
const enMemoire = new Map<string, Promise<string>>()

export function prechargerSon(url: string): Promise<string> {
  if (Platform.OS !== 'web') return Promise.resolve(url)
  let p = enMemoire.get(url)
  if (!p) {
    p = fetch(url)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.blob() })
      .then(b => URL.createObjectURL(b))
      // Echec : l'adresse d'origine, lue en continu comme avant.
      .catch(() => { enMemoire.delete(url); return url })
    enMemoire.set(url, p)
  }
  return p
}

// Renvoie null tant que le fichier n'est pas pret.
export function useSonEnMemoire(url: string | null): string | null {
  const [pret, setPret] = useState<{ url: string; local: string } | null>(null)
  useEffect(() => {
    if (!url || Platform.OS !== 'web') return
    let annule = false
    prechargerSon(url).then(local => { if (!annule) setPret({ url, local }) })
    return () => { annule = true }
  }, [url])
  if (!url) return null
  if (Platform.OS !== 'web') return url
  return pret?.url === url ? pret.local : null
}
