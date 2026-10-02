// ============================================================
// Bande de recits, partagee par l'onglet Amis et la boite de
// reception. Les deux ecrans l'affichent a l'identique : la
// dupliquer les ferait deriver l'un de l'autre.
//
// Le fond differe toutefois : sombre sur le fil Amis, clair dans
// la boite de reception. La propriete `clair` bascule les teintes
// du liseret, du libelle et du contour de la pastille.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Text } from './Texte'
import { AjoutPersonne, PlusStory } from './Icones'
import { apiStories, televerser, type RecitApi } from '../lib/api'
import type { Story } from '../lib/demo'

// Bulle d'un recit reel : l'anneau d'accent signale qu'il y a quelque
// chose a regarder.
export function BulleRecit({ recit, clair = false, onOuvrir }: {
  recit: RecitApi
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
}) {
  return (
    <Pressable style={s.bulle} onPress={() => onOuvrir?.(recit.pseudo)}>
      <View style={s.anneau}>
        <View style={[s.anneauInterieur, clair && s.anneauInterieurClair]}>
          <View style={s.avatar}>
            <Text style={s.lettre}>{recit.pseudo.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <Text style={[s.libelle, clair && s.libelleClair]} numberOfLines={1}>
        {recit.moi ? 'Mon récit' : recit.pseudo}
      </Text>
    </Pressable>
  )
}

// Une bulle decorative : pas de recit reel derriere, donc pas d'anneau
// de couleur.
export function Bulle({ story, clair = false, onOuvrir }: {
  story: Story
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
}) {
  return (
    <Pressable style={s.bulle} onPress={() => onOuvrir?.(story.pseudo)}>
      <View style={[s.anneau, s.anneauSansRecit]}>
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
// qui invite a deposer un recit.
export function BulleCreer({ pseudo, clair = false, envoi = false, onPresser }: {
  pseudo: string
  clair?: boolean
  envoi?: boolean
  onPresser?: () => void
}) {
  return (
    <Pressable style={s.bulle} disabled={envoi} onPress={onPresser}>
      <View style={s.avatarSimple}>
        {envoi
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.lettre}>{pseudo.charAt(0).toUpperCase()}</Text>}
      </View>
      <View style={[s.pastillePlus, clair && s.pastillePlusClaire]}>
        <PlusStory taille={12} couleur="#fff" />
      </View>
      <Text style={[s.libelle, clair && s.libelleClair]} numberOfLines={1}>
        {envoi ? 'Envoi…' : 'Créer'}
      </Text>
    </Pressable>
  )
}

// La bande complete : « Créer », les recits reels, puis le decor local.
export default function BandeStories({
  pseudo, stories, clair = false, onOuvrir, onCreer,
}: {
  pseudo: string
  // Bulles decoratives locales, affichees apres les vrais recits.
  stories: Story[]
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
  onCreer?: () => void
}) {
  const [recits, setRecits] = useState<RecitApi[]>([])
  const [envoi, setEnvoi] = useState(false)

  const charger = () => {
    apiStories.liste()
      .then(setRecits)
      // Session absente ou reseau coupe : la bande garde son decor
      // local plutot que d'afficher une erreur.
      .catch(() => undefined)
  }

  useEffect(charger, [])

  // La video part vers le stockage, puis l'API ne recoit que son
  // adresse : les octets ne traversent pas le serveur.
  const publier = async () => {
    onCreer?.()
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Autorisation requise', 'Autorisez l’accès à vos vidéos.')
      return
    }
    const choix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 90,
      quality: 0.7,
    })
    if (choix.canceled || !choix.assets[0]) return

    setEnvoi(true)
    try {
      await apiStories.publier(await televerser(choix.assets[0].uri))
      charger()
    } catch (e) {
      Alert.alert('Récit non publié',
        e instanceof Error ? e.message : 'Publication impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={s.bande} contentContainerStyle={s.contenu}>
      <BulleCreer pseudo={pseudo} clair={clair} envoi={envoi}
        onPresser={() => void publier()} />
      {recits.map(r => (
        <BulleRecit key={r.id} recit={r} clair={clair} onOuvrir={onOuvrir} />
      ))}
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

  // Anneau d'accent de 2.5pt autour de l'avatar : il ne parait que sur
  // un compte portant un recit non expire.
  anneau: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5,
    borderColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  anneauSansRecit: { borderColor: 'rgba(255,255,255,.19)' },

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
    width: 23, height: 23, borderRadius: 12, backgroundColor: '#ff2856',
    borderWidth: 2, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center' },
  pastillePlusClaire: { borderColor: '#fff' },

  voileSuggestion: { position: 'absolute', top: 0, width: 76, height: 76,
    borderRadius: 38, backgroundColor: 'rgba(0,0,0,.52)',
    alignItems: 'center', justifyContent: 'center' },
})
