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
  View, FlatList, Pressable, ScrollView, StyleSheet, Share, PanResponder,
  ActivityIndicator,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native'
import { BARRE_ETAT_WEB } from '../lib/theme'
import { useFinDefilementWeb } from '../lib/finDefilement'
import { Text } from '../composants/Texte'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LinearGradient } from 'expo-linear-gradient'
import { useEvent } from 'expo'
import {
  etat, abreger, type Video as VideoType, type Story,
} from '../lib/demo'
import { useBascule } from '../lib/bascule'
import { montrerAvis } from '../lib/avis'
import { apiInteractions, apiVideos } from '../lib/api'
import { useAuth } from '../lib/auth'
import Commentaires from '../composants/Commentaires'
import Decouvrir from './Decouvrir'
import Suggestions from '../composants/Suggestions'
import {
  CoeurFil, BulleFil, PartageFil, Favori, LecturePleine, LoupeEntete,
  NoteDisque, SonNote, Chevron, AjoutPersonne, AvionEnvoi, ListeLecture,
  PlusStory, EtincelleEtiquette,
} from '../composants/Icones'

// Position de lecture affichee pendant le glissement, en « m:ss ».
const horloge = (secondes: number) => {
  const s = Math.max(0, Math.floor(secondes))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Au-dela de cette distance horizontale, le geste ouvre le profil de
// l'auteur. La comparaison avec l'ecart vertical se fait a part : le fil
// pagine a la verticale, un glissement oblique ne doit pas le detourner.
const SEUIL_LATERAL = 55

// Le premier geste vers le haut n'avance pas d'une video : il rend
// d'abord l'ecran entier a la premiere, en tassant la rangee de recits.
// La liste paginant, le moindre defilement sauterait sinon directement
// a la video suivante. On la fige donc tant que ce premier palier n'est
// pas franchi, et le geste suivant reprend son cours normal.

// Hauteur de l'entete (zone sure comprise) et de la rangee de stories.
// Deployee, la carte repousse la video d'autant, pour que les bulles ne la
// recouvrent pas ; repliee, la video remonte sous l'entete.
const HAUT_ENTETE = 54 - BARRE_ETAT_WEB + 20 + 10
const HAUT_STORIES = 76 + 7 + 18 + 12

// Habillage de demonstration des cartes : effet, son et liste de lecture
// n'existent pas encore dans les donnees, on les derive de la video pour
// que chaque carte garde les siens d'un rendu a l'autre.
const EFFETS = [
  { nom: 'Lumière douce', couleur: '#ff8a3d' },
  { nom: 'Vintage 229', couleur: '#8d6cff' },
  { nom: 'Néon Cotonou', couleur: '#1ec0f0' },
  { nom: 'Grain argentique', couleur: '#c43cc0' },
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

// Les videos viennent de l'API, qui porte `favori` ; les listes passees
// par un autre ecran ne l'ont pas toujours.
type VideoAmis = VideoType & { favori?: boolean }

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
  onErreur, suivi, onSuivi,
}: {
  item: VideoAmis
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
  onCommenter: (v: VideoAmis) => void
  onVisiter?: (pseudo: string) => void
  onErreur: (message: string) => void
  // Abonnement a l'auteur, tenu par l'ecran : la meme personne pouvant
  // publier plusieurs videos du fil, la pastille doit disparaitre sur
  // toutes ses cartes des qu'on s'abonne depuis l'une d'elles.
  suivi: boolean
  onSuivi: (pseudo: string, suivi: boolean) => void
}) {
  const lecteur = useVideoPlayer(item.url, p => {
    p.loop = true; p.timeUpdateEventInterval = 0.25
  })

  // J'aime et favori : affiches au toucher, puis envoyes un par un
  // jusqu'a ce que le serveur porte le dernier choix (voir lib/bascule).
  const [nbAime, setNbAime] = useState(item.nbAime)
  const [aime, basculerAimeServeur] = useBascule(item.aime,
    vise => (vise ? apiInteractions.aimer(item.id) : apiInteractions.retirerJaime(item.id)),
    { surReponse: r => setNbAime(r.nbAime), surErreur: e => onErreur(e.message) })
  const [favori, basculerFavori] = useBascule(Boolean(item.favori),
    vise => (vise ? apiInteractions.mettreEnFavori(item.id) : apiInteractions.retirerFavori(item.id)),
    { surErreur: e => onErreur(e.message) })
  const [developpe, setDeveloppe] = useState(false)
  // Pause demandee par l'utilisateur, a distinguer d'un chargement. La
  // demande est rangee avec le passage de la carte auquel elle se
  // rapporte : quand la carte redevient visible, le passage a change et
  // la demande cesse d'elle meme de s'appliquer, sans qu'il faille la
  // remettre a zero depuis l'effet de lecture.
  const [pausee, setPausee] = useState(-1)
  const pauseVoulue = pausee === passage
  const [progression, setProgression] = useState(0)
  // Deplacement en cours sur la barre : tant qu'il dure, la barre suit le
  // doigt et non le lecteur, qui continue d'avancer sous lui.
  const [glisse, setGlisse] = useState(false)
  // Largeur mesuree de la barre : elle convertit l'abscisse du doigt en
  // fraction de la duree. Mesuree plutot que deduite de la fenetre, les
  // marges laterales etant deja retirees.
  //
  // La reponse au geste etant creee une fois pour toutes, elle ne peut pas
  // lire un etat : la mesure passe donc par ce couple accesseur/depot, cree
  // avec elle et clos sur sa propre variable.
  const [mesure] = useState(() => {
    let largeur = 0
    return { lire: () => largeur, poser: (v: number) => { largeur = v } }
  })

  const { isPlaying } = useEvent(
    lecteur, 'playingChange', { isPlaying: lecteur.playing })

  useEffect(() => {
    // Seule la carte visible lit : les autres restent en pause, pour ne
    // pas consommer de donnees sur des videos jamais regardees.
    if (actif) lecteur.play()
    else lecteur.pause()
  }, [actif, lecteur])

  // Pendant un glissement la barre appartient au doigt : la relever depuis
  // le lecteur la ferait sauter en arriere a chaque tour du minuteur.
  useEffect(() => {
    if (!actif || glisse) return
    const minuteur = setInterval(() => {
      const duree = lecteur.duration
      if (duree > 0) setProgression((lecteur.currentTime / duree) * 100)
    }, 250)
    return () => clearInterval(minuteur)
  }, [actif, lecteur, glisse])

  // La vue part quand la carte devient celle qu'on regarde, et non a
  // chaque rendu. L'echec est silencieux : rater un comptage ne doit pas
  // interrompre le visionnage.
  useEffect(() => {
    if (!actif) return
    apiVideos.vue(item.id).catch(() => { /* Compteur de vues indisponible. */ })
  }, [actif, item.id])

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

  // Le serveur renvoie le decompte reel : on l'affiche d'abord de maniere
  // optimiste, puis on se recale dessus, et on revient en arriere si la
  // requete echoue.
  const basculerAime = () => {
    setNbAime(v => v + (aime ? -1 : 1))
    basculerAimeServeur()
  }


  const partager = async () => {
    try {
      await Share.share({
        message: `${item.legende}\n\nRegarde cette vidéo sur TockTick`,
      })
    } catch { /* annule */ }
  }

  // Abonnement depuis le fil, sur le meme modele que le j'aime :
  // affiche d'abord, confirme ensuite, defait si le serveur refuse.
  const suivre = () => {
    onSuivi(item.pseudo, true)
    apiInteractions.suivre(item.pseudo)
      .then(r => { onSuivi(item.pseudo, r.suivi); if (r.suivi) montrerAvis(`Vous êtes abonné(e) à ${item.pseudo}`) })
      .catch((e: Error) => { onSuivi(item.pseudo, false); onErreur(e.message) })
  }

  // Deplacement de la position de lecture. Creee une fois pour toutes :
  // la lire pendant le rendu interdit de passer par une ref.
  const [frottement] = useState(() => {
    // Abscisse du contact initial dans la barre. Le deplacement s'y ajoute
    // ensuite : `locationX` devient faux des que le doigt sort de la barre,
    // ce qui arrive sans cesse en visant les extremites.
    let origine = 0
    const deplacer = (x: number) => {
      const duree = lecteur.duration
      if (duree <= 0 || mesure.lire() <= 0) return
      const part = Math.min(1, Math.max(0, x / mesure.lire()))
      setProgression(part * 100)
      lecteur.currentTime = part * duree
    }
    return PanResponder.create({
      // La barre reclame le geste des le contact : un simple appui doit
      // deja deplacer la lecture, sans attendre un deplacement.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Le fil pagine a la verticale, et la carte guette le glissement
      // lateral : sans cela l'un des deux volerait le geste en cours.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        setGlisse(true)
        origine = e.nativeEvent.locationX
        deplacer(origine)
      },
      onPanResponderMove: (_, g) => deplacer(origine + g.dx),
      onPanResponderRelease: () => { setGlisse(false); lecteur.play() },
      onPanResponderTerminate: () => setGlisse(false),
    })
  })

  // Glissement vers la droite : le profil de l'auteur. Le fil paginant a
  // la verticale, le geste n'est retenu que s'il est franchement
  // horizontal, sans quoi il volerait le defilement d'une video a l'autre.
  const [lateral] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      g.dx < -SEUIL_LATERAL && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -SEUIL_LATERAL && Math.abs(g.dx) > Math.abs(g.dy) * 2) {
        onVisiter?.(item.pseudo)
      }
    },
  }))

  return (
    <View style={[s.carte, { height: hauteur }]} {...lateral.panHandlers}>
      <View style={[s.cadre, { top: decalage }, arrondi && s.cadreArrondi]}>
        <Pressable style={StyleSheet.absoluteFill}
          onPress={() => {
            if (isPlaying) { setPausee(passage); lecteur.pause() }
            else { setPausee(-1); lecteur.play() }
          }}>
          {/* « contain » et non « cover » : une video tournee en paysage
              garderait sinon ses bords coupes pour remplir le cadre. */}
          <VideoView player={lecteur} style={StyleSheet.absoluteFill}
            contentFit="contain" nativeControls={false} />
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
          <View style={s.avatarBoite}>
            <Pressable onPress={() => onVisiter?.(item.pseudo)}>
              <View style={s.avatar}>
                <Text style={s.avatarLettre}>
                  {item.pseudo.charAt(0).toUpperCase()}
                </Text>
              </View>
            </Pressable>
            {/* S'abonner sans quitter le fil : le « + » occupe la place de
                la pastille d'envoi tant qu'on ne suit pas l'auteur, et
                lui rend une fois l'abonnement pris. */}
            {suivi ? (
              <View style={s.pastilleEnvoi}>
                <AvionEnvoi taille={13} couleur="#fff" />
              </View>
            ) : (
              <Pressable style={s.pastilleSuivre} onPress={suivre} hitSlop={8}
                accessibilityLabel={`S'abonner à ${item.pseudo}`}>
                <PlusStory taille={12} couleur="#fff" />
              </Pressable>
            )}
          </View>

          <Pressable style={s.action} onPress={basculerAime} hitSlop={6}>
            <CoeurFil taille={34} couleur={aime ? '#ff2856' : '#fff'} />
            <Text style={s.compteur}>{abreger(nbAime)}</Text>
          </Pressable>

          <Pressable style={s.action} onPress={() => onCommenter(item)} hitSlop={6}>
            <BulleFil taille={34} couleur="#fff" />
            <Text style={s.compteur}>{abreger(item.nbCommentaires)}</Text>
          </Pressable>

          <Pressable style={s.action} onPress={basculerFavori} hitSlop={6}>
            <Favori taille={32} plein={favori} couleur={favori ? '#fcd116' : '#fff'} />
            <Text style={s.compteur}>Favori</Text>
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

      {/* Barre de lecture : la zone sensible est haute pour s'attraper au
          pouce, le trait visible reste fin. Elle se tient au-dessus de la
          barre de liste de lecture, qui occupe deja le bas du cadre. */}
      <View style={s.zoneBarre} {...frottement.panHandlers}
        onLayout={e => mesure.poser(e.nativeEvent.layout.width)}>
        <View style={[s.barre, glisse && s.barreGlissee]}>
          <View style={[s.barreRemplie, { width: `${progression}%` },
            glisse && s.barreRemplieGlissee]} />
        </View>
      </View>

      {/* Position atteinte, montree seulement pendant le glissement : le
          reste du temps elle encombrerait la video. */}
      {glisse && (
        <View style={s.minuteur} pointerEvents="none">
          <View style={s.minuteurPille}>
            <Text style={s.minuteurTexte}>
              {horloge(lecteur.currentTime)} / {horloge(lecteur.duration)}
            </Text>
          </View>
        </View>
      )}

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
  // DECOR LOCAL : il n'existe pas d'API de recits, la rangee du haut
  // reste donc servie par demo.ts.
  const stories = etat.stories

  const [liste, setListe] = useState<VideoAmis[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Incremente par « Réessayer » : l'effet de chargement repart.
  const [tentative, setTentative] = useState(0)

  useEffect(() => {
    let valable = true
    // Fil des abonnements, et non le fil general : l'onglet ne montre que
    // les comptes que le lecteur suit, sans quoi son nom serait trompeur.
    apiVideos.suivis()
      .then(v => { if (valable) { setListe(v); setErreur('') } })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [tentative])

  const recharger = () => { setChargement(true); setTentative(n => n + 1) }

  // Comptes suivis, charges une fois pour tout le fil : la video de l'API
  // ne porte pas la relation d'abonnement, et une requete par carte en
  // ferait autant que de videos. L'onglet ne montrant que des comptes
  // suivis, la pastille y est normalement absente ; elle reparait apres un
  // desabonnement fait ailleurs, le fil n'etant pas recharge pour autant.
  const [suivis, setSuivis] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (!profil?.pseudo) return
    let valable = true
    apiInteractions.abonnements(profil.pseudo, { limite: 200 })
      .then(c => { if (valable) setSuivis(new Set(c.map(x => x.pseudo))) })
      .catch(() => { /* Liste d'abonnements indisponible. */ })
    return () => { valable = false }
  }, [profil?.pseudo])

  // L'abonnement se note par pseudo et non par video : le meme auteur peut
  // tenir plusieurs cartes du fil, toutes doivent suivre.
  const marquerSuivi = (p: string, suivi: boolean) =>
    setSuivis(anciens => {
      const prochains = new Set(anciens)
      if (suivi) prochains.add(p)
      else prochains.delete(p)
      return prochains
    })

  const [index, setIndex] = useState(0)
  // Nombre de changements de carte depuis l'ouverture : il sert de numero
  // de passage aux cartes, pour perimer les pauses demandees.
  const [passage, setPassage] = useState(0)
  const [videoCom, setVideoCom] = useState<VideoAmis | null>(null)
  // Vrai des que le fil a quitte le haut : la rangee de stories se tasse.
  const [replie, setReplie] = useState(false)
  // La recherche recouvre l'ecran, ouverte par la loupe de l'entete.
  const [recherche, setRecherche] = useState(false)
  // Hauteur reelle du fil : c'est le pas du defilement par ecran. La
  // mesurer evite de dependre de la hauteur de la fenetre, trop grande.
  const [hauteur, setHauteur] = useState(0)

  // Le repli se decide sur le geste, jamais dans un effet : l'etat suit
  // directement la main. Il ne se deploie a nouveau qu'une fois revenu
  // tout en haut de la premiere video.
  // Fin d'un geste de defilement : la carte posee devient la carte active.
  const changerCarte = (y: number) => {
    if (hauteur <= 0) return
    const n = Math.round(y / hauteur)
    if (n === index) return
    setIndex(n); setPassage(v => v + 1)
  }
  // Sur le web, la fin du geste est detectee a l'arret du defilement.
  const finDefilementWeb = useFinDefilementWeb(changerCarte)
  const auDefilement = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y <= 0) setReplie(false)
  }

  // Premier palier : la liste etant figee, elle ne recoit aucun geste.
  // Cette reponse-ci guette donc le glissement vers le haut et rend
  // l'ecran entier a la premiere video. Creee une fois pour toutes :
  // la lire pendant le rendu interdit de passer par une ref.
  const [deploiement] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy < -6,
    onPanResponderRelease: () => setReplie(true),
    onPanResponderTerminate: () => setReplie(true),
  }))

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
        onLayout={e => setHauteur(e.nativeEvent.layout.height)}
        {...(replie ? {} : deploiement.panHandlers)}>
        {chargement ? (
          <View style={s.attente}>
            <ActivityIndicator color="#fff" />
            <Text style={s.attenteTexte}>Chargement…</Text>
          </View>
        ) : liste.length === 0 ? (
          // Un fil vide et un fil en panne se ressemblent a l'ecran : le
          // message du serveur distingue les deux. Vide sans erreur, la
          // cause est connue : le lecteur ne suit encore personne.
          <View style={s.attente}>
            <Text style={s.attenteTexte}>
              {erreur
                || 'Tu ne suis encore personne. Abonne-toi à des comptes pour voir leurs vidéos ici.'}
            </Text>
            {!!erreur && (
              <Pressable style={s.reessayer} onPress={recharger}>
                <Text style={s.reessayerTexte}>Réessayer</Text>
              </Pressable>
            )}
            {/* Le fil vide devient actionnable : on suit depuis ici meme. */}
            {!erreur && <Suggestions onVisiter={onVisiter} />}
          </View>
        ) : (
        <FlatList
          data={liste}
          keyExtractor={v => v.id}
          pagingEnabled
          // Figee tant que la premiere video n'occupe pas tout l'ecran :
          // le geste sert alors a la deployer, pas a changer de video.
          scrollEnabled={replie}
          showsVerticalScrollIndicator={false}
          snapToInterval={hauteur || undefined}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={e => { auDefilement(e); finDefilementWeb(e) }}
          getItemLayout={(_, i) => (
            { length: hauteur, offset: hauteur * i, index: i })}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          onMomentumScrollEnd={e => changerCarte(e.nativeEvent.contentOffset.y)}
          renderItem={({ item, index: i }) => (
            <Carte item={item} actif={i === index} passage={passage}
              hauteur={hauteur} arrondi={!replie}
              decalage={replie ? 0 : HAUT_ENTETE + HAUT_STORIES}
              suivi={item.pseudo === pseudo || suivis.has(item.pseudo)}
              onSuivi={marquerSuivi}
              onErreur={setErreur}
              onCommenter={setVideoCom} onVisiter={onVisiter} />
          )}
        />
        )}
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

      {/* Un j'aime ou un favori refuse par le serveur se signale ici : la
          video continue de se lire, seul le bandeau apparait. */}
      {!!erreur && liste.length > 0 && (
        <Pressable style={s.bandeau} onPress={() => setErreur('')}>
          <Text style={s.bandeauTexte}>{erreur}</Text>
        </Pressable>
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
    paddingTop: 54 - BARRE_ETAT_WEB, paddingBottom: 10,
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
    position: 'absolute', right: 1, top: 54 - BARRE_ETAT_WEB,
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
    position: 'absolute', top: 52 - BARRE_ETAT_WEB, left: 12, zIndex: 6,
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

  // --- Attente et pannes reseau ---
  attente: { flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 14 },
  attenteTexte: { color: '#bbb', textAlign: 'center', fontSize: 15 },
  reessayer: { borderWidth: 1, borderColor: 'rgba(255,255,255,.35)',
    borderRadius: 22, paddingHorizontal: 22, minHeight: 44,
    alignItems: 'center', justifyContent: 'center' },
  reessayerTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },
  // Bandeau pose au-dessus de la barre de liste de lecture.
  bandeau: { position: 'absolute', left: 16, right: 16, bottom: 100, zIndex: 7,
    backgroundColor: 'rgba(90,90,90,.92)', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16 },
  bandeauTexte: { color: '#fff', fontSize: 14, textAlign: 'center' },

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
  // Pastille d'abonnement, a la place de la pastille d'envoi.
  pastilleSuivre: {
    position: 'absolute', bottom: -10, alignSelf: 'center',
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#ff2856',
    alignItems: 'center', justifyContent: 'center',
  },

  // Zone sensible de la barre de lecture : 28pt de haut pour s'attraper au
  // pouce, alors que le trait n'en fait que 2. Elle se pose au-dessus de la
  // barre de liste de lecture, haute de 41pt.
  zoneBarre: {
    position: 'absolute', left: 12, right: 12, bottom: 41, height: 28,
    justifyContent: 'flex-end', paddingBottom: 3, zIndex: 4,
  },
  barre: {
    height: 2, backgroundColor: 'rgba(255,255,255,.19)', borderRadius: 2,
  },
  barreRemplie: { height: 2, backgroundColor: 'rgba(255,255,255,.6)', borderRadius: 2 },
  // Pendant le glissement la barre s'epaissit : le doigt la masque, et
  // c'est le seul retour qui reste visible autour de lui.
  barreGlissee: { height: 4, borderRadius: 4 },
  barreRemplieGlissee: { height: 4, borderRadius: 4, backgroundColor: '#fff' },

  // Position de lecture, affichee au centre pendant le glissement.
  minuteur: {
    position: 'absolute', left: 0, right: 0, bottom: 95, zIndex: 4,
    alignItems: 'center',
  },
  minuteurPille: {
    backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 11,
  },
  minuteurTexte: { color: '#fff', fontSize: 14, fontWeight: '600' },

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
