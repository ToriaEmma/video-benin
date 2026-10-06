// ============================================================
// Onglet « Communauté » du fil : mosaique a deux colonnes sur fond
// blanc.
//
// La mosaique est faite de deux colonnes posees cote a cote dans un
// seul defilement, et non d'une liste a deux colonnes : celle-ci
// alignerait les cartes rangee par rangee, et le decalage qui fait
// toute la mosaique disparaitrait.
// ============================================================

import React, { useMemo } from 'react'
import {
  View, ScrollView, Pressable, StyleSheet,
} from 'react-native'
import { useWindowDimensions } from '../lib/ecran'
import { BARRE_ETAT_WEB } from '../lib/theme'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import {
  communauteDemo, etat, abreger, type EntreeCommunaute,
} from '../lib/demo'
import { Diaporama, LectureVignette, CoeurPetit } from '../composants/Icones'

// Ecart entre les deux colonnes et entre deux cartes d'une meme colonne.
const GOUTTIERE = 1.5
const INTERCARTE = 8
const MARGE = 1.5

// Hauteur de la vignette d'une entree. Le rapport vient des donnees, mais
// une entree qui n'en porterait pas retombe sur une valeur tiree de son
// identifiant : deux colonnes de vignettes identiques ne decaleraient pas.
function rapportDe(entree: EntreeCommunaute) {
  if (entree.rapport) return entree.rapport
  let somme = 0
  for (let i = 0; i < entree.id.length; i++) somme += entree.id.charCodeAt(i)
  return 1 + (somme % 50) / 100
}

function Vignette({ url, hauteur }: { url: string; hauteur: number }) {
  // La vignette est la premiere image de la video : le lecteur reste en
  // pause, seule sa premiere trame est montree.
  const lecteur = useVideoPlayer(url, p => { p.muted = true; p.pause() })
  return (
    <View style={[s.vignette, { height: hauteur }]}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
    </View>
  )
}

function Carte({ entree, largeur, onOuvrir }: {
  entree: EntreeCommunaute
  largeur: number
  onOuvrir: (videoId: string) => void
}) {
  const video = etat.videos.find(v => v.id === entree.videoId)
  const hauteur = Math.round(largeur * rapportDe(entree))
  const diaporama = (entree.nbPhotos ?? 0) > 1

  return (
    <Pressable style={[s.carte, { width: largeur }]}
      onPress={() => onOuvrir(entree.videoId)}>
      {video
        ? <Vignette url={video.url} hauteur={hauteur} />
        : <View style={[s.vignette, s.vignetteVide, { height: hauteur }]} />}

      {/* Pastille du coin : pile de carres pour un diaporama, triangle
          de lecture pour une video. */}
      <View style={s.pastille}>
        {diaporama
          ? <Diaporama taille={14} couleur="#fff" />
          : <LectureVignette taille={13} couleur="#fff" />}
        {diaporama && (
          <Text style={s.pastilleTexte}>{entree.nbPhotos}</Text>
        )}
      </View>

      <View style={s.corps}>
        <Text style={s.legende} numberOfLines={2}>{entree.legende}</Text>

        <View style={s.ligneAuteur}>
          <View style={s.avatar}>
            <Text style={s.avatarLettre}>
              {entree.pseudo.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={s.pseudo} numberOfLines={1}>{entree.pseudo}</Text>
          <View style={s.aime}>
            <CoeurPetit taille={13} couleur="#777" />
            <Text style={s.aimeTexte}>{abreger(entree.nbAime)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function Communaute({ onOuvrir }: {
  // Appelee avec l'identifiant de la video touchee : le fil bascule sur
  // « Pour toi » et s'y ouvre.
  onOuvrir: (videoId: string) => void
}) {
  const { width } = useWindowDimensions()
  const largeur = (width - MARGE * 2 - GOUTTIERE) / 2

  // Repartition en deux colonnes : chaque entree rejoint la colonne la
  // plus courte, ce qui garde les deux colonnes de hauteurs voisines
  // tout en les decalant l'une par rapport a l'autre.
  const colonnes = useMemo(() => {
    const gauche: EntreeCommunaute[] = []
    const droite: EntreeCommunaute[] = []
    let hGauche = 0
    let hDroite = 0
    for (const entree of communauteDemo) {
      // Vignette plus corps de carte : approximation suffisante pour
      // equilibrer les colonnes.
      const h = largeur * rapportDe(entree) + 78
      if (hGauche <= hDroite) { gauche.push(entree); hGauche += h }
      else { droite.push(entree); hDroite += h }
    }
    return { gauche, droite }
  }, [largeur])

  return (
    <ScrollView style={s.page} contentContainerStyle={s.contenu}
      showsVerticalScrollIndicator={false}>
      <View style={s.colonne}>
        {colonnes.gauche.map(e => (
          <Carte key={e.id} entree={e} largeur={largeur} onOuvrir={onOuvrir} />
        ))}
      </View>
      <View style={s.colonne}>
        {colonnes.droite.map(e => (
          <Carte key={e.id} entree={e} largeur={largeur} onOuvrir={onOuvrir} />
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  // Le haut laisse passer la barre des categories, qui se superpose.
  contenu: {
    flexDirection: 'row', gap: GOUTTIERE,
    paddingHorizontal: MARGE, paddingTop: 108 - BARRE_ETAT_WEB, paddingBottom: 24,
  },
  colonne: { flex: 1, gap: INTERCARTE },

  carte: { backgroundColor: '#fff', borderRadius: 10 },
  vignette: {
    width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10,
    backgroundColor: '#e9e9ec', overflow: 'hidden',
  },
  vignetteVide: { backgroundColor: '#dcdce0' },

  // Pastille du coin haut droit de la vignette.
  pastille: {
    position: 'absolute', top: 7, right: 7,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 3, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,.35)',
  },
  pastilleTexte: { color: '#fff', fontSize: 11, fontWeight: '600' },

  corps: { paddingTop: 7, paddingHorizontal: 6, paddingBottom: 4 },
  legende: { color: '#111', fontSize: 14, lineHeight: 18 },

  ligneAuteur: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7,
  },
  avatar: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#b9b9c0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLettre: { color: '#fff', fontSize: 10, fontWeight: '700' },
  pseudo: { flex: 1, color: '#444', fontSize: 12.5 },
  aime: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  aimeTexte: { color: '#444', fontSize: 12.5 },
})
