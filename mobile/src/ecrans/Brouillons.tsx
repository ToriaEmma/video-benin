import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, ScrollView, useWindowDimensions, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import {
  Chevron, Calques, NoteEtiquette, EtincelleEtiquette,
} from '../composants/Icones'
import { etat, poidsLisible, jourEtMois, type Brouillon } from '../lib/demo'

// Filtres proposes sous le titre. Seul le premier est actif pour l'instant :
// les deux autres attendent les effets et les modeles.
const FILTRES = ['Trier par : taille du fichier', 'Effet utilisé', 'Modèle utilisé']

// Une case de la grille : l'apercu du brouillon, sa date, et selon le mode
// soit son poids, soit le rond de selection.
function Case({ item, largeur, selection, choisi, onPresser }: {
  item: Brouillon
  largeur: number
  selection: boolean
  choisi: boolean
  onPresser: () => void
}) {
  const lecteur = useVideoPlayer(item.url, p => { p.muted = true })
  const { jour, mois } = jourEtMois(item.date)

  return (
    <Pressable style={[s.case, { width: largeur, height: largeur * 4 / 3 }]}
      onPress={onPresser}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />

      {/* Hors selection, la date occupe le coin haut gauche. */}
      {!selection && (
        <View style={s.date}>
          <Text style={s.dateJour}>{jour}</Text>
          <Text style={s.dateMois}>{mois}</Text>
        </View>
      )}

      {/* En selection, un rond vide ou plein prend le coin haut droit. */}
      {selection && (
        <View style={[s.rond, choisi && s.rondChoisi]}>
          {choisi && <Text style={s.rondCoche}>✓</Text>}
        </View>
      )}

      {/* Hors selection, la pile de calques signale les brouillons
          a plusieurs clips ; en selection, le poids s'affiche. */}
      {!selection && (item.clips ?? 1) > 1 && (
        <View style={s.calques}><Calques taille={18} couleur="#fff" /></View>
      )}

      {selection
        ? <Text style={s.poids}>{poidsLisible(item.octets)}</Text>
        : !!item.etiquette && (
          <View style={s.etiquette}>
            {item.etiquette.type === 'son'
              ? <NoteEtiquette taille={13} couleur="#fff" />
              : <EtincelleEtiquette taille={13} couleur="#fff" />}
            <Text style={s.etiquetteTexte} numberOfLines={1}>
              {item.etiquette.nom}
            </Text>
          </View>
        )}
    </Pressable>
  )
}

