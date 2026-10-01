// ============================================================
// Onglet « Amis » : fil video plein ecran sombre, surmonte d'une
// rangee de stories.
//
// Deux etats, commandes par le defilement du fil :
//   - deploye (en haut du fil) : les bulles de stories en 76pt,
//     la video dessous avec des coins hauts arrondis ;
//     - replie (des que ca defile) : les bulles se tassent en une
//     grappe de petits avatars en haut a gauche, la video passe
//     plein cadre derriere l'entete.
//
// La mecanique de lecture est celle de Fil.tsx : un lecteur par
// carte, seule la carte visible lit.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, FlatList, Pressable, ScrollView, StyleSheet, Share,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native'
import { Text } from '../composants/Texte'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LinearGradient } from 'expo-linear-gradient'
import { useEvent } from 'expo'
import {
  etat, abreger, type Video as VideoType, type Story,
} from '../lib/demo'
import { useAuth } from '../lib/auth'
import Commentaires from '../composants/Commentaires'
import Decouvrir from './Decouvrir'
import {
  CoeurFil, BulleFil, PartageFil, Favori, LecturePleine, LoupeEntete,
  NoteDisque, SonNote, Chevron, AjoutPersonne, AvionEnvoi, ListeLecture,
  PlusStory, EtincelleEtiquette,
} from '../composants/Icones'

// Au-dela de ce decalage, la rangee de stories se tasse. Un seuil bas
// suffit : le premier geste vers le haut doit deja rendre l'ecran a la
// video.
const SEUIL_REPLI = 48

// Hauteur de l'entete (zone sure comprise) et de la rangee de stories.
// Deployee, la carte repousse la video d'autant, pour que les bulles ne la
// recouvrent pas ; repliee, la video remonte sous l'entete.
const HAUT_ENTETE = 54 + 20 + 10
const HAUT_STORIES = 76 + 7 + 18 + 12

// Habillage de demonstration des cartes : effet, son et liste de lecture
// n'existent pas encore dans les donnees, on les derive de la video pour
// que chaque carte garde les siens d'un rendu a l'autre.
const EFFETS = [
  { nom: 'Lumière douce', couleur: '#ff8a3d' },
  { nom: 'Vintage 229', couleur: '#8d6cff' },
  { nom: 'Néon Cotonou', couleur: '#1ec0f0' },
  { nom: 'Grain argentique', couleur: '#49c96d' },
  { nom: 'Coucher chaud', couleur: '#ff4d7e' },
]
const SONS = [
  { titre: 'Agbadja remix', artiste: 'DJ Zem' },
  { titre: 'Amiwo Groove', artiste: 'Mama Cuisine' },
  { titre: 'Dantokpa Beat', artiste: 'Vie Cotonou' },
  { titre: 'Zem Challenge', artiste: 'Rire 229' },
  { titre: 'Fils de Parakou', artiste: 'Culture BJ' },
]
const LISTES = [
  'Cotonou by night', 'Cuisine du pays', 'Marchés du Bénin',
  'Éclats de rire', 'Savoir-faire',
]

// Index stable deduit de l'identifiant : la meme video garde le meme
// habillage sans qu'il faille le stocker.
const empreinte = (id: string) => {
  let n = 0
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 997
  return n
}

// ------------------------------------------------------------
// Rangee de stories.
// ------------------------------------------------------------

function Bulle({ story, onOuvrir }: {
  story: Story; onOuvrir?: (pseudo: string) => void
}) {
  return (
    <Pressable style={s.bulle} onPress={() => onOuvrir?.(story.pseudo)}>
      <View style={[s.anneau, story.vue && s.anneauVu]}>
        <View style={s.anneauInterieur}>
          <View style={s.bulleAvatar}>
            <Text style={s.bulleLettre}>
              {story.pseudo.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Compte propose : voile sombre et icone d'ajout, par-dessus
          l'avatar, pour le distinguer d'un recit a regarder. */}
      {story.suggestion && (
        <View style={s.voileSuggestion}>
          <AjoutPersonne taille={26} couleur="#fff" />
        </View>
      )}

      <Text style={s.bulleLibelle} numberOfLines={1}>
        {story.libelle ?? story.pseudo}
      </Text>
    </Pressable>
  )
}

