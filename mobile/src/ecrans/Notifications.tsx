// ============================================================
// Notifications systeme : la liste des cartes de service, puis
// l'ecran de reglages du canal ouvert par la roue dentee.
// ============================================================

import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import Interrupteur from '../composants/Interrupteur'
import {
  Chevron, ChevronDroit, Engrenage, TroisPoints, Epingle, ClocheBarree,
  CanalPublicite, CanalPromotion, CanalMarketplace, CanalLive,
  CanalMiniSerie, CanalApplication,
} from '../composants/Icones'
import {
  etat, ageCourt, type Notification, type CanalNotification,
} from '../lib/demo'

// Filtres de la bande horizontale. `canal` a null pour « Tous », qui
// laisse passer toutes les cartes.
const FILTRES: { nom: string; canal: CanalNotification | null }[] = [
  { nom: 'Tous', canal: null },
  { nom: 'LIVE', canal: 'live' },
  { nom: 'TockTick', canal: 'application' },
  { nom: 'Assistant promotion', canal: 'promotion' },
]

// Pastille ronde de chaque carte : une couleur et une icone par canal.
const PASTILLES: Record<CanalNotification, {
  fond: string
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
}> = {
  live: { fond: '#ff2856', Icone: CanalLive },
  application: { fond: '#111', Icone: CanalApplication },
  promotion: { fond: '#2a7ab0', Icone: CanalPromotion },
}

// ------------------------------------------------------------
// Une carte de la liste
// ------------------------------------------------------------

function Carte({ notification }: { notification: Notification }) {
  // Le corps reste tronque a trois lignes jusqu'au premier « Voir plus ».
  const [developpe, setDeveloppe] = useState(false)
  const pastille = PASTILLES[notification.canal]

  return (
    <View style={s.carte}>
      <View style={s.carteEntete}>
        <View style={[s.pastille, { backgroundColor: pastille.fond }]}>
          <pastille.Icone taille={15} couleur="#fff" />
        </View>
        <Text style={s.etiquette} numberOfLines={1}>{notification.etiquette}</Text>
        <Pressable hitSlop={10} style={s.points}>
          <TroisPoints taille={18} couleur="#8e8e93" />
        </Pressable>
      </View>

      <Text style={s.carteTitre}>{notification.titre}</Text>

      <View style={s.carteCorps}>
        <Text style={s.corps} numberOfLines={developpe ? undefined : 3}>
          {notification.corps}
          {'  '}
          <Text style={s.age}>{ageCourt(notification.date)}</Text>
        </Text>
        {!!notification.vignette && <Vignette url={notification.vignette} />}
      </View>

      <Pressable hitSlop={8} onPress={() => setDeveloppe(v => !v)}>
        <Text style={s.voirPlus}>{developpe ? 'Voir moins' : 'Voir plus'}</Text>
      </Pressable>
    </View>
  )
}

// Vignette carree posee a droite du corps. Elle reprend la premiere image
// de la video, lecteur coupe et en pause : c'est une image fixe.
function Vignette({ url }: { url: string }) {
  const lecteur = useVideoPlayer(url, p => { p.muted = true })
  return (
    <View style={s.vignette}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
    </View>
  )
}

// ------------------------------------------------------------
// Ecran 2 : reglages du canal
// ------------------------------------------------------------

// Les six canaux de la seconde carte des reglages.
const CANAUX: {
  nom: string
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
}[] = [
  { nom: 'Assistance publicités', Icone: CanalPublicite },
  { nom: 'Assistant promotion', Icone: CanalPromotion },
  { nom: 'Creator Marketplace', Icone: CanalMarketplace },
  { nom: 'LIVE', Icone: CanalLive },
  { nom: 'Mini-série', Icone: CanalMiniSerie },
  { nom: 'TockTick', Icone: CanalApplication },
]

