// ============================================================
// Comptes a suivre proposes quand le fil « Suivis » est vide.
//
// Sans cela l'onglet est un cul-de-sac : il annonce qu'on ne suit
// personne sans donner le moyen d'y remedier.
//
// Portage de app/src/components/Suggestions.tsx.
// ============================================================

import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from './Texte'
import LigneCompte from './LigneCompte'
import { apiInteractions, type CompteApi } from '../lib/api'

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
    <View style={s.bloc}>
      <Text style={s.titre}>Comptes à suivre</Text>
      {comptes.map(c => (
        <LigneCompte key={c.id} compte={c} onVisiter={onVisiter} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  bloc: { width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: 10 },
  titre: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
})
