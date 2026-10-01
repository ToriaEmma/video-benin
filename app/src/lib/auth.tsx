import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, emailDepuisTelephone, MODE_DEMO } from './supabase'
import { etatDemo } from './demo'

export type Profil = {
  id: string
  pseudo: string
  nom?: string
  telephone: string | null
  bio: string
  avatar_url: string | null
}

type AuthContexte = {
  session: Session | null
  profil: Profil | null
  chargement: boolean
  inscrire: (telephone: string, motDePasse: string, pseudo: string) => Promise<void>
  connecter: (telephone: string, motDePasse: string) => Promise<void>
  deconnecter: () => Promise<void>
  rafraichirProfil: () => Promise<void>
  modifierProfil: (valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>) => Promise<void>
}

const Contexte = createContext<AuthContexte | null>(null)
const CLE_SESSION_DEMO = 'tiktik-session-demo-v1'
function conserverDemo(profil: Profil | null) {
  try {
    if (profil) localStorage.setItem(CLE_SESSION_DEMO, JSON.stringify(profil))
    else localStorage.removeItem(CLE_SESSION_DEMO)
  } catch { /* La session courante reste utilisable si le stockage est bloqué. */ }
}

export const FournisseurAuth = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(true)

  const chargerProfil = async (id: string) => {
    const { data } = await supabase.from('profils').select('*').eq('id', id).single()
    setProfil(data as Profil | null)
  }

  useEffect(() => {
    if (MODE_DEMO) {
      try {
        const sauvegarde = JSON.parse(localStorage.getItem(CLE_SESSION_DEMO) || 'null')
        if (sauvegarde?.id === 'demo' && typeof sauvegarde.pseudo === 'string') {
          etatDemo.connecte = true
          etatDemo.pseudo = sauvegarde.pseudo
          setProfil(sauvegarde)
          setSession({ user: { id: 'demo' } } as unknown as Session)
        }
      } catch { /* Données absentes ou invalides : afficher la connexion. */ }
      setChargement(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) chargerProfil(data.session.user.id).finally(() => setChargement(false))
      else setChargement(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) chargerProfil(s.user.id)
      else setProfil(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const inscrire = async (telephone: string, motDePasse: string, pseudo: string) => {
    if (MODE_DEMO) {
      etatDemo.connecte = true
      etatDemo.pseudo = pseudo
      setSession({ user: { id: 'demo' } } as unknown as Session)
      setProfil({ id: 'demo', pseudo, telephone, bio: '', avatar_url: null })
      conserverDemo({ id: 'demo', pseudo, telephone, bio: '', avatar_url: null })
      return
    }
    // Le pseudo est verifie AVANT la creation du compte : sans ce controle, un
    // compte auth serait cree puis l'insertion du profil echouerait sur la
    // contrainte d'unicite, laissant un compte orphelin impossible a reutiliser.
    const { data: existant } = await supabase
      .from('profils').select('id').eq('pseudo', pseudo).maybeSingle()
    if (existant) throw new Error('Ce pseudo est déjà pris')

    const { data, error } = await supabase.auth.signUp({
      email: emailDepuisTelephone(telephone),
      password: motDePasse,
    })
    if (error) throw error
    if (!data.user) throw new Error("Le compte n'a pas pu être créé")

    const { error: erreurProfil } = await supabase.from('profils').insert({
      id: data.user.id,
      pseudo,
      telephone,
    })
    if (erreurProfil) throw erreurProfil
    await chargerProfil(data.user.id)
  }

  const connecter = async (telephone: string, motDePasse: string) => {
    if (MODE_DEMO) {
      const pseudo = etatDemo.pseudo || 'visiteur'
      etatDemo.connecte = true
      etatDemo.pseudo = pseudo
      setSession({ user: { id: 'demo' } } as unknown as Session)
      setProfil({ id: 'demo', pseudo, telephone, bio: '', avatar_url: null })
      conserverDemo({ id: 'demo', pseudo, telephone, bio: '', avatar_url: null })
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDepuisTelephone(telephone),
      password: motDePasse,
    })
    if (error) throw new Error('Numéro ou mot de passe incorrect')
  }

  const deconnecter = async () => {
    if (MODE_DEMO) {
      etatDemo.connecte = false
      conserverDemo(null)
      setSession(null)
      setProfil(null)
      return
    }
    await supabase.auth.signOut()
    setProfil(null)
  }

  const rafraichirProfil = async () => {
    if (MODE_DEMO) return
    if (session) await chargerProfil(session.user.id)
  }

  const modifierProfil = async (valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>) => {
    if (!profil) return
    if (!MODE_DEMO) {
      const { error } = await supabase.from('profils').update(valeurs).eq('id', profil.id)
      if (error) throw error
    } else if (valeurs.pseudo) etatDemo.pseudo = valeurs.pseudo
    setProfil({ ...profil, ...valeurs })
    if (MODE_DEMO) conserverDemo({ ...profil, ...valeurs })
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
