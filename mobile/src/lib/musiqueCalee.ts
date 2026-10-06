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

// `ecartMax` : ecart tolere avant recalage. Une musique en memoire se recale
// sans a-coup, on peut alors etre plus exigeant.
// `vitesse` et `origine` : quand l'apercu joue la video accelere ou
// decoupee, la musique suit le temps de la video finale,
// (position - origine) / vitesse.
export function useMusiqueCalee(
  video: Video, musique: Musique | null, actif: boolean, duree: number,
  ecartMax = 0.3, vitesse = 1, origine = 0,
) {
  useEffect(() => {
    if (!actif || !musique) return
    let dernier = -1
    let immobile = 0
    // Apres un saut, la musique met un instant a repartir : on la recale
    // plus finement pendant les deux secondes qui suivent.
    let precis = 0
    // Relevés laisses a la musique pour se poser apres un recalage.
    let calme = 0
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
      const temps = Math.max(0, (v - origine) / vitesse)
      const cible = duree > 0 ? temps % duree : temps
      const tolerance = precis > 0 ? Math.min(0.12, ecartMax) : ecartMax
      if (precis > 0) precis--
      if (calme > 0 && !boucle) calme--
      else if (boucle || Math.abs(musique.currentTime - cible) > tolerance) {
        if (boucle || precis === 0) precis = 20
        calme = 3
        musique.seekTo(cible).catch(() => { /* Position refusee. */ })
      }
      if (!musique.playing) musique.play()
    }, PAS)
    return () => clearInterval(minuteur)
  }, [actif, video, musique, duree, ecartMax, vitesse, origine])
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

// Renvoie null tant que le fichier n'est pas pret. `memoire` a faux (son
// original : la piste d'une video, souvent lourde) lit l'adresse en continu.
export function useSonEnMemoire(url: string | null, memoire = true): string | null {
  const [pret, setPret] = useState<{ url: string; local: string } | null>(null)
  useEffect(() => {
    if (!url || Platform.OS !== 'web' || !memoire) return
    let annule = false
    prechargerSon(url).then(local => { if (!annule) setPret({ url, local }) })
    return () => { annule = true }
  }, [url, memoire])
  if (!url) return null
  if (Platform.OS !== 'web' || !memoire) return url
  return pret?.url === url ? pret.local : null
}