export function ParametresNotifications({ onRetour }: { onRetour: () => void }) {
  const [epingle, setEpingle] = useState(false)
  const [sourdine, setSourdine] = useState(false)

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.barreTitre}>Paramètres des notifications</Text>
        <View style={s.retour} />
      </View>

      <ScrollView contentContainerStyle={s.reglages}>
        <View style={s.carteReglage}>
          <View style={s.ligne}>
            <Epingle taille={22} couleur="#111" />
            <Text style={s.ligneNom}>Épingler en haut</Text>
            <Interrupteur actif={epingle} onChange={setEpingle} />
          </View>
          <View style={[s.ligne, s.ligneSuivante]}>
            <ClocheBarree taille={22} couleur="#111" />
            <Text style={s.ligneNom}>Mettre en sourdine</Text>
            <Interrupteur actif={sourdine} onChange={setSourdine} />
          </View>
        </View>

        <Text style={s.sectionTitre}>Notifications de canal</Text>

        <View style={s.carteReglage}>
          {CANAUX.map((c, i) => (
            <Pressable key={c.nom}
              style={[s.ligne, i > 0 && s.ligneSuivante]}>
              <c.Icone taille={22} couleur="#111" />
              <Text style={s.ligneNom}>{c.nom}</Text>
              <ChevronDroit taille={17} couleur="#c4c4c6" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// Ecran 1 : la liste des notifications
// ------------------------------------------------------------

export default function Notifications({ onRetour }: { onRetour: () => void }) {
  const [filtre, setFiltre] = useState(0)
  const [reglages, setReglages] = useState(false)

  if (reglages) {
    return <ParametresNotifications onRetour={() => setReglages(false)} />
  }

  const canal = FILTRES[filtre].canal
  const liste = etat.notifications.filter(n => !canal || n.canal === canal)

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.barreTitre}>Notifications système</Text>
        <Pressable hitSlop={10} onPress={() => setReglages(true)}
          style={[s.retour, s.retourFin]}>
          <Engrenage taille={23} couleur="#111" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.bande} contentContainerStyle={s.bandeContenu}>
        {FILTRES.map((f, i) => (
          <Pressable key={f.nom} onPress={() => setFiltre(i)}
            style={[s.puce, i === filtre && s.puceActive]}>
            <Text style={[s.puceTexte, i === filtre && s.puceTexteActive]}>
              {f.nom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={liste}
        keyExtractor={n => n.id}
        contentContainerStyle={s.liste}
        ListEmptyComponent={
          <Text style={s.vide}>Aucune notification dans ce canal.</Text>
        }
        renderItem={({ item }) => <Carte notification={item} />}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },

  barre: { flexDirection: 'row', alignItems: 'center', minHeight: 52,
    paddingHorizontal: 8 },
  retour: { width: 40, height: 44, justifyContent: 'center' },
  retourFin: { alignItems: 'flex-end' },
  barreTitre: { flex: 1, color: '#111', fontSize: 17, fontWeight: '700',
    textAlign: 'center' },

  // Bande de filtres, sous l'en-tete.
  bande: { flexGrow: 0 },
  bandeContenu: { gap: 9, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center' },
  puce: { backgroundColor: '#ececec', borderRadius: 10, height: 44,
    justifyContent: 'center', paddingHorizontal: 16 },
  puceActive: { backgroundColor: '#d9ecf7' },
  puceTexte: { color: '#111', fontSize: 15, fontWeight: '500' },
  puceTexteActive: { color: '#2a7ab0', fontWeight: '600' },

  liste: { paddingVertical: 8, paddingBottom: 28, gap: 14, flexGrow: 1 },

  // Une carte de notification.
  carte: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12,
    padding: 16, gap: 8 },
  carteEntete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pastille: { width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center' },
  etiquette: { flex: 1, color: '#111', fontSize: 14, fontWeight: '700' },
  points: { width: 24, alignItems: 'flex-end' },

  carteTitre: { color: '#111', fontSize: 17, fontWeight: '700',
    lineHeight: 22 },

  carteCorps: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  corps: { flex: 1, color: '#8e8e93', fontSize: 15, lineHeight: 21 },
  age: { color: '#b0b0b5', fontSize: 15 },
  vignette: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee',
    overflow: 'hidden' },

  voirPlus: { color: '#111', fontSize: 15, fontWeight: '500' },

  vide: { color: '#8e8e93', fontSize: 14, textAlign: 'center',
    paddingTop: '22%', paddingHorizontal: 40 },

  // Ecran des reglages.
  reglages: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
  carteReglage: { backgroundColor: '#fff', borderRadius: 12,
    overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, minHeight: 56 },
  ligneSuivante: { borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e7' },
  ligneNom: { flex: 1, color: '#111', fontSize: 16 },
  sectionTitre: { color: '#8a8a8e', fontSize: 14, fontWeight: '500',
    marginTop: 24, marginBottom: 8, marginLeft: 4 },
})
