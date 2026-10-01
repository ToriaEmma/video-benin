import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiComptes, lireJeton, poserJeton, type ProfilApi } from './api'
import { etat } from './demo'

// Meme forme que le profil de la version web (app/src/lib/auth.tsx) : les
// deux plateformes lisent la meme table `profils`, leurs champs doivent donc
// concorder.
export type Profil = {
  id: string
  pseudo: string
  nom?: string
  telephone: string | null
  bio: string
  avatar_url: string | null
}

type Contexte = {
  profil: Profil | null
  chargement: boolean
  inscrire: (tel: string, mdp: string, pseudo: string) => Promise<void>
  connecter: (tel: string, mdp: string) => Promise<void>
  deconnecter: () => Promise<void>
  rafraichirProfil: () => Promise<void>
  modifierProfil: (
    valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>,
  ) => Promise<void>
}

const C = createContext<Contexte | null>(null)

// Postgres rend NULL la ou les ecrans attendent une chaine : la conversion
// est faite ici une fois pour toutes.
const versProfil = (p: ProfilApi): Profil => ({
  id: p.id,
  pseudo: p.pseudo,
  nom: p.nom ?? undefined,
  telephone: p.telephone,
  bio: p.bio ?? '',
  avatar_url: p.avatar_url,
})

export const FournisseurAuth = ({ children }: { children: React.ReactNode }) => {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(true)

  // Les ecrans encore alimentes par demo.ts lisent `etat.pseudo` : il doit
  // suivre le profil reel tant qu'ils n'ont pas bascule sur l'API.
  const appliquer = (suivant: Profil | null) => {
    etat.connecte = Boolean(suivant)
    etat.pseudo = suivant?.pseudo ?? ''
    setProfil(suivant)
  }

  useEffect(() => {
    // Un jeton conserve est suppose valable : seul /moi peut le confirmer.
    // S'il a expire, on le jette sans bruit et l'ecran de connexion s'ouvre.
    lireJeton()
      .then(jeton => (jeton ? apiComptes.moi() : null))
      .then(p => { if (p) appliquer(versProfil(p)) })
      .catch(() => poserJeton(null))
      .finally(() => setChargement(false))
  }, [])

  const ouvrirSession = async (session: { jeton: string; profil: ProfilApi }) => {
    await poserJeton(session.jeton)
    appliquer(versProfil(session.profil))
  }

  const inscrire = async (tel: string, mdp: string, pseudo: string) => {
    await ouvrirSession(await apiComptes.inscription(tel, mdp, pseudo))
  }

  const connecter = async (tel: string, mdp: string) => {
    await ouvrirSession(await apiComptes.connexion(tel, mdp))
  }

  const deconnecter = async () => {
    await poserJeton(null)
    appliquer(null)
  }

  const rafraichirProfil = async () => {
    if (!profil) return
    appliquer(versProfil(await apiComptes.moi()))
  }

  const modifierProfil = async (
    valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>,
  ) => {
    if (!profil) return
    appliquer(versProfil(await apiComptes.modifierProfil(valeurs)))
  }

  return (
    <C.Provider value={{
      profil, chargement, inscrire, connecter, deconnecter,
      rafraichirProfil, modifierProfil,
    }}>
      {children}
    </C.Provider>
  )
}

export const useAuth = () => {
  const c = useContext(C)
  if (!c) throw new Error('useAuth hors FournisseurAuth')
  return c
}
