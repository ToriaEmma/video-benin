// Musique d'un ecran (fil, camera, montage, choix du son). Sur mobile, un
// lecteur expo-audio par piste ; le web passe par une platine unique
// (piste.web.ts), seule facon d'avoir un son obeissant et autorise partout.
import { useEffect } from 'react'
import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio'

export type Piste = {
  readonly currentTime: number
  readonly playing: boolean
  readonly isLoaded: boolean
  play: () => void
  pause: () => void
  seekTo: (secondes: number) => Promise<void>
}

// Reglage pose hors du composant : une propriete d'objet venant d'un hook
// ne se modifie pas dans le rendu.
const boucler = (p: AudioPlayer) => { p.loop = true }

export function usePiste(url: string | null): Piste {
  const lecteur = useAudioPlayer(url ? { uri: url } : null)
  useEffect(() => { boucler(lecteur) }, [lecteur])
  useEffect(() => () => { try { lecteur.pause() } catch { /* Deja libere. */ } }, [lecteur])
  return lecteur
}

// Etat « en lecture », suivi en direct pour l'affichage.
export function usePisteJoue(piste: Piste): boolean {
  return useAudioPlayerStatus(piste as AudioPlayer).playing
}
