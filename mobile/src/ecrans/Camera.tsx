import React, { useEffect, useRef, useState } from 'react'
import {
  View, Pressable, StyleSheet, SafeAreaView, Alert, Image, Platform,
  ActivityIndicator,
} from 'react-native'
import { useWindowDimensions } from '../lib/ecran'
import { Text, TextInput } from '../composants/Texte'
import Feuille from '../composants/Feuille'
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { usePiste } from '../lib/piste'
import { assemblerVideos } from '../lib/assemblage'
import { compresserSiLourde } from '../lib/compression'
import { videoFixe, dessinerHabillage, chargerImage } from '../lib/rendu'
import { televerser, apiBrouillons } from '../lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Circle, Line } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Croix, Camera as IconeCamera, SonNote, Retourner, Galerie,
  EffetEnregistrer, EffetDeplier, CocheValider, SupprimerClip,
  Corbeille, Brouillon, Chevron,
  OutilFlash, OutilMinuteur, OutilDisposition, OutilRetouche, OutilFiltres,
  OutilVitesse, OutilPlus,
} from '../composants/Icones'
import ChoixSon from './ChoixSon'
import VignetteFiltre from '../composants/VignetteFiltre'
import { useApercuCamera } from '../lib/apercus'
import type { Son } from '../lib/sons'
import { prechargerSon } from '../lib/musiqueCalee'


// Memes listes que app/src/components/CreationCamera.tsx.
const FILTRES = [
  { nom: 'Original', voile: 'transparent', melange: 'normal' as const },
  { nom: 'Chaud', voile: 'rgba(255,146,60,.26)', melange: 'overlay' as const },
  { nom: 'Froid', voile: 'rgba(58,134,255,.26)', melange: 'overlay' as const },
  { nom: 'Éclat', voile: 'rgba(255,255,255,.22)', melange: 'soft-light' as const },
  { nom: 'Vintage', voile: 'rgba(188,152,106,.34)', melange: 'multiply' as const },
  { nom: 'Noir & blanc', voile: 'rgba(128,128,128,.62)', melange: 'saturation' as const },
]
const DUREES = ['10 min', '60 s', '15 s', 'PHOTO', 'TEXTE']
// Vitesses de prise, comme sur TikTok : a 2×, la musique joue deux fois
// plus lentement pendant la prise, et la video finale est acceleree.
const VITESSES = [0.5, 1, 2, 3]
// Minuteur : delai avant le debut de la prise, en secondes (0 = aucun).
const MINUTEURS = [0, 3, 10]
// Fonds du mode TEXTE.
const FONDS_TEXTE = ['#ff2856', '#111111', '#3f7ff0', '#ef8d3c', '#c43cc0', '#1fa774']
const CLE_EFFETS_FAVORIS = 'tocktick-effets-favoris-v1'

const OUTILS = [
  { nom: 'Flash', Icone: OutilFlash },
  { nom: 'Minuteur', Icone: OutilMinuteur },
  { nom: 'Grille', Icone: OutilDisposition },
  { nom: 'Retouche', Icone: OutilRetouche },
  { nom: 'Filtres', Icone: OutilFiltres },
  { nom: 'Vitesse', Icone: OutilVitesse },
  { nom: "Plus d'outils", Icone: OutilPlus },
]

// Anneau de progression : un cercle dont on decouvre le trace a mesure que
// l'enregistrement avance, comme la capture de reference.
// Compteur de duree partage : une seule horloge, et seuls les deux composants
// qui l'affichent se re-rendent. Le reste de l'ecran — dont le flux camera —
// reste intact pendant la prise.
const chrono = {
  valeur: 0,
  abonnes: new Set<(v: number) => void>(),
  minuterie: null as ReturnType<typeof setInterval> | null,
  poser(v: number) {
    this.valeur = v
    this.abonnes.forEach(f => f(v))
  },
  demarrer() {
    if (this.minuterie) return
    this.minuterie = setInterval(() => this.poser(+(this.valeur + .1).toFixed(1)), 100)
  },
  arreter() {
    if (!this.minuterie) return
    clearInterval(this.minuterie)
    this.minuterie = null
  },
}

function useChrono() {
  const [v, setV] = useState(chrono.valeur)
  useEffect(() => {
    const abonne = (x: number) => setV(x)
    chrono.abonnes.add(abonne)
    return () => { chrono.abonnes.delete(abonne) }
  }, [])
  return v
}

// Musique du son retenu, jouee pendant chaque prise pour filmer dans le
// rythme. Elle part du point ou en est le chronometre : les prises
// successives s'enchainent donc sur le morceau, et la suppression d'un clip
// la fait revenir d'autant. Montee par son (cle), la source ne change jamais.
// Camera web : enregistrement continu, a clore pour obtenir la video.
type CameraSeance = { terminerSession: () => Promise<string | undefined> }
const seanceWeb = (c: unknown): CameraSeance | null =>
  c && typeof (c as Partial<CameraSeance>).terminerSession === 'function' ? c as CameraSeance : null

function MusiquePrise({ son, enCours, vitesse }: { son: Son; enCours: boolean; vitesse: number }) {
  const musique = usePiste(son.url)
  // A 2×, la musique joue a 0,5× pendant la prise : une fois la video
  // acceleree, elle retrouve son rythme normal.
  useEffect(() => { musique.regler(1 / vitesse) }, [musique, vitesse])
  // Le son est deja mis en memoire pour l'apercu du montage (sauf un son
  // original : c'est la piste d'une video, trop lourde pour ca).
  useEffect(() => { if (!son.original) prechargerSon(son.url) }, [son.url, son.original])
  useEffect(() => {
    if (!enCours) { musique.pause(); return }
    let annule = false
    const lancer = async () => {
      // Mobile : le morceau doit etre charge pour accepter une position. Le
      // web la retient et l'applique des que le fichier est pret.
      for (let i = 0; Platform.OS !== 'web' && i < 60 && !musique.isLoaded && !annule; i++) {
        await new Promise(r => setTimeout(r, 50))
      }
      if (annule) return
      // Duree inconnue (son original) : on suit le chronometre sans boucler.
      const temps = chrono.valeur / vitesse
      const position = son.duree > 0 ? temps % son.duree : temps
      await musique.seekTo(position).catch(() => { /* Position refusee. */ })
      if (!annule) musique.play()
    }
    lancer()
    return () => { annule = true }
  }, [enCours, musique, son.duree, vitesse])
  return null
}

