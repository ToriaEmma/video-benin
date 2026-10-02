import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView, type VideoThumbnail } from 'expo-video'
import Svg, { Circle, Path } from 'react-native-svg'
import { Text, TextInput } from '../composants/Texte'
import { TexteCadre, TexteAlignement } from '../composants/Icones'

// Styles de titre proposes sous la bande de vignettes.
const STYLES = ['Aucun', 'Standard', 'Vector', 'Glitch', 'Tint', 'Emboss']

// Mode saisie libre : polices et couleurs proposees sous le texte.
const POLICES = ['Classic', 'Elegance', 'Neon', 'Retro']
const COULEURS = [
  '#ffffff', '#111111', '#e8485c', '#ef8d3c', '#eece4a', '#ff2856',
  '#c43cc0', '#45b4d8', '#3f7ff0', '#2b3fae',
]

// Nombre d'images extraites pour la bande de selection.
const NB_VIGNETTES = 7

const Oeil = ({ taille = 20, couleur = '#111' }: { taille?: number; couleur?: string }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <Circle cx="12" cy="12" r="3" fill={couleur} />
  </Svg>
)

const Interdit = ({ taille = 30, couleur = '#111' }: { taille?: number; couleur?: string }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="m6 18 12-12" />
  </Svg>
)

export default function Couverture({ uri, onAnnuler, onEnregistrer }: {
  uri: string
  onAnnuler: () => void
  // Index de l'image retenue dans la bande.
  onEnregistrer: (index: number) => void
}) {
  const { width } = useWindowDimensions()
  const lecteur = useVideoPlayer(uri, p => { p.muted = true })
  const [vignettes, setVignettes] = useState<VideoThumbnail[]>([])
  const [choisie, setChoisie] = useState(0)
  // Couverture prise dans la pellicule, qui prime sur les images extraites.
  const [importee, setImportee] = useState<string | null>(null)

  const importer = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: .9,
    })
    if (!r.canceled && r.assets[0]) setImportee(r.assets[0].uri)
  }
  const [style, setStyle] = useState(1)
  const [titre, setTitre] = useState('')
  // Saisie libre : ouverte en appuyant sur l'image sans template choisi.
  const [saisieLibre, setSaisieLibre] = useState(false)
  const [police, setPolice] = useState(0)
  const [couleur, setCouleur] = useState(0)
  const [aligne, setAligne] = useState<'center' | 'left' | 'right'>('center')

  // Images extraites a intervalles reguliers : ce sont les positions parmi
  // lesquelles choisir la couverture.
  useEffect(() => {
    let annule = false
    const extraire = async () => {
      try {
        const duree = lecteur.duration || 1
        const instants = Array.from(
          { length: NB_VIGNETTES },
          (_, i) => (duree * i) / NB_VIGNETTES,
        )
        const images = await lecteur.generateThumbnailsAsync(instants)
        if (!annule) setVignettes(images)
      } catch { /* Extraction impossible : la bande reste vide. */ }
    }
    const minuterie = setTimeout(extraire, 300)
    return () => { annule = true; clearTimeout(minuterie) }
  }, [lecteur])

  const largeurBande = width - 32 - 12 - 90
  const largeurVignette = largeurBande / NB_VIGNETTES

  if (saisieLibre) return (
    <SafeAreaView style={s.pageSaisie} edges={['top', 'bottom']}>
      <View style={s.enteteSaisie}>
        <Pressable hitSlop={10} onPress={() => setSaisieLibre(false)}>
          <Text style={s.termine}>Terminé</Text>
        </Pressable>
      </View>

      <View style={s.cadreSaisie}>
        {importee
          ? <Image source={{ uri: importee }} style={s.image} contentFit="contain" />
          : vignettes[choisie]
            ? <Image source={vignettes[choisie]} style={s.image} contentFit="contain" />
            : <VideoView player={lecteur} style={s.image}
                contentFit="contain" nativeControls={false} />}
        <TextInput style={[s.saisieTexte, {
          color: COULEURS[couleur], textAlign: aligne,
          fontStyle: POLICES[police] === 'Elegance' ? 'italic' : 'normal',
        }]}
          value={titre} onChangeText={setTitre} autoFocus multiline />
      </View>

      {/* Barre d'outils : cadre, alignement, puis les polices */}
      <View style={s.barreTexte}>
        <Pressable hitSlop={8}><TexteCadre taille={30} couleur="#fff" /></Pressable>
        <Pressable hitSlop={8}
          onPress={() => setAligne(a =>
            a === 'center' ? 'left' : a === 'left' ? 'right' : 'center')}>
          <TexteAlignement taille={30} couleur="#fff" />
        </Pressable>
        <View style={s.barreTrait} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.polices}>
          {POLICES.map((nom, i) => (
            <Pressable key={nom} onPress={() => setPolice(i)}
              style={[s.police, i === police && s.policeChoisie]}>
              <Text style={[
                s.policeTexte,
                nom === 'Elegance' && s.policeElegance,
                nom === 'Neon' && s.policeNeon,
                nom === 'Retro' && s.policeRetro,
              ]}>{nom}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Palette de couleurs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.palette}>
        {COULEURS.map((c, i) => (
          <Pressable key={c} onPress={() => setCouleur(i)}
            style={[s.pastille, { backgroundColor: c },
              i === couleur && s.pastilleChoisie]} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.page} edges={['top', 'bottom']}>
      <View style={s.entete}>
        <Pressable onPress={onAnnuler} hitSlop={10}>
          <Text style={s.enteteTexte}>Annuler</Text>
        </Pressable>
        <Pressable hitSlop={10}
          onPress={() => onEnregistrer(choisie)}>
          <Text style={s.enteteTexte}>Enregistrer</Text>
        </Pressable>
      </View>

      <Pressable style={s.cadre} onPress={() => setSaisieLibre(true)}>
        {importee
          ? <Image source={{ uri: importee }} style={s.image} contentFit="contain" />
          : vignettes[choisie]
            ? <Image source={vignettes[choisie]} style={s.image} contentFit="contain" />
            : <VideoView player={lecteur} style={s.image}
                contentFit="contain" nativeControls={false} />}

        {/* Cartouche de titre : il apparait des qu'un style autre
            qu'« Aucun » est selectionne, et se saisit au clavier. */}
        {style > 0 && (
          <View style={s.titreZone}>
            {STYLES[style] === 'Vector' && <>
              <View style={s.vectorCadreNoir} />
              <View style={s.vectorCadreBlanc} />
              <Text style={s.vectorPlusNoirHaut}>+</Text>
              <Text style={s.vectorPlusBlanc}>+</Text>
              <Text style={s.vectorPlusNoirBas}>+</Text>
              <View style={s.vectorPointHaut} />
              <View style={s.vectorPointBas} />
              <View style={s.vectorPointBlanc} />
            </>}
            <View style={[
              STYLES[style] !== 'Standard' && s.titreFond,
              STYLES[style] === 'Glitch' && s.titreFondNoir,
            ]}>
              <TextInput style={s.titreSaisie} value={titre} onChangeText={setTitre}
                placeholder="Saisis du texte" placeholderTextColor="rgba(255,255,255,.65)"
                multiline />
            </View>
          </View>
        )}
      </Pressable>

      <View style={s.apercuLigne}>
        <Oeil taille={20} couleur="#111" />
        <Text style={s.apercuTexte}>Aperçu</Text>
      </View>

      {/* Bande de selection : les images de la video, puis « Importer » */}
      <View style={s.bandeLigne}>
        <View style={s.bande}>
          {vignettes.map((v, i) => (
            <Pressable key={i} onPress={() => { setChoisie(i); setImportee(null) }}
              style={[
                { width: largeurVignette },
                s.bandeImage,
                i === choisie && s.bandeChoisie,
              ]}>
              <Image source={v} style={s.bandeApercu} contentFit="cover" />
            </Pressable>
          ))}
        </View>
        <Pressable style={s.importer} onPress={importer}>
          <Text style={s.importerPlus}>+</Text>
          <Text style={s.importerTexte}>Importer</Text>
        </Pressable>
      </View>

      {/* Styles de titre */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.styles}>
        {STYLES.map((nom, i) => (
          <Pressable key={nom} style={s.style} onPress={() => setStyle(i)}>
            <View style={[s.styleCarre, i === style && s.styleChoisi]}>
              {nom === 'Aucun' && <Interdit taille={30} couleur="#111" />}
              {nom === 'Standard' && <Text style={s.styleAa}>Aa</Text>}
              {nom === 'Vector' && (
                <View style={s.badgeVector}>
                  <Text style={s.badgeTexteBlanc}>TikTok</Text>
                </View>
              )}
              {nom === 'Glitch' && (
                <View style={s.badgeGlitchFond}>
                  <View style={s.badgeGlitchRouge} />
                  <View style={s.badgeGlitchNoir}>
                    <Text style={s.badgeTexteBlanc}>TikTok</Text>
                  </View>
                </View>
              )}
              {nom === 'Tint' && (
                <View style={s.badgeTintFond}>
                  <View style={s.badgeTintCyan} />
                  <View style={s.badgeTintBlanc}>
                    <Text style={s.badgeTexteNoir}>TikTok</Text>
                  </View>
                </View>
              )}
              {nom === 'Emboss' && (
                <View style={s.badgeEmboss}>
                  <Text style={s.badgeTexteBlanc}>TikTok</Text>
                </View>
              )}
            </View>
            <Text style={[s.styleNom, i === style && s.styleNomChoisi]}>{nom}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },

  entete: { flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12, minHeight: 48, alignItems: 'center' },
  enteteTexte: { color: '#111', fontSize: 21, fontWeight: '400' },

  cadre: { marginHorizontal: 22, flex: 1, backgroundColor: '#dfe1e3',
    borderRadius: 2, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },

  // --- Mode saisie libre : fond assombri, clavier ouvert ---
  pageSaisie: { flex: 1, backgroundColor: '#8f8f8f' },
  enteteSaisie: { alignItems: 'flex-end', paddingHorizontal: 16,
    paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  termine: { color: '#fff', fontSize: 19, fontWeight: '600' },
  cadreSaisie: { marginHorizontal: 30, flex: 1, backgroundColor: '#d4d4d4',
    borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
  saisieTexte: { position: 'absolute', left: 20, right: 20,
    fontSize: 27, fontWeight: '700', padding: 0 },

  barreTexte: { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 12 },
  barreTrait: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,.5)' },
  polices: { gap: 10, paddingRight: 14 },
  police: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,.55)', borderRadius: 22,
    paddingVertical: 8, paddingHorizontal: 18, justifyContent: 'center' },
  policeChoisie: { borderColor: '#fff', borderWidth: 2 },
  policeTexte: { color: '#fff', fontSize: 17, fontWeight: '600' },
  policeElegance: { fontStyle: 'italic', fontWeight: '400' },
  policeNeon: { color: '#f2e9a0' },
  policeRetro: { fontStyle: 'italic', fontWeight: '800' },

  palette: { gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  pastille: { width: 42, height: 42, borderRadius: 21, borderWidth: 2.5,
    borderColor: '#fff' },
  pastilleChoisie: { borderWidth: 4 },

  // --- Cartouche de titre pose sur l'image ---
  titreZone: { position: 'absolute', left: 24, right: 24, top: '40%' },
  titreFond: { backgroundColor: '#f0455c', borderRadius: 2,
    paddingVertical: 18, paddingHorizontal: 16 },
  titreFondNoir: { backgroundColor: '#111' },
  titreSaisie: { color: '#fff', fontSize: 30, fontWeight: '400',
    textAlign: 'center', padding: 0, minHeight: 36 },

  // Decorations du style « Vector » : deux cadres decales, croix et points.
  vectorCadreNoir: { position: 'absolute', left: -8, right: 4, top: -14, bottom: 18,
    borderWidth: 2.5, borderColor: '#111' },
  vectorCadreBlanc: { position: 'absolute', left: -4, right: 8, top: -4, bottom: 8,
    borderWidth: 2.5, borderColor: '#fff' },
  vectorPlusNoirHaut: { position: 'absolute', left: -2, top: -22, color: '#111',
    fontSize: 24, fontWeight: '700' },
  vectorPlusBlanc: { position: 'absolute', right: -6, top: -6, color: '#fff',
    fontSize: 24, fontWeight: '700' },
  vectorPlusNoirBas: { position: 'absolute', right: 2, bottom: 6, color: '#111',
    fontSize: 24, fontWeight: '700' },
  vectorPointHaut: { position: 'absolute', right: -2, top: -16, width: 7, height: 7,
    borderRadius: 4, backgroundColor: '#111' },
  vectorPointBas: { position: 'absolute', right: 2, bottom: 20, width: 7, height: 7,
    borderRadius: 4, backgroundColor: '#111' },
  vectorPointBlanc: { position: 'absolute', left: 2, bottom: 18, width: 6, height: 6,
    borderRadius: 3, backgroundColor: '#fff' },

  apercuLigne: { flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 14 },
  apercuTexte: { color: '#111', fontSize: 17, fontWeight: '600' },

  bandeLigne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, marginBottom: 18 },
  bande: { flex: 1, flexDirection: 'row', borderRadius: 4, overflow: 'hidden' },
  bandeImage: { height: 86, overflow: 'hidden' },
  bandeApercu: { width: '100%', height: '100%' },
  // L'image retenue deborde de la bande sur les quatre cotes, cadre rouge arrondi.
  bandeChoisie: { borderWidth: 3, borderColor: '#ff2856', borderRadius: 10,
    height: 98, marginVertical: -6 },

  importer: { width: 90, height: 86, borderRadius: 10, backgroundColor: '#f1f1f2',
    alignItems: 'center', justifyContent: 'center', gap: 2 },
  importerPlus: { color: '#111', fontSize: 30, lineHeight: 32, fontWeight: '300' },
  importerTexte: { color: '#111', fontSize: 13 },

  styles: { paddingHorizontal: 16, gap: 14, paddingBottom: 6 },
  style: { alignItems: 'center', gap: 8, width: 82 },
  styleCarre: { width: 82, height: 76, borderRadius: 12, backgroundColor: '#f1f1f2',
    alignItems: 'center', justifyContent: 'center' },
  styleChoisi: { borderWidth: 2.5, borderColor: '#ff2856', backgroundColor: '#fff' },
  styleAa: { color: '#111', fontSize: 28, fontWeight: '700' },
  badgeTexteBlanc: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeTexteNoir: { color: '#111', fontSize: 11, fontWeight: '700' },
  badgeVector: { backgroundColor: '#ff2856', borderRadius: 3,
    paddingVertical: 4, paddingHorizontal: 7 },
  badgeGlitchFond: { width: 54, height: 26, justifyContent: 'center' },
  badgeGlitchRouge: { position: 'absolute', left: 4, right: 0, top: 3, bottom: 0,
    backgroundColor: '#ff2856', borderRadius: 3 },
  badgeGlitchNoir: { backgroundColor: '#111', borderRadius: 3,
    paddingVertical: 4, paddingHorizontal: 7, alignSelf: 'flex-start' },
  badgeTintFond: { width: 54, height: 26, justifyContent: 'center' },
  badgeTintCyan: { position: 'absolute', left: 0, right: 4, top: 0, bottom: 3,
    backgroundColor: '#16cce0', borderRadius: 3 },
  badgeTintBlanc: { backgroundColor: '#fff', borderRadius: 3, borderWidth: 1,
    borderColor: '#111', paddingVertical: 3, paddingHorizontal: 6,
    alignSelf: 'flex-end' },
  badgeEmboss: { backgroundColor: '#111', borderRadius: 13,
    paddingVertical: 5, paddingHorizontal: 8 },
  styleNom: { color: '#111', fontSize: 15 },
  styleNomChoisi: { color: '#ff2856' },
})
