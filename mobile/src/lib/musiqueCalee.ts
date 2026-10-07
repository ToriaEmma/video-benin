// Garde la musique calee sur la video : la video commande, la musique suit.
// - video figee (chargement, pause) : la musique s'arrete et attend ;
// - video qui repart : la musique reprend au meme instant ;
// - retour au debut de la boucle, ou grand ecart : la musique saute a la
//   bonne position ;
// - petit ecart : la musique accelere ou ralentit un peu (±8 %, inaudible)
//   jusqu'a rattraper la video. Un saut s'entend comme une coupure ; un
//   leger changement de vitesse, non.
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

type Video = { currentTime: number }
type Musique = {
  currentTime: number
  playing: boolean
  play: () => void
  pause: () => void
  seekTo: (secondes: number) => Promise<void>
  // Vitesse de lecture ; sans elle, les ecarts se corrigent par des sauts.
  regler?: (debit: number) => void
}

// Releve frequent : un bouclage est rattrape en moins de 0,1 s.
const PAS = 100
// Sans progression pendant ce delai, la video est consideree figee. Assez
// long pour qu'un telephone qui met a jour la position par a-coups ne
// fasse pas couper la musique a tort.
const FIGEE_MS = 700
// Au-dela de cet ecart (s), on saute ; en dessous, on ajuste la vitesse.
const SEUIL_SAUT = 0.6
// En dessous de cet ecart, la musique est consideree calee.
const ECART_NUL = 0.05
// Correction maximale de vitesse : 8 %, imperceptible a l'oreille.
const CORRECTION_MAX = 0.08

// `ecartMax` : ecart tolere avant un saut quand la musique ne sait pas
// changer de vitesse.
// `vitesse` et `origine` : quand l'apercu joue la video accelere ou
// decoupee, la musique suit le temps de la video finale,
// (position - origine) / vitesse.
export function useMusiqueCalee(
  video: Video, musique: Musique | null, actif: boolean, duree: number,
  ecartMax = 0.3, vitesse = 1, origine = 0,
) {
  useEffect(() => {
    if (!actif || !musique) return
    const reglable = typeof musique.regler === 'function'
    const regler = (d: number) => musique.regler?.(d)
    let dernier = -1
    let immobile = 0
    // Releves laisses a la musique pour se poser apres un saut.
    let calme = 0
    let debit = 1
    const poserDebit = (d: number) => {
      if (Math.abs(d - debit) < 0.005) return
      debit = d
      regler(d)
    }
    const minuteur = setInterval(() => {
      const v = video.currentTime
      const avance = Math.abs(v - dernier) > 0.005
      // La video est revenue en arriere : elle vient de boucler (ou d'etre
      // ramenee en arriere a la main).
      const boucle = dernier >= 0 && v < dernier - 0.3
      dernier = v
      if (!avance) {
        immobile += PAS
        if (immobile >= FIGEE_MS && musique.playing) { musique.pause(); poserDebit(1) }
        return
      }
      immobile = 0
      // Extrait plus court que la video : la musique repart en boucle.
      const temps = Math.max(0, (v - origine) / vitesse)
      const cible = duree > 0 ? temps % duree : temps
      // Positif : la musique est en retard.
      const ecart = cible - musique.currentTime
      if (calme > 0 && !boucle) {
        calme--
      } else if (boucle || Math.abs(ecart) > (reglable ? SEUIL_SAUT : ecartMax)) {
        calme = 3
        poserDebit(1)
        musique.seekTo(cible).catch(() => { /* Position refusee. */ })
      } else if (reglable) {
        poserDebit(Math.abs(ecart) < ECART_NUL ? 1
          : 1 + Math.max(-CORRECTION_MAX, Math.min(CORRECTION_MAX, ecart * 0.6)))
      }
      if (!musique.playing) musique.play()
    }, PAS)
    return () => { clearInterval(minuteur); if (debit !== 1) regler(1) }
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
