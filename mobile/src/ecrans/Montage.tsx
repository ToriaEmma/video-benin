import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, PanResponder, Animated, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video'
import { useMusiqueCalee, useSonEnMemoire } from '../lib/musiqueCalee'
import { usePiste } from '../lib/piste'
import { rendreVideo, dimensionsVideo, type Calque as CalqueRendu } from '../lib/rendu'
import { televerser, apiBrouillons, apiStories } from '../lib/api'
import { Text, TextInput } from '../composants/Texte'
import Feuille from '../composants/Feuille'
import Interrupteur from '../composants/Interrupteur'
import ChoixSon from './ChoixSon'
import VignetteFiltre from '../composants/VignetteFiltre'
import { useVignetteVideo } from '../lib/apercus'
import { feuille as F } from '../lib/theme'
import type { Son } from '../lib/sons'
import {
  Chevron, Croix, SonNote, Corbeille, Brouillon, CocheValider,
  MontageReglages, MontageDuree,
  MontageTexte, MontageSticker, MontageEffets, MontageVoix,
  MontageFiltres, MontageSousTitres, OutilPlus, Vitesse, Emoji,
} from '../composants/Icones'

// Colonne de droite : chaque entree ouvre un reglage de montage.
const OUTILS = [
  { nom: 'Paramètres', Icone: MontageReglages },
  { nom: 'Modifier', Icone: MontageDuree, groupe: 2 },
  { nom: 'Texte', Icone: MontageTexte },
  { nom: 'Stickers', Icone: MontageSticker },
  { nom: 'Effets', Icone: MontageEffets },
  { nom: 'Filtres', Icone: MontageFiltres },
  { nom: 'Vitesse', Icone: Vitesse },
  { nom: 'Effet vocal', Icone: MontageVoix },
  { nom: 'Sous-titres', Icone: MontageSousTitres },
]

// Memes voiles que l'ecran de tournage (src/ecrans/Camera.tsx) : un calque
// teinte pose sur l'apercu, avec un mode de fusion.
const FILTRES = [
  { nom: 'Original', voile: 'transparent', melange: 'normal' as const },
  { nom: 'Chaud', voile: 'rgba(255,146,60,.26)', melange: 'overlay' as const },
  { nom: 'Froid', voile: 'rgba(58,134,255,.26)', melange: 'overlay' as const },
  { nom: 'Éclat', voile: 'rgba(255,255,255,.22)', melange: 'soft-light' as const },
  { nom: 'Vintage', voile: 'rgba(188,152,106,.34)', melange: 'multiply' as const },
  { nom: 'Noir & blanc', voile: 'rgba(128,128,128,.62)', melange: 'saturation' as const },
]

// Palette reprise de l'editeur de couverture (src/ecrans/Couverture.tsx).
const COULEURS = [
  '#ffffff', '#111111', '#e8485c', '#ef8d3c', '#eece4a', '#ff2856',
  '#c43cc0', '#45b4d8', '#3f7ff0', '#2b3fae',
]

const STICKERS = [
  '😀', '😂', '🥰', '😎', '🤩', '😭', '🔥', '💯',
  '👏', '🙌', '💪', '🙏', '❤️', '✨', '🎉', '🎵',
  '⚽', '🏆', '🌴', '🌞', '🍲', '🥤', '🚕', '🏍️',
  '📍', '💃', '🕺', '🪘', '🇧🇯', '👑', '😮', '🤔',
]

// Chaque vitesse de lecture est reellement posee sur le lecteur.
const VITESSES = [0.5, 1, 1.5, 2]

// Les effets vocaux jouent sur le debit et la hauteur de la piste. Ceux
// qui demandent un vrai traitement du signal sont signales « aperçu »
// plutot que de ne rien faire en silence.
const EFFETS_VOCAUX: { nom: string; debit: number; hauteur: boolean; voix?: 'robot' | 'echo' }[] = [
  { nom: 'Normal', debit: 1, hauteur: true },
  { nom: 'Grave', debit: 0.78, hauteur: false },
  { nom: 'Aigu', debit: 1.35, hauteur: false },
  // Traites par le rendu final (Web Audio) : l'apercu ne les fait pas entendre.
  { nom: 'Robot', debit: 1, hauteur: true, voix: 'robot' },
  { nom: 'Écho', debit: 1, hauteur: true, voix: 'echo' },
]

