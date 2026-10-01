import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Text } from '../composants/Texte'
import {
  Chevron, Croix, SonNote, Corbeille, Brouillon,
  MontageReglages, MontagePartage, MontageDuree, MontageClips,
  MontageTexte, MontageSticker, MontageEffets, MontageVoix,
  MontageFiltres, MontageSousTitres, OutilPlus,
} from '../composants/Icones'

// Colonne de droite : chaque entree ouvre un reglage de montage.
const OUTILS = [
  { nom: 'Paramètres', Icone: MontageReglages },
  { nom: 'Partager', Icone: MontagePartage },
  { nom: 'Modifier', Icone: MontageDuree, groupe: 2 },
  { nom: 'Modèles', Icone: MontageClips },
  { nom: 'Texte', Icone: MontageTexte },
  { nom: 'Stickers', Icone: MontageSticker },
  { nom: 'Effets', Icone: MontageEffets },
  { nom: 'Filtres', Icone: MontageFiltres },
  { nom: 'Effet vocal', Icone: MontageVoix },
  { nom: 'Sous-titres', Icone: MontageSousTitres },
]

export default function Montage({ uri, pseudo, onRetour, onSuivant, onOutil }: {
  uri: string
  pseudo: string
  onRetour: () => void
  onSuivant: () => void
  onOutil: (nom: string) => void
}) {
  const marges = useSafeAreaInsets()
  // Meme menu de sortie que l'ecran de tournage.
  const [menuSortie, setMenuSortie] = useState(false)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  const lecteur = useVideoPlayer(uri, p => { p.loop = true; p.muted = false })

  useEffect(() => {
    lecteur.play()
  }, [lecteur])

  return (
    <View style={[s.page, { paddingTop: marges.top }]}>
      <View style={s.viseur}>
        <VideoView player={lecteur} style={StyleSheet.absoluteFill}
          contentFit="contain" nativeControls={false} />

        {/* Barre du haut : retour, son choisi, puis la colonne d'outils */}
        <View style={s.haut}>
          <Pressable onPress={() => setMenuSortie(true)} hitSlop={12} style={s.hautBouton}>
            <Chevron taille={28} couleur="#fff" />
          </Pressable>
          <Pressable style={s.son} onPress={() => onOutil('Ajouter un son')}>
            <SonNote taille={16} couleur="#fff" />
            <Text style={s.sonTexte} numberOfLines={1}>son original</Text>
            <View style={s.sonTrait} />
            <Croix taille={16} couleur="#fff" />
          </Pressable>
          <View style={s.hautBouton} />
        </View>

        <View style={s.outils}>
          {OUTILS.map(({ nom, Icone, groupe }, i) => (
            <Pressable key={nom} onPress={() => onOutil(nom)} hitSlop={6}
              style={[s.outilLigne, groupe === 2 && s.outilGroupe]}>
              {groupe === 2 && <View style={s.outilFilet} />}
              {outilsDeplies && i > 1 && (
                <Text style={s.outilNom} numberOfLines={1}>{nom}</Text>
              )}
              <View style={s.outil}>
                <Icone taille={31} couleur="#fff" />
              </View>
            </Pressable>
          ))}
          <Pressable style={s.outil} hitSlop={6}
            onPress={() => setOutilsDeplies(v => !v)}>
            <View style={outilsDeplies ? s.chevronHaut : undefined}>
              <OutilPlus taille={31} couleur="#fff" />
            </View>
          </Pressable>
        </View>

        {menuSortie && (
          <>
            <Pressable style={s.menuVoile} onPress={() => setMenuSortie(false)} />
            <View style={s.menuSortie}>
              <Pressable style={s.menuLigne}
                onPress={() => { setMenuSortie(false); onRetour() }}>
                <Corbeille taille={20} couleur="#ed2753" />
                <Text style={[s.menuTexte, s.menuSupprimer]}>Supprimer</Text>
              </Pressable>
              <Pressable style={s.menuLigne}
                onPress={() => { setMenuSortie(false); onRetour() }}>
                <Brouillon taille={20} couleur="#111" />
                <Text style={s.menuTexte}>Enregistrer le brouillon</Text>
              </Pressable>
              <Pressable style={s.menuLigne}
                onPress={() => { setMenuSortie(false); onOutil('Envoyer à des amis') }}>
                <View style={s.menuAvatar} />
                <Text style={s.menuTexte}>Envoyer à des amis</Text>
              </Pressable>
            </View>
          </>
        )}

        <Pressable style={s.autocut} onPress={() => onOutil('AutoCut')}>
          <MontageEffets taille={17} couleur="#fff" />
          <Text style={s.autocutTexte}>AutoCut</Text>
        </Pressable>
      </View>

      {/* Pied : story a gauche, « Suivant » a droite */}
      <View style={[s.pied, { paddingBottom: 10 + marges.bottom }]}>
        <Pressable style={s.story} onPress={() => onOutil('Ta Story')}>
          <View style={s.storyAvatar}>
            <Text style={s.storyLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.storyTexte}>Ta Story</Text>
        </Pressable>
        <Pressable style={s.suivant} onPress={onSuivant}>
          <Text style={s.suivantTexte}>Suivant</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
  viseur: { flex: 1, minHeight: 0, borderRadius: 22, backgroundColor: '#171717',
    overflow: 'hidden' },

  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  hautBouton: { width: 32, minHeight: 36, justifyContent: 'center' },
  son: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '62%',
    backgroundColor: 'rgba(51,51,51,.53)', borderRadius: 30,
    paddingVertical: 10, paddingHorizontal: 16 },
  sonTexte: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  sonTrait: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,.4)' },

  outils: { position: 'absolute', right: 10, top: 74, gap: 14, alignItems: 'flex-end' },
  outil: { width: 38, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  // Libelle a gauche de l'icone quand la colonne est depliee.
  outilLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  outilNom: { color: '#fff', fontSize: 17, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 3 },
  chevronHaut: { transform: [{ rotate: '180deg' }] },
  // Les deux premieres entrees sont detachees du reste, comme la maquette.
  outilGroupe: { marginTop: 16 },
  outilFilet: { position: 'absolute', top: -8, width: 22, height: 1,
    backgroundColor: 'rgba(255,255,255,.38)' },

  menuVoile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 },
  menuSortie: { position: 'absolute', top: 70, left: 16, width: 236, zIndex: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 4 },
  menuLigne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
  menuTexte: { color: '#111', fontSize: 15, fontWeight: '500' },
  menuSupprimer: { color: '#ed2753' },
  menuAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d9c3a8' },

  autocut: { position: 'absolute', bottom: 18, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(51,51,51,.6)', borderRadius: 20,
    paddingVertical: 9, paddingHorizontal: 16 },
  autocutTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },

  pied: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingTop: 10 },
  story: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderRadius: 26, minHeight: 50 },
  storyAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#d9c3a8',
    alignItems: 'center', justifyContent: 'center' },
  storyLettre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  storyTexte: { color: '#111', fontSize: 16, fontWeight: '600' },
  suivant: { flex: 1, backgroundColor: '#ff2856', borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  suivantTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
