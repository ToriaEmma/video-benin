import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, MODE_DEMO, emailDepuisTelephone } from './supabase'
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
const CLE_SESSION_DEMO = 'tiktik-session-demo-v1'

// Equivalent du localStorage de la version web : sans cette persistance, le
// mode demonstration redemanderait une connexion a chaque ouverture.
async function conserverDemo(profil: Profil | null) {
  try {
    if (profil) await AsyncStorage.setItem(CLE_SESSION_DEMO, JSON.stringify(profil))
    else await AsyncStorage.removeItem(CLE_SESSION_DEMO)
  } catch { /* La session courante reste utilisable si le stockage est bloque. */ }
}

export const FournisseurAuth = ({ children }: { children: React.ReactNode }) => {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(true)
  const [idSession, setIdSession] = useState<string | null>(null)

  const chargerProfil = async (id: string) => {
    const { data } = await supabase.from('profils').select('*').eq('id', id).single()
    setProfil(data as Profil | null)
  }

  useEffect(() => {
    if (MODE_DEMO) {
      AsyncStorage.getItem(CLE_SESSION_DEMO)
        .then(brut => {
          const sauvegarde = JSON.parse(brut || 'null')
          if (sauvegarde?.id === 'demo' && typeof sauvegarde.pseudo === 'string') {
            etat.connecte = true
            etat.pseudo = sauvegarde.pseudo
            setProfil(sauvegarde)
            setIdSession('demo')
          }
        })
        .catch(() => { /* Donnees absentes ou invalides : afficher la connexion. */ })
        .finally(() => setChargement(false))
      return
    }
    supabase.auth.getSession().then(async ({ data }: any) => {
      if (data.session) {
        setIdSession(data.session.user.id)
        await chargerProfil(data.session.user.id)
      }
      setChargement(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      setIdSession(s?.user.id ?? null)
      if (s) chargerProfil(s.user.id)
      else setProfil(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const inscrire = async (tel: string, mdp: string, pseudo: string) => {
    if (MODE_DEMO) {
      etat.connecte = true; etat.pseudo = pseudo
      const p: Profil = { id: 'demo', pseudo, telephone: tel, bio: '', avatar_url: null }
      setProfil(p); setIdSession('demo'); await conserverDemo(p)
      return
    }
    // Le pseudo est verifie AVANT la creation du compte : sans ce controle, un
    // compte auth serait cree puis l'insertion du profil echouerait sur la
    // contrainte d'unicite, laissant un compte orphelin impossible a reutiliser.
    const { data: existant } = await supabase.from('profils').select('id').eq('pseudo', pseudo).maybeSingle()
    if (existant) throw new Error('Ce pseudo est déjà pris')

    const { data, error } = await supabase.auth.signUp({ email: emailDepuisTelephone(tel), password: mdp })
    if (error) throw error
    if (!data.user) throw new Error("Le compte n'a pas pu être créé")

    const { error: e2 } = await supabase.from('profils').insert({ id: data.user.id, pseudo, telephone: tel })
    if (e2) throw e2
    await chargerProfil(data.user.id)
  }

  const connecter = async (tel: string, mdp: string) => {
    if (MODE_DEMO) {
      const pseudo = etat.pseudo || 'visiteur'
      etat.connecte = true; etat.pseudo = pseudo
      const p: Profil = { id: 'demo', pseudo, telephone: tel, bio: '', avatar_url: null }
      setProfil(p); setIdSession('demo'); await conserverDemo(p)
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailDepuisTelephone(tel), password: mdp,
    })
    if (error) throw new Error('Numéro ou mot de passe incorrect')
    await chargerProfil(data.user.id)
  }

  const deconnecter = async () => {
    if (MODE_DEMO) {
      etat.connecte = false
      await conserverDemo(null)
      setProfil(null); setIdSession(null)
      return
    }
    await supabase.auth.signOut()
    etat.connecte = false
    setProfil(null)
  }

  const rafraichirProfil = async () => {
    if (MODE_DEMO) return
    if (idSession) await chargerProfil(idSession)
  }

  const modifierProfil = async (
    valeurs: Partial<Pick<Profil, 'nom' | 'pseudo' | 'bio' | 'avatar_url'>>,
  ) => {
    if (!profil) return
    if (!MODE_DEMO) {
      const { error } = await supabase.from('profils').update(valeurs).eq('id', profil.id)
      if (error) throw error
    } else if (valeurs.pseudo) etat.pseudo = valeurs.pseudo
    const suivant = { ...profil, ...valeurs }
    setProfil(suivant)
    if (MODE_DEMO) await conserverDemo(suivant)
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
