import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const cle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Sans cles, l'application tourne sur des donnees de demonstration : on peut
// ainsi la montrer immediatement, et le vrai client prend le relais des que
// le fichier .env est renseigne.
export const MODE_DEMO = !url || !cle

export const supabase = MODE_DEMO
  ? (null as any)
  : createClient(url!, cle!, {
      auth: {
        // AsyncStorage conserve la session entre deux ouvertures de l'app :
        // sans lui, l'utilisateur serait deconnecte a chaque demarrage.
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })

export const emailDepuisTelephone = (telephone: string) =>
  `${telephone.replace(/\D/g, '')}@video-benin.local`