// Affichage « mm:ss », isole pour ne re-rendre que lui.
const Chronometre = React.memo(function Chronometre() {
  const v = useChrono()
  return (
    <Text style={s.chrono}>
      {String(Math.floor(v / 60)).padStart(2, '0')}
      :{String(Math.floor(v % 60)).padStart(2, '0')}
    </Text>
  )
})

const Viseur = React.memo(function Viseur({ cameraRef, face, filtre, torche, retouche, grille }: {
  cameraRef: React.RefObject<CameraView | null>; face: CameraType
  // Index du filtre applique : son voile se pose sur l'apercu.
  filtre: number
  // Lampe allumee : seule la camera arriere en porte une.
  torche: boolean
  retouche: boolean
  // Grille de cadrage (regle des tiers), jamais enregistree.
  grille: boolean
}) {
  const choisi = FILTRES[filtre]
  // Web : filtre et retouche sont aussi graves dans l'enregistrement.
  const habillage = { voile: { couleur: choisi.voile, melange: choisi.melange }, retouche }
  return (
    <>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill}
        facing={face} mode="video" enableTorch={torche}
        {...(habillage as object)} />
      {grille && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {[1, 2].map(i => <View key={`v${i}`} style={[s.grilleTrait, { left: `${(i * 100) / 3}%`, top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />)}
          {[1, 2].map(i => <View key={`h${i}`} style={[s.grilleTrait, { top: `${(i * 100) / 3}%`, left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />)}
        </View>
      )}
      {choisi.voile !== 'transparent' && (
        <View pointerEvents="none" style={[
          StyleSheet.absoluteFill,
          { backgroundColor: choisi.voile, mixBlendMode: choisi.melange },
        ]} />
      )}
    </>
  )
})

const DisqueEnregistrement = React.memo(function DisqueEnregistrement({
  taille, dureeMax, enCours, separations,
}: {
  taille: number; dureeMax: number; enCours: boolean
  // Avancement, entre 0 et 1, de la fin de chaque prise deja enregistree.
  separations: number[]
}) {
  const part = useChrono() / dureeMax
  const rayon = taille / 2 - 3
  const tour = 2 * Math.PI * rayon
  const centre = taille / 2
  return (
    <View style={{ width: taille, height: taille, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
        <Circle cx={centre} cy={centre} r={rayon} fill="rgba(255,255,255,.92)" />
        <Circle cx={centre} cy={centre} r={rayon}
          stroke="#ff2856" strokeWidth={6} fill="none" strokeLinecap="round"
          strokeDasharray={`${tour}`}
          strokeDashoffset={tour * (1 - Math.min(part, 1))}
          transform={`rotate(-90 ${centre} ${centre})`} />
        {/* Traits blancs marquant la fin de chaque prise, pour situer les
            coupes sur l'anneau de progression. */}
        {separations.filter(s => s > 0 && s < 1).map((s, i) => {
          const angle = (s * 360 - 90) * Math.PI / 180
          const interne = rayon - 4
          const externe = rayon + 4
          return (
            <Line key={i}
              x1={centre + Math.cos(angle) * interne}
              y1={centre + Math.sin(angle) * interne}
              x2={centre + Math.cos(angle) * externe}
              y2={centre + Math.sin(angle) * externe}
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          )
        })}
      </Svg>
      <View style={{
        width: taille * (enCours ? .3 : .62),
        height: taille * (enCours ? .3 : .62),
        borderRadius: enCours ? 10 : taille * .31,
        backgroundColor: '#ff2856',
      }} />
    </View>
  )
})

export default function Camera({ onFermer, onChoisir, sonInitial }: {
  onFermer: () => void
  // Son deja retenu (« Utiliser ce son » depuis le fil).
  sonInitial?: Son | null
  // Le son retenu voyage avec la video : sans lui, le choix fait ici
  // serait perdu entre le viseur et la publication.
  // `vitesse` : vitesse de prise, appliquee par le montage.
  onChoisir: (uri: string, son?: Son | null, vitesse?: number) => void
}) {
  // Mesure reactive plutot que lue au chargement du module : la vignette
  // suit ainsi la largeur reelle, y compris a la rotation.
  const { width: largeur } = useWindowDimensions()
  const marges = useSafeAreaInsets()
  // `grid-template-columns: 1fr 1fr 1.5fr 1fr 1fr; gap:12px; padding:0 7px`
  // La colonne centrale vaut 1,5 fois les autres.
  const dispo = largeur - 14 - 12 * 4
  const colonne = dispo / 5.5
  const cote = Math.min(colonne, 68)
  const tailleVignette = {
    width: cote, height: cote, borderRadius: cote / 2,
  }
  const tailleFilmer = Math.min(colonne * 1.5, 104)
  const [permission, demander] = useCameraPermissions()
  const [face, setFace] = useState<CameraType>('back')
  const [mode, setMode] = useState('15 s')
  const [filtre, setFiltre] = useState(0)
  // Son retenu pour la prochaine prise, choisi dans la feuille.
  const [choixSon, setChoixSon] = useState(false)
  const [son, setSon] = useState<Son | null>(sonInitial ?? null)
  const [message, setMessage] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  // Clips deja captures : chaque appui sur le bouton ajoute un segment, et la
  // coche valide l'ensemble. `cumul` garde la duree des clips termines pour
  // que le chronometre et l'arc continuent d'une prise a l'autre.
  const [clips, setClips] = useState<{ uri: string; fin: number }[]>([])
  const [cumul, setCumul] = useState(0)

  const [vitesse, setVitesse] = useState(1)
  const [barreVitesse, setBarreVitesse] = useState(false)
  const [minuteur, setMinuteur] = useState(0)
  // Compte a rebours du minuteur en cours (secondes restantes), ou null.
  const [decompte, setDecompte] = useState<number | null>(null)
  const [retouche, setRetouche] = useState(false)
  const [grille, setGrille] = useState(false)
  // Panneau de tous les effets (« Agrandir ») et effets mis en favoris.
  const [panneauEffets, setPanneauEffets] = useState(false)
  const [effetsFavoris, setEffetsFavoris] = useState<string[]>([])
  useEffect(() => {
    AsyncStorage.getItem(CLE_EFFETS_FAVORIS)
      .then(brut => { if (brut) setEffetsFavoris(JSON.parse(brut)) })
      .catch(() => { /* Stockage illisible : aucun favori. */ })
  }, [])
  // Mode TEXTE : texte saisi et couleur de fond.
  const [texte, setTexte] = useState('')
  const [fondTexte, setFondTexte] = useState(0)
  // Travail en cours (preparation ou envoi), affiche par-dessus le viseur.
  const [travail, setTravail] = useState<string | null>(null)

  // Duree maximale de la video finale selon le mode choisi.
  const dureeMax = mode === '10 min' ? 600 : mode === '60 s' ? 60 : 15
  // Avec un son, la video s'arrete a la fin du morceau, comme sur TikTok.
  // La limite est exprimee en temps de prise : a 2×, on filme deux fois
  // plus longtemps pour une meme duree finale.
  const limite = (son && son.duree > 0 ? Math.min(dureeMax, son.duree) : dureeMax) * vitesse
  // Web : les prises s'enchainent dans un enregistrement continu (seance).
  // Supprimer une prise clot la seance ; on garde sa partie utile, et la
  // validation raccorde les seances. `debutSeance` : chrono au debut de la
  // seance en cours (null s'il n'y en a pas).
  const seances = useRef<{ uri: string; debut: number; fin: number; entiere: boolean }[]>([])
  const debutSeance = useRef<number | null>(null)
  const [assemblage, setAssemblage] = useState(false)

  useEffect(() => {
    if (enregistrement) chrono.demarrer()
    else chrono.arreter()
  }, [enregistrement])

  useEffect(() => () => { chrono.arreter(); chrono.poser(0) }, [])
  const camera = useRef<CameraView>(null)
  // Image vivante de la camera, posee dans les vignettes des filtres.
  const apercuFiltres = useApercuCamera()
  // Apercu de la derniere video de la pellicule, pose dans le cadre « galerie ».
  const [apercuGalerie, setApercuGalerie] = useState<string | null>(null)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  // Lampe de la camera arriere, commandee par l'outil « Flash ».
  const [torche, setTorche] = useState(false)
  // Mode « Effets » : s'active des qu'un filtre autre qu'Original est choisi.
  const [modeEffets, setModeEffets] = useState(false)
  // Menu affiche quand on quitte un montage en cours.
  const [menuSortie, setMenuSortie] = useState(false)

  useEffect(() => {
    let annule = false
    MediaLibrary.requestPermissionsAsync()
      .then(async perm => {
        // Refus : le cadre garde simplement son icone, l'import reste possible
        // par le selecteur systeme.
        if (!perm.granted) return
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: ['video'], sortBy: ['creationTime'], first: 1,
        })
        if (!annule && page.assets[0]) setApercuGalerie(page.assets[0].uri)
      })
      .catch(() => { /* Pellicule illisible : on garde l'icone. */ })
    return () => { annule = true }
  }, [])

  // Glissement du carrousel : un filtre tous les 60 px, comme sur le web.
  const depart = useRef<number | null>(null)
  const franchi = useRef(0)

  const avertir = (texteAvis: string, duree = 2600) => {
    setMessage(texteAvis)
    setTimeout(() => setMessage(''), duree)
  }

  const outil = (nom: string) => {
    switch (nom) {
      case 'Filtres':
      case 'Effets':
        setFiltre(v => (v + 1) % FILTRES.length); setModeEffets(true); setMessage(''); return
      case 'Flash':
        // La lampe est une vraie capacite de l'appareil : seule la camera
        // arriere en porte une, d'ou le refus explicite en facade.
        if (face === 'front') return avertir('La caméra avant n’a pas de lampe.')
        setTorche(v => !v); setMessage(''); return
      case 'Minuteur': {
        const suivant = MINUTEURS[(MINUTEURS.indexOf(minuteur) + 1) % MINUTEURS.length]
        setMinuteur(suivant)
        return avertir(suivant ? `Minuteur : la prise démarre ${suivant} s après l’appui.` : 'Minuteur désactivé.')
      }
      case 'Grille':
        setGrille(v => !v); return
      case 'Retouche':
        setRetouche(v => !v)
        return avertir(retouche ? 'Retouche désactivée.' : 'Retouche activée : teint lissé et lumineux.')
      case 'Vitesse':
        if (clips.length > 0) return avertir('La vitesse se choisit avant la première prise.')
        setBarreVitesse(v => !v); return
      case 'Enregistrer l’effet': {
        const nomFiltre = FILTRES[filtre].nom
        const favoris = effetsFavoris.includes(nomFiltre)
          ? effetsFavoris.filter(n => n !== nomFiltre)
          : [nomFiltre, ...effetsFavoris]
        setEffetsFavoris(favoris)
        AsyncStorage.setItem(CLE_EFFETS_FAVORIS, JSON.stringify(favoris)).catch(() => {})
        return avertir(favoris.includes(nomFiltre)
          ? `« ${nomFiltre} » ajouté à tes effets favoris.`
          : `« ${nomFiltre} » retiré de tes effets favoris.`)
      }
      case 'Agrandir':
        setPanneauEffets(true); return
      case 'Diffusion LIVE':
        // Meme regle que TikTok : le direct s'ouvre a partir de 1 000 abonnes.
        return avertir('Le LIVE s’ouvre à partir de 1 000 abonnés.', 3200)
      case 'Créer':
        setMode('TEXTE'); return
    }
  }

  const galerie = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return Alert.alert('Autorisation requise', 'Autorisez l’accès à vos vidéos.')
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 90, quality: 0.7,
    })
    if (r.canceled || !r.assets[0]) return
    // Video lourde (telephone recent) : compressee avant le montage.
    setTravail('Compression de la vidéo… 0 %')
    try {
      const uri = await compresserSiLourde(r.assets[0].uri, part => setTravail(`Compression de la vidéo… ${Math.round(part * 100)} %`))
      onChoisir(uri, son)
    } catch {
      onChoisir(r.assets[0].uri, son)
    } finally { setTravail(null) }
  }

  const prendre = async () => {
    if (!camera.current) return
    const restant = limite - chrono.valeur
    if (restant < 0.3) {
      return avertir(son && son.duree > 0 && limite === son.duree * vitesse
        ? 'Le son est terminé : valide ta vidéo.' : 'Durée maximale atteinte.')
    }
    setEnregistrement(true)
    if (seanceWeb(camera.current) && debutSeance.current === null) debutSeance.current = chrono.valeur
    try {
      const v = await camera.current.recordAsync({ maxDuration: restant })
      if (v?.uri) setClips(l => [...l, { uri: v.uri, fin: chrono.valeur }])
    } catch {
      setMessage("L'enregistrement a échoué. Réessaie.")
    } finally {
      setEnregistrement(false)
      setCumul(chrono.valeur)
    }
  }

  // Bouton rond : arrete la prise en cours, annule un compte a rebours, ou
  // lance la prise (apres le minuteur s'il est regle).
  const minuteurEnCours = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (minuteurEnCours.current) clearInterval(minuteurEnCours.current) }, [])
  const filmer = () => {
    if (!camera.current) return
    if (enregistrement) { camera.current.stopRecording(); return }
    if (decompte !== null) {
      if (minuteurEnCours.current) clearInterval(minuteurEnCours.current)
      setDecompte(null); return
    }
    setBarreVitesse(false)
    if (!minuteur) { prendre(); return }
    let reste = minuteur
    setDecompte(reste)
    minuteurEnCours.current = setInterval(() => {
      reste -= 1
      if (reste > 0) { setDecompte(reste); return }
      if (minuteurEnCours.current) clearInterval(minuteurEnCours.current)
      setDecompte(null)
      prendre()
    }, 1000)
  }

  // Mode PHOTO : la photo devient une video de 5 s (leger zoom), sur
  // laquelle la musique choisie s'ajoute comme pour toute video.
  const photographier = async () => {
    if (!camera.current || travail) return
    try {
      const photo = await camera.current.takePictureAsync()
      if (!photo?.uri) return
      setTravail('Préparation de la photo')
      const image = await chargerImage(photo.uri)
      const voile = FILTRES[filtre]
      const uri = await videoFixe((g, l, h, t) => {
        const e = Math.max(l / image.width, h / image.height) * (1 + 0.06 * t)
        const w = image.width * e, hh = image.height * e
        g.save()
        if (face === 'front') { g.translate(l, 0); g.scale(-1, 1) }
        if (retouche) g.filter = 'brightness(1.06) contrast(.94) saturate(1.06) blur(.5px)'
        g.drawImage(image, (l - w) / 2, (h - hh) / 2, w, hh)
        g.restore()
        if (voile.voile !== 'transparent') {
          g.save()
          g.globalCompositeOperation = (voile.melange === 'normal' ? 'source-over' : voile.melange) as GlobalCompositeOperation
          g.fillStyle = voile.voile
          g.fillRect(0, 0, l, h)
          g.restore()
        }
      })
      onChoisir(uri, son, 1)
    } catch {
      avertir('La photo n’a pas pu être prise. Réessaie.')
    } finally { setTravail(null) }
  }

  // Mode TEXTE : le texte sur fond de couleur devient une video de 5 s.
  const publierTexte = async () => {
    const propre = texte.trim()
    if (!propre) return avertir('Écris d’abord ton texte.')
    if (travail) return
    setTravail('Préparation du texte')
    try {
      const fond = FONDS_TEXTE[fondTexte]
      const uri = await videoFixe((g, l, h) => {
        g.fillStyle = fond
        g.fillRect(0, 0, l, h)
        dessinerHabillage(g, l, h, { calques: [{
          genre: 'texte', contenu: propre, couleur: '#fff', x: 0.5, y: 0.5,
          taille: propre.length > 120 ? 0.055 : propre.length > 40 ? 0.07 : 0.09,
        }] })
      })
      onChoisir(uri, son, 1)
    } catch {
      avertir('Le texte n’a pas pu être préparé. Réessaie.')
    } finally { setTravail(null) }
  }

  // `⊗` : retire la derniere prise, apres confirmation comme sur TikTok.
  const supprimerDernier = () => {
    Alert.alert('Supprimer le dernier clip ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          const reste = clips.slice(0, -1)
          setClips(reste)
          const finGardee = reste.length ? reste[reste.length - 1].fin : 0
          // La seance en cours contient la prise supprimee : on la clot, et
          // seule sa partie d'avant la prise sera gardee.
          const cam = seanceWeb(camera.current)
          if (cam) {
            if (debutSeance.current !== null) {
              const debut = debutSeance.current
              debutSeance.current = null
              const uri = await cam.terminerSession()
              if (uri) seances.current.push({ uri, debut, fin: Infinity, entiere: false })
            }
            seances.current = seances.current
              .map(x => ({ ...x, fin: Math.min(x.fin, finGardee) }))
              .filter(x => x.fin > x.debut + 0.05)
          }
          // Le chronometre revient a la fin du clip precedent.
          const fin = reste.length ? reste[reste.length - 1].fin : 0
          chrono.poser(fin); setCumul(fin)
        },
      },
    ])
  }

  // La coche valide le montage et passe a la publication.
  // Video de toutes les prises : sur le web, l'enregistrement continu est
  // clos, et les seances separees par une suppression sont raccordees.
  const videoFinale = async (): Promise<string> => {
    const cam = seanceWeb(camera.current)
    // Mobile : chaque prise est un fichier, la camera rend la derniere.
    if (!cam) return clips[clips.length - 1].uri
    if (debutSeance.current !== null) {
      const debut = debutSeance.current
      debutSeance.current = null
      const uri = await cam.terminerSession()
      if (uri) seances.current.push({ uri, debut, fin: chrono.valeur, entiere: true })
    }
    const morceaux = seances.current
    if (!morceaux.length) throw new Error('Aucune prise')
    if (morceaux.length === 1 && morceaux[0].entiere) return morceaux[0].uri
    setAssemblage(true)
    try {
      const uri = await assemblerVideos(morceaux.map(m => ({ uri: m.uri, duree: m.fin - m.debut })))
      // Le raccord devient l'unique morceau : une seconde validation le reprend.
      seances.current = [{ uri, debut: 0, fin: chrono.valeur, entiere: true }]
      return uri
    } finally { setAssemblage(false) }
  }

  // La coche valide le montage et passe a la publication.
  const valider = async () => {
    if (!clips.length || assemblage || enregistrement || travail) return
    try { onChoisir(await videoFinale(), son, vitesse) }
    catch { setMessage('Impossible de préparer la vidéo. Réessaie.') }
  }

  // Menu de sortie : « Recommencer » efface les prises sans quitter.
  const recommencer = async () => {
    setMenuSortie(false)
    await seanceWeb(camera.current)?.terminerSession()
    debutSeance.current = null
    seances.current = []
    setClips([]); chrono.poser(0); setCumul(0)
  }

  // Menu de sortie : les prises rejoignent les brouillons (envoyes au
  // compte, retrouves dans le profil).
  const enregistrerBrouillon = async () => {
    setMenuSortie(false)
    if (!clips.length || travail) return
    try {
      const video = await videoFinale()
      setTravail('Envoi du brouillon')
      const url = await televerser(video, (etape, pct) => {
        if (etape === 'envoi') setTravail(`Envoi du brouillon… ${pct ?? 0} %`)
      })
      await apiBrouillons.creer(url, '')
      setTravail(null)
      avertir('Brouillon enregistré.')
      setTimeout(onFermer, 900)
    } catch (e) {
      setTravail(null)
      avertir(e instanceof Error ? e.message : 'Le brouillon n’a pas pu être enregistré.')
    }
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.page}>
        <Pressable style={s.fermer} onPress={onFermer} hitSlop={12}>
          <Croix taille={26} couleur="#fff" />
        </Pressable>
        <View style={s.centre}>
          <IconeCamera taille={56} couleur="rgba(255,255,255,.6)" />
          <Text style={s.centreTitre}>Autorisez la caméra</Text>
          <Text style={s.centreTexte}>
            Pour filmer une vidéo, autorisez l’accès à la caméra et au micro.
          </Text>
          <Pressable style={s.autoriser} onPress={demander}>
            <Text style={s.autoriserTexte}>Autoriser</Text>
          </Pressable>
          {/* Web : un refus du navigateur s'explique, sinon le bouton
              semblerait ne rien faire. */}
          {!!(permission as { raison?: string } | null)?.raison && (
            <Text style={s.raisonRefus} accessibilityLiveRegion="polite">
              {(permission as { raison?: string }).raison}
            </Text>
          )}
          <Pressable onPress={galerie}>
            <Text style={s.lien}>Ou choisir dans la galerie</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={[s.page, { paddingTop: marges.top + 40 }]}>
      <View style={s.viseur}>
        {son && <MusiquePrise key={son.id} son={son} enCours={enregistrement} vitesse={vitesse} />}
        <Viseur cameraRef={camera} face={face} filtre={filtre}
          torche={torche && face === 'back'} retouche={retouche} grille={grille} />

        {decompte !== null && (
          <View style={s.decompte} pointerEvents="none">
            <Text style={s.decompteTexte}>{decompte}</Text>
          </View>
        )}

        {mode === 'TEXTE' && !enregistrement && clips.length === 0 && (
          <View style={[s.texteMode, { backgroundColor: FONDS_TEXTE[fondTexte] }]}>
            <TextInput style={s.texteSaisie} value={texte} onChangeText={setTexte}
              multiline maxLength={300} placeholder="Appuie pour écrire"
              placeholderTextColor="rgba(255,255,255,.6)" />
            <View style={s.texteActions}>
              <Pressable style={s.texteCouleur} onPress={() => setFondTexte(i => (i + 1) % FONDS_TEXTE.length)}>
                <View style={[s.texteCouleurRond, { backgroundColor: FONDS_TEXTE[(fondTexte + 1) % FONDS_TEXTE.length] }]} />
                <Text style={s.texteCouleurNom}>Couleur</Text>
              </Pressable>
              <Pressable style={[s.texteSuivant, !texte.trim() && s.inactif]} onPress={publierTexte}>
                <Text style={s.texteSuivantTexte}>Suivant</Text>
              </Pressable>
            </View>
          </View>
        )}

        {(travail || assemblage) && (
          <View style={s.travail}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={s.messageTexte}>{travail ?? 'Préparation de la vidéo…'}</Text>
          </View>
        )}

      {/* Barre du haut : fermer, ajouter un son, retourner */}
      {!enregistrement && <SafeAreaView style={s.hautZone}>
        <View style={s.haut}>
          <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="Quitter"
            onPress={() => clips.length > 0 ? setMenuSortie(true) : onFermer()}>
            {clips.length > 0
              ? <Chevron taille={26} couleur="#fff" />
              : <Croix taille={26} couleur="#fff" />}
          </Pressable>
          <Pressable style={s.son} onPress={() => setChoixSon(true)}>
            <SonNote taille={18} couleur="#fff" />
            <Text style={s.sonTexte} numberOfLines={1}>
              {son ? son.titre : 'Ajouter un son'}
            </Text>
          </Pressable>
          <Pressable hitSlop={12} disabled={enregistrement}
            accessibilityRole="button" accessibilityLabel="Retourner la caméra"
            onPress={() => {
              // La facade n'a pas de lampe : la torche s'eteint avec le
              // retournement, pour ne pas rester allumee en apparence.
              setTorche(false)
              setFace(f => (f === 'back' ? 'front' : 'back'))
            }}>
            <Retourner taille={26} couleur="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>}

      {menuSortie && (
        <>
          <Pressable style={s.menuVoile} onPress={() => setMenuSortie(false)} />
          <View style={s.menuSortie}>
            <Pressable style={s.menuLigne} onPress={recommencer}>
              <Retourner taille={20} couleur="#111" />
              <Text style={s.menuTexte}>Recommencer</Text>
            </Pressable>
            <Pressable style={s.menuLigne} onPress={enregistrerBrouillon}>
              <Brouillon taille={20} couleur="#111" />
              <Text style={s.menuTexte}>Enregistrer le brouillon</Text>
            </Pressable>
            <Pressable style={s.menuLigne} onPress={async () => {
              await recommencer(); onFermer()
            }}>
              <Corbeille taille={20} couleur="#ed2753" />
              <Text style={[s.menuTexte, s.menuSupprimer]}>Supprimer</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Outils, colonne de droite */}
      {!enregistrement && <View style={s.outils}>
        {OUTILS.filter(o => o.nom !== 'Vitesse' || outilsDeplies)
          .map(({ nom, Icone }, i, liste) => {
          const dernier = i === liste.length - 1
          // Le chevron final deplie la colonne : les libelles se posent alors
          // a gauche de chaque icone et la fleche se retourne.
          if (dernier) {
            return (
              <Pressable key={nom} style={s.outil} hitSlop={6}
                accessibilityRole="button" accessibilityLabel={outilsDeplies ? 'Moins d’outils' : 'Plus d’outils'}
                onPress={() => setOutilsDeplies(v => !v)}>
                <View style={outilsDeplies ? s.chevronHaut : undefined}>
                  <Icone taille={26} couleur="#fff" />
                </View>
              </Pressable>
            )
          }
          return (
            <Pressable key={nom} style={[s.outilLigne, i === 0 && s.outilPremier]}
              accessibilityRole="button" accessibilityLabel={nom}
              onPress={() => outil(nom)} hitSlop={6}>
              {outilsDeplies && !modeEffets && i > 0 && (
                <Text style={s.outilNom} numberOfLines={1}>{nom}</Text>
              )}
              <View style={s.outil}>
                {/* Lampe allumee : l'icone passe au jaune, sans quoi rien
                    ne distinguerait les deux etats du flash. */}
                {/* Outil actif en jaune : sans cela, rien ne distinguerait
                    ses deux etats (lampe, retouche, grille, minuteur). */}
                <Icone taille={26}
                  couleur={(nom === 'Flash' && torche && face === 'back')
                    || (nom === 'Retouche' && retouche) || (nom === 'Grille' && grille)
                    || (nom === 'Minuteur' && minuteur > 0) || (nom === 'Vitesse' && vitesse !== 1)
                    ? '#fcd116' : '#fff'} />
                {nom === 'Minuteur' && minuteur > 0 && <Text style={s.outilBadge}>{minuteur}s</Text>}
                {nom === 'Vitesse' && vitesse !== 1 && <Text style={s.outilBadge}>{vitesse}×</Text>}
                {i === 0 && <View style={s.outilFilet} />}
              </View>
            </Pressable>
          )
        })}
      </View>}

      {!!message && (
        <View style={s.message}><Text style={s.messageTexte}>{message}</Text></View>
      )}
      {assemblage && (
        <View style={s.message}>
          <ActivityIndicator color="#fff" />
          <Text style={s.messageTexte}>Préparation de la vidéo…</Text>
        </View>
      )}

      {/* Bas : durees, carrousel, modes */}
      <SafeAreaView style={s.basZone}>
        {barreVitesse && !enregistrement && (
          <View style={s.vitesses}>
            {VITESSES.map(v => (
              <Pressable key={v} style={[s.vitesse, v === vitesse && s.vitesseChoisie]}
                onPress={() => setVitesse(v)}>
                <Text style={[s.vitesseTexte, v === vitesse && s.vitesseTexteChoisi]}>{v}×</Text>
              </Pressable>
            ))}
          </View>
        )}
        {enregistrement || clips.length > 0 ? (
          <Chronometre />
        ) : <View style={s.durees}>
          {DUREES.map(d => (
            <Pressable key={d} disabled={enregistrement} onPress={() => setMode(d)}>
              <Text style={[s.duree, mode === d && s.dureeActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>}

        <View
          style={s.carrousel}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={e => { depart.current = e.nativeEvent.pageX; franchi.current = 0 }}
          onResponderMove={e => {
            if (depart.current === null) return
            const crans = Math.trunc((depart.current - e.nativeEvent.pageX) / 60)
            if (crans === franchi.current) return
            const pas = crans - franchi.current
            franchi.current = crans
            setFiltre(v => (v + pas + FILTRES.length * 10) % FILTRES.length)
          }}
          onResponderRelease={() => { depart.current = null }}>
          {[-2, -1, 0, 1, 2].map(decalage => {
            const i = (filtre + decalage + FILTRES.length) % FILTRES.length
            if (decalage === 0) {
              return (
                enregistrement || clips.length > 0 ? (
                  // Pendant la prise : carre rouge (= arreter), entoure de
                  // l'arc de progression. En pause : disque rouge plein
                  // (= reprendre), l'arc gardant l'avancement acquis.
                  <Pressable key="filmer" onPress={filmer} accessibilityRole="button"
                    accessibilityLabel={enregistrement ? 'Arrêter la prise' : 'Reprendre la prise'}>
                    <DisqueEnregistrement taille={tailleFilmer}
                      dureeMax={limite} enCours={enregistrement}
                      separations={clips.map(c => c.fin / limite)} />
                  </Pressable>
                ) : (
                  <Pressable key="filmer" disabled={!camera || mode === 'TEXTE'}
                    accessibilityRole="button"
                    accessibilityLabel={mode === 'PHOTO' ? 'Prendre une photo' : decompte !== null ? 'Annuler le minuteur' : 'Enregistrer'}
                    style={[s.filmer, {
                      width: tailleFilmer, height: tailleFilmer,
                      borderRadius: tailleFilmer / 2,
                    }, mode === 'TEXTE' && s.inactif]}
                    onPress={mode === 'PHOTO' ? photographier : filmer}>
                    {decompte !== null
                      ? <View style={s.carreRouge} />
                      : <View style={mode === 'PHOTO' ? s.disqueBlanc : modeEffets ? s.disqueEffet : s.disqueRouge} />}
                  </Pressable>
                )
              )
            }
            if (enregistrement || clips.length > 0) return null
            return (
              <Pressable key={decalage} style={[s.vignetteFiltre, tailleVignette]}
                onPress={() => { setFiltre(i); setModeEffets(true) }}>
                <VignetteFiltre image={apercuFiltres} voile={FILTRES[i].voile} melange={FILTRES[i].melange} />
              </Pressable>
            )
          })}
          {clips.length > 0 && !enregistrement && (
            <Pressable style={s.filtreEnPause}
              onPress={() => { setFiltre(f => (f + 1) % FILTRES.length); setModeEffets(true) }}>
              <VignetteFiltre image={apercuFiltres} voile={FILTRES[filtre].voile} melange={FILTRES[filtre].melange} />
            </Pressable>
          )}
          {clips.length > 0 && (
            <View style={s.montage} pointerEvents="box-none">
              {!enregistrement && (
                <Pressable style={s.montageSupprimer} onPress={supprimerDernier}
                  accessibilityRole="button" accessibilityLabel="Supprimer la dernière prise">
                  <SupprimerClip taille={22} couleur="#111" />
                </Pressable>
              )}
              <Pressable style={s.montageValider} onPress={valider}
                accessibilityRole="button" accessibilityLabel="Valider">
                <CocheValider taille={26} couleur="#fff" />
              </Pressable>
            </View>
          )}
        </View>

          {!enregistrement && clips.length === 0 && (
            <Text style={s.filtreNom}>{FILTRES[filtre].nom}</Text>
          )}
        </SafeAreaView>
      </View>

      {/* `.creation-camera > footer` : hors du viseur, sur le fond noir. */}
      <View style={[s.pied, { paddingBottom: marges.bottom }]}>
        {!enregistrement && clips.length === 0 && <>
        <Pressable style={s.galerie} onPress={galerie} accessibilityRole="button" accessibilityLabel="Galerie">
          {apercuGalerie
            ? <Image source={{ uri: apercuGalerie }} style={s.galerieApercu} />
            : <Galerie taille={20} couleur="#fff" />}
        </Pressable>

        {modeEffets ? <>
          {/* Barre « Effets » : elle remplace LIVE / PUBLIER / CREER tant
              qu'un filtre est applique. */}
          <View style={s.barreEffets}>
            <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Enregistrer l’effet"
              onPress={() => outil('Enregistrer l’effet')}>
              <EffetEnregistrer taille={24} couleur="#fff" />
            </Pressable>
            <Text style={s.barreEffetsTitre}>Effets</Text>
            <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Tous les effets"
              onPress={() => outil('Agrandir')}>
              <EffetDeplier taille={22} couleur="#fff" />
            </Pressable>
          </View>
          <Pressable style={s.effetsFermer}
            onPress={() => { setModeEffets(false); setFiltre(0) }}>
            <Croix taille={22} couleur="#111" />
          </Pressable>
        </> : <>
          <Pressable onPress={() => outil('Diffusion LIVE')}>
            <Text style={s.mode}>LIVE</Text>
          </Pressable>
          <Text style={[s.mode, s.modeActif]}>PUBLIER</Text>
          <Pressable onPress={() => outil('Créer')}>
            <Text style={s.mode}>CRÉER</Text>
          </Pressable>
        </>}
        </>}
      </View>

      {/* « Agrandir » : tous les effets, favoris en tete (etoile). */}
      <Feuille visible={panneauEffets} titre="Effets" onFermer={() => setPanneauEffets(false)}>
        <View style={s.panneau}>
          {[...FILTRES.keys()]
            .sort((a, b) => Number(effetsFavoris.includes(FILTRES[b].nom)) - Number(effetsFavoris.includes(FILTRES[a].nom)))
            .map(i => (
              <Pressable key={FILTRES[i].nom} style={s.panneauEffet}
                onPress={() => { setFiltre(i); setModeEffets(i !== 0); setPanneauEffets(false) }}>
                <View style={[s.panneauVignette, i === filtre && s.panneauChoisi]}>
                  <VignetteFiltre image={apercuFiltres} voile={FILTRES[i].voile} melange={FILTRES[i].melange} />
                </View>
                <Text style={s.panneauNom} numberOfLines={1}>
                  {effetsFavoris.includes(FILTRES[i].nom) ? '★ ' : ''}{FILTRES[i].nom}
                </Text>
              </Pressable>
            ))}
        </View>
      </Feuille>

      <ChoixSon visible={choixSon} onFermer={() => setChoixSon(false)}
        onChoisir={setSon} />
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
  grilleTrait: { position: 'absolute', backgroundColor: 'rgba(255,255,255,.45)' },
  decompte: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 8,
    alignItems: 'center', justifyContent: 'center' },
  decompteTexte: { color: '#fff', fontSize: 120, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,.4)', textShadowRadius: 12 },
  travail: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  inactif: { opacity: .45 },
  // Mode TEXTE : le viseur devient une carte de couleur a ecrire.
  texteMode: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 4,
    alignItems: 'center', justifyContent: 'center', padding: 28 },
  texteSaisie: { color: '#fff', fontSize: 30, fontWeight: '700', textAlign: 'center',
    alignSelf: 'stretch', minHeight: 120 },
  texteActions: { position: 'absolute', bottom: 190, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  texteCouleur: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texteCouleurRond: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#fff' },
  texteCouleurNom: { color: '#fff', fontSize: 14, fontWeight: '600' },
  texteSuivant: { backgroundColor: '#fff', borderRadius: 22, paddingVertical: 10, paddingHorizontal: 22 },
  texteSuivantTexte: { color: '#111', fontSize: 15, fontWeight: '700' },
  outilBadge: { position: 'absolute', bottom: -10, color: '#fcd116', fontSize: 10, fontWeight: '700' },
  vitesses: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,.45)',
    borderRadius: 10, padding: 3, marginBottom: 12 },
  vitesse: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8 },
  vitesseChoisie: { backgroundColor: '#fff' },
  vitesseTexte: { color: '#fff', fontSize: 14, fontWeight: '600' },
  vitesseTexteChoisi: { color: '#111' },
  disqueBlanc: { width: '82%', height: '82%', borderRadius: 999, backgroundColor: '#fff' },
  panneau: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 16, paddingBottom: 24 },
  panneauEffet: { width: 76, alignItems: 'center', gap: 6 },
  panneauVignette: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#222' },
  panneauChoisi: { borderWidth: 3, borderColor: '#ff2856' },
  panneauNom: { fontSize: 12, color: '#111' },
  // `.creation-viseur` : coins arrondis 22px sur fond #171717, le pied est
  // rendu en dehors.
  viseur: { flex: 1, minHeight: 0, borderRadius: 22, backgroundColor: '#171717',
    overflow: 'hidden' },
  fermer: { position: 'absolute', top: 54, left: 16, zIndex: 5 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, gap: 12 },
  centreTitre: { color: '#fff', fontSize: 19, fontWeight: '700', marginTop: 8 },
  centreTexte: { color: 'rgba(255,255,255,.62)', fontSize: 15, textAlign: 'center', lineHeight: 21 },
  autoriser: { backgroundColor: '#ff2856', borderRadius: 30, paddingVertical: 14,
    paddingHorizontal: 40, marginTop: 10, minHeight: 48, justifyContent: 'center' },
  raisonRefus: { color: '#ffd166', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 4, maxWidth: 340 },
  autoriserTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lien: { color: 'rgba(255,255,255,.7)', marginTop: 14, fontSize: 14 },

  hautZone: { position: 'absolute', top: 0, left: 0, right: 0 },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  son: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(51,51,51,.53)', borderRadius: 30,
    paddingVertical: 12, paddingHorizontal: 16 },
  sonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },

  outils: { position: 'absolute', right: 12, top: 74, gap: 14, alignItems: 'flex-end' },
  outil: { width: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  // Libelle a gauche de l'icone quand la colonne est depliee.
  outilLigne: { flexDirection: 'row', alignItems: 'center', gap: 10,
    justifyContent: 'flex-end' },
  outilNom: { color: '#fff', fontSize: 15, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 3 },
  chevronHaut: { transform: [{ rotate: '180deg' }] },
  // `.creation-outils button:first-child:after` : filet de 20x1 sous le flash.
  outilPremier: { marginBottom: 10 },
  outilFilet: { position: 'absolute', bottom: -10, width: 20, height: 1,
    backgroundColor: 'rgba(255,255,255,.38)' },

  message: { position: 'absolute', left: 20, right: 60, bottom: 165,
    backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, padding: 10, zIndex: 4 },
  messageTexte: { color: '#fff', fontSize: 13 },

  basZone: { position: 'absolute', left: 0, right: 0, bottom: 6 },
  durees: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 14 },
  // Chronometre affiche a la place des durees pendant la prise.
  chrono: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center',
    marginBottom: 14, textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 4 },
  duree: { color: 'rgba(255,255,255,.75)', fontSize: 14, fontWeight: '600',
    paddingVertical: 4, paddingHorizontal: 9 },
  dureeActive: { color: '#000', backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden' },

  carrousel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 7, marginTop: 18 },
  vignetteFiltre: { backgroundColor: '#956d84', overflow: 'hidden' },
  filmer: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: '#fff',
    padding: 4, alignItems: 'center', justifyContent: 'center' },
  filmerActif: {},
  disqueRouge: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#ff2856' },
  carreRouge: { width: '52%', height: '52%', borderRadius: 8, backgroundColor: '#ff2856' },
  // En mode effets, le centre montre le filtre choisi plutot que le rouge.
  disqueEffet: { width: '100%', height: '100%', borderRadius: 40,
    backgroundColor: '#8d7f74' },

  // Boutons de montage poses a droite du declencheur, par-dessus le carrousel.
  // Menu de sortie : carte blanche sous la barre du haut.
  menuVoile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 },
  menuSortie: { position: 'absolute', top: 70, left: 16, width: 236, zIndex: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 4 },
  menuLigne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16, minHeight: 44 },
  menuTexte: { color: '#111', fontSize: 15, fontWeight: '500' },
  menuSupprimer: { color: '#ed2753' },
  menuAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d9c3a8' },

  // Vignette du filtre pendant la pause : carre arrondi cale a gauche.
  filtreEnPause: { position: 'absolute', left: 16, top: '50%',
    width: 62, height: 62, marginTop: -31, borderRadius: 12,
    backgroundColor: '#956d84', overflow: 'hidden' },

  montage: { position: 'absolute', right: 16, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 14 },
  montageSupprimer: { width: 44, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' },
  montageValider: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ff2856',
    alignItems: 'center', justifyContent: 'center' },

  filtreNom: { color: '#fff', fontSize: 12, textAlign: 'center', marginTop: 8,
    textShadowColor: 'rgba(0,0,0,.7)', textShadowRadius: 3 },

  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 26, paddingTop: 12, minHeight: 80 },
  // `.creation-galerie` : cadre blanc 30x30 cale a gauche, centre sur la ligne
  // LIVE / PUBLIER / CREER (padding 12 + moitie des 44px de la ligne, moins
  // la moitie des 30px du cadre).
  galerie: { position: 'absolute', left: 14, top: 19, width: 30, height: 30, padding: 3,
    borderWidth: 2, borderColor: '#fff', borderRadius: 10, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center' },
  galerieApercu: { width: '100%', height: '100%', borderRadius: 7 },
  mode: { color: '#888', fontSize: 16, fontWeight: '600', paddingVertical: 6,
    paddingHorizontal: 4, minHeight: 44, textAlignVertical: 'center' },
  modeActif: { color: '#fff' },

  // Mode « Effets » : pilule sombre centree et bouton de sortie rond a droite.
  barreEffets: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 18,
    backgroundColor: 'rgba(60,60,60,.85)', borderRadius: 26,
    paddingVertical: 12, paddingHorizontal: 20, minWidth: 236,
    // Decalee a droite pour degager la vignette de galerie, calee a gauche.
    marginLeft: 44 },
  barreEffetsTitre: { color: '#fff', fontSize: 17, fontWeight: '700' },
  effetsFermer: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center' },
})
