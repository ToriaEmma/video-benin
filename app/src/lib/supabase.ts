import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Mode demonstration : sans cles, l'application tourne sur des donnees fictives
// pour qu'on puisse voir l'interface. Des que .env.local est renseigne, le vrai
// client Supabase prend le relais sans aucune autre modification.
export const MODE_DEMO = !url || !cle

export const supabase = MODE_DEMO
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(url!, cle!)

export const emailDepuisTelephone = (telephone: string) =>
  `${telephone.replace(/\D/g, '')}@tiktok-benin.local`
