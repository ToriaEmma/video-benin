import React, { useRef, useState } from 'react'
import {
  View, FlatList, Pressable, StyleSheet, Modal, KeyboardAvoidingView,
  Platform, SafeAreaView, type TextInput as SaisieNative
} from 'react-native'
import { Text, TextInput } from './Texte'
import { etat, type Commentaire, type Video } from '../lib/demo'
import {
  Croix, Tri, Envoyer, ImageCommentaire, Emoji, Mention,
} from './Icones'

// « à l'instant », « il y a 5 min », « il y a 2 h », « il y a 3 j » : repris
// de app/src/components/Commentaires.tsx. Sans horodatage, on retombe sur la
// chaine deja ecrite dans les donnees de demonstration.
export const depuis = (c: Commentaire) => {
  if (c.horodatage == null) return c.date
  const s = Math.floor((Date.now() - c.horodatage) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return `il y a ${Math.floor(s / 86400)} j`
}

export default function Commentaires({ video, pseudo, onFermer }: {
  video: Video; pseudo: string; onFermer: () => void
}) {
  const [texte, setTexte] = useState('')
  const [liste, setListe] = useState(
    etat.commentaires.filter(c => c.videoId === video.id),
  )
  // Les plus recents d'abord par defaut ; le bouton de l'entete renverse.
  const [ancien, setAncien] = useState(false)
  // Message d'etat affiche sous la barre de saisie.
  const [message, setMessage] = useState('')
  const saisie = useRef<SaisieNative>(null)

  const envoyer = () => {
    if (!texte.trim()) return
    const nouveau = {
      id: `c${Date.now()}`, videoId: video.id,
      texte: texte.trim(), pseudo, date: "à l'instant",
      horodatage: Date.now(),
    }
    etat.commentaires.unshift(nouveau)
    video.nbCommentaires += 1
    setListe([nouveau, ...liste])
    setTexte('')
  }

  // « Répondre » prefixe la saisie d'une mention de l'auteur.
  const repondre = (aqui: string) => {
    setTexte(`@${aqui} `)
    saisie.current?.focus()
  }

  const affichee = ancien ? [...liste].reverse() : liste

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onFermer}>
      <Pressable style={s.voile} onPress={onFermer} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.feuille}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.entete}>
            <View style={s.enteteGauche}>
              <Text style={s.titre}>
                {liste.length} commentaire{liste.length > 1 ? 's' : ''}
              </Text>
              <Pressable hitSlop={10} onPress={() => setAncien(!ancien)}
                accessibilityRole="button"
                accessibilityLabel={ancien
                  ? 'Afficher les plus récents'
                  : 'Afficher les plus anciens'}>
                <Tri taille={16} couleur="rgba(255,255,255,.6)" />
              </Pressable>
            </View>
            <Pressable onPress={onFermer} hitSlop={12}><Croix taille={20} /></Pressable>
          </View>

          <FlatList
            data={affichee}
            keyExtractor={c => c.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={s.vide}>Aucun commentaire. Soyez le premier.</Text>}
            renderItem={({ item }) => (
              <View style={s.commentaire}>
                <View style={s.avatar}>
                  <Text style={s.avatarLettre}>{item.pseudo.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.auteur}>@{item.pseudo}</Text>
                  <Text style={s.texte}>{item.texte}</Text>
                  <View style={s.meta}>
                    <Text style={s.date}>{depuis(item)}</Text>
                    <Pressable hitSlop={8} onPress={() => repondre(item.pseudo)}>
                      <Text style={s.repondre}>Répondre</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={s.pied}>
            <TextInput ref={saisie} style={s.champ} placeholder="Ajouter un commentaire…"
              placeholderTextColor="#777" value={texte} onChangeText={setTexte} maxLength={300} />
            {texte.trim() ? (
              <Pressable onPress={envoyer} hitSlop={8} accessibilityRole="button"
                accessibilityLabel="Envoyer">
                <Envoyer taille={23} couleur="#00a550" />
              </Pressable>
            ) : (
              <View style={s.outils}>
                <Pressable hitSlop={6} accessibilityRole="button"
                  accessibilityLabel="Ajouter une image"
                  onPress={() => setMessage(
                    'Les images dans les commentaires seront disponibles prochainement.')}>
                  <ImageCommentaire taille={23} couleur="rgba(255,255,255,.72)" />
                </Pressable>
                <Pressable hitSlop={6} accessibilityRole="button"
                  accessibilityLabel="Insérer un emoji"
                  onPress={() => { setTexte(t => `${t}😊`); saisie.current?.focus() }}>
                  <Emoji taille={24} couleur="rgba(255,255,255,.72)" />
                </Pressable>
                <Pressable hitSlop={6} accessibilityRole="button"
                  accessibilityLabel="Mentionner"
                  onPress={() => { setTexte('@'); saisie.current?.focus() }}>
                  <Mention taille={25} couleur="rgba(255,255,255,.72)" />
                </Pressable>
              </View>
            )}
          </View>

          {message !== '' && (
            <Pressable onPress={() => setMessage('')}>
              <Text style={s.message}>{message}</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  voile: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)' },
  feuille: { height: '72%', backgroundColor: '#161616', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.12)',
  },
  enteteGauche: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { color: '#fff', fontSize: 14, fontWeight: '600' },
  vide: { color: 'rgba(255,255,255,.6)', textAlign: 'center', marginTop: 28 },
  commentaire: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#232323',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLettre: { color: '#fff', fontSize: 13, fontWeight: '700' },
  auteur: { color: 'rgba(255,255,255,.6)', fontSize: 13, marginBottom: 2 },
  texte: { color: '#fff', fontSize: 14, lineHeight: 19 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 5 },
  date: { color: 'rgba(255,255,255,.45)', fontSize: 12 },
  repondre: { color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: '600' },
  pied: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)',
  },
  champ: {
    flex: 1, backgroundColor: '#232323', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 16,
  },
  outils: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  message: {
    color: 'rgba(255,255,255,.7)', fontSize: 13, textAlign: 'center',
    paddingHorizontal: 16, paddingBottom: 12, lineHeight: 18,
  },
})
