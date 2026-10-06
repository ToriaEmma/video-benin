// Garde la musique calee sur la video : la video commande, la musique suit.
// - video figee (chargement, pause) : la musique s'arrete et attend ;
// - video qui repart : la musique reprend au meme instant ;
// - ecart de plus de 0,3 s, ou retour au debut de la boucle : on recale.
import { useEffect } from 'react'

type Video = { currentTime: number }
type Musique = {
  currentTime: number
  playing: boolean
  play: () => void
  pause: () => void
  seekTo: (secondes: number) => Promise<void>
}

export function useMusiqueCalee(video: Video, musique: Musique | null, actif: boolean, duree: number) {
  useEffect(() => {
    if (!actif || !musique) return
    let dernier = -1
    let figee = 0
    const minuteur = setInterval(() => {
      const v = video.currentTime
      const avance = Math.abs(v - dernier) > 0.01
      dernier = v
      if (!avance) {
        // Deux releves sans progression (~0,5 s) : la video est figee.
        if (++figee >= 2 && musique.playing) musique.pause()
        return
      }
      figee = 0
      // Extrait plus court que la video : la musique repart en boucle.
      const cible = duree > 0 ? v % duree : v
      if (Math.abs(musique.currentTime - cible) > 0.3) musique.seekTo(cible).catch(() => { /* Position refusee. */ })
      if (!musique.playing) musique.play()
    }, 250)
    return () => clearInterval(minuteur)
  }, [actif, video, musique, duree])
}
