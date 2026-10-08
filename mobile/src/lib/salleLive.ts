// Application native : le LIVE passe par le site (le module WebRTC de
// LiveKit demande une compilation native que l'application n'embarque pas).
import type { AccesLive } from './api'

export type MessageSalle = { id: string; pseudo: string; texte: string; systeme?: boolean }
export type EtatSalle = 'connexion' | 'direct' | 'termine' | 'erreur' | 'indisponible'
type Piste = { stop: () => void }

export async function preparerCamera(_face: 'user' | 'environment'): Promise<Piste[]> {
  throw new Error('Le LIVE est disponible sur le site tocktick-web.vercel.app')
}
export function libererCamera(pistes: Piste[]) { pistes.forEach(p => p.stop()) }
export async function basculerCamera(_pistes: Piste[], _face: 'user' | 'environment') {}

export function useSalleLive(_acces: AccesLive | null, _options: { diffuseur: boolean; pistes?: Piste[]; moi: string }) {
  return {
    etat: 'indisponible' as EtatSalle, spectateurs: 0, messages: [] as MessageSalle[], coeurs: 0, sonBloque: false,
    refVideo: (_e: HTMLVideoElement | null) => {}, envoyer: (_t: string) => {}, envoyerCoeur: () => {}, activerSon: () => {},
  }
}
