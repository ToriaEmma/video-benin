// Sections du menu du profil (☰), branchees sur les vraies donnees :
// code QR du profil, sons favoris, activite recente et statistiques.
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, Share } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import qrcode from 'qrcode-generator'
import { Text } from './Texte'
import { apiNotifications, apiVideos, type EvenementApi, type VideoApi } from '../lib/api'
import { useFavorisSons, basculerFavoriSon } from '../lib/favorisSons'
import { lienProfil } from '../lib/lien'

// ---------------- Code QR ----------------

function DessinQR({ texte, taille }: { texte: string; taille: number }) {
  const modules = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(texte)
    qr.make()
    const n = qr.getModuleCount()
    const cases: [number, number][] = []
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (qr.isDark(l, c)) cases.push([c, l])
    return { n, cases }
  }, [texte])
  // Marge blanche de 4 modules autour, exigee par la norme pour la lecture.
  const total = modules.n + 8
  return (
    <Svg width={taille} height={taille} viewBox={`0 0 ${total} ${total}`}>
      <Rect x={0} y={0} width={total} height={total} fill="#fff" />
      {modules.cases.map(([x, y]) => <Rect key={`${x}-${y}`} x={x + 4} y={y + 4} width={1.02} height={1.02} fill="#111" />)}
    </Svg>
  )
}

