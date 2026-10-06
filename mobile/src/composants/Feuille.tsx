import React from 'react'
import {
  View, StyleSheet, Pressable, Modal, ScrollView,
} from 'react-native'
import { useWindowDimensions } from '../lib/ecran'
import { Text } from './Texte'
import { FeuilleCroix } from './Icones'
import { feuille as F } from '../lib/theme'

// Feuille qui remonte du bas de l'ecran, posee sur la page assombrie.
// Le titre est centre, la croix de fermeture a droite ; au-dessus, la
// zone grise renvoie vers la page et ferme la feuille.
export default function Feuille({
  visible, titre, onFermer, croixCerclee = true, fondGris = false, children,
}: {
  visible: boolean
  titre: string
  onFermer: () => void
  // La croix de « Ajouter un lien » est nue, celle des autres feuilles
  // est posee sur une pastille grise.
  croixCerclee?: boolean
  // « Partager sur » pose ses applications sur un fond gris clair.
  fondGris?: boolean
  children: React.ReactNode
}) {
  const { height } = useWindowDimensions()

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />
        <View style={[s.feuille, fondGris && s.feuilleGrise,
          { maxHeight: height * .72 }]}>
          <View style={s.entete}>
            <Text style={s.titre}>{titre}</Text>
            <Pressable style={s.fermer} hitSlop={10} onPress={onFermer}>
              <View style={croixCerclee ? s.croixRonde : undefined}>
                <FeuilleCroix taille={croixCerclee ? 17 : 21} couleur="#111" />
              </View>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={s.corps}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  feuilleGrise: { backgroundColor: '#f4f4f5' },

  entete: { minHeight: 54, justifyContent: 'center', paddingHorizontal: F.marge },
  titre: { color: '#111', fontSize: F.titre, fontWeight: '700', textAlign: 'center' },
  fermer: { position: 'absolute', right: F.marge, top: 0, bottom: 0,
    justifyContent: 'center' },
  croixRonde: { width: 27, height: 27, borderRadius: 13.5, backgroundColor: '#f1f1f2',
    alignItems: 'center', justifyContent: 'center' },

  corps: { paddingBottom: 30 },
})
