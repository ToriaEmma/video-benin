// ============================================================
// Liste des abonnes ou des abonnements d'un profil, ouverte depuis les
// compteurs « Suivis » et « Followers ».
//
// Portage de app/src/components/ListeComptes.tsx.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator,
} from 'react-native'
import { useWindowDimensions } from '../lib/ecran'
import { Text } from './Texte'
import { FeuilleCroix } from './Icones'
import LigneCompte from './LigneCompte'
import { apiInteractions, type CompteApi } from '../lib/api'

export type SensListe = 'abonnes' | 'abonnements'

export default function ListeComptes({ pseudo, sens, onFermer, onVisiter }: {
  pseudo: string
  sens: SensListe
  onFermer: () => void
  onVisiter?: (pseudo: string) => void
}) {
  const { height } = useWindowDimensions()
  const [comptes, setComptes] = useState<CompteApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let valable = true
    const demande = sens === 'abonnes'
      ? apiInteractions.abonnes(pseudo, { limite: 50 })
      : apiInteractions.abonnements(pseudo, { limite: 50 })
    demande
      .then(c => { if (valable) setComptes(c) })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [pseudo, sens])

  const titre = sens === 'abonnes' ? 'Followers' : 'Suivis'
  const vide = sens === 'abonnes'
    ? 'Personne ne suit encore ce compte.'
    : 'Ce compte ne suit encore personne.'

  return (
    <Modal visible transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />
        <View style={[s.feuille, { maxHeight: height * .72 }]}>
          <View style={s.entete}>
            <Text style={s.titre}>{titre}</Text>
            <Pressable style={s.fermer} hitSlop={10} onPress={onFermer}>
              <FeuilleCroix taille={19} couleur="#fff" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.corps}
            showsVerticalScrollIndicator={false}>
            {chargement ? (
              <ActivityIndicator color="#fff" />
            ) : erreur ? (
              <Text style={s.etat}>{erreur}</Text>
            ) : comptes.length === 0 ? (
              <Text style={s.etat}>{vide}</Text>
            ) : (
              comptes.map(c => (
                <LigneCompte key={c.id} compte={c}
                  onVisiter={p => { onFermer(); onVisiter?.(p) }} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#161616', borderTopLeftRadius: 16,
    borderTopRightRadius: 16 },

  entete: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 16 },
  titre: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  fermer: { position: 'absolute', right: 16, top: 0, bottom: 0,
    justifyContent: 'center' },

  corps: { paddingHorizontal: 16, paddingBottom: 28 },
  etat: { color: 'rgba(255,255,255,.62)', fontSize: 13, paddingVertical: 10 },
})
