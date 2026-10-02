// ============================================================
// Ligne de compte avec son bouton d'abonnement.
//
// Partagee par la recherche, les listes d'abonnes/abonnements et les
// suggestions : ces quatre ecrans affichent la meme forme de compte,
// renvoyee telle quelle par l'API.
// ============================================================

import { useState } from 'react'
import { apiInteractions, type CompteApi } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function LigneCompte({ compte, onVisiter }: {
  compte: CompteApi
  onVisiter?: (pseudo: string) => void
}) {
  const { profil } = useAuth()
  const [suivi, setSuivi] = useState(compte.suivi)
  const [envoi, setEnvoi] = useState(false)

  // Son propre compte n'a pas de bouton : on ne s'abonne pas a soi-meme.
  const moi = profil?.pseudo === compte.pseudo

  // Abonnement optimiste : le bouton change tout de suite et revient en
  // arriere si le serveur refuse.
  const basculer = async () => {
    const vise = !suivi
    setSuivi(vise)
    setEnvoi(true)
    try {
      const r = vise
        ? await apiInteractions.suivre(compte.pseudo)
        : await apiInteractions.nePlusSuivre(compte.pseudo)
      setSuivi(r.suivi)
    } catch {
      setSuivi(!vise)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="resultat">
      <button
        className="compte-identite"
        onClick={() => onVisiter?.(compte.pseudo)}
      >
        <span className="avatar">
          {compte.avatar_url
            ? <img src={compte.avatar_url} alt="" />
            : compte.pseudo.charAt(0).toUpperCase()}
        </span>
        <span className="compte-textes">
          <span className="compte-pseudo">@{compte.pseudo}</span>
          <span className="compte-detail">
            {compte.nom ? `${compte.nom} · ` : ''}
            {compte.nbAbonnes} abonné{compte.nbAbonnes > 1 ? 's' : ''}
          </span>
        </span>
      </button>
      {profil && !moi && (
        <button
          className={`compte-suivre${suivi ? ' suivi' : ''}`}
          onClick={basculer}
          disabled={envoi}
        >
          {suivi ? 'Abonné' : 'Suivre'}
        </button>
      )}
    </div>
  )
}
