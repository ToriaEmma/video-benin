// ============================================================
// Comptes a suivre proposes quand le fil « Suivis » est vide.
//
// Sans cela l'onglet est un cul-de-sac : il annonce qu'on ne suit
// personne sans donner le moyen d'y remedier.
// ============================================================

import { useEffect, useState } from 'react'
import { apiInteractions, type CompteApi } from '../lib/api'
import LigneCompte from './LigneCompte'

export default function Suggestions({ onVisiter }: {
  onVisiter?: (pseudo: string) => void
}) {
  const [comptes, setComptes] = useState<CompteApi[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let valable = true
    apiInteractions.suggestions({ limite: 10 })
      .then(c => { if (valable) setComptes(c) })
      .catch(() => { /* Suggestions indisponibles : le bloc reste absent. */ })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [])

  if (chargement || comptes.length === 0) return null

  return (
    <div className="suggestions">
      <h2 className="comptes-liste-titre">Comptes à suivre</h2>
      {comptes.map(c => (
        <LigneCompte key={c.id} compte={c} onVisiter={onVisiter} />
      ))}
    </div>
  )
}
