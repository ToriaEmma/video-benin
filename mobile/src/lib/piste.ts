// Musique d'un ecran (fil, camera, montage, choix du son). Sur mobile, un
// lecteur expo-audio par piste ; le web passe par une platine unique
// (piste.web.ts), seule facon d'avoir un son obeissant et autorise partout.
import { useEffect, useMemo } from 'react'
import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio'

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

// Lecteur expo-audio derriere chaque piste, pour suivre son statut.
const lecteurDe = new WeakMap<Piste, AudioPlayer>()

// Reglage pose hors du composant : une propriete d'objet venant d'un hook
// ne se modifie pas dans le rendu.
const boucler = (p: AudioPlayer) => { p.loop = true }

export function usePiste(url: string | null): Piste {
  const lecteur = useAudioPlayer(url ? { uri: url } : null)
  useEffect(() => { boucler(lecteur) }, [lecteur])
  useEffect(() => () => { try { lecteur.pause() } catch { /* Deja libere. */ } }, [lecteur])
  return useMemo(() => {
    const piste: Piste = {
      get currentTime() { return lecteur.currentTime },
      get playing() { return lecteur.playing },
      get isLoaded() { return lecteur.isLoaded },
      play: () => lecteur.play(),
      pause: () => lecteur.pause(),
      seekTo: s => lecteur.seekTo(s),
      regler: d => lecteur.setPlaybackRate(d),
    }
    lecteurDe.set(piste, lecteur)
    return piste
  }, [lecteur])
}

// Etat « en lecture », suivi en direct pour l'affichage.
export function usePisteJoue(piste: Piste): boolean {
  return useAudioPlayerStatus(lecteurDe.get(piste) as AudioPlayer).playing
}
