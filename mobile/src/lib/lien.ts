// Liens publics : https://<site>/v/<id> pour une video, https://<site>/@<pseudo>
// pour un profil. Ouverts dans un navigateur, ils lancent le site dessus.
import { Platform } from 'react-native'

const SITE = 'https://tocktick-web.vercel.app'
const MOTIF = /^\/v\/([0-9a-f-]{36})\/?$/i
const MOTIF_PROFIL = /^\/@([a-z0-9._]{3,24})\/?$/i

const surLeWeb = () => Platform.OS === 'web' && typeof window !== 'undefined'

const origine = () => (surLeWeb() ? window.location.origin : SITE)

export const lienVideo = (id: string) => `${origine()}/v/${id}`

export const lienProfil = (pseudo: string) => `${origine()}/@${pseudo}`

// Pseudo du profil demande par l'adresse, ou null.
export function profilDuLien(): string | null {
  if (!surLeWeb()) return null
  return MOTIF_PROFIL.exec(window.location.pathname)?.[1]?.toLowerCase() ?? null
}

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
