// ============================================================
// Feuille « Ajouter un son » : elle s'ouvre a mi-hauteur et
// se deploie quand on tire la poignee vers le haut.
// ============================================================

import React, { useEffect, useRef, useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, Modal, Animated, PanResponder,
  useWindowDimensions, ScrollView, ActivityIndicator, Image,
} from 'react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Text, TextInput } from '../composants/Texte'
import {
  Loupe, Egaliseur, Ciseaux, MarquePage,
} from '../composants/Icones'
import {
  SONS, parPopularite, abregerPublications, dureeLisible, type Son,
} from '../lib/sons'
import { rechercherSons, sonsPopulaires, sonsPourToi } from '../lib/deezer'
import { basculerFavoriSon, useFavorisSons } from '../lib/favorisSons'

// Derniers sons retenus, pour l'onglet « Récents » (le temps de la session).
const recents: Son[] = []
export function noterRecent(son: Son) {
  const i = recents.findIndex(x => x.id === son.id)
  if (i >= 0) recents.splice(i, 1)
  recents.unshift(son)
  if (recents.length > 30) recents.pop()
}

const ONGLETS = ['Populaire', 'Pour toi', 'Favoris', 'Récents']

// archive.org met souvent plus de trois secondes a repondre : au-dela de
// ce delai sans son audible, mieux vaut l'avouer que laisser le silence.
const DELAI_ABANDON = 12000

type Etat = 'chargement' | 'lecture' | 'echec'

