// ============================================================
// Analyse video : les indicateurs d'une de ses publications,
// ouverte depuis « Données analytiques » de la feuille « Envoyer à ».
// ============================================================

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import {
  Chevron, StudioPastille, Lecture, Coeur, Bulle, Partage, MarquePage,
} from '../composants/Icones'
import { abreger, jourEtMois, type Video } from '../lib/demo'

const ONGLETS = ['Inspiration', 'Vue d\'ensemble', 'Spectateurs', 'Engagement']

// Duree de demonstration : les sources de test font toutes dix secondes,
// la maquette en montre une bien plus longue. On la derive du nombre de
// vues pour qu'elle reste stable d'une ouverture a l'autre.
const dureeSimulee = (video: Video) => 42 + (video.vues % 100) + (video.vues % 97) / 100

// « 121.77 s » : la duree posee en bas de la vignette.
const dureeLisible = (secondes: number) => `${secondes.toFixed(2)} s`

// « 1 min 23 s » / « 18 s » : les durees de lecture des tuiles.
const dureeLongue = (secondes: number) => {
  const entier = Math.round(secondes)
  if (entier < 60) return `${entier} s`
  const minutes = Math.floor(entier / 60)
  if (minutes < 60) return `${minutes} min ${entier % 60} s`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

// « Publié le 27 sept. 2026, 17:44 ». `publieeLe` vaut « 9-27 » : le mois et
// le jour, sans annee. L'annee en cours complete la date, et l'heure vient
// du nombre de vues pour ne pas changer a chaque rendu.
const datePubliee = (video: Video) => {
  const [mois, jour] = (video.publieeLe ?? '').split('-').map(Number)
  const maintenant = new Date()
  const d = Number.isFinite(mois) && Number.isFinite(jour)
    ? new Date(maintenant.getFullYear(), mois - 1, jour)
    : maintenant
  const heure = String(8 + (video.vues % 12)).padStart(2, '0')
  const minute = String(video.vues % 60).padStart(2, '0')
  const { jour: j, mois: m } = jourEtMois(d.getTime())
  return `Publié le ${j} ${m} ${d.getFullYear()}, ${heure}:${minute}`
}

// Une des cinq mesures de la rangee sous la vignette.
function Mesure({ Icone, valeur }: {
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
  valeur: number
}) {
  return (
    <View style={s.mesure}>
      <Icone taille={20} couleur="#111" />
      <Text style={s.mesureValeur}>{abreger(valeur)}</Text>
    </View>
  )
}

// Une tuile de la grille « Indicateurs clés ». La premiere est mise en
// avant : bord bleu et fond bleu pale.
function Tuile({ libelle, valeur, enAvant }: {
  libelle: string
  valeur: string
  enAvant?: boolean
}) {
  return (
    <View style={[s.tuile, enAvant && s.tuileEnAvant]}>
      <Text style={s.tuileLibelle}>{libelle}</Text>
      <Text style={s.tuileValeur}>{valeur}</Text>
    </View>
  )
}

export default function AnalyseVideo({ video, onRetour }: {
  video: Video
  onRetour: () => void
}) {
  const [onglet, setOnglet] = useState(1)
  const lecteur = useVideoPlayer(video.url, p => { p.muted = true })

  // Les mesures derivees restent figees pour une video donnee : elles
  // viennent de ses vues, de ses j'aime et de sa duree simulee.
  const duree = useState(() => dureeSimulee(video))[0]
  const partages = Math.round(video.nbAime * 0.14)
  const favoris = Math.round(video.nbAime * 0.21)
  // Un spectateur sur trois environ va au bout de la video.
  const complets = Math.round(video.vues * 0.34)
  const visionnageMoyen = duree * 0.38
  const lectureTotale = video.vues * visionnageMoyen
  const nouveauxAbonnes = Math.round(video.vues * 0.004)

  const TUILES: { libelle: string; valeur: string }[] = [
    { libelle: 'Vues de la vidéo', valeur: abreger(video.vues) },
    { libelle: 'Temps de lecture total', valeur: dureeLongue(lectureTotale) },
    { libelle: 'Temps de visionnage moyen', valeur: dureeLongue(visionnageMoyen) },
    // Une video sans vue n'a personne a compter : la part reste a zero.
    { libelle: 'A regardé toute la vidéo',
      valeur: `${video.vues > 0 ? Math.round(complets / video.vues * 100) : 0} %` },
    { libelle: 'Nouveaux followers', valeur: abreger(nouveauxAbonnes) },
  ]

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.barreTitre}>Analyse vidéo</Text>
        <Pressable style={s.studio}>
          <StudioPastille taille={15} couleur="#111" />
          <Text style={s.studioTexte}>Studio créateur</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.corps}>
        <View style={s.apercu}>
          <VideoView player={lecteur} style={StyleSheet.absoluteFill}
            contentFit="cover" nativeControls={false} />
          <Text style={s.duree}>{dureeLisible(duree)}</Text>
        </View>

        <Text style={s.datePubliee}>{datePubliee(video)}</Text>

        <View style={s.mesures}>
          <Mesure Icone={Lecture} valeur={video.vues} />
          <View style={s.regle} />
          <Mesure Icone={Coeur} valeur={video.nbAime} />
          <View style={s.regle} />
          <Mesure Icone={Bulle} valeur={video.nbCommentaires} />
          <View style={s.regle} />
          <Mesure Icone={Partage} valeur={partages} />
          <View style={s.regle} />
          <Mesure Icone={MarquePage} valeur={favoris} />
        </View>

        <View style={s.onglets}>
          {ONGLETS.map((o, i) => (
            <Pressable key={o} onPress={() => setOnglet(i)} style={s.onglet}>
              <Text style={[s.ongletTexte, i === onglet && s.ongletTexteActif]}
                numberOfLines={1}>
                {o}
              </Text>
              <View style={[s.soulignement, i === onglet && s.soulignementActif]} />
            </Pressable>
          ))}
        </View>

        {onglet === 1 ? (
          <View style={s.carte}>
            <Text style={s.carteTitre}>Indicateurs clés</Text>
            <Text style={s.carteSousTitre}>Mis à jour en temps réel.</Text>
            <View style={s.grille}>
              {TUILES.map((t, i) => (
                <Tuile key={t.libelle} libelle={t.libelle} valeur={t.valeur}
                  enAvant={i === 0} />
              ))}
            </View>
          </View>
        ) : (
          <Text style={s.bientot}>Bientôt disponible</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },

  barre: { flexDirection: 'row', alignItems: 'center', minHeight: 52,
    paddingHorizontal: 8 },
  retour: { width: 40, height: 44, justifyContent: 'center' },
  barreTitre: { flex: 1, color: '#111', fontSize: 17, fontWeight: '700',
    textAlign: 'center' },
  studio: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ececec', borderRadius: 16, height: 32,
    paddingHorizontal: 11, marginRight: 4 },
  studioTexte: { color: '#111', fontSize: 13, fontWeight: '600' },

  corps: { paddingBottom: 32 },

  // Vignette centree, avec la duree posee en bas.
  apercu: { width: 115, height: 155, borderRadius: 8, alignSelf: 'center',
    marginTop: 12, backgroundColor: '#e3e3e5', overflow: 'hidden',
    justifyContent: 'flex-end' },
  duree: { color: '#fff', fontSize: 12.5, fontWeight: '600',
    textAlign: 'center', paddingBottom: 7,
    textShadowColor: 'rgba(0,0,0,.55)', textShadowRadius: 4 },

  datePubliee: { color: '#8e8e93', fontSize: 13, textAlign: 'center',
    marginTop: 10 },

  // Rangee des cinq mesures, separees par de fins traits verticaux.
  mesures: { flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 18 },
  mesure: { flex: 1, alignItems: 'center', gap: 6 },
  mesureValeur: { color: '#111', fontSize: 20, fontWeight: '700' },
  regle: { width: StyleSheet.hairlineWidth, height: 30,
    backgroundColor: '#d9d9dc' },

  // Barre d'onglets.
  onglets: { flexDirection: 'row', paddingHorizontal: 6,
    backgroundColor: '#f5f5f5' },
  onglet: { flex: 1, alignItems: 'center', gap: 8 },
  ongletTexte: { color: '#8e8e93', fontSize: 14.5, fontWeight: '500',
    paddingTop: 4 },
  ongletTexteActif: { color: '#111', fontWeight: '700' },
  soulignement: { height: 2.5, width: '58%', borderRadius: 2,
    backgroundColor: 'transparent' },
  soulignementActif: { backgroundColor: '#111' },

  // Carte « Indicateurs clés ».
  carte: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12,
    marginTop: 16, padding: 16 },
  carteTitre: { color: '#111', fontSize: 17, fontWeight: '700' },
  carteSousTitre: { color: '#8e8e93', fontSize: 13.5, marginTop: 4 },

  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  tuile: { flexGrow: 1, flexBasis: '46%', backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e5e7', padding: 16,
    gap: 8 },
  tuileEnAvant: { borderColor: '#3b82f6', backgroundColor: '#eaf2fe' },
  tuileLibelle: { color: '#8e8e93', fontSize: 15, lineHeight: 20 },
  tuileValeur: { color: '#111', fontSize: 24, fontWeight: '800' },

  bientot: { color: '#8e8e93', fontSize: 15, textAlign: 'center',
    paddingTop: 70 },
})
