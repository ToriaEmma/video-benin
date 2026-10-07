// ============================================================
// Ligne de compte avec son bouton d'abonnement.
//
// Partagee par la recherche, les listes d'abonnes/abonnements et les
// suggestions : ces quatre ecrans affichent la meme forme de compte,
// renvoyee telle quelle par l'API.
//
// Portage de app/src/components/LigneCompte.tsx.
// ============================================================

import React, { useState } from 'react'
import { View, Image, StyleSheet, Pressable } from 'react-native'
import { Text } from './Texte'
import { apiInteractions, type CompteApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { montrerAvis } from '../lib/avis'

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
  const basculer = () => {
    const vise = !suivi
    setSuivi(vise)
    setEnvoi(true)
    const envoyer = vise
      ? apiInteractions.suivre(compte.pseudo)
      : apiInteractions.nePlusSuivre(compte.pseudo)
    envoyer
      .then(r => {
        setSuivi(r.suivi)
        montrerAvis(r.suivi ? `Vous êtes abonné(e) à ${compte.pseudo}` : `Vous n’êtes plus abonné(e) à ${compte.pseudo}`)
      })
      .catch(() => setSuivi(!vise))
      .finally(() => setEnvoi(false))
  }

  return (
    <View style={s.ligne}>
      <Pressable style={s.identite} onPress={() => onVisiter?.(compte.pseudo)}>
        <View style={s.avatar}>
          {compte.avatar_url ? (
            <Image source={{ uri: compte.avatar_url }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarLettre}>
              {compte.pseudo.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={s.textes}>
          <Text style={s.pseudo} numberOfLines={1}>@{compte.pseudo}</Text>
          <Text style={s.detail} numberOfLines={1}>
            {compte.nom ? `${compte.nom} · ` : ''}
            {compte.nbAbonnes} abonné{compte.nbAbonnes > 1 ? 's' : ''}
          </Text>
        </View>
      </Pressable>
      {!!profil && !moi && (
        <Pressable
          style={[s.bouton, suivi && s.boutonSuivi, envoi && s.boutonEnvoi]}
          onPress={basculer}
          disabled={envoi}
        >
          <Text style={[s.boutonTexte, suivi && s.boutonTexteSuivi]}>
            {suivi ? 'Abonné' : 'Suivre'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10 },
  identite: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#232323',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLettre: { color: '#fff', fontSize: 18, fontWeight: '700' },
  textes: { flex: 1, minWidth: 0 },
  pseudo: { color: '#fff', fontWeight: '600', fontSize: 14 },
  detail: { color: 'rgba(255,255,255,.62)', fontSize: 12, marginTop: 2 },

  bouton: { minHeight: 34, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  boutonSuivi: { backgroundColor: 'transparent', borderWidth: 1,
    borderColor: 'rgba(255,255,255,.22)' },
  boutonEnvoi: { opacity: 0.6 },
  boutonTexte: { color: '#fff', fontSize: 13, fontWeight: '600' },
  boutonTexteSuivi: { color: '#fff' },
})
