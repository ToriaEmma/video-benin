import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, Modal, ScrollView, Image,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Text } from './Texte'
import Connexion from '../ecrans/Connexion'
import { Plus } from './Icones'

// Croix de fermeture (.comptes-fermer du web).
const Croix = ({ taille = 20 }: { taille?: number }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke="#111" strokeWidth={2} strokeLinecap="round">
    <Path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

// Coche du compte actif (.comptes-coche, rose).
const Coche = ({ taille = 27 }: { taille?: number }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke="#ff2856" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m4 13 6 7L21 4" />
  </Svg>
)

export default function ComptesProfil({ pseudo, avatar, onFermer }: {
  pseudo: string; avatar?: string | null; onFermer: () => void
}) {
  const [ajouter, setAjouter] = useState(false)

  return (
    <Modal transparent animationType="slide" onRequestClose={onFermer}>
      <View style={s.voileZone}>
        <Pressable style={s.voile} onPress={onFermer} />
        <View style={s.panneau}>
          <View style={s.entete}>
            <Text style={s.titre}>
              {ajouter ? 'Ajouter un compte' : 'Changer de compte'}
            </Text>
            <Pressable style={s.fermer} onPress={onFermer} hitSlop={10}>
              <Croix />
            </Pressable>
          </View>

          {ajouter ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Pressable style={s.retour} onPress={() => setAjouter(false)}>
                <Text style={s.retourTexte}>Retour aux comptes</Text>
              </Pressable>
              <Connexion onSucces={onFermer} />
            </ScrollView>
          ) : (
            <>
              <Pressable style={s.ligne} onPress={onFermer}>
                <View style={s.avatar}>
                  {avatar
                    ? <Image source={{ uri: avatar }} style={s.avatarImage} />
                    : <Text style={s.avatarLettre}>{pseudo.charAt(0).toUpperCase()}</Text>}
                </View>
                <Text style={s.pseudo} numberOfLines={1}>{pseudo}</Text>
                <Coche />
              </Pressable>

              <Pressable style={s.ligne} onPress={() => setAjouter(true)}>
                <View style={[s.avatar, s.avatarAjouter]}>
                  <Plus taille={24} couleur="#888" />
                </View>
                <Text style={s.pseudo}>Ajouter un compte</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

// Valeurs reprises de .comptes-* dans app/src/pages/profil.css.
const s = StyleSheet.create({
  voileZone: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  voile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  panneau: {
    backgroundColor: '#fff', borderTopLeftRadius: 15, borderTopRightRadius: 15,
    paddingTop: 14, paddingHorizontal: 16, paddingBottom: 28, maxHeight: '85%',
  },
  entete: { alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, minHeight: 30 },
  titre: { fontSize: 18, fontWeight: '600', color: '#111' },
  fermer: { position: 'absolute', right: -4, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center' },

  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 66, width: '100%' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eee',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarAjouter: { backgroundColor: '#f3f3f3' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLettre: { fontSize: 20, color: '#111' },
  pseudo: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111' },

  retour: { paddingVertical: 8 },
  retourTexte: { fontSize: 13, color: '#666' },
})
