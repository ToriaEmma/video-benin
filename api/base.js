// ============================================================
// Acces a la base Neon.
//
// La chaine de connexion vit uniquement ici, cote serveur : elle
// ne doit jamais etre embarquee dans l'application mobile, ou elle
// serait extractible du paquet installe.
// ============================================================

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const chaine = process.env.DATABASE_URL

if (!chaine) {
  console.error(
    'DATABASE_URL manquant. Copiez api/.env.exemple vers api/.env et\n' +
    'collez-y la chaine de connexion du projet Neon.',
  )
  process.exit(1)
}

// `sql` s'utilise en gabarit : sql`SELECT ... WHERE id = ${valeur}`.
// Les valeurs interpolees sont transmises comme parametres, jamais
// concatenees : c'est ce qui ecarte les injections SQL.
export const sql = neon(chaine)
