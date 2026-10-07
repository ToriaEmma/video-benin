import React, { useEffect, useRef, useState } from 'react'
import {
  View, FlatList, Pressable, StyleSheet, Modal, KeyboardAvoidingView,
  Platform, SafeAreaView, ActivityIndicator, Alert,
  type TextInput as SaisieNative
} from 'react-native'
import { useCadreFeuille } from '../lib/ecran'
import { Text, TextInput } from './Texte'
import { type Commentaire, type Video } from '../lib/demo'
import { apiCommentaires } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useExigerCompte } from '../lib/invite'
import {
  Croix, Tri, Envoyer, ImageCommentaire, Emoji, Mention,
} from './Icones'

// « à l'instant », « il y a 5 min », « il y a 2 h », « il y a 3 j » : repris
// de app/src/components/Commentaires.tsx. L'API fournit `horodatage` ; sans
// lui on retombe sur la date telle quelle.
export const depuis = (c: Commentaire) => {
  if (c.horodatage == null) return c.date
  const s = Math.floor((Date.now() - c.horodatage) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return `il y a ${Math.floor(s / 86400)} j`
}

export default function Commentaires({
  video, pseudo, onFermer, onVariation,
}: {
  video: Video; pseudo: string; onFermer: () => void
  // Signale a l'ecran appelant qu'un commentaire a ete ajoute (+1) ou
  // retire (-1) : son compteur suit sans recharger la video.
  onVariation?: (n: number) => void
}) {
  // Grand ecran : la feuille se cale sur la colonne (voir lib/ecran).
  const cadre = useCadreFeuille()
  const [texte, setTexte] = useState('')
  const [liste, setListe] = useState<Commentaire[]>([])
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  // Les plus recents d'abord par defaut ; le bouton de l'entete renverse.
  const [ancien, setAncien] = useState(false)
  // Message d'etat affiche sous la barre de saisie.
  const [message, setMessage] = useState('')
  const saisie = useRef<SaisieNative>(null)

  // Le serveur renvoie les commentaires du plus ancien au plus recent :
  // on renverse pour que la feuille ouvre sur les derniers ecrits.
  useEffect(() => {
    let valable = true
    apiCommentaires.liste(video.id)
      .then(c => { if (valable) { setListe([...c].reverse()); setMessage('') } })
      .catch((e: Error) => { if (valable) setMessage(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [video.id])

  // Un visiteur lit les commentaires ; pour ecrire, il se connecte.
  const { profil } = useAuth()
  const exiger = useExigerCompte()

  const envoyer = () => {
    const propre = texte.trim()
    if (!propre || envoi) return
    setEnvoi(true)
    apiCommentaires.ajouter(video.id, propre)
      .then(cree => {
        setListe(l => [cree, ...l])
        setTexte(''); setMessage('')
        onVariation?.(1)
      })
      .catch((e: Error) => setMessage(e.message))
      .finally(() => setEnvoi(false))
  }

  // L'API n'autorise la suppression qu'a l'auteur du commentaire et a
  // celui de la video : un refus remonte tel quel sous la saisie.
  const supprimer = (c: Commentaire) => {
    Alert.alert('Supprimer ce commentaire ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          apiCommentaires.supprimer(c.id)
            .then(() => {
              setListe(l => l.filter(x => x.id !== c.id))
              onVariation?.(-1)
            })
            .catch((e: Error) => setMessage(e.message))
        },
      },
    ])
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
        style={[s.feuille, cadre]}>
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
            ListEmptyComponent={chargement
              ? <View style={s.attente}><ActivityIndicator color="#fff" /></View>
              : <Text style={s.vide}>Aucun commentaire. Soyez le premier.</Text>}
            renderItem={({ item }) => (
              <Pressable style={s.commentaire} onLongPress={() => supprimer(item)}>
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
              </Pressable>
            )}
          />

          {!profil ? (
            <Pressable style={s.pied} onPress={() => exiger('commenter')} accessibilityRole="button">
              <Text style={[s.champ, s.champVisiteur]}>Connecte-toi pour commenter</Text>
            </Pressable>
          ) : <View style={s.pied}>
            <TextInput ref={saisie} style={s.champ} placeholder="Ajouter un commentaire…"
              placeholderTextColor="#777" value={texte} onChangeText={setTexte} maxLength={300} />
            {texte.trim() ? (
              <Pressable onPress={envoyer} hitSlop={8} disabled={envoi}
                accessibilityRole="button" accessibilityLabel="Envoyer">
                {envoi
                  ? <ActivityIndicator color="#ff2856" />
                  : <Envoyer taille={23} couleur="#ff2856" />}
              </Pressable>
            ) : (
              <View style={s.outils}>
                <Pressable hitSlop={6} accessibilityRole="button"
                  accessibilityLabel="Ajouter une image"
                  onPress={() => setMessage(
                    'Un commentaire ne peut contenir que du texte : TockTick n’héberge pas d’images de commentaires.')}>
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
          </View>}

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
  feuille: { width: '100%', maxWidth: 600, alignSelf: 'center', height: '72%', backgroundColor: '#161616', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.12)',
  },
  enteteGauche: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { color: '#fff', fontSize: 14, fontWeight: '600' },
  vide: { color: 'rgba(255,255,255,.6)', textAlign: 'center', marginTop: 28 },
  attente: { paddingTop: 28, alignItems: 'center' },
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
  champVisiteur: { color: '#9a9a9a', paddingVertical: 12 },
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
