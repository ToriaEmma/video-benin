// ============================================================
// Portage de app/src/pages/GererPublications.tsx : memes ecrans,
// memes intitules, memes traces SVG. Les classes CSS de gerer.css
// deviennent des styles React Native.
// ============================================================

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import { Chevron, ChevronDroit } from '../composants/Icones'
import type { Video } from '../lib/demo'
import { apiVideos, type ModificationVideo } from '../lib/api'
import { useAuth } from '../lib/auth'

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
      {nom === 'muet' && <>
        <Path d="M3 10.2v3.6a1 1 0 0 0 1 1h2.2L11 18.6V5.4L6.2 9.2H4a1 1 0 0 0-1 1Z" fill={couleur} stroke="none" />
        <Path d="m15 9.5 5 5m0-5-5 5" />
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

type Reglage = 'visibilite' | 'commentaires' | 'reutilisation'

// Actions proposees pour la selection, par ecran : chacune est envoyee a
// l'API pour toutes les publications cochees.
const ACTIONS: Record<Reglage, { nom: string; valeurs: ModificationVideo; local: Partial<Video> }[]> = {
  visibilite: [
    { nom: 'Tout le monde', valeurs: { visibilite: 'monde' }, local: { visibilite: 'monde' } },
    { nom: 'Ami(e)s', valeurs: { visibilite: 'amis' }, local: { visibilite: 'amis' } },
    { nom: 'Toi uniquement', valeurs: { visibilite: 'moi' }, local: { visibilite: 'moi' } },
  ],
  commentaires: [
    { nom: 'Autoriser', valeurs: { commentaires_autorises: true }, local: { commentairesAutorises: true } },
    { nom: 'Désactiver', valeurs: { commentaires_autorises: false }, local: { commentairesAutorises: false } },
  ],
  reutilisation: [
    { nom: 'Autoriser', valeurs: { reutilisation_autorisee: true }, local: { reutilisationAutorisee: true } },
    { nom: 'Interdire', valeurs: { reutilisation_autorisee: false }, local: { reutilisationAutorisee: false } },
  ],
}

const TITRES: Record<Reglage, string> = {
  visibilite: 'Gérer la visibilité des publications',
  commentaires: 'Gérer les autorisations de commentaire',
  reutilisation: "Gérer l'autorisation de réutilisation",
}

const LIBELLE_VISIBILITE = { monde: 'Tout le monde', amis: 'Ami(e)s', moi: 'Toi uniquement' }

const dateLisible = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function GererPublications({ onRetour }: { onRetour: () => void }) {
  const { profil } = useAuth()
  const [ecran, setEcran] = useState<'menu' | Reglage>('menu')
  const [filtre, setFiltre] = useState<'tout' | 'monde' | 'amis' | 'moi'>('tout')
  // Publications cochees, auxquelles s'applique l'action choisie en bas.
  const [choix, setChoix] = useState<Set<string>>(() => new Set())
  const [videos, setVideos] = useState<Video[] | null>(null)
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)

  // Les vraies publications du compte, toutes visibilites confondues.
  useEffect(() => {
    if (!profil) return
    let valable = true
    apiVideos.duProfil(profil.pseudo, { limite: 50 })
      .then(v => { if (valable) setVideos(v) })
      .catch((e: Error) => { if (valable) { setVideos([]); setMessage(e.message) } })
    return () => { valable = false }
  }, [profil])

  const ouvrir = (r: Reglage) => { setChoix(new Set()); setFiltre('tout'); setEcran(r) }
  const cocher = (id: string) => setChoix(c => {
    const n = new Set(c)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const appliquer = async (action: typeof ACTIONS[Reglage][number]) => {
    if (!choix.size || occupe) return
    setOccupe(true)
    const ids = [...choix]
    const resultats = await Promise.allSettled(ids.map(id => apiVideos.modifier(id, action.valeurs)))
    const reussis = ids.filter((_, i) => resultats[i].status === 'fulfilled')
    setVideos(l => l && l.map(v => (reussis.includes(v.id) ? { ...v, ...action.local } : v)))
    setChoix(new Set())
    setOccupe(false)
    setMessage(reussis.length === ids.length
      ? `${reussis.length} publication${reussis.length > 1 ? 's' : ''} mise${reussis.length > 1 ? 's' : ''} à jour.`
      : `${ids.length - reussis.length} publication(s) n'ont pas pu être modifiées.`)
    setTimeout(() => setMessage(''), 2600)
  }

  // ---------------- Menu ----------------
  if (ecran === 'menu') {
    const entrees: { cle: Reglage; nom: string; icone: string }[] = [
      { cle: 'visibilite', nom: 'Gérer la visibilité des publications', icone: 'oeil' },
      { cle: 'commentaires', nom: 'Gérer les autorisations de commentaire', icone: 'bulle' },
      { cle: 'reutilisation', nom: "Gérer l'autorisation de réutilisation des publications", icone: 'reutilisation' },
    ]
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Gérer les publications" onRetour={onRetour} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.carte}>
            {entrees.map(e => (
              <Pressable style={s.ligne} key={e.cle} onPress={() => ouvrir(e.cle)} accessibilityRole="button">
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

  const liste = (videos ?? []).filter(v => ecran !== 'visibilite' || filtre === 'tout' || (v.visibilite ?? 'monde') === filtre)
  const filtres = [
    ['tout', 'Tout'], ['monde', 'Tout le monde'],
    ['amis', 'Ami(e)s'], ['moi', 'Toi uniquement'],
  ] as const

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre={TITRES[ecran]} onRetour={() => setEcran('menu')} />

      {ecran === 'visibilite' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.bandeFiltres} contentContainerStyle={s.filtres}>
          {filtres.map(([cle, nom]) => (
            <Pressable key={cle} onPress={() => setFiltre(cle)}
              style={[s.filtre, filtre === cle && s.filtreActif]}>
              <Text style={[s.filtreTexte, filtre === cle && s.filtreTexteActif]}>{nom}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={s.corps}>
        {videos === null ? (
          <ActivityIndicator style={s.attente} color="#111" />
        ) : liste.length === 0 ? (
          <View style={[s.vide, s.attente]}>
            <Icone nom="camera-vide" taille={64} couleur="#aaa" />
            <Text style={s.videTitre}>Aucune publication</Text>
            <Text style={s.videTexte}>Les vidéos que tu publies apparaîtront ici.</Text>
          </View>
        ) : (
          <View style={s.liste}>
            {liste.map(v => (
              <Pressable style={s.item} key={v.id} onPress={() => cocher(v.id)}
                accessibilityRole="checkbox" accessibilityState={{ checked: choix.has(v.id) }}>
                <Vignette v={v} />
                <View style={s.texte}>
                  {!!v.legende && <Text style={s.legende} numberOfLines={2}>{v.legende}</Text>}
                  {ecran === 'visibilite' && (
                    <Text style={s.meta}>{LIBELLE_VISIBILITE[v.visibilite ?? 'monde']} · {dateLisible(v.publieeLe)}</Text>
                  )}
                  {ecran === 'commentaires' && (
                    <View style={s.metaIcone}>
                      {v.commentairesAutorises === false ? <>
                        <Icone nom="muet" taille={17} couleur="#888" />
                        <Text style={s.meta}>Commentaires désactivés</Text>
                      </> : <>
                        <Icone nom="bulle" taille={17} couleur="#888" />
                        <Text style={s.meta}>{v.nbCommentaires ?? 0} · autorisés</Text>
                      </>}
                    </View>
                  )}
                  {ecran === 'reutilisation' && (
                    <Text style={s.meta}>
                      {v.reutilisationAutorisee === false ? 'Réutilisation interdite' : 'Réutilisation autorisée'} · {dateLisible(v.publieeLe)}
                    </Text>
                  )}
                </View>
                <Rond choisi={choix.has(v.id)} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {!!message && <Text style={s.message}>{message}</Text>}
      {choix.size > 0 && (
        <View style={s.actions}>
          <Text style={s.actionsTitre}>{choix.size} sélectionnée{choix.size > 1 ? 's' : ''}</Text>
          <View style={s.actionsBoutons}>
            {ACTIONS[ecran].map(a => (
              <Pressable key={a.nom} style={s.action} onPress={() => appliquer(a)} disabled={occupe} accessibilityRole="button">
                <Text style={s.actionTexte}>{a.nom}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
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

  attente: { marginTop: 60 },
  message: { textAlign: 'center', fontSize: 13.5, color: '#111', paddingVertical: 8 },
  actions: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ddd',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18, gap: 10 },
  actionsTitre: { fontSize: 13.5, color: '#666' },
  actionsBoutons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  action: { flexGrow: 1, minHeight: 42, borderRadius: 8, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionTexte: { color: '#fff', fontSize: 14.5, fontWeight: '600' },
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