// Une ligne de son : pochette, titre, auteur et compteurs.
function Ligne({ son, choisi, etat, rang, favori, onChoisir, onFavori }: {
  son: Son
  choisi: boolean
  // Etat de l'apercu du son retenu, pour cette ligne seulement.
  etat: Etat
  // Numero affiche dans l'onglet « Populaire ».
  rang?: number
  favori: boolean
  onChoisir: () => void
  onFavori: () => void
}) {
  const charge = choisi && etat === 'chargement'
  const echoue = choisi && etat === 'echec'

  return (
    <Pressable style={[s.ligne, choisi && s.ligneChoisie]} onPress={onChoisir}>
      {rang != null && <Text style={s.rang}>{rang}</Text>}

      <View style={[s.pochette, { backgroundColor: son.couleur },
        choisi && s.pochetteChoisie]}>
        {son.pochette && <Image source={{ uri: son.pochette }} style={s.pochetteImage} />}
        {charge
          ? <ActivityIndicator size="small" color="#fff" />
          : !son.pochette && <Text style={s.pochetteLettre}>{son.titre.charAt(0).toUpperCase()}</Text>}
      </View>

      <View style={s.ligneCorps}>
        <View style={s.ligneTitreGroupe}>
          {/* L'egaliseur ne s'anime qu'une fois le son vraiment audible. */}
          {choisi && etat === 'lecture' && <Egaliseur taille={15} />}
          <Text style={[s.titre, choisi && s.titreChoisi]} numberOfLines={1}>
            {son.titre}
          </Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {son.artiste} · {abregerPublications(son.publications)} publications
          {' · '}{dureeLisible(son.duree)}
        </Text>
        {charge && <Text style={s.chargement}>Chargement…</Text>}
        {echoue && <Text style={s.echec}>{'Ce son n’a pas pu être chargé'}</Text>}
        {choisi && !charge && !echoue && <Text style={s.licence}>{son.licence}</Text>}
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
  const [choisiSon, setChoisiSon] = useState<Son | null>(null)
  const choisi = choisiSon?.id ?? null
  const { favoris, estFavori } = useFavorisSons()

  // Listes Deezer chargees a l'ouverture ; le catalogue libre de droits
  // prend le relais si Deezer ne repond pas.
  const [populaires, setPopulaires] = useState<Son[] | null>(null)
  const [pourToi, setPourToi] = useState<Son[] | null>(null)
  const [erreurListe, setErreurListe] = useState(false)
  useEffect(() => {
    if (!visible || pourToi) return
    let annule = false
    sonsPourToi()
      .then(l => { if (!annule) { setPourToi(l); setChoisiSon(c => c ?? l[0] ?? null) } })
      .catch(() => { if (!annule) { setPourToi(SONS); setErreurListe(true); setChoisiSon(c => c ?? SONS[0]) } })
    sonsPopulaires()
      .then(l => { if (!annule) setPopulaires(l) })
      .catch(() => { if (!annule) setPopulaires(parPopularite(SONS)) })
    return () => { annule = true }
  }, [visible, pourToi])

  // Recherche : la loupe ouvre le champ, les resultats remplacent l'onglet.
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [terme, setTerme] = useState('')
  const [resultats, setResultats] = useState<Son[] | null>(null)
  const [recherchant, setRecherchant] = useState(false)
  const delai = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (delai.current) clearTimeout(delai.current)
    if (!terme.trim()) { setResultats(null); setRecherchant(false); return }
    setRecherchant(true)
    delai.current = setTimeout(() => {
      rechercherSons(terme)
        .then(l => setResultats(l))
        .catch(() => setResultats([]))
        .finally(() => setRecherchant(false))
    }, 350)
  }, [terme])

  // Apercu du son retenu. Les pistes du catalogue depassent la minute et
  // demie : la boucle est inutile pour un apercu, et la muter ici serait
  // modifier la valeur rendue par le hook.
  const son = choisiSon
  // `downloadFirst` est laisse a faux : attendre le fichier entier rendrait
  // l'apercu muet le temps du telechargement, ce qui est le defaut corrige ici.
  const lecteur = useAudioPlayer(son ? { uri: son.url } : null)
  const statut = useAudioPlayerStatus(lecteur)

  // Un son qui tarde trop est declare injouable : c'est le seul etat que
  // le statut du lecteur ne donne pas de lui-meme.
  const [abandonne, setAbandonne] = useState<string | null>(null)

  // L'etat vient du lecteur plutot que d'un setState a l'appui : lui seul
  // sait quand le son devient reellement audible.
  const etat: Etat = abandonne === choisi ? 'echec'
    : statut.playing ? 'lecture'
    : 'chargement'

  // Relance la lecture a chaque changement de son, et coupe tout quand la
  // feuille se referme : un son qui continue sans la feuille est pire que rien.
  useEffect(() => {
    if (!visible || !son) {
      lecteur.pause()
      return
    }
    lecteur.play()
    return () => { lecteur.pause() }
  }, [visible, son, lecteur])

  // Le compte a rebours repart avec chaque son retenu. Il couvre aussi le
  // cas d'une lecture refusee d'emblee : dans les deux cas rien n'est audible.
  useEffect(() => {
    if (!visible || !son || statut.playing) return
    const minuteur = setTimeout(() => setAbandonne(son.id), DELAI_ABANDON)
    return () => clearTimeout(minuteur)
  }, [visible, son, statut.playing])

  const retenir = (x: Son) => {
    if (choisi === x.id) {
      // Second appui : on valide et on referme, sauf si rien ne s'est joue.
      if (etat === 'echec') return
      noterRecent(x)
      onChoisir(x); onFermer(); return
    }
    setAbandonne(null)
    setChoisiSon(x)
  }

  // Chaque onglet a sa liste ; une recherche en cours les remplace toutes.
  const enRecherche = rechercheOuverte && !!terme.trim()
  const liste: Son[] | null = enRecherche ? resultats
    : onglet === 'Populaire' ? (zone === 'Mondial' ? populaires : (pourToi && parPopularite(pourToi)))
    : onglet === 'Favoris' ? favoris
    : onglet === 'Récents' ? [...recents]
    : pourToi
  const enChargement = liste === null || (enRecherche && recherchant && !resultats)

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
            <Pressable style={s.loupe} hitSlop={8}
              onPress={() => { setRechercheOuverte(v => !v); setTerme('') }}>
              <Loupe taille={24} couleur="#111" />
            </Pressable>
          </View>

          {rechercheOuverte && (
            <View style={s.recherche}>
              <Loupe taille={18} couleur="#9a9a9c" />
              <TextInput style={s.rechercheChamp} value={terme} onChangeText={setTerme}
                placeholder="Rechercher un son ou un artiste" placeholderTextColor="#9a9a9c"
                autoFocus returnKeyType="search" />
              {recherchant && <ActivityIndicator size="small" color="#9a9a9c" />}
            </View>
          )}

          {/* « Populaire » ajoute le choix du territoire */}
          {onglet === 'Populaire' && !enRecherche && (
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

          {erreurListe && !enRecherche && (
            <Text style={s.avis}>Deezer ne répond pas : sons libres de droits en attendant.</Text>
          )}

          <FlatList
            data={liste ?? []}
            keyExtractor={x => x.id}
            contentContainerStyle={s.liste}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={enChargement
              ? <ActivityIndicator style={s.attente} color="#9a9a9c" />
              : (
              <Text style={s.vide}>
                {enRecherche ? 'Aucun son trouvé'
                  : onglet === 'Favoris' ? 'Aucun son enregistré'
                  : onglet === 'Récents' ? 'Aucun son utilisé récemment'
                  : 'Aucun son pour le moment'}
              </Text>
            )}
            renderItem={({ item, index }) => (
              <Ligne son={item} choisi={choisi === item.id} etat={etat}
                rang={onglet === 'Populaire' && !enRecherche ? index + 1 : undefined}
                favori={estFavori(item.id)}
                onChoisir={() => retenir(item)}
                onFavori={() => basculerFavoriSon(item)} />
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

  pochette: { width: 49, height: 49, borderRadius: 9, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center' },
  pochetteChoisie: { borderWidth: 2, borderColor: '#ff2856' },
  pochetteLettre: { color: '#fff', fontSize: 20, fontWeight: '800' },
  pochetteImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 7 },

  recherche: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16,
    marginTop: 12, paddingHorizontal: 12, height: 40, borderRadius: 10, backgroundColor: '#f1f1f2' },
  rechercheChamp: { flex: 1, fontSize: 15, color: '#111', paddingVertical: 0 },
  avis: { fontSize: 12, color: '#9a9a9c', paddingHorizontal: 16, paddingTop: 10 },
  attente: { padding: 40 },

  ligneCorps: { flex: 1, gap: 4 },
  ligneTitreGroupe: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  titre: { flex: 1, fontSize: 14.5, fontWeight: '700', color: '#111' },
  titreChoisi: { color: '#ff2856' },
  meta: { fontSize: 12.5, color: '#9a9a9c' },
  licence: { fontSize: 11, color: '#b4b4b6' },
  chargement: { fontSize: 11.5, color: '#9a9a9c' },
  echec: { fontSize: 11.5, color: '#ff2856' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
})
