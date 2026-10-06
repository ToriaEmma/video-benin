// Lien public d'une video : https://<site>/v/<id>. Ouvert dans un
// navigateur, il lance le site sur cette video (compte ou pas).
import { Platform } from 'react-native'

const SITE = 'https://tocktick-web.vercel.app'
const MOTIF = /^\/v\/([0-9a-f-]{36})\/?$/i

const surLeWeb = () => Platform.OS === 'web' && typeof window !== 'undefined'

export const lienVideo = (id: string) =>
  `${surLeWeb() ? window.location.origin : SITE}/v/${id}`

// Identifiant de la video demandee par l'adresse, ou null.
export function videoDuLien(): string | null {
  if (!surLeWeb()) return null
  return MOTIF.exec(window.location.pathname)?.[1] ?? null
}

// Une fois la video ouverte, l'adresse revient a l'accueil : un
// rechargement ne doit pas y ramener.
export function oublierLien() {
  if (surLeWeb()) window.history.replaceState(null, '', '/')
}
