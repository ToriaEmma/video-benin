// ============================================================
// Bande de recits, partagee par l'onglet Amis et la boite de
// reception. Les deux ecrans l'affichent a l'identique : la
// dupliquer les ferait deriver l'un de l'autre.
//
// Le fond differe toutefois : sombre sur le fil Amis, clair dans
// la boite de reception. La propriete `clair` bascule les teintes
// du liseret, du libelle et du contour de la pastille.
// ============================================================

import React from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Text } from './Texte'
import { AjoutPersonne, PlusStory } from './Icones'
import type { Story } from '../lib/demo'

// Une bulle : l'anneau, l'avatar, et le libelle dessous.
export function Bulle({ story, clair = false, onOuvrir }: {
  story: Story
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
}) {
  return (
    <Pressable style={s.bulle} onPress={() => onOuvrir?.(story.pseudo)}>
      <View style={[s.anneau, story.vue && s.anneauVu]}>
        <View style={[s.anneauInterieur, clair && s.anneauInterieurClair]}>
          <View style={s.avatar}>
            <Text style={s.lettre}>
              {story.pseudo.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Compte propose : voile sombre et icone d'ajout, pour le
          distinguer d'un recit a regarder. */}
      {story.suggestion && (
        <View style={s.voileSuggestion}>
          <AjoutPersonne taille={26} couleur="#fff" />
        </View>
      )}

      <Text style={[s.libelle, clair && s.libelleClair]} numberOfLines={1}>
        {story.libelle ?? story.pseudo}
      </Text>
    </Pressable>
  )
}

// Premiere bulle : son propre compte, sans anneau, avec la pastille
// bleue qui invite a deposer un recit.
export function BulleCreer({ pseudo, clair = false, onPresser }: {
  pseudo: string
  clair?: boolean
  onPresser?: () => void
}) {
  return (
    <Pressable style={s.bulle} onPress={onPresser}>
      <View style={s.avatarSimple}>
        <Text style={s.lettre}>{pseudo.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={[s.pastillePlus, clair && s.pastillePlusClaire]}>
        <PlusStory taille={12} couleur="#fff" />
      </View>
      <Text style={[s.libelle, clair && s.libelleClair]} numberOfLines={1}>
        Créer
      </Text>
    </Pressable>
  )
}

// La bande complete : « Créer », puis les recits.
export default function BandeStories({
  pseudo, stories, clair = false, onOuvrir, onCreer,
}: {
  pseudo: string
  stories: Story[]
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
  onCreer?: () => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={s.bande} contentContainerStyle={s.contenu}>
      <BulleCreer pseudo={pseudo} clair={clair} onPresser={onCreer} />
      {stories.map(x => (
        <Bulle key={x.id} story={x} clair={clair} onOuvrir={onOuvrir} />
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  bande: { flexGrow: 0 },
  contenu: { gap: 14, paddingHorizontal: 16, paddingVertical: 6 },

  bulle: { width: 76, alignItems: 'center' },

  // Anneau cyan-vert de 2.5pt autour de l'avatar.
  anneau: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5,
    borderColor: '#3fd0e0', alignItems: 'center', justifyContent: 'center' },
  anneauVu: { borderColor: 'rgba(255,255,255,.26)' },

  // Fin liseret entre l'anneau et l'avatar, de la couleur du fond.
  anneauInterieur: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5,
    borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
  anneauInterieurClair: { borderColor: '#fff' },

  avatar: { width: 65, height: 65, borderRadius: 33,
    backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' },
  avatarSimple: { width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' },
  lettre: { color: '#fff', fontSize: 26, fontWeight: '700' },

  libelle: { color: '#fff', fontSize: 13, marginTop: 7, maxWidth: 76,
    textAlign: 'center' },
  libelleClair: { color: '#111' },

  pastillePlus: { position: 'absolute', right: 1, top: 54,
    width: 23, height: 23, borderRadius: 12, backgroundColor: '#1ec0f0',
    borderWidth: 2, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center' },
  pastillePlusClaire: { borderColor: '#fff' },

  voileSuggestion: { position: 'absolute', top: 0, width: 76, height: 76,
    borderRadius: 38, backgroundColor: 'rgba(0,0,0,.52)',
    alignItems: 'center', justifyContent: 'center' },
})
