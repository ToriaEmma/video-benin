import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !cle) {
  throw new Error(
    "Configuration Supabase manquante : renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local",
  )
}

export const supabase = createClient(url, cle)

// Le compte se cree avec un numero de telephone, mais Supabase Auth attend un
// email. On fabrique donc une adresse technique a partir du numero : elle n'est
// jamais affichee ni utilisee pour ecrire a l'utilisateur, elle sert seulement
// de cle de connexion. Cela evite d'avoir a payer un service SMS pour la
// demonstration, tout en gardant le parcours prevu au cahier des charges.
export const emailDepuisTelephone = (telephone: string) =>
  `${telephone.replace(/\D/g, '')}@tiktok-benin.local`
