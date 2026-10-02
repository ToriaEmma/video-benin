import React, { useEffect, useRef, useState } from 'react'
import {
  View, Pressable, StyleSheet, Modal, ScrollView, useWindowDimensions,
  Animated, Easing,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg'
import { Text } from './Texte'
import { Chevron, Studio } from './Icones'

// Pourquoi chaque section reste vide : aucune n'a de route cote serveur.
// Le menu le dit section par section, plutot que d'annoncer une suite.
const RAISONS: Record<string, string> = {
  'Centre des activités': 'Tok 229 ne tient pas encore d’historique d’activité : il n’y a rien à afficher ici.',
  'Vidéos hors ligne': 'Le téléchargement des vidéos n’est pas encore en place : rien n’est gardé sur l’appareil.',
  'Ton code QR': 'La génération de code QR n’est pas encore en place.',
  'Ta musique': 'Tok 229 n’a pas encore de catalogue musical : aucun son ne peut être listé ici.',
  'Studio créateur': 'Le studio créateur n’est pas encore en place. Tu peux déjà gérer tes publications depuis les paramètres.',
}

const GROUPES = [
  { titre: 'Ressources', lignes: [{ nom: 'Solde', icone: 'solde' }] },
  { titre: 'Outils personnels', lignes: [
    { nom: 'Centre des activités', icone: 'activite' },
    { nom: 'Vidéos hors ligne', icone: 'telecharger' },
    { nom: 'Ton code QR', icone: 'qr' },
    { nom: 'Ta musique', icone: 'musique' },
  ] },
  { titre: 'Outils de création et professionnels', lignes: [{ nom: 'Studio créateur', icone: 'studio' }] },
  { titre: '', lignes: [{ nom: 'Paramètres et confidentialité', icone: 'parametres' }] },
]

// Les 6 traces du <Icone> de app/src/components/MenuProfil.tsx, a la lettre.
function Icone({ type }: { type: string }) {
  if (type === 'studio') return <Studio taille={23} couleur="#111" />
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#111"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {type === 'solde' && <>
        <Path d="M3 7V5l15-3v5" />
        <Rect x="2" y="7" width="20" height="15" rx="2" />
        <Circle cx="17" cy="14" r="1" fill="#111" />
      </>}
      {type === 'activite' && <>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 5v7l5 3" />
      </>}
      {type === 'telecharger' && <>
        <Path d="M6 20a5 5 0 0 1-2-9 6 6 0 0 1 11-5 5 5 0 0 1 6 6 4 4 0 0 1-2 8Z" />
        <Path d="M12 8v8m-4-4 4 4 4-4" />
      </>}
      {type === 'qr' && <>
        <Rect x="3" y="3" width="6" height="6" rx="1" />
        <Rect x="15" y="3" width="6" height="6" rx="1" />
        <Rect x="3" y="15" width="6" height="6" rx="1" />
        <Path d="M15 14h2v3h4v4h-3m-4 0v-2m7-6v1" />
      </>}
      {type === 'musique' && <>
        <Path d="M8 18V5l12-3v14M8 8l12-3" />
        <Ellipse cx="5" cy="19" rx="3" ry="2.5" fill="#111" />
        <Ellipse cx="17" cy="17" rx="3" ry="2.5" fill="#111" />
      </>}
      {type === 'parametres' && <>
        <Path d="m10 2-.7 2.3-2 .9-2.3-.7-2 3 1.5 1.9-.2 2.3L2 13l1 3.5 2.5.3 1.4 1.7.1 2.5 3.5 1 1.5-2 2.2-.3 2 1.5 3-2-.7-2.5 1-2 2-1V10l-2.3-.7-1-2 .8-2.3-3-2-2 1.5-2.2-.2L13 2Z" />
        <Circle cx="12" cy="12" r="5.5" />
      </>}
    </Svg>
  )
}

