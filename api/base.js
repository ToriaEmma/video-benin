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

// Sans chaine de connexion, on ne quitte pas le processus : en
// hebergement sans serveur, le module est charge a l'ouverture de la
// fonction, et en sortir ne rend qu'une panne opaque. On laisse donc
// `sql` lever a l'usage, avec un message qui dit quoi faire.
export const sql = chaine
  ? neon(chaine)
  : (() => {
      const absente = () => {
        throw new Error(
          'DATABASE_URL manquant : renseignez la variable d\'environnement '
          + 'avec la chaine de connexion du projet Neon, puis redeployez.',
        )
      }
      absente.query = absente
      return absente
    })()