export function CodeQR({ pseudo }: { pseudo: string }) {
  const lien = lienProfil(pseudo)
  const [copie, setCopie] = useState(false)
  const copier = async () => {
    try {
      if (Platform.OS === 'web') await navigator.clipboard.writeText(lien)
      else await Share.share({ message: lien })
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch { /* Copie refusee : le lien reste affiche. */ }
  }
  return (
    <View style={s.centre}>
      <View style={s.carteQR}>
        <DessinQR texte={lien} taille={210} />
        <Text style={s.pseudoQR}>{pseudo}</Text>
      </View>
      <Text style={s.aide}>Scanne ce code avec l’appareil photo d’un téléphone pour ouvrir ton profil.</Text>
      <Text style={s.lien} selectable>{lien}</Text>
      <View style={s.boutons}>
        <Pressable style={[s.bouton, copie && s.boutonFait]} onPress={copier} accessibilityRole="button">
          <Text style={s.boutonTexte}>{copie ? 'Lien copié ✓' : 'Copier le lien'}</Text>
        </Pressable>
        <Pressable style={[s.bouton, s.boutonGris]} accessibilityRole="button"
          onPress={() => Share.share({ message: `Retrouve ${pseudo} sur TockTick\n${lien}`, url: lien }).catch(() => {})}>
          <Text style={[s.boutonTexte, s.boutonGrisTexte]}>Partager</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ---------------- Ta musique ----------------

export function TaMusique() {
  const { favoris } = useFavorisSons()
  if (!favoris.length) {
    return <Text style={s.vide}>Aucun son en favori. Touche le disque d’une vidéo, puis « Ajouter aux favoris ».</Text>
  }
  return (
    <View style={s.liste}>
      {favoris.map(son => (
        <View key={son.id} style={s.ligne}>
          <View style={[s.pochette, { backgroundColor: son.couleur }]}>
            <Text style={s.pochetteLettre}>{son.titre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.ligneCorps}>
            <Text style={s.ligneTitre} numberOfLines={1}>{son.titre}</Text>
            <Text style={s.ligneDetail} numberOfLines={1}>{son.artiste}{son.original ? ' · son original' : ''}</Text>
          </View>
          <Pressable onPress={() => basculerFavoriSon(son)} hitSlop={8} accessibilityRole="button"
            accessibilityLabel={`Retirer ${son.titre} des favoris`}>
            <Text style={s.retirer}>Retirer</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}

// ---------------- Centre des activites ----------------

const PHRASES: Record<EvenementApi['genre'], string> = {
  abonnement: 'a commencé à te suivre',
  jaime: 'a aimé ta vidéo',
  commentaire: 'a commenté',
}

const ilYa = (date: number) => {
  const m = Math.round((Date.now() - date) / 60000)
  if (m < 1) return 'à l’instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.round(h / 24)} j`
}

export function CentreActivites() {
  const [evenements, setEvenements] = useState<EvenementApi[] | null>(null)
  useEffect(() => {
    let valable = true
    apiNotifications.liste().then(e => { if (valable) setEvenements(e) }).catch(() => { if (valable) setEvenements([]) })
    return () => { valable = false }
  }, [])
  if (!evenements) return <ActivityIndicator style={s.attente} color="#111" />
  if (!evenements.length) return <Text style={s.vide}>Aucune activité pour l’instant. Les abonnements, j’aime et commentaires sur tes vidéos apparaîtront ici.</Text>
  return (
    <View style={s.liste}>
      {evenements.map((e, i) => (
        <View key={i} style={s.ligne}>
          <View style={[s.pochette, s.avatar]}><Text style={s.pochetteLettre}>{e.pseudo.charAt(0).toUpperCase()}</Text></View>
          <View style={s.ligneCorps}>
            <Text style={s.ligneTitre} numberOfLines={2}>
              {e.pseudo} <Text style={s.ligneDetail}>{PHRASES[e.genre]}{e.texte ? ` : « ${e.texte} »` : ''}</Text>
            </Text>
            <Text style={s.ligneDetail}>{ilYa(e.date)}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ---------------- Studio createur ----------------

const nombre = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M` : n >= 1000 ? `${(n / 1000).toFixed(1)} k` : String(n)

export function StudioCreateur({ pseudo }: { pseudo: string }) {
  const [videos, setVideos] = useState<VideoApi[] | null>(null)
  useEffect(() => {
    let valable = true
    apiVideos.duProfil(pseudo, { limite: 50 }).then(v => { if (valable) setVideos(v) }).catch(() => { if (valable) setVideos([]) })
    return () => { valable = false }
  }, [pseudo])
  if (!videos) return <ActivityIndicator style={s.attente} color="#111" />
  const vues = videos.reduce((t, v) => t + (v.vues ?? 0), 0)
  const aime = videos.reduce((t, v) => t + v.nbAime, 0)
  const commentaires = videos.reduce((t, v) => t + v.nbCommentaires, 0)
  const meilleure = [...videos].sort((a, b) => (b.vues ?? 0) - (a.vues ?? 0))[0]
  return (
    <View style={s.liste}>
      <View style={s.tuiles}>
        {[['Publications', videos.length], ['Vues', vues], ['J’aime', aime], ['Commentaires', commentaires]].map(([nom, n]) => (
          <View key={nom as string} style={s.tuile}>
            <Text style={s.tuileNombre}>{nombre(n as number)}</Text>
            <Text style={s.tuileNom}>{nom}</Text>
          </View>
        ))}
      </View>
      {meilleure && (
        <View style={s.meilleure}>
          <Text style={s.ligneDetail}>Ta vidéo la plus vue</Text>
          <Text style={s.ligneTitre} numberOfLines={2}>{meilleure.legende || 'Sans légende'}</Text>
          <Text style={s.ligneDetail}>{nombre(meilleure.vues ?? 0)} vues · {nombre(meilleure.nbAime)} j’aime</Text>
        </View>
      )}
      <Text style={s.aide}>Pour modifier la visibilité ou les commentaires de plusieurs vidéos, va dans Paramètres et confidentialité › Gérer les publications.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  centre: { alignItems: 'center', gap: 14, paddingTop: 10 },
  carteQR: { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e2e2e2' },
  pseudoQR: { fontSize: 17, fontWeight: '700', color: '#111' },
  aide: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 18 },
  lien: { fontSize: 13, color: '#111' },
  boutons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  bouton: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  boutonFait: { backgroundColor: '#1fa774' },
  boutonGris: { backgroundColor: '#f1f1f2' },
  boutonTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
  boutonGrisTexte: { color: '#111' },
  vide: { fontSize: 14, color: '#777', lineHeight: 20, paddingTop: 12 },
  attente: { marginTop: 30 },
  liste: { gap: 4, paddingTop: 6 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  pochette: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  avatar: { borderRadius: 22, backgroundColor: '#e8485c' },
  pochetteLettre: { color: '#fff', fontWeight: '700', fontSize: 17 },
  ligneCorps: { flex: 1, gap: 2 },
  ligneTitre: { fontSize: 14.5, fontWeight: '600', color: '#111' },
  ligneDetail: { fontSize: 13, color: '#777', fontWeight: '400' },
  retirer: { fontSize: 13.5, color: '#ff2856', fontWeight: '600' },
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tuile: { flexBasis: '46%', flexGrow: 1, backgroundColor: '#f6f6f7', borderRadius: 10, padding: 14, gap: 4 },
  tuileNombre: { fontSize: 22, fontWeight: '800', color: '#111', fontVariant: ['tabular-nums'] },
  tuileNom: { fontSize: 13, color: '#666' },
  meilleure: { backgroundColor: '#f6f6f7', borderRadius: 10, padding: 14, gap: 4, marginVertical: 8 },
})
