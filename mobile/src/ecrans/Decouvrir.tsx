// ============================================================
// Portage de app/src/pages/Decouvrir.tsx : recherche de comptes
// et de videos, grille des videos populaires.
// ============================================================

import React, { useMemo, useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text, TextInput } from '../composants/Texte'
import { Loupe, Chevron, Lecture } from '../composants/Icones'
import { etat, comptesDemo, abreger, type Video } from '../lib/demo'

function Case({ item, largeur }: { item: Video; largeur: number }) {
  const lecteur = useVideoPlayer(item.url, p => { p.muted = true })
  return (
    <View style={[s.case, { width: largeur, height: largeur * 4 / 3 }]}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
      <View style={s.vues}>
        <Lecture taille={11} couleur="#fff" />
        <Text style={s.vuesTexte}>{abreger(item.vues)}</Text>
      </View>
    </View>
  )
}

export default function Decouvrir({ onVisiter }: {
  onVisiter?: (pseudo: string) => void
}) {
  const { width } = useWindowDimensions()
  const largeurCase = (width - 32 - 8) / 3
  const [terme, setTerme] = useState('')
  const [recherche, setRecherche] = useState(false)
  const [comptes, setComptes] = useState<typeof comptesDemo>([])
  const [videos, setVideos] = useState<Video[]>([])

  // Les plus vues en tete, comme la requete `order('vues')` du web.
  const populaires = useMemo(
    () => [...etat.videos].sort((a, b) => b.vues - a.vues), [])

  const chercher = () => {
    const q = terme.trim().toLowerCase()
    if (!q) return
    setRecherche(true)
    setComptes(comptesDemo.filter(c => c.pseudo.includes(q)))
    setVideos(etat.videos.filter(v => v.legende.toLowerCase().includes(q)))
  }

  const reinitialiser = () => {
    setTerme(''); setRecherche(false); setComptes([]); setVideos([])
  }

  // En recherche, la grille des videos trouvees ; sinon les populaires.
  const grille = recherche ? videos : populaires

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.recherche}>
        <TextInput style={s.saisie}
          placeholder="Rechercher un compte, une vidéo…"
          placeholderTextColor="rgba(255,255,255,.5)"
          value={terme} onChangeText={setTerme}
          returnKeyType="search" onSubmitEditing={chercher} />
        <Pressable style={s.loupe} onPress={chercher} hitSlop={8}>
          <Loupe taille={22} couleur="#00a550" />
        </Pressable>
      </View>

      <FlatList
        data={grille}
        keyExtractor={v => v.id}
        numColumns={3}
        contentContainerStyle={s.corps}
        ListHeaderComponent={
          <View>
            {recherche ? <>
              <Pressable style={s.retour} onPress={reinitialiser}>
                <Chevron taille={16} couleur="#00a550" />
                <Text style={s.retourTexte}>Retour aux tendances</Text>
              </Pressable>

              <Text style={s.section}>Comptes</Text>
              {comptes.length === 0
                ? <Text style={s.vide}>Aucun compte trouvé</Text>
                : comptes.map(c => (
                  <Pressable style={s.resultat} key={c.id}
                    onPress={() => onVisiter?.(c.pseudo)}>
                    <View style={s.avatar}>
                      <Text style={s.avatarLettre}>
                        {c.pseudo.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.resultatCorps}>
                      <Text style={s.resultatPseudo}>@{c.pseudo}</Text>
                      {!!c.bio && <Text style={s.resultatBio}>{c.bio}</Text>}
                    </View>
                  </Pressable>
                ))}

              <Text style={[s.section, s.sectionEspacee]}>Vidéos</Text>
              {videos.length === 0 && (
                <Text style={s.vide}>Aucune vidéo trouvée</Text>
              )}
            </> : <>
              <Text style={s.section}>Vidéos populaires</Text>
              {populaires.length === 0 && (
                <Text style={s.vide}>Aucune vidéo pour le moment</Text>
              )}
            </>}
          </View>
        }
        renderItem={({ item }) => <Case item={item} largeur={largeurCase} />}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },

  recherche: { flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161616', borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)', borderRadius: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 16,
    paddingLeft: 14 },
  saisie: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 13 },
  loupe: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },

  corps: { paddingHorizontal: 16, paddingBottom: 24 },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 16 },
  retourTexte: { color: '#00a550', fontSize: 14, fontWeight: '600' },

  section: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionEspacee: { marginTop: 24 },
  vide: { color: 'rgba(255,255,255,.62)', fontSize: 14, marginBottom: 8 },

  resultat: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#232323',
    alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultatCorps: { flex: 1 },
  resultatPseudo: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultatBio: { color: 'rgba(255,255,255,.62)', fontSize: 13, marginTop: 2 },

  case: { margin: 1, borderRadius: 4, backgroundColor: '#161616',
    overflow: 'hidden' },
  vues: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row',
    alignItems: 'center', gap: 4 },
  vuesTexte: { color: '#fff', fontSize: 11, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 3 },
})