export default function Brouillons({ onRetour, onPublier }: {
  onRetour: () => void
  // Reprend un brouillon pour le publier.
  onPublier: (b: Brouillon) => void
}) {
  const { width } = useWindowDimensions()
  const largeurCase = (width - 6) / 3
  const [selection, setSelection] = useState(false)
  const [choisis, setChoisis] = useState<string[]>([])
  // Force le reaffichage apres une suppression.
  const [, setRevision] = useState(0)

  const brouillons = etat.brouillons
  const poidsTotal = brouillons.reduce((t, b) => t + b.octets, 0)

  const quitterSelection = () => { setSelection(false); setChoisis([]) }

  const basculer = (id: string) => setChoisis(l =>
    l.includes(id) ? l.filter(x => x !== id) : [...l, id])

  const toutSelectionner = () => setChoisis(
    choisis.length === brouillons.length ? [] : brouillons.map(b => b.id))

  const supprimer = () => {
    if (choisis.length === 0) return
    Alert.alert(
      `Supprimer ${choisis.length} brouillon${choisis.length > 1 ? 's' : ''} ?`,
      undefined,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => {
            etat.brouillons = etat.brouillons.filter(b => !choisis.includes(b.id))
            quitterSelection(); setRevision(n => n + 1)
          },
        },
      ],
    )
  }

  // « Publier » reprend le premier brouillon retenu : l'ecran de publication
  // ne traite qu'une video a la fois.
  const publier = () => {
    const premier = brouillons.find(b => choisis.includes(b.id))
    if (premier) onPublier(premier)
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      {/* La barre du haut change selon le mode. */}
      <View style={s.barre}>
        {selection ? <>
          <Pressable hitSlop={10} onPress={toutSelectionner}>
            <Text style={s.barreTexte}>Tout sélectionner</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={quitterSelection}>
            <Text style={s.barreTexte}>Annuler</Text>
          </Pressable>
        </> : <>
          <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
            <Chevron taille={24} couleur="#111" />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => setSelection(true)}>
            <Text style={s.barreTexte}>Sélectionner</Text>
          </Pressable>
        </>}
      </View>

      <Text style={s.titre}>
        {brouillons.length} brouillon{brouillons.length > 1 ? 's' : ''}
        {' · '}{poidsLisible(poidsTotal)}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.bandeFiltres} contentContainerStyle={s.filtres}>
        {FILTRES.map(f => (
          <Pressable key={f} style={s.filtre}>
            <Text style={s.filtreTexte}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={brouillons}
        keyExtractor={b => b.id}
        numColumns={3}
        contentContainerStyle={s.grille}
        ListEmptyComponent={<Text style={s.vide}>Aucun brouillon</Text>}
        renderItem={({ item }) => (
          <Case item={item} largeur={largeurCase} selection={selection}
            choisi={choisis.includes(item.id)}
            onPresser={() => selection ? basculer(item.id) : onPublier(item)} />
        )}
      />

      {/* En selection, les deux actions occupent le pied de page. */}
      {selection && (
        <View style={s.pied}>
          <Pressable style={s.supprimer} onPress={supprimer}>
            <Text style={[s.supprimerTexte, choisis.length > 0 && s.actifSombre]}>
              Supprimer
            </Text>
          </Pressable>
          <Pressable style={[s.publier, choisis.length > 0 && s.publierActif]}
            onPress={publier}>
            <Text style={s.publierTexte}>Publier</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },

  barre: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, minHeight: 50 },
  retour: { width: 40, height: 44, justifyContent: 'center',
    marginLeft: -8 },
  barreTexte: { color: '#111', fontSize: 17, fontWeight: '400' },

  // « 12 brouillons · 87.5MB » : le gros titre de la page.
  titre: { color: '#111', fontSize: 23, fontWeight: '800',
    paddingHorizontal: 16, paddingTop: 26, paddingBottom: 14 },

  bandeFiltres: { flexGrow: 0, marginBottom: 10 },
  filtres: { gap: 9, paddingHorizontal: 16, alignItems: 'center' },
  filtre: { backgroundColor: '#f1f1f2', borderRadius: 10, height: 32,
    justifyContent: 'center', paddingHorizontal: 8 },
  filtreTexte: { color: '#111', fontSize: 14, lineHeight: 18 },

  grille: { paddingHorizontal: 0.5 },
  case: { margin: 1, borderRadius: 6, backgroundColor: '#eee',
    overflow: 'hidden' },

  // Pastille blanche de date, coin haut gauche.
  date: { position: 'absolute', left: 7, top: 7, backgroundColor: '#fff',
    borderRadius: 7, paddingVertical: 4, paddingHorizontal: 8,
    alignItems: 'center' },
  dateJour: { color: '#111', fontSize: 16, fontWeight: '800', lineHeight: 18 },
  dateMois: { color: '#111', fontSize: 12, lineHeight: 14 },

  // Rond de selection, coin haut droit.
  rond: { position: 'absolute', right: 8, top: 8, width: 24, height: 24,
    borderRadius: 12, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center' },
  rondChoisi: { backgroundColor: '#ff2856', borderColor: '#ff2856' },
  rondCoche: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 },

  calques: { position: 'absolute', right: 8, top: 8 },

  // Poids du fichier, centre en bas, en mode selection.
  poids: { position: 'absolute', left: 0, right: 0, bottom: 8, color: '#fff',
    fontSize: 13, fontWeight: '600', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 4 },

  // Etiquette de son ou d'effet, centree en bas.
  etiquette: { position: 'absolute', left: 8, right: 8, bottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: 'rgba(60,60,60,.72)', borderRadius: 14,
    paddingVertical: 6, paddingHorizontal: 9 },
  etiquetteTexte: { color: '#fff', fontSize: 12.5, fontWeight: '600',
    flexShrink: 1 },

  vide: { color: '#888', textAlign: 'center', padding: 40, fontSize: 14 },

  pied: { flexDirection: 'row', gap: 12, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 18 },
  supprimer: { flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f6f6f7', borderRadius: 24, minHeight: 48 },
  supprimerTexte: { color: '#b8b8bb', fontSize: 16, fontWeight: '600' },
  actifSombre: { color: '#111' },
  publier: { flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f7adbf', borderRadius: 24, minHeight: 48 },
  publierActif: { backgroundColor: '#ff2856' },
  publierTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