// Les reglages sont poses sur le lecteur ici, hors du composant : une
// propriete d'objet venant d'un hook ne se modifie pas dans le rendu.
function reglerLecture(p: {
  loop: boolean; muted: boolean; playbackRate: number; preservesPitch: boolean; currentTime: number
}, r: { boucle?: boolean; coupe?: boolean; debit?: number; hauteur?: boolean; position?: number }) {
  if (r.position !== undefined) p.currentTime = r.position
  if (r.boucle !== undefined) p.loop = r.boucle
  if (r.coupe !== undefined) p.muted = r.coupe
  if (r.hauteur !== undefined) p.preservesPitch = r.hauteur
  if (r.debit !== undefined) p.playbackRate = r.debit
}

// Identifiants des calques : un compteur plutot que l'horloge, que la regle
// de purete interdit de lire pendant le rendu.
const compteur = { n: 0, suivant() { this.n += 1; return this.n } }


// Un texte ou un sticker pose sur l'apercu, deplacable au doigt.
type Calque = {
  id: string
  genre: 'texte' | 'sticker'
  contenu: string
  // Index dans COULEURS ; sans objet pour un sticker.
  couleur: number
  position: Animated.ValueXY
}

// Un calque isole : son PanResponder est cree une fois pour toutes, ce qui
// evite d'en refabriquer un a chaque rendu de l'ecran.
function CalquePose({ calque, onOuvrir }: {
  calque: Calque
  onOuvrir: () => void
}) {
  const { position } = calque
  const [glissement] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
    onPanResponderGrant: () => {
      position.setOffset({
        x: (position.x as unknown as { _value: number })._value,
        y: (position.y as unknown as { _value: number })._value,
      })
      position.setValue({ x: 0, y: 0 })
    },
    onPanResponderMove: Animated.event(
      [null, { dx: position.x, dy: position.y }],
      { useNativeDriver: false },
    ),
    onPanResponderRelease: () => position.flattenOffset(),
  }))

  return (
    <Animated.View {...glissement.panHandlers}
      style={[s.calque, { transform: position.getTranslateTransform() }]}>
      <Pressable onPress={onOuvrir} hitSlop={6}>
        {calque.genre === 'sticker'
          ? <Text style={s.calqueSticker}>{calque.contenu}</Text>
          : <Text style={[s.calqueTexte, { color: COULEURS[calque.couleur] }]}>
              {calque.contenu}
            </Text>}
      </Pressable>
    </Animated.View>
  )
}

// Apercu du montage avec le son retenu : la musique tourne par-dessus la
// video, comme elle sera jouee dans le fil une fois publiee.
function MusiqueApercu({ son, url, lecteur, actif, vitesse, origine }: {
  son: Son; url: string; lecteur: VideoPlayer; actif: boolean
  // Debit de l'apercu et debut de la decoupe : la musique suit le temps de
  // la video finale, pas celui du fichier source.
  vitesse: number; origine: number
}) {
  const musique = usePiste(url)
  // La musique suit l'apercu : meme instant, meme boucle, arret si la video fige.
  // Elle se tait pendant le choix d'un autre son (qui fait son propre apercu).
  useMusiqueCalee(lecteur, musique, actif, son.duree, son.original ? 0.3 : 0.08, vitesse, origine)
  useEffect(() => { if (!actif) musique.pause() }, [actif, musique])
  return null
}