export default function MenuProfil({ onFermer, onDeconnecter, onSolde, onParametres }: {
  onFermer: () => void
  onDeconnecter: () => void
  onSolde?: () => void
  onParametres: () => void
}) {
  const [selection, setSelection] = useState<string | null>(null)
  const { width } = useWindowDimensions()
  const marges = useSafeAreaInsets()

  // `.menu-profil-panneau { inset: 0 0 0 15% }` : le panneau couvre 85 % de la
  // largeur et vient se coller a droite.
  const largeur = width * .85

  // `@keyframes menu-profil-entree` : le panneau glisse depuis la droite en
  // .25s. L'animation « slide » de Modal vient du bas, on anime donc nous-meme.
  const glissement = useRef(new Animated.Value(largeur)).current
  useEffect(() => {
    Animated.timing(glissement, {
      toValue: 0, duration: 250, easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [glissement])

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFermer}>
      <View style={s.plein}>
        <Pressable style={s.voile} onPress={onFermer} />
        <Animated.View style={[s.panneau, {
          width: largeur,
          paddingTop: 26 + marges.top,
          paddingBottom: 32 + marges.bottom,
          transform: [{ translateX: glissement }],
        }]}>
          {selection ? <>
            <Pressable style={s.retour} onPress={() => setSelection(null)}>
              <Chevron taille={22} couleur="#111" />
              <Text style={s.retourTexte}>Retour</Text>
            </Pressable>
            <Text style={s.titreSection}>{selection}</Text>
            {selection === 'Paramètres et confidentialité' ? (
              <Pressable onPress={onDeconnecter}>
                <Text style={s.deconnexion}>Se déconnecter</Text>
              </Pressable>
            ) : (
              <Text style={s.indisponible}>
                {RAISONS[selection] ?? 'Cette section n’est pas encore en place.'}
              </Text>
            )}
          </> : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {GROUPES.map((g, i) => (
                <View key={i} style={[
                  s.groupe,
                  i === 0 && s.groupePremier,
                  i === GROUPES.length - 1 && s.groupeDernier,
                ]}>
                  {!!g.titre && <Text style={s.groupeTitre}>{g.titre}</Text>}
                  {g.lignes.map(l => (
                    <Pressable key={l.nom} style={s.ligne}
                      onPress={() => l.nom === 'Solde' ? onSolde?.()
                        : l.nom === 'Paramètres et confidentialité' ? onParametres()
                        : setSelection(l.nom)}>
                      <Icone type={l.icone} />
                      <Text style={[
                        s.ligneTexte,
                        i === GROUPES.length - 1 && s.ligneTexteDernier,
                      ]} numberOfLines={1}>{l.nom}</Text>
                      <View style={s.chevron}>
                        <Chevron taille={18} couleur="#929292" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

// Valeurs reprises de .menu-profil-* dans app/src/pages/profil.css.
const s = StyleSheet.create({
  plein: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  voile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0007' },
  panneau: { backgroundColor: '#fff', paddingHorizontal: 24 },

  groupe: { borderBottomWidth: 1, borderBottomColor: '#dedede',
    paddingTop: 19, paddingBottom: 12 },
  groupePremier: { paddingTop: 0 },
  groupeDernier: { borderBottomWidth: 0, paddingTop: 7 },
  groupeTitre: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 9 },

  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  ligneTexte: { flex: 1, color: '#111', fontSize: 14, lineHeight: 18 },
  // `.menu-profil-groupe:last-child .menu-profil-ligne` retrecit le libelle
  // pour qu'il tienne sur une ligne.
  ligneTexteDernier: { fontSize: 13 },
  chevron: { transform: [{ rotate: '180deg' }] },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  retourTexte: { color: '#111', fontSize: 15 },
  titreSection: { color: '#111', fontSize: 18, fontWeight: '500', marginVertical: 22 },
  deconnexion: { color: '#ed2753', fontSize: 16, minHeight: 48, lineHeight: 48 },
  indisponible: { color: '#777', fontSize: 15, lineHeight: 22 },
})
