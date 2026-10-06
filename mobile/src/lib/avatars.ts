// Photos de profil des auteurs, demandees une fois par compte puis gardees
// en memoire : les videos de l'API ne portent que le pseudo de l'auteur.
import { useEffect, useState } from 'react'
import { apiInteractions } from './api'

const promesses = new Map<string, Promise<string | null>>()
const connues = new Map<string, string | null>()

export function avatarDe(pseudo: string): Promise<string | null> {
  if (!promesses.has(pseudo)) {
    promesses.set(pseudo, apiInteractions.profil(pseudo)
      .then(p => { const a = p.avatar_url || null; connues.set(pseudo, a); return a })
      .catch(() => { promesses.delete(pseudo); return null }))
  }
  return promesses.get(pseudo)!
}

// Apres un changement de photo : la prochaine lecture repart de l'API.
export function oublierAvatar(pseudo: string, nouvelle?: string | null) {
  promesses.delete(pseudo)
  if (nouvelle !== undefined) { connues.set(pseudo, nouvelle); promesses.set(pseudo, Promise.resolve(nouvelle)) }
  else connues.delete(pseudo)
}

export function useAvatar(pseudo: string | null | undefined): string | null {
  const [avatar, setAvatar] = useState<string | null>(pseudo ? connues.get(pseudo) ?? null : null)
  useEffect(() => {
    if (!pseudo) return
    let actif = true
    avatarDe(pseudo).then(a => { if (actif) setAvatar(a) })
    return () => { actif = false }
  }, [pseudo])
  return avatar
}