function BulleCreer({ pseudo }: { pseudo: string }) {
  return (
    <Pressable style={s.bulle}>
      <View style={s.bulleAvatarSimple}>
        <Text style={s.bulleLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={s.pastillePlus}>
        <PlusStory taille={12} couleur="#fff" />
      </View>
      <Text style={s.bulleLibelle} numberOfLines={1}>Créer</Text>
    </Pressable>
  )
}

// Grappe repliee : son propre avatar, puis deux ou trois autres qui se
// chevauchent a moitie.
function Grappe({ pseudo, stories }: {
  pseudo: string; stories: Story[]
}) {
  return (
    <View style={s.grappe}>
      <View style={s.grappeMoi}>
        <View style={s.petitAvatar}>
          <Text style={s.petitLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.petitePastillePlus}>
          <PlusStory taille={9} couleur="#fff" />
        </View>
      </View>

      {stories.slice(0, 3).map((st, i) => (
        <View key={st.id} style={i > 0 && s.grappeChevauche}>
          <View style={[s.petitAnneau, st.vue && s.anneauVu]}>
            <View style={s.petitAvatar}>
              <Text style={s.petitLettre}>
                {st.pseudo.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

// ------------------------------------------------------------
// Carte video. Reprise de Fil.tsx, avec l'habillage « Amis » :
// etiquette d'effet, ligne de son, barre de liste de lecture.
// ------------------------------------------------------------

function Carte({
  item, actif, passage, hauteur, arrondi, decalage, onCommenter, onVisiter,
}: {
  item: VideoType
  actif: boolean
  // Numero du passage courant de la carte : il change a chaque fois que
  // la carte redevient visible, ce qui perime la pause demandee avant.
  passage: number
  hauteur: number
  // Coins hauts arrondis quand la rangee de stories est deployee.
  arrondi: boolean
  // Hauteur reservee en haut par l'entete et les stories. Deployees, la
  // video commence dessous ; repliees, le decalage retombe a zero et la
  // video occupe tout le cadre.
  decalage: number
  onCommenter: (v: VideoType) => void
  onVisiter?: (pseudo: string) => void
}) {
  const lecteur = useVideoPlayer(item.url, p => {
    p.loop = true; p.timeUpdateEventInterval = 0.25
  })

  const [aime, setAime] = useState(item.aime)
  const [nbAime, setNbAime] = useState(item.nbAime)
  const [favori, setFavori] = useState(false)
  const [developpe, setDeveloppe] = useState(false)
  // Pause demandee par l'utilisateur, a distinguer d'un chargement. La
  // demande est rangee avec le passage de la carte auquel elle se
  // rapporte : quand la carte redevient visible, le passage a change et
  // la demande cesse d'elle meme de s'appliquer, sans qu'il faille la
  // remettre a zero depuis l'effet de lecture.
  const [pausee, setPausee] = useState(-1)
  const pauseVoulue = pausee === passage

  const { isPlaying } = useEvent(
    lecteur, 'playingChange', { isPlaying: lecteur.playing })

  useEffect(() => {
    // Seule la carte visible lit : les autres restent en pause, pour ne
    // pas consommer de donnees sur des videos jamais regardees.
    if (actif) lecteur.play()
    else lecteur.pause()
  }, [actif, lecteur])

  const [habillage] = useState(() => {
    const n = empreinte(item.id)
    return {
      effet: EFFETS[n % EFFETS.length],
      son: SONS[n % SONS.length],
      liste: LISTES[n % LISTES.length],
      // Anciennete affichee a cote du pseudo.
      minutes: 7 + (n % 54),
    }
  })

  const basculerAime = () => {
    const n = !aime
    setAime(n); setNbAime(v => v + (n ? 1 : -1))
  }

  const partager = async () => {
    try {
      await Share.share({
        message: `${item.legende}\n\nRegarde cette vidéo sur Vidéo Bénin`,
      })
    } catch { /* annule */ }
  }

  return (
    <View style={[s.carte, { height: hauteur }]}>
      <View style={[s.cadre, { top: decalage }, arrondi && s.cadreArrondi]}>
        <Pressable style={StyleSheet.absoluteFill}
          onPress={() => {
            if (isPlaying) { setPausee(passage); lecteur.pause() }
            else { setPausee(-1); lecteur.play() }
          }}>
          <VideoView player={lecteur} style={StyleSheet.absoluteFill}
            contentFit="cover" nativeControls={false} />
        </Pressable>

        <LinearGradient colors={['transparent', 'rgba(0,0,0,.55)']}
          style={s.ombre} pointerEvents="none" />

        {pauseVoulue && actif && (
          <Pressable style={s.lecture}
            onPress={() => { setPausee(-1); lecteur.play() }}>
            <LecturePleine taille={60} couleur="rgba(255,255,255,.65)" />
          </Pressable>
        )}

        {/* Rail d'actions, de haut en bas : avatar et sa pastille d'envoi,
            j'aime, commentaires, favori, partage, disque. */}
        <View style={s.actions}>
          <Pressable style={s.avatarBoite} onPress={() => onVisiter?.(item.pseudo)}>
            <View style={s.avatar}>
              <Text style={s.avatarLettre}>
                {item.pseudo.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.pastilleEnvoi}>
              <AvionEnvoi taille={13} couleur="#fff" />
            </View>
          </Pressable>

          <Pressable style={s.action} onPress={basculerAime} hitSlop={6}>
            <CoeurFil taille={34} couleur={aime ? '#ff2856' : '#fff'} />
            <Text style={s.compteur}>{abreger(nbAime)}</Text>
          </Pressable>

          <Pressable style={s.action} onPress={() => onCommenter(item)} hitSlop={6}>
            <BulleFil taille={34} couleur="#fff" />
            <Text style={s.compteur}>{abreger(item.nbCommentaires)}</Text>
          </Pressable>

          <Pressable style={s.action} onPress={() => setFavori(!favori)} hitSlop={6}>
            <Favori taille={32} plein={favori} couleur={favori ? '#fcd116' : '#fff'} />
            <Text style={s.compteur}>{abreger(item.vues % 900)}</Text>
          </Pressable>

          <Pressable style={s.action} onPress={partager} hitSlop={6}>
            <PartageFil taille={34} couleur="#fff" />
            <Text style={s.compteur}>Partager</Text>
          </Pressable>

          <View style={s.disque}>
            <NoteDisque taille={22} couleur="#fff" />
          </View>
      </View>

      {/* Bloc du bas a gauche : effet, auteur, legende, son. */}
      <View style={s.infos}>
        <View style={s.effet}>
          <View style={[s.effetBadge, { backgroundColor: habillage.effet.couleur }]}>
            <EtincelleEtiquette taille={11} couleur="#fff" />
          </View>
          <Text style={s.effetTexte} numberOfLines={1}>
            Effet · {habillage.effet.nom}
          </Text>
        </View>

        <View style={s.ligneAuteur}>
          <Pressable onPress={() => onVisiter?.(item.pseudo)}>
            <Text style={s.pseudo}>{item.pseudo}</Text>
          </Pressable>
          <Text style={s.anciennete}> · Il y a {habillage.minutes} min</Text>
        </View>

        {!!item.legende && (
          <Pressable onPress={() => setDeveloppe(!developpe)}>
            <Text style={s.legende} numberOfLines={developpe ? undefined : 2}>
              {item.legende}
            </Text>
          </Pressable>
        )}

        <View style={s.ligneSon}>
          <SonNote taille={14} couleur="#fff" />
          <Text style={s.sonTexte} numberOfLines={1}>
            Contient : {habillage.son.titre} - {habillage.son.artiste}
          </Text>
        </View>
      </View>

      {/* Barre pleine largeur de la liste de lecture, juste au-dessus de
          la barre de navigation. */}
      <Pressable style={s.barreListe}>
        <ListeLecture taille={17} couleur="#fff" />
        <Text style={s.barreListeTexte} numberOfLines={1}>
          Liste de lecture · {habillage.liste}
        </Text>
        <View style={s.barreListeChevron}>
          <Chevron taille={18} couleur="rgba(255,255,255,.85)" />
        </View>
      </Pressable>
      </View>
    </View>
  )
}

// ------------------------------------------------------------
// Ecran.
// ------------------------------------------------------------

export default function Amis({ onVisiter, onOuvrirVideo }: {
  onVisiter?: (pseudo: string) => void
  // Ouvre le lecteur plein ecran depuis la grille de la recherche.
  onOuvrirVideo?: (videos: VideoType[], index: number) => void
}) {
  const { profil } = useAuth()
  const pseudo = profil?.pseudo ?? 'moi'
  const liste = etat.videos
  const stories = etat.stories

  const [index, setIndex] = useState(0)
  // Nombre de changements de carte depuis l'ouverture : il sert de numero
  // de passage aux cartes, pour perimer les pauses demandees.
  const [passage, setPassage] = useState(0)
  const [videoCom, setVideoCom] = useState<VideoType | null>(null)
  // Vrai des que le fil a quitte le haut : la rangee de stories se tasse.
  const [replie, setReplie] = useState(false)
  // La recherche recouvre l'ecran, ouverte par la loupe de l'entete.
  const [recherche, setRecherche] = useState(false)
  // Hauteur reelle du fil : c'est le pas du defilement par ecran. La
  // mesurer evite de dependre de la hauteur de la fenetre, trop grande.
  const [hauteur, setHauteur] = useState(0)

  // Le repli se decide au defilement, jamais dans un effet : l'etat suit
  // directement le geste.
  const auDefilement = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y
    setReplie(v => (v ? y > SEUIL_REPLI / 2 : y > SEUIL_REPLI))
  }

  if (recherche) return (
    <Decouvrir
      onVisiter={p => { setRecherche(false); onVisiter?.(p) }}
      onOuvrirVideo={(videos, i) => {
        setRecherche(false); onOuvrirVideo?.(videos, i)
      }}
    />
  )

  return (
    <View style={s.page}>
      {/* Le fil occupe tout l'ecran des le premier rendu : l'entete et les
          stories se posent par-dessus. Sa hauteur ne bouge donc pas quand
          la rangee se tasse, et le pas du defilement reste juste. */}
      <View style={s.fil}
        onLayout={e => setHauteur(e.nativeEvent.layout.height)}>
        <FlatList
          data={liste}
          keyExtractor={v => v.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={hauteur || undefined}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={auDefilement}
          getItemLayout={(_, i) => (
            { length: hauteur, offset: hauteur * i, index: i })}
          onMomentumScrollEnd={e => {
            if (hauteur <= 0) return
            const n = Math.round(e.nativeEvent.contentOffset.y / hauteur)
            if (n === index) return
            setIndex(n); setPassage(v => v + 1)
          }}
          renderItem={({ item, index: i }) => (
            <Carte item={item} actif={i === index} passage={passage}
              hauteur={hauteur} arrondi={!replie}
              decalage={replie ? 0 : HAUT_ENTETE + HAUT_STORIES}
              onCommenter={setVideoCom} onVisiter={onVisiter} />
          )}
        />
      </View>

      {/* Entete : titre centre et loupe. Posee au-dessus de tout, elle
          recoit un voile sombre une fois la video passee dessous. */}
      <View style={[s.entete, replie && s.enteteVoilee]}>
        <Text style={s.titre}>Amis</Text>
        <Pressable style={s.loupe} hitSlop={10}
          onPress={() => setRecherche(true)}>
          <LoupeEntete taille={24} couleur="#fff" />
        </Pressable>
      </View>

      {/* Rangee de stories, deployee ou tassee. */}
      {replie ? (
        <View style={s.grappeBoite}>
          <Grappe pseudo={pseudo} stories={stories} />
        </View>
      ) : (
        <ScrollView horizontal style={s.rangee}
          contentContainerStyle={s.rangeeContenu}
          showsHorizontalScrollIndicator={false}>
          <BulleCreer pseudo={pseudo} />
          {stories.map(st => (
            <Bulle key={st.id} story={st} onOuvrir={onVisiter} />
          ))}
        </ScrollView>
      )}

      {videoCom && (
        <Commentaires video={videoCom} pseudo={pseudo}
          onFermer={() => setVideoCom(null)} />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },

  // --- Entete ---
  // Toujours posee par-dessus le fil : seul le voile sombre apparait
  // quand la video remonte derriere elle.
  entete: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
    paddingTop: 54, paddingBottom: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  enteteVoilee: { backgroundColor: 'rgba(0,0,0,.42)' },
  titre: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loupe: {
    position: 'absolute', right: 10, bottom: 4,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },

  // --- Rangee de stories deployee ---
  // Posee sous l'entete, par-dessus le fil : la carte reserve sa hauteur
  // en haut de la video, pour que les bulles ne la recouvrent pas.
  rangee: {
    position: 'absolute', left: 0, right: 0, top: HAUT_ENTETE,
    flexGrow: 0, zIndex: 4,
  },
  rangeeContenu: {
    flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingBottom: 12,
  },
  bulle: { width: 76, alignItems: 'center' },
  // Anneau cyan-vert de 2.5pt autour de l'avatar.
  anneau: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 2.5,
    borderColor: '#3fd0e0', alignItems: 'center', justifyContent: 'center',
  },
  anneauVu: { borderColor: 'rgba(255,255,255,.26)' },
  // Fin liseret noir entre l'anneau et l'avatar, comme la maquette.
  anneauInterieur: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 1.5,
    borderColor: '#000', alignItems: 'center', justifyContent: 'center',
  },
  bulleAvatar: {
    width: 65, height: 65, borderRadius: 33, backgroundColor: '#2c2c2e',
    alignItems: 'center', justifyContent: 'center',
  },
  // Bulle « Creer » : pas d'anneau, l'avatar occupe tout le cercle.
  bulleAvatarSimple: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#2c2c2e',
    alignItems: 'center', justifyContent: 'center',
  },
  bulleLettre: { color: '#fff', fontSize: 26, fontWeight: '700' },
  bulleLibelle: {
    color: '#fff', fontSize: 13, marginTop: 7, maxWidth: 76,
    textAlign: 'center',
  },
  // Pastille bleue « + », en bas a droite de la bulle « Creer ».
  pastillePlus: {
    position: 'absolute', right: 1, top: 54,
    width: 23, height: 23, borderRadius: 12, backgroundColor: '#1ec0f0',
    borderWidth: 2, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  // Voile du compte propose, avec son icone d'ajout de personne.
  voileSuggestion: {
    position: 'absolute', top: 0, width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,.52)',
    alignItems: 'center', justifyContent: 'center',
  },

  // --- Grappe tassee ---
  grappeBoite: {
    position: 'absolute', top: 52, left: 12, zIndex: 6,
  },
  grappe: { flexDirection: 'row', alignItems: 'center' },
  grappeMoi: { width: 34, height: 34, marginRight: 6 },
  // Chaque avatar suivant recouvre le precedent sur la moitie.
  grappeChevauche: { marginLeft: -17 },
  petitAnneau: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1.5,
    borderColor: '#3fd0e0', alignItems: 'center', justifyContent: 'center',
  },
  petitAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#2c2c2e',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  petitLettre: { color: '#fff', fontSize: 13, fontWeight: '700' },
  petitePastillePlus: {
    position: 'absolute', right: -3, bottom: -2,
    width: 15, height: 15, borderRadius: 8, backgroundColor: '#1ec0f0',
    borderWidth: 1.5, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },

  // --- Fil ---
  fil: { flex: 1 },
  carte: { width: '100%', backgroundColor: '#000' },
  // Cadre de la video : `top` recule quand les stories sont deployees.
  cadre: { position: 'absolute', left: 0, right: 0, bottom: 0,
    overflow: 'hidden' },
  cadreArrondi: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },

  ombre: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%' },
  lecture: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', opacity: .65,
  },

  // --- Rail d'actions ---
  actions: {
    position: 'absolute', right: 8, bottom: 74,
    alignItems: 'center', gap: 13, zIndex: 2,
  },
  action: { alignItems: 'center', gap: 2, minWidth: 44 },
  compteur: {
    color: '#fff', fontSize: 14, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 3,
  },
  avatarBoite: { width: 46, height: 52, alignItems: 'center', marginBottom: 4 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
    borderColor: '#fff', backgroundColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLettre: { color: '#fff', fontSize: 19, fontWeight: '700' },
  // Pastille rose a cheval sur le bas de l'avatar : envoyer a un ami.
  pastilleEnvoi: {
    position: 'absolute', bottom: 0,
    width: 23, height: 23, borderRadius: 12, backgroundColor: '#ff2856',
    alignItems: 'center', justifyContent: 'center',
  },
  disque: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#666',
    borderWidth: 7, borderColor: '#292929',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },

  // --- Bloc d'informations ---
  infos: { position: 'absolute', left: 12, right: 72, bottom: 62, zIndex: 2 },
  effet: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 9,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,.42)',
  },
  effetBadge: {
    width: 18, height: 18, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  effetTexte: { color: '#fff', fontSize: 13, fontWeight: '500' },

  ligneAuteur: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 },
  pseudo: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 3,
  },
  anciennete: {
    color: 'rgba(255,255,255,.72)', fontSize: 14,
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 3,
  },
  legende: {
    color: '#fff', fontSize: 15, lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 3,
  },
  ligneSon: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  sonTexte: {
    flex: 1, color: '#fff', fontSize: 14,
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 3,
  },

  // --- Barre de la liste de lecture ---
  barreListe: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,.52)',
  },
  barreListeTexte: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  // Le chevron pointe vers la gauche : on le retourne pour la droite.
  barreListeChevron: { transform: [{ rotate: '180deg' }] },
})
