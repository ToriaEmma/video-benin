// ============================================================
// Feuille « Ajouter un son » : elle s'ouvre a mi-hauteur et
// se deploie quand on tire la poignee vers le haut.
// ============================================================

import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, Modal, Animated, PanResponder,
  useWindowDimensions, ScrollView,
} from 'react-native'
import { useAudioPlayer } from 'expo-audio'
import { Text } from '../composants/Texte'
import {
  Loupe, Egaliseur, Ciseaux, MarquePage,
} from '../composants/Icones'
import {
  SONS, parPopularite, abregerPublications, dureeLisible, type Son,
} from '../lib/sons'

const ONGLETS = ['Populaire', 'Pour toi', 'Favoris', 'Récents']

// Une ligne de son : pochette, titre, auteur et compteurs.
function Ligne({ son, choisi, rang, favori, onChoisir, onFavori }: {
  son: Son
  choisi: boolean
  // Numero affiche dans l'onglet « Populaire ».
  rang?: number
  favori: boolean
  onChoisir: () => void
  onFavori: () => void
}) {
  return (
    <Pressable style={[s.ligne, choisi && s.ligneChoisie]} onPress={onChoisir}>
      {rang != null && <Text style={s.rang}>{rang}</Text>}

      <View style={[s.pochette, { backgroundColor: son.couleur },
        choisi && s.pochetteChoisie]}>
        <Text style={s.pochetteLettre}>{son.titre.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={s.ligneCorps}>
        <View style={s.ligneTitreGroupe}>
          {choisi && <Egaliseur taille={15} />}
          <Text style={[s.titre, choisi && s.titreChoisi]} numberOfLines={1}>
            {son.titre}
          </Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {son.artiste} · {abregerPublications(son.publications)} publications
          {' · '}{dureeLisible(son.duree)}
        </Text>
        {choisi && <Text style={s.licence}>{son.licence}</Text>}
      </View>

      {/* Les deux actions n'apparaissent que sur le son retenu. */}
      {choisi && <View style={s.actions}>
        <Pressable hitSlop={8}><Ciseaux taille={23} couleur="#111" /></Pressable>
        <Pressable hitSlop={8} onPress={onFavori}>
          <MarquePage taille={23} couleur="#111" plein={favori} />
        </Pressable>
      </View>}
    </Pressable>
  )
}

export default function ChoixSon({ visible, onFermer, onChoisir }: {
  visible: boolean
  onFermer: () => void
  onChoisir: (son: Son | null) => void
}) {
  const { height } = useWindowDimensions()
  // Deux crans : la feuille s'arrete d'abord a mi-hauteur, puis se
  // deploie quand on tire la poignee.
  const HAUT_BAS = Math.round(height * .46)
  const HAUT_HAUT = Math.round(height * .82)

  const [deploye, setDeploye] = useState(false)
  // Hauteur animee et reponse au glissement, creees une seule fois :
  // elles ne dependent que de HAUT_BAS et HAUT_HAUT, qui ne bougent pas.
  const [{ hauteur, poignee }] = useState(() => {
    const valeur = new Animated.Value(HAUT_BAS)
    const vers = (deplie: boolean) => {
      setDeploye(deplie)
      Animated.spring(valeur, {
        toValue: deplie ? HAUT_HAUT : HAUT_BAS,
        useNativeDriver: false, bounciness: 2,
      }).start()
    }
    return {
      hauteur: valeur,
      vers,
      // Vers le haut la feuille se deploie, vers le bas elle se replie.
      poignee: PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderRelease: (_, g) => {
          if (g.dy < -30) vers(true)
          else if (g.dy > 30) vers(false)
        },
      }),
    }
  })

  const glisser = (vers: boolean) => {
    setDeploye(vers)
    Animated.spring(hauteur, {
      toValue: vers ? HAUT_HAUT : HAUT_BAS,
      useNativeDriver: false, bounciness: 2,
    }).start()
  }

  const [onglet, setOnglet] = useState('Pour toi')
  const [zone, setZone] = useState<'Bénin' | 'Mondial'>('Bénin')
  const [choisi, setChoisi] = useState<string | null>(SONS[0].id)
  const [favoris, setFavoris] = useState<string[]>([])

  // Le son retenu se joue en boucle, comme sur la plateforme.
  const son = SONS.find(x => x.id === choisi)
  const lecteur = useAudioPlayer(son ? { uri: son.url } : null)

  const retenir = (x: Son) => {
    if (choisi === x.id) {
      // Second appui : on valide et on referme.
      onChoisir(x); onFermer(); return
    }
    setChoisi(x.id)
    try { lecteur.play() } catch { /* Son illisible : silence. */ }
  }

  const basculerFavori = (id: string) => setFavoris(l =>
    l.includes(id) ? l.filter(x => x !== id) : [...l, id])

  // Chaque onglet trie la meme bibliotheque differemment.
  const liste = onglet === 'Populaire' ? parPopularite(SONS)
    : onglet === 'Favoris' ? SONS.filter(x => favoris.includes(x.id))
    : onglet === 'Récents' ? [...SONS].reverse()
    : SONS

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />

        <Animated.View style={[s.feuille, { height: hauteur }]}>
          {/* Poignee : glisser pour deployer ou replier */}
          <View {...poignee.panHandlers} style={s.poigneeZone}>
            <Pressable onPress={() => glisser(!deploye)} hitSlop={10}>
              <View style={s.poignee} />
            </Pressable>
          </View>

          <View style={s.onglets}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.ongletsListe}>
              {ONGLETS.map(t => (
                <Pressable key={t} onPress={() => setOnglet(t)} style={s.onglet}>
                  <Text style={[s.ongletTexte, onglet === t && s.ongletActif]}>
                    {t}
                  </Text>
                  {onglet === t && <View style={s.soulignement} />}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.loupe} hitSlop={8}>
              <Loupe taille={24} couleur="#111" />
            </Pressable>
          </View>

          {/* « Populaire » ajoute le choix du territoire */}
          {onglet === 'Populaire' && (
            <View style={s.zones}>
              {(['Bénin', 'Mondial'] as const).map(z => (
                <Pressable key={z} onPress={() => setZone(z)}
                  style={[s.zone, zone === z && s.zoneActive]}>
                  <Text style={[s.zoneTexte, zone === z && s.zoneTexteActif]}>
                    {z}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <FlatList
            data={liste}
            keyExtractor={x => x.id}
            contentContainerStyle={s.liste}
            ListEmptyComponent={
              <Text style={s.vide}>
                {onglet === 'Favoris'
                  ? 'Aucun son enregistré'
                  : 'Aucun son pour le moment'}
              </Text>
            }
            renderItem={({ item, index }) => (
              <Ligne son={item} choisi={choisi === item.id}
                rang={onglet === 'Populaire' ? index + 1 : undefined}
                favori={favoris.includes(item.id)}
                onChoisir={() => retenir(item)}
                onFavori={() => basculerFavori(item.id)} />
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 16,
    borderTopRightRadius: 16, overflow: 'hidden' },

  poigneeZone: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  poignee: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#d2d2d4' },

  onglets: { flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#ececec' },
  ongletsListe: { gap: 22, paddingHorizontal: 16 },
  onglet: { paddingVertical: 12 },
  ongletTexte: { fontSize: 15.5, color: '#9a9a9c', fontWeight: '600' },
  ongletActif: { color: '#111' },
  soulignement: { height: 2.5, backgroundColor: '#111', borderRadius: 2,
    marginTop: 7 },
  loupe: { paddingHorizontal: 16, paddingVertical: 12 },

  zones: { flexDirection: 'row', gap: 9, paddingHorizontal: 16,
    paddingTop: 14, paddingBottom: 4 },
  zone: { backgroundColor: '#f1f1f2', borderRadius: 18, height: 34,
    justifyContent: 'center', paddingHorizontal: 18 },
  zoneActive: { backgroundColor: '#111' },
  zoneTexte: { fontSize: 14.5, color: '#111', fontWeight: '600' },
  zoneTexteActif: { color: '#fff' },

  liste: { paddingBottom: 24 },
  vide: { color: '#9a9a9c', fontSize: 14, textAlign: 'center', padding: 40 },

  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f2f2f3' },
  ligneChoisie: { backgroundColor: '#f7f7f8', borderBottomColor: 'transparent' },
  rang: { width: 18, fontSize: 15, color: '#9a9a9c', fontStyle: 'italic' },

  pochette: { width: 49, height: 49, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center' },
  pochetteChoisie: { borderWidth: 2, borderColor: '#ff2856' },
  pochetteLettre: { color: '#fff', fontSize: 20, fontWeight: '800' },

  ligneCorps: { flex: 1, gap: 4 },
  ligneTitreGroupe: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  titre: { flex: 1, fontSize: 14.5, fontWeight: '700', color: '#111' },
  titreChoisi: { color: '#ff2856' },
  meta: { fontSize: 12.5, color: '#9a9a9c' },
  licence: { fontSize: 11, color: '#b4b4b6' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
})