export default function Montage({
  uri, pseudo, sonInitial, vitesseInitiale = 1, onRetour, onSuivant, onBrouillon, onStory, onOutil,
}: {
  uri: string
  pseudo: string
  // Son deja retenu au viseur : le montage le reprend plutot que de
  // repartir a vide, et peut encore le changer ou le retirer.
  sonInitial?: Son | null
  onRetour: () => void
  // Le son suit la video vers la publication : c'est la seule etape qui
  // le transmet, le fichier ne le portant pas.
  // Recoit aussi la video finale, retouches gravees.
  onSuivant: (son: Son | null, video: string) => void
  // Vitesse choisie a la camera : appliquee d'emblee, modifiable ici.
  vitesseInitiale?: number
  onBrouillon?: () => void
  onStory?: () => void
  // Reserve aux actions qui sortent du montage ; le reste est traite ici.
  onOutil?: (nom: string) => void
}) {
  const marges = useSafeAreaInsets()
  // Meme menu de sortie que l'ecran de tournage.
  const [menuSortie, setMenuSortie] = useState(false)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  const lecteur = useVideoPlayer(uri, p => { p.loop = true; p.muted = false })
  // Image de la video, reprise dans les vignettes des filtres.
  const imageVideo = useVignetteVideo(uri)

  // Avis passager, affiche en bas de l'apercu.
  const [message, setMessage] = useState('')
  // Barre ouverte sous l'apercu : filtres, vitesse ou saisie de sous-titre.
  const [barre, setBarre] = useState<'filtres' | 'vitesse' | 'sousTitres' | 'decoupe' | null>(null)
  // Feuille ouverte : reglages, stickers ou effets vocaux.
  const [feuilleOuverte, setFeuilleOuverte] = useState<'reglages' | 'stickers' | 'voix' | null>(null)
  const [choixSon, setChoixSon] = useState(false)
  const [son, setSon] = useState<Son | null>(sonInitial ?? null)

  const [filtre, setFiltre] = useState(0)
  const [vitesse, setVitesse] = useState(vitesseInitiale)
  const [effetVocal, setEffetVocal] = useState(0)
  const [boucle, setBoucle] = useState(true)
  const [coupe, setCoupe] = useState(false)

  const [calques, setCalques] = useState<Calque[]>([])
  // Calque en cours d'ecriture : son identifiant, ou null hors saisie.
  const [enEdition, setEnEdition] = useState<string | null>(null)
  const [saisie, setSaisie] = useState('')
  const [couleur, setCouleur] = useState(0)

  const [sousTitre, setSousTitre] = useState('')
  const [sousTitresActifs, setSousTitresActifs] = useState(false)

  // Decoupe (outil « Modifier ») : debut et fin gardes, en secondes.
  const [duree, setDuree] = useState(0)
  const [debut, setDebut] = useState(0)
  const [fin, setFin] = useState<number | null>(null)
  // Taille de l'apercu et de la video : de quoi convertir la position des
  // textes et stickers en position dans l'image finale.
  const [boite, setBoite] = useState({ l: 0, h: 0 })
  const [dims, setDims] = useState<{ l: number; h: number } | null>(null)
  useEffect(() => { dimensionsVideo(uri).then(setDims).catch(() => {}) }, [uri])
  // Rendu en cours : etape affichee et avancement (0 a 1), ou null.
  const [travail, setTravail] = useState<{ etape: string; part: number } | null>(null)

  useEffect(() => {
    const t = setInterval(() => {
      const d = lecteur.duration
      if (d > 0 && Number.isFinite(d)) { setDuree(d); clearInterval(t) }
    }, 200)
    return () => clearInterval(t)
  }, [lecteur])

  // L'apercu ne joue que la partie gardee.
  const finEffective = fin ?? duree
  useEffect(() => {
    if (!(debut > 0 || fin !== null)) return
    const t = setInterval(() => {
      const v = lecteur.currentTime
      if (v < debut - 0.05 || (finEffective > 0 && v > finEffective)) reglerLecture(lecteur, { position: debut })
    }, 100)
    return () => clearInterval(t)
  }, [lecteur, debut, fin, finEffective])

  // Vitesse choisie a la camera, posee sur le lecteur des le depart.
  useEffect(() => {
    if (vitesseInitiale !== 1) reglerLecture(lecteur, { debit: vitesseInitiale })
  }, [lecteur, vitesseInitiale])

  // Avec un son, l'apercu attend que la musique soit chargee en memoire,
  // puis video et musique partent ensemble du debut.
  const sonLocal = useSonEnMemoire(son?.url ?? null, !son?.original)
  const sonPret = !son || !!sonLocal
  useEffect(() => {
    if (!sonPret) { lecteur.pause(); return }
    reglerLecture(lecteur, { position: 0 })
    lecteur.play()
  }, [lecteur, sonPret])

  // Un son retenu remplace la piste de la video dans l'apercu (« Son coupé »
  // coupe aussi la video sans son).
  useEffect(() => {
    reglerLecture(lecteur, { coupe: coupe || !!son })
  }, [lecteur, coupe, son])

  // Le message s'effacant seul, chaque appel remplace le precedent.
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2200)
    return () => clearTimeout(t)
  }, [message])

  const avertir = (texte: string) => setMessage(texte)

  // Vitesse et effet vocal se combinent sur un seul debit, pose sur le lecteur.
  const poserDebit = (v: number, effet: number) => {
    setVitesse(v); setEffetVocal(effet)
    reglerLecture(lecteur, { debit: v * EFFETS_VOCAUX[effet].debit,
      hauteur: EFFETS_VOCAUX[effet].hauteur })
  }

  const basculerBoucle = (v: boolean) => {
    setBoucle(v); reglerLecture(lecteur, { boucle: v })
  }

  const basculerCoupe = (v: boolean) => {
    setCoupe(v); reglerLecture(lecteur, { coupe: v })
  }

  const ajouterTexte = () => {
    const id = `t${compteur.suivant()}`
    setCalques(l => [...l, {
      id, genre: 'texte', contenu: '', couleur,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
    }])
    setSaisie('')
    setEnEdition(id)
  }

  const ouvrirCalque = (c: Calque) => {
    if (c.genre !== 'texte') { avertir('Fais glisser le sticker pour le placer.'); return }
    setSaisie(c.contenu)
    setCouleur(c.couleur)
    setEnEdition(c.id)
  }

  // Fin de saisie : un texte laisse vide est retire plutot que garde invisible.
  const validerTexte = () => {
    const propre = saisie.trim()
    setCalques(l => propre
      ? l.map(c => (c.id === enEdition ? { ...c, contenu: propre, couleur } : c))
      : l.filter(c => c.id !== enEdition))
    setEnEdition(null)
    setSaisie('')
  }

  const ajouterSticker = (emoji: string) => {
    setCalques(l => [...l, {
      id: `s${compteur.suivant()}`, genre: 'sticker', contenu: emoji, couleur: 0,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
    }])
    setFeuilleOuverte(null)
    avertir('Sticker ajouté — fais-le glisser.')
  }

  // Positions des textes et stickers, de l'apercu vers l'image finale :
  // l'apercu montre la video entiere (« contain ») au centre de la boite.
  const calquesPourRendu = (): CalqueRendu[] => {
    const v = dims ?? { l: 9, h: 16 }
    const e = Math.min(boite.l / v.l, boite.h / v.h) || 1
    const rl = v.l * e, rh = v.h * e
    const rx = (boite.l - rl) / 2, ry = (boite.h - rh) / 2
    const lire = (a: Animated.Value) => (a as unknown as { _value: number })._value
    return calques.filter(c => c.contenu).map(c => ({
      genre: c.genre,
      contenu: c.contenu,
      couleur: COULEURS[c.couleur],
      x: (boite.l / 2 + lire(c.position.x) - rx) / rl,
      y: (boite.h / 2 + lire(c.position.y) - ry) / rh,
      taille: (c.genre === 'sticker' ? 54 : 26) / rl,
    }))
  }

  const debit = vitesse * EFFETS_VOCAUX[effetVocal].debit
  const sousTitreGrave = sousTitresActifs ? sousTitre.trim() : ''
  const modifie = filtre !== 0 || debit !== 1 || coupe || !!EFFETS_VOCAUX[effetVocal].voix
    || calques.some(c => c.contenu) || !!sousTitreGrave || debut > 0 || fin !== null

  // Video finale : les retouches sont gravees (version web) ; sans retouche,
  // le fichier part tel quel.
  const finaliser = async (): Promise<string> => {
    if (!modifie) return uri
    lecteur.pause()
    setTravail({ etape: 'Préparation de la vidéo', part: 0 })
    try {
      return await rendreVideo([{ uri, debut, fin: fin ?? undefined }], {
        voile: { couleur: FILTRES[filtre].voile, melange: FILTRES[filtre].melange },
        debit,
        hauteurPreservee: EFFETS_VOCAUX[effetVocal].hauteur,
        voix: EFFETS_VOCAUX[effetVocal].voix,
        calques: calquesPourRendu(),
        sousTitre: sousTitreGrave,
        sansSon: coupe,
        surProgression: part => setTravail({ etape: 'Préparation de la vidéo', part }),
      })
    } finally {
      setTravail(null)
      lecteur.play()
    }
  }

  // Video finale envoyee au stockage, avec l'avancement de l'envoi.
  const envoyer = async () => {
    const video = await finaliser()
    setTravail({ etape: 'Envoi de la vidéo', part: 0 })
    try {
      return await televerser(video, (etape, pourcentage) => {
        if (etape === 'envoi') setTravail({ etape: 'Envoi de la vidéo', part: (pourcentage ?? 0) / 100 })
      })
    } finally { setTravail(null) }
  }

  const suivant = async () => {
    if (travail) return
    try { onSuivant(son, await finaliser()) }
    catch (e) { avertir(e instanceof Error ? e.message : 'La préparation a échoué.') }
  }

  // Menu de sortie : la video (retouches comprises) rejoint les brouillons.
  const enregistrerBrouillon = async () => {
    setMenuSortie(false)
    if (travail) return
    try {
      const url = await envoyer()
      const legende = calques.filter(c => c.genre === 'texte').map(c => c.contenu).join(' ').trim()
      await apiBrouillons.creer(url, legende)
      if (onBrouillon) onBrouillon()
      else onRetour()
    } catch (e) {
      avertir(e instanceof Error ? e.message : 'Le brouillon n’a pas pu être enregistré.')
    }
  }

  // « Ta Story » : publiee pour 24 h, visible des abonnes.
  const publierStory = async () => {
    if (travail) return
    try {
      await apiStories.publier(await envoyer())
      if (onStory) onStory()
      else avertir('Publié dans ta Story.')
    } catch (e) {
      avertir(e instanceof Error ? e.message : 'La Story n’a pas pu être publiée.')
    }
  }

  const outilChoisi = (nom: string) => {
    switch (nom) {
      case 'Paramètres': setFeuilleOuverte('reglages'); return
      case 'Texte': ajouterTexte(); return
      case 'Stickers': setFeuilleOuverte('stickers'); return
      case 'Effet vocal': setFeuilleOuverte('voix'); return
      case 'Filtres': setBarre(b => (b === 'filtres' ? null : 'filtres')); return
      case 'Vitesse': setBarre(b => (b === 'vitesse' ? null : 'vitesse')); return
      case 'Sous-titres': setBarre(b => (b === 'sousTitres' ? null : 'sousTitres')); return
      case 'Modifier': setBarre(b => (b === 'decoupe' ? null : 'decoupe')); return
      case 'Effets':
        // Les effets visuels reprennent les voiles des filtres.
        setBarre('filtres')
        avertir('Les effets reprennent les filtres pour le moment.')
        return
      default:
        onOutil?.(nom)
    }
  }

  const voile = FILTRES[filtre]

  return (
    <View style={[s.page, { paddingTop: marges.top }]}>
      <View style={s.viseur}
        onLayout={e => setBoite({ l: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {son && sonLocal && <MusiqueApercu key={son.id + sonLocal} son={son} url={sonLocal} lecteur={lecteur}
          actif={!choixSon && !travail} vitesse={debit} origine={debut} />}
        <VideoView player={lecteur} style={StyleSheet.absoluteFill}
          contentFit="contain" nativeControls={false} />

        {/* Teinte du filtre, posee sur l'apercu comme a la camera. */}
        {voile.voile !== 'transparent' && (
          <View pointerEvents="none" style={[
            StyleSheet.absoluteFill,
            { backgroundColor: voile.voile, mixBlendMode: voile.melange },
          ]} />
        )}

        {/* Textes et stickers deposes sur la video */}
        <View style={s.calques} pointerEvents="box-none">
          {calques.filter(c => c.id !== enEdition && c.contenu).map(c => (
            <CalquePose key={c.id} calque={c} onOuvrir={() => ouvrirCalque(c)} />
          ))}
        </View>

        {/* Bande de sous-titres, alimentee par la saisie du bas */}
        {sousTitresActifs && !!sousTitre.trim() && (
          <View style={s.bandeSousTitre} pointerEvents="none">
            <Text style={s.bandeSousTitreTexte}>{sousTitre.trim()}</Text>
          </View>
        )}

        {/* Barre du haut : retour, son choisi, puis la colonne d'outils */}
        <View style={s.haut}>
          <Pressable onPress={() => setMenuSortie(true)} hitSlop={12} style={s.hautBouton}
            accessibilityRole="button" accessibilityLabel="Retour">
            <Chevron taille={28} couleur="#fff" />
          </Pressable>
          <View style={s.son}>
            <Pressable style={s.sonCorps} onPress={() => setChoixSon(true)} hitSlop={6}>
              <SonNote taille={16} couleur="#fff" />
              <Text style={s.sonTexte} numberOfLines={1}>
                {son ? son.titre : 'son original'}
              </Text>
            </Pressable>
            <View style={s.sonTrait} />
            {/* La croix retire le son retenu, sans ouvrir la bibliotheque. */}
            <Pressable hitSlop={10} onPress={() => {
              setSon(null)
              avertir(son ? 'Son retiré.' : 'Aucun son à retirer.')
            }}>
              <Croix taille={16} couleur="#fff" />
            </Pressable>
          </View>
          <View style={s.hautBouton} />
        </View>

        <View style={s.outils}>
          {OUTILS.map(({ nom, Icone, groupe }, i) => (
            <Pressable key={nom} onPress={() => outilChoisi(nom)} hitSlop={6}
              accessibilityRole="button" accessibilityLabel={nom}
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
              <Pressable style={s.menuLigne} onPress={enregistrerBrouillon}>
                <Brouillon taille={20} couleur="#111" />
                <Text style={s.menuTexte}>Enregistrer le brouillon</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Saisie d'un texte : elle recouvre l'apercu le temps de l'ecriture. */}
        {enEdition && (
          <View style={s.saisieVoile}>
            <Pressable style={s.saisieTermine} onPress={validerTexte} hitSlop={10}>
              <Text style={s.saisieTermineTexte}>Terminé</Text>
            </Pressable>
            <TextInput style={[s.saisieTexte, { color: COULEURS[couleur] }]}
              value={saisie} onChangeText={setSaisie} autoFocus multiline
              placeholder="Ton texte" placeholderTextColor="rgba(255,255,255,.45)" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.palette}>
              {COULEURS.map((c, i) => (
                <Pressable key={c} onPress={() => setCouleur(i)}
                  style={[s.pastille, { backgroundColor: c },
                    i === couleur && s.pastilleChoisie]} />
              ))}
            </ScrollView>
          </View>
        )}

        {!!message && (
          <View style={s.message} pointerEvents="none">
            <Text style={s.messageTexte}>{message}</Text>
          </View>
        )}

        {travail && (
          <View style={s.travail}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={s.travailTexte}>{travail.etape}… {Math.round(travail.part * 100)} %</Text>
          </View>
        )}
      </View>

      {/* Bande de reglage ouverte par un outil, a la place du pied */}
      {barre === 'filtres' && (
        <View style={s.bande}>
          <View style={s.bandeEntete}>
            <Text style={s.bandeTitre}>Filtres</Text>
            <Pressable hitSlop={10} onPress={() => setBarre(null)}>
              <CocheValider taille={22} couleur="#fff" />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.bandeListe}>
            {FILTRES.map((f, i) => (
              <Pressable key={f.nom} onPress={() => setFiltre(i)} style={s.filtre}>
                <View style={[s.filtreRond,
                  !imageVideo && f.voile !== 'transparent' && { backgroundColor: f.voile },
                  i === filtre && s.filtreRondChoisi]}>
                  <VignetteFiltre image={imageVideo} voile={f.voile} melange={f.melange} />
                </View>
                <Text style={[s.filtreNom, i === filtre && s.filtreNomChoisi]}
                  numberOfLines={1}>{f.nom}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {barre === 'vitesse' && (
        <View style={s.bande}>
          <View style={s.bandeEntete}>
            <Text style={s.bandeTitre}>Vitesse de lecture</Text>
            <Pressable hitSlop={10} onPress={() => setBarre(null)}>
              <CocheValider taille={22} couleur="#fff" />
            </Pressable>
          </View>
          <View style={s.vitesses}>
            {VITESSES.map(v => (
              <Pressable key={v} onPress={() => poserDebit(v, effetVocal)}
                style={[s.vitesse, v === vitesse && s.vitesseChoisie]}>
                <Text style={[s.vitesseTexte, v === vitesse && s.vitesseTexteChoisi]}>
                  {v}×
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {barre === 'decoupe' && (
        <View style={s.bande}>
          <View style={s.bandeEntete}>
            <Text style={s.bandeTitre}>Découper · {(finEffective - debut).toFixed(1)} s gardées</Text>
            <Pressable hitSlop={10} onPress={() => setBarre(null)}>
              <CocheValider taille={22} couleur="#fff" />
            </Pressable>
          </View>
          {[
            { nom: 'Début', valeur: debut, poser: (v: number) => setDebut(Math.max(0, Math.min(v, finEffective - 1))) },
            { nom: 'Fin', valeur: finEffective, poser: (v: number) => { const f = Math.min(duree, Math.max(v, debut + 1)); setFin(f >= duree ? null : f) } },
          ].map(r => (
            <View key={r.nom} style={s.decoupeLigne}>
              <Text style={s.decoupeNom}>{r.nom}</Text>
              <Pressable hitSlop={8} style={s.decoupeBouton} onPress={() => r.poser(r.valeur - 0.5)}>
                <Text style={s.decoupeBoutonTexte}>−</Text>
              </Pressable>
              <Text style={s.decoupeValeur}>{r.valeur.toFixed(1)} s</Text>
              <Pressable hitSlop={8} style={s.decoupeBouton} onPress={() => r.poser(r.valeur + 0.5)}>
                <Text style={s.decoupeBoutonTexte}>+</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {barre === 'sousTitres' && (
        <View style={s.bande}>
          <View style={s.bandeEntete}>
            <Text style={s.bandeTitre}>Sous-titres</Text>
            <Pressable hitSlop={10} onPress={() => setBarre(null)}>
              <CocheValider taille={22} couleur="#fff" />
            </Pressable>
          </View>
          <View style={s.sousTitreLigne}>
            <TextInput style={s.sousTitreSaisie} value={sousTitre}
              onChangeText={setSousTitre} multiline
              placeholder="Écris le sous-titre"
              placeholderTextColor="rgba(255,255,255,.45)" />
            <Interrupteur actif={sousTitresActifs} onChange={setSousTitresActifs} />
          </View>
        </View>
      )}

      {/* Pied : story a gauche, « Suivant » a droite */}
      <View style={[s.pied, { paddingBottom: 10 + marges.bottom }]}>
        <Pressable style={s.story} onPress={publierStory}>
          <View style={s.storyAvatar}>
            <Text style={s.storyLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.storyTexte}>Ta Story</Text>
        </Pressable>
        <Pressable style={[s.suivant, !!travail && s.suivantInactif]} onPress={suivant} disabled={!!travail}>
          <Text style={s.suivantTexte}>Suivant</Text>
        </Pressable>
      </View>

      <Feuille visible={feuilleOuverte === 'reglages'} titre="Paramètres"
        onFermer={() => setFeuilleOuverte(null)}>
        <View style={s.reglageLigne}>
          <View style={s.reglageCorps}>
            <Text style={s.reglageNom}>Lecture en boucle</Text>
            <Text style={s.reglageDetail}>La vidéo recommence automatiquement.</Text>
          </View>
          <Interrupteur actif={boucle} onChange={basculerBoucle} />
        </View>
        <View style={s.reglageLigne}>
          <View style={s.reglageCorps}>
            <Text style={s.reglageNom}>Son coupé</Text>
            <Text style={s.reglageDetail}>Coupe la piste originale de la vidéo.</Text>
          </View>
          <Interrupteur actif={coupe} onChange={basculerCoupe} />
        </View>
        <View style={s.reglageLigne}>
          <View style={s.reglageCorps}>
            <Text style={s.reglageNom}>Afficher les sous-titres</Text>
            <Text style={s.reglageDetail}>Pose la bande de sous-titres sur l’aperçu.</Text>
          </View>
          <Interrupteur actif={sousTitresActifs} onChange={setSousTitresActifs} />
        </View>
      </Feuille>

      <Feuille visible={feuilleOuverte === 'stickers'} titre="Stickers"
        onFermer={() => setFeuilleOuverte(null)}>
        <View style={s.grille}>
          {STICKERS.map(e => (
            <Pressable key={e} style={s.sticker} onPress={() => ajouterSticker(e)}>
              <Text style={s.stickerEmoji}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Feuille>

      <Feuille visible={feuilleOuverte === 'voix'} titre="Effet vocal"
        onFermer={() => setFeuilleOuverte(null)}>
        {EFFETS_VOCAUX.map((e, i) => (
          <Pressable key={e.nom} style={s.voixLigne} onPress={() => {
            poserDebit(vitesse, i)
            if (e.voix) avertir(`${e.nom} : appliqué à la vidéo finale.`)
          }}>
            <Emoji taille={F.icone} couleur="#111" />
            <View style={s.voixCorps}>
              <Text style={s.voixNom}>{e.nom}</Text>
              {e.voix && <Text style={s.voixApercu}>appliqué à la vidéo finale</Text>}
            </View>
            {i === effetVocal && <CocheValider taille={20} couleur="#111" />}
          </Pressable>
        ))}
      </Feuille>

      <ChoixSon visible={choixSon} onFermer={() => setChoixSon(false)}
        onChoisir={x => {
          setSon(x)
          if (x) avertir(`Son « ${x.titre} » ajouté.`)
        }} />
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
  // Le libelle ouvre la bibliotheque, la croix retire le son : deux zones.
  sonCorps: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
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


  // Calques poses sur la video : ils partent du centre de l'apercu.
  travail: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  travailTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },
  suivantInactif: { opacity: .5 },
  decoupeLigne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 6 },
  decoupeNom: { color: '#fff', fontSize: 14, width: 48 },
  decoupeBouton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.14)',
    alignItems: 'center', justifyContent: 'center' },
  decoupeBoutonTexte: { color: '#fff', fontSize: 20, fontWeight: '600' },
  decoupeValeur: { color: '#fff', fontSize: 15, fontVariant: ['tabular-nums'], minWidth: 56, textAlign: 'center' },
  calques: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center' },
  calque: { position: 'absolute' },
  calqueTexte: { fontSize: 26, fontWeight: '700', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 4 },
  calqueSticker: { fontSize: 54 },

  bandeSousTitre: { position: 'absolute', left: 24, right: 24, bottom: 74,
    backgroundColor: 'rgba(0,0,0,.52)', borderRadius: 8, paddingVertical: 7,
    paddingHorizontal: 12 },
  bandeSousTitreTexte: { color: '#fff', fontSize: 16, fontWeight: '600',
    textAlign: 'center' },

  // Saisie d'un texte : l'apercu reste visible derriere le voile.
  saisieVoile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 12,
    backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'center' },
  saisieTermine: { position: 'absolute', top: 16, right: 18 },
  saisieTermineTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saisieTexte: { fontSize: 26, fontWeight: '700', textAlign: 'center',
    paddingHorizontal: 24, minHeight: 44 },
  palette: { gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  pastille: { width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    borderColor: 'rgba(255,255,255,.7)' },
  pastilleChoisie: { borderWidth: 4 },

  message: { position: 'absolute', left: 20, right: 60, bottom: 70, zIndex: 11,
    backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, padding: 10 },
  messageTexte: { color: '#fff', fontSize: 13 },

  // Bande de reglage glissee entre l'apercu et le pied.
  bande: { paddingTop: 10, paddingBottom: 4, gap: 10 },
  bandeEntete: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16 },
  bandeTitre: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bandeListe: { gap: 14, paddingHorizontal: 16 },

  filtre: { width: 62, alignItems: 'center', gap: 6 },
  filtreRond: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, overflow: 'hidden',
    borderColor: 'rgba(255,255,255,.35)', backgroundColor: '#2a2a2a' },
  filtreRondChoisi: { borderColor: '#fff', borderWidth: 3 },
  filtreNom: { color: 'rgba(255,255,255,.7)', fontSize: 11.5, textAlign: 'center' },
  filtreNomChoisi: { color: '#fff', fontWeight: '700' },

  vitesses: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  vitesse: { flex: 1, minHeight: 40, borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' },
  vitesseChoisie: { backgroundColor: '#fff' },
  vitesseTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },
  vitesseTexteChoisi: { color: '#111' },

  sousTitreLigne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16 },
  sousTitreSaisie: { flex: 1, color: '#fff', fontSize: 15, minHeight: 42,
    backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10 },

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

  // Feuille « Paramètres »
  reglageLigne: { flexDirection: 'row', alignItems: 'center', gap: F.interligne,
    paddingHorizontal: F.marge, paddingVertical: F.hauteurLigne },
  reglageCorps: { flex: 1, gap: 3 },
  reglageNom: { color: '#111', fontSize: F.entree, fontWeight: '600' },
  reglageDetail: { color: '#8e8e93', fontSize: F.description },

  // Feuille « Stickers »
  grille: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: F.marge - 4 },
  sticker: { width: '12.5%', aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center' },
  stickerEmoji: { fontSize: 28 },

  // Feuille « Effet vocal »
  voixLigne: { flexDirection: 'row', alignItems: 'center', gap: F.interligne,
    paddingHorizontal: F.marge, paddingVertical: F.hauteurLigne },
  voixCorps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  voixNom: { color: '#111', fontSize: F.entree, fontWeight: '600' },
  voixApercu: { color: '#8e8e93', fontSize: F.description,
    backgroundColor: '#f1f1f2', borderRadius: 8, paddingHorizontal: 7,
    paddingVertical: 2, overflow: 'hidden' },
})
