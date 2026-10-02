// ============================================================
// Recherche de l'onglet « Amis » : recherche de comptes et de
// videos, grille des videos populaires.
//
// Portage de app/src/pages/Decouvrir.tsx. L'ecran est ouvert par la
// loupe de l'entete de Amis.tsx ; une case de la grille ouvre la
// video dans le lecteur, via `onOuvrirVideo`.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text, TextInput } from '../composants/Texte'
import { Loupe, Chevron, Lecture } from '../composants/Icones'
import LigneCompte from '../composants/LigneCompte'
import { abreger, type Video } from '../lib/demo'
import {
  apiRecherche, apiVideos, type CompteApi, type VideoApi,
} from '../lib/api'

function Case({ item, largeur, onOuvrir }: {
  item: Video; largeur: number; onOuvrir?: () => void
}) {
  const lecteur = useVideoPlayer(item.url, p => { p.muted = true })
  return (
    <Pressable style={[s.case, { width: largeur, height: largeur * 4 / 3 }]}
      onPress={onOuvrir}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
      <View style={s.vues}>
        <Lecture taille={11} couleur="#fff" />
        <Text style={s.vuesTexte}>{abreger(item.vues)}</Text>
      </View>
    </Pressable>
  )
}

export default function Decouvrir({ onVisiter, onOuvrirVideo }: {
  onVisiter?: (pseudo: string) => void
  // Ouvre le lecteur plein ecran sur la case touchee, dans la liste
  // affichee par la grille.
  onOuvrirVideo?: (videos: Video[], index: number) => void
}) {
  const { width } = useWindowDimensions()
  const largeurCase = (width - 32 - 8) / 3
  const [terme, setTerme] = useState('')
  const [recherche, setRecherche] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [comptes, setComptes] = useState<CompteApi[]>([])
  const [videos, setVideos] = useState<VideoApi[]>([])
  const [populaires, setPopulaires] = useState<VideoApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  // L'API n'expose pas de classement : les plus vues passent en tete ici
  // meme, ce qui suffit au volume d'un ecran.
  useEffect(() => {
    let valable = true
    apiVideos.liste({ limite: 50 })
      .then(v => {
        if (valable) setPopulaires([...v].sort((a, b) => b.vues - a.vues))
      })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [])

  // Comptes et videos arrivent d'un seul appel : le serveur compare le
  // fragment au pseudo, au nom et aux legendes.
  const chercher = useCallback(() => {
    const q = terme.trim()
    if (!q) return
    setRecherche(true)
    setEnCours(true)
    setErreur('')
    apiRecherche.tout(q)
      .then(r => { setComptes(r.comptes); setVideos(r.videos) })
      .catch((e: Error) => {
        setComptes([]); setVideos([]); setErreur(e.message)
      })
      .finally(() => setEnCours(false))
  }, [terme])

  const reinitialiser = () => {
    setTerme(''); setRecherche(false); setComptes([]); setVideos([])
    setErreur('')
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
          <Loupe taille={22} couleur="#ff2856" />
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
                <Chevron taille={16} couleur="#ff2856" />
                <Text style={s.retourTexte}>Retour aux tendances</Text>
              </Pressable>

              {!!erreur && <Text style={s.vide}>{erreur}</Text>}

              <Text style={s.section}>Comptes</Text>
              {enCours
                ? <Text style={s.vide}>Recherche…</Text>
                : comptes.length === 0
                  ? <Text style={s.vide}>Aucun compte ne correspond</Text>
                  : comptes.map(c => (
                    <LigneCompte key={c.id} compte={c} onVisiter={onVisiter} />
                  ))}

              <Text style={[s.section, s.sectionEspacee]}>Vidéos</Text>
              {!enCours && videos.length === 0 && (
                <Text style={s.vide}>Aucune vidéo trouvée</Text>
              )}
            </> : <>
              <Text style={s.section}>Vidéos populaires</Text>
              {chargement && <ActivityIndicator color="#fff" />}
              {!chargement && !!erreur && <Text style={s.vide}>{erreur}</Text>}
              {!chargement && !erreur && populaires.length === 0 && (
                <Text style={s.vide}>Aucune vidéo pour le moment</Text>
              )}
            </>}
          </View>
        }
        renderItem={({ item, index }) => (
          <Case item={item} largeur={largeurCase}
            onOuvrir={() => onOuvrirVideo?.(grille, index)} />
        )}
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
  retourTexte: { color: '#ff2856', fontSize: 14, fontWeight: '600' },

  section: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  sectionEspacee: { marginTop: 24 },
  vide: { color: 'rgba(255,255,255,.62)', fontSize: 13, marginBottom: 8 },

  case: { margin: 1, borderRadius: 4, backgroundColor: '#161616',
    overflow: 'hidden' },
  vues: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row',
    alignItems: 'center', gap: 4 },
  vuesTexte: { color: '#fff', fontSize: 11, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 3 },
})
