// ============================================================
// Portage de app/src/pages/GererPublications.tsx : memes ecrans,
// memes intitules, memes traces SVG. Les classes CSS de gerer.css
// deviennent des styles React Native.
// ============================================================

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import { Chevron, ChevronDroit, Croix } from '../composants/Icones'
import { etat, type Video } from '../lib/demo'

type Ecran = 'menu' | 'corbeille' | 'visibilite' | 'commentaires' | 'reutilisation'

function Icone({ nom, taille = 24, couleur = '#111' }: {
  nom: string; taille?: number; couleur?: string
}) {
  const t = {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: couleur, strokeWidth: 1.7,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  return (
    <Svg {...t}>
      {nom === 'corbeille' && <>
        <Path d="M3.8 6.4h16.4" />
        <Path d="M9.2 6.4V4.2A1.2 1.2 0 0 1 10.4 3h3.2a1.2 1.2 0 0 1 1.2 1.2v2.2" />
        <Path d="M5.8 6.4 6.9 20a1.8 1.8 0 0 0 1.8 1.6h6.6a1.8 1.8 0 0 0 1.8-1.6l1.1-13.6" />
        <Path d="M10.2 10.4v6.8M13.8 10.4v6.8" />
      </>}
      {nom === 'oeil' && <>
        <Path d="M12 5.2c5 0 9 4.3 9 6.8s-4 6.8-9 6.8-9-4.3-9-6.8 4-6.8 9-6.8Z" fill={couleur} stroke="none" />
        <Circle cx="12" cy="12" r="2.8" fill="#fff" stroke="none" />
      </>}
      {nom === 'bulle' && <>
        <Path d="M21 11.3c0 4-4 7.3-9 7.3-1 0-1.9-.1-2.8-.4L4 20.4l1.4-3.5C4 15.3 3 13.4 3 11.3 3 7.3 7 4 12 4s9 3.3 9 7.3Z" fill={couleur} stroke="none" />
        <Circle cx="8.4" cy="11.2" r="1.1" fill="#fff" stroke="none" />
        <Circle cx="12" cy="11.2" r="1.1" fill="#fff" stroke="none" />
        <Circle cx="15.6" cy="11.2" r="1.1" fill="#fff" stroke="none" />
      </>}
      {nom === 'reutilisation' && <>
        <Rect x="3" y="4.5" width="12.5" height="15" rx="2" fill={couleur} stroke="none" />
        <Path d="M7.6 9.4v5.2l4-2.6-4-2.6Z" fill="#fff" stroke="none" />
        <Path d="M18 6.5v11M20.8 8v8" />
      </>}
      {nom === 'camera-vide' && <>
        <Rect x="2.5" y="6" width="13.5" height="12" rx="2.5" />
        <Path d="m16 11 5.5-3.2v8.4L16 13v-2Z" />
      </>}
      {nom === 'info' && <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 11v5.5" />
        <Circle cx="12" cy="7.8" r="1" fill={couleur} stroke="none" />
      </>}
      {nom === 'reglages' && <>
        <Path d="m10.2 2.6-.6 2.1-1.9.8-2.1-.6-1.8 2.8 1.4 1.7-.2 2.1-1.9 1 .9 3.2 2.3.3 1.3 1.6.1 2.3 3.2.9 1.4-1.8 2 .3 1.8 1.4 2.8-1.8-.6-2.3.9-1.8 1.8-.9v-3.3l-2.1-.6-.9-1.8.7-2.1-2.8-1.8-1.8 1.4-2-.2-1-1.9Z" />
        <Circle cx="12" cy="12" r="4.6" />
      </>}
      {nom === 'muet' && <>
        <Path d="M3 10.2v3.6a1 1 0 0 0 1 1h2.2L11 18.6V5.4L6.2 9.2H4a1 1 0 0 0-1 1Z" fill={couleur} stroke="none" />
        <Path d="m15 9.5 5 5m0-5-5 5" />
      </>}
      {nom === 'copies' && <>
        <Rect x="7" y="3.5" width="13.5" height="13.5" rx="2.5" />
        <Path d="M11.6 8.2v4.2l3.4-2.1-3.4-2.1Z" fill={couleur} stroke="none" />
        <Path d="M4 7v11.5a2 2 0 0 0 2 2h11" />
      </>}
    </Svg>
  )
}

// Barre commune aux sous-ecrans : retour, titre centre, action a droite.
function Barre({ titre, onRetour, action }: {
  titre: string; onRetour: () => void; action?: React.ReactNode
}) {
  return (
    <View style={s.barre}>
      <Pressable onPress={onRetour} hitSlop={10} style={s.barreBouton}>
        <Chevron taille={24} couleur="#111" />
      </Pressable>
      <Text style={s.barreTitre} numberOfLines={1}>{titre}</Text>
      <View style={s.barreAction}>{action}</View>
    </View>
  )
}

function Vignette({ v }: { v: Video }) {
  const lecteur = useVideoPlayer(v.url, p => { p.muted = true })
  return (
    <View style={s.vignette}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
    </View>
  )
}

// Rond de choix a droite d'une publication.
const Rond = ({ choisi }: { choisi: boolean }) => (
  <View style={[s.rond, choisi && s.rondChoisi]}>
    {choisi && <View style={s.rondCoeur} />}
  </View>
)

export default function GererPublications({ onRetour }: { onRetour: () => void }) {
  const [ecran, setEcran] = useState<Ecran>('menu')
  const [filtre, setFiltre] = useState<'tout' | 'monde' | 'amis' | 'moi'>('tout')
  const [banniere, setBanniere] = useState(true)
  const [choix, setChoix] = useState<string | null>(null)

  const mesVideos = etat.videos

  // ---------------- Menu ----------------
  if (ecran === 'menu') {
    const entrees = [
      { cle: 'corbeille' as const, nom: 'Suppression récente', icone: 'corbeille' },
      { cle: 'visibilite' as const, nom: 'Gérer la visibilité des publications', icone: 'oeil' },
      { cle: 'commentaires' as const, nom: 'Gérer les autorisations de commentaire', icone: 'bulle' },
      { cle: 'reutilisation' as const, nom: "Gérer l'autorisation de réutilisation des publications", icone: 'reutilisation' },
    ]
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Gérer les publications" onRetour={onRetour}
          action={<Pressable hitSlop={8}><Icone nom="reglages" taille={26} /></Pressable>} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.carte}>
            {entrees.map(e => (
              <Pressable style={s.ligne} key={e.cle} onPress={() => setEcran(e.cle)}>
                <Icone nom={e.icone} taille={23} />
                <Text style={s.nom}>{e.nom}</Text>
                <ChevronDroit taille={17} couleur="#c4c4c6" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Suppression recente ----------------
  if (ecran === 'corbeille') {
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Suppression récente" onRetour={() => setEcran('menu')}
          action={<Pressable hitSlop={8}><Icone nom="info" taille={20} /></Pressable>} />
        <ScrollView contentContainerStyle={[s.corps, s.centre]}>
          {etat.corbeille.length === 0 ? (
            <View style={s.vide}>
              <Icone nom="camera-vide" taille={72} couleur="#aaa" />
              <Text style={s.videTitre}>Aucune publication supprimée récemment</Text>
              <Text style={s.videTexte}>
                Les publications que tu as supprimées au cours des 30 derniers
                jours apparaîtront ici.
              </Text>
            </View>
          ) : (
            <View style={s.liste}>
              {etat.corbeille.map(v => (
                <View style={s.item} key={v.id}>
                  <Vignette v={v} />
                  <View style={s.texte}>
                    <Text style={s.date}>{v.publieeLe}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Visibilite ----------------
  if (ecran === 'visibilite') {
    const libelle = { monde: 'Tout le monde', amis: 'Ami(e)s', moi: 'Toi uniquement' }
    const liste = filtre === 'tout' ? mesVideos : mesVideos.filter(v => v.visibilite === filtre)
    const filtres = [
      ['tout', 'Tout'], ['monde', 'Tout le monde'],
      ['amis', 'Ami(e)s'], ['moi', 'Toi uniquement'],
    ] as const

    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Gérer la visibilité des publications"
          onRetour={() => setEcran('menu')} />

        {banniere && (
          <View style={s.banniere}>
            <Text style={s.banniereTexte}>
              Cette fonctionnalité est en cours de test bêta et ne prend en
              charge que certaines publications.{' '}
              <Text style={s.lien}>En savoir plus</Text>
            </Text>
            <Pressable hitSlop={8} onPress={() => setBanniere(false)}>
              <Croix taille={18} couleur="#888" />
            </Pressable>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.bandeFiltres} contentContainerStyle={s.filtres}>
          {filtres.map(([cle, nom]) => (
            <Pressable key={cle} onPress={() => setFiltre(cle)}
              style={[s.filtre, filtre === cle && s.filtreActif]}>
              <Text style={[s.filtreTexte, filtre === cle && s.filtreTexteActif]}>
                {nom}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.liste}>
            {liste.map(v => (
              <Pressable style={s.item} key={v.id} onPress={() => setChoix(v.id)}>
                <Vignette v={v} />
                <View style={s.texte}>
                  {!!v.legende && (
                    <Text style={s.legende} numberOfLines={2}>{v.legende}</Text>
                  )}
                  <Text style={s.meta}>
                    {libelle[v.visibilite ?? 'monde']} · {v.publieeLe}
                  </Text>
                </View>
                <Rond choisi={choix === v.id} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Commentaires ----------------
  if (ecran === 'commentaires') {
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Gérer les autorisations de comm…"
          onRetour={() => setEcran('menu')} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.liste}>
            {mesVideos.map(v => (
              <Pressable style={s.item} key={v.id} onPress={() => setChoix(v.id)}>
                <Vignette v={v} />
                <View style={s.texte}>
                  {!!v.legende && (
                    <Text style={s.legende} numberOfLines={2}>{v.legende}</Text>
                  )}
                  <Text style={s.date}>{v.publieeLe}</Text>
                  <View style={s.metaIcone}>
                    {v.commentairesAutorises === false ? <>
                      <Icone nom="muet" taille={17} couleur="#888" />
                      <Text style={s.meta}>Commentaires non autorisés</Text>
                    </> : <>
                      <Icone nom="bulle" taille={17} couleur="#888" />
                      <Text style={s.meta}>{v.nbCommentaires ?? 0}</Text>
                    </>}
                  </View>
                </View>
                <Rond choisi={choix === v.id} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Reutilisation ----------------
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Gérer l'autorisation de réutilisati…"
        onRetour={() => setEcran('menu')} />
      <ScrollView contentContainerStyle={s.corps}>
        <View style={s.liste}>
          {mesVideos.map(v => (
            <Pressable style={s.item} key={v.id} onPress={() => setChoix(v.id)}>
              <Vignette v={v} />
              <View style={s.texte}>
                {!!v.legende && (
                  <Text style={s.legende} numberOfLines={2}>{v.legende}</Text>
                )}
                <View style={s.metaIcone}>
                  <Icone nom="copies" taille={17} couleur="#888" />
                  <Text style={s.meta}>1 publication · {v.publieeLe}</Text>
                </View>
                {v.reutilisationAutorisee === false && (
                  <Text style={s.etiquette}>Réutilisation interdite</Text>
                )}
              </View>
              <Rond choisi={choix === v.id} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Styles repris de gerer.css.
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },

  barre: { flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 48, paddingHorizontal: 12 },
  barreBouton: { width: 36, height: 40, justifyContent: 'center' },
  barreTitre: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111',
    textAlign: 'center' },
  barreAction: { width: 36, alignItems: 'flex-end' },

  corps: { paddingHorizontal: 12, paddingBottom: 28 },
  centre: { flexGrow: 1, justifyContent: 'center' },

  carte: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10,
    paddingHorizontal: 16 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14,
    minHeight: 62, paddingVertical: 12 },
  nom: { flex: 1, fontSize: 16, color: '#111', lineHeight: 21 },

  vide: { alignItems: 'center', paddingHorizontal: 30, gap: 16 },
  videTitre: { fontSize: 16, fontWeight: '600', color: '#111',
    textAlign: 'center', marginTop: 6 },
  videTexte: { fontSize: 14, lineHeight: 19, color: '#888', textAlign: 'center' },

  liste: { paddingVertical: 8, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10 },
  vignette: { width: 56, height: 74, borderRadius: 5, backgroundColor: '#e5e5e5',
    overflow: 'hidden' },
  texte: { flex: 1, gap: 5 },
  legende: { fontSize: 14.5, color: '#111', lineHeight: 19 },
  date: { fontSize: 13, color: '#888' },
  meta: { fontSize: 13, color: '#888' },
  metaIcone: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  etiquette: { fontSize: 12, color: '#888', backgroundColor: '#ececec',
    borderRadius: 4, paddingVertical: 3, paddingHorizontal: 7,
    alignSelf: 'flex-start' },

  rond: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.8,
    borderColor: '#d1d1d6', alignItems: 'center', justifyContent: 'center' },
  rondChoisi: { backgroundColor: '#ff2856', borderColor: '#ff2856' },
  rondCoeur: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  banniere: { flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#ececec', borderRadius: 10, marginHorizontal: 12,
    padding: 13 },
  banniereTexte: { flex: 1, fontSize: 13, lineHeight: 18, color: '#666' },
  lien: { color: '#111', fontWeight: '600' },

  bandeFiltres: { flexGrow: 0, marginTop: 12 },
  filtres: { gap: 8, paddingHorizontal: 12 },
  filtre: { backgroundColor: '#ececec', borderRadius: 8, height: 32,
    justifyContent: 'center', paddingHorizontal: 12 },
  filtreActif: { backgroundColor: '#111' },
  filtreTexte: { fontSize: 14, color: '#111' },
  filtreTexteActif: { color: '#fff' },
})
