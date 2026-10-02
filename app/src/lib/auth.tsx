import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiComptes, lireJeton, poserJeton, type ProfilApi } from './api'
import { etatDemo } from './demo'

// Meme forme que le profil de la version mobile (mobile/src/lib/auth.tsx) :
// les deux plateformes lisent la meme table `profils`.
export type Profil = {
  id: string
  pseudo: string
  nom?: string
  telephone: string | null
  bio: string
  avatar_url: string | null
}

// L'API identifie l'appelant par son jeton : il n'y a plus de session a
// porter. Cette forme reduite est conservee parce que les ecrans s'en
// servent comme temoin de connexion, et pour l'identifiant de l'auteur.
export type SessionLocale = { user: { id: string } }

type AuthContexte = {
  session: SessionLocale | null
  profil: Profil | null
  chargement: boolean
  inscrire: (telephone: string, motDePasse: string, pseudo: string) => Promise<void>
  connecter: (telephone: string, motDePasse: string) => Promise<void>
  deconnecter: () => Promise<void>
  rafraichirProfil: () => Promise<void>
  modifierProfil: (valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>) => Promise<void>
}

const Contexte = createContext<AuthContexte | null>(null)

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

export const FournisseurAuth = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionLocale | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(true)

  // Les ecrans encore decores par demo.ts lisent `etatDemo.pseudo` : il
  // doit suivre le profil reel tant qu'ils n'ont pas bascule sur l'API.
  const appliquer = (suivant: Profil | null) => {
    etatDemo.connecte = Boolean(suivant)
    etatDemo.pseudo = suivant?.pseudo ?? ''
    setProfil(suivant)
    setSession(suivant ? { user: { id: suivant.id } } : null)
  }

  useEffect(() => {
    // Un jeton conserve est suppose valable : seul /moi peut le confirmer.
    // S'il a expire, on le jette sans bruit et l'ecran de connexion s'ouvre.
    const jeton = lireJeton()
    if (!jeton) { setChargement(false); return }
    apiComptes.moi()
      .then(p => appliquer(versProfil(p)))
      .catch(() => poserJeton(null))
      .finally(() => setChargement(false))
  }, [])

  const ouvrirSession = (session: { jeton: string; profil: ProfilApi }) => {
    poserJeton(session.jeton)
    appliquer(versProfil(session.profil))
  }

  const inscrire = async (telephone: string, motDePasse: string, pseudo: string) => {
    ouvrirSession(await apiComptes.inscription(telephone, motDePasse, pseudo))
  }

  const connecter = async (telephone: string, motDePasse: string) => {
    ouvrirSession(await apiComptes.connexion(telephone, motDePasse))
  }

  const deconnecter = async () => {
    poserJeton(null)
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
    <Contexte.Provider
      value={{ session, profil, chargement, inscrire, connecter, deconnecter, rafraichirProfil, modifierProfil }}
    >
      {children}
    </Contexte.Provider>
  )
}

export const useAuth = () => {
  const c = useContext(Contexte)
  if (!c) throw new Error('useAuth doit être utilisé dans FournisseurAuth')
  return c
}
