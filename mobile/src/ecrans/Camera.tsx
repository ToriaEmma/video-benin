import React, { useEffect, useRef, useState } from 'react'
import {
  View, Pressable, StyleSheet, useWindowDimensions, SafeAreaView, Alert, Image,
} from 'react-native'
import { Text } from '../composants/Texte'
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
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
import type { Son } from '../lib/sons'


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
// Pourquoi chaque outil reste muet. Filmer, choisir un filtre et allumer
// la lampe fonctionnent ; le reste demande un vrai moteur de montage, que
// Tok 229 n'a pas. Chaque bouton le dit plutot que de promettre une suite.
const RAISONS_OUTILS: Record<string, string> = {
  Minuteur: 'le déclenchement différé n’est pas encore en place.',
  Disposition: 'les modèles de disposition demandent un moteur de montage.',
  Retouche: 'la retouche du visage demande un moteur de montage.',
  Vitesse: 'le ralenti et l’accéléré demandent un moteur de montage.',
  "Plus d'outils": 'il n’y a pas d’autre outil pour l’instant.',
  'Enregistrer l’effet': 'les effets ne sont pas encore enregistrables.',
  Agrandir: 'l’aperçu agrandi n’est pas encore en place.',
  'Diffusion LIVE': 'Tok 229 n’a pas encore de diffusion en direct.',
  'Envoyer à des amis': 'partage ta vidéo une fois publiée.',
  Créer: 'il n’y a pas d’autre mode de création pour l’instant.',
}

const OUTILS = [
  { nom: 'Flash', Icone: OutilFlash },
  { nom: 'Minuteur', Icone: OutilMinuteur },
  { nom: 'Disposition', Icone: OutilDisposition },
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

const Viseur = React.memo(function Viseur({ cameraRef, face, filtre, torche }: {
  cameraRef: React.RefObject<CameraView | null>; face: CameraType
  // Index du filtre applique : son voile se pose sur l'apercu.
  filtre: number
  // Lampe allumee : seule la camera arriere en porte une.
  torche: boolean
}) {
  const choisi = FILTRES[filtre]
  return (
    <>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill}
        facing={face} mode="video" enableTorch={torche} />
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

export default function Camera({ onFermer, onChoisir }: {
  onFermer: () => void
  onChoisir: (uri: string) => void
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
  const [son, setSon] = useState<Son | null>(null)
  const [message, setMessage] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  // Clips deja captures : chaque appui sur le bouton ajoute un segment, et la
  // coche valide l'ensemble. `cumul` garde la duree des clips termines pour
  // que le chronometre et l'arc continuent d'une prise a l'autre.
  const [clips, setClips] = useState<{ uri: string; fin: number }[]>([])
  const [cumul, setCumul] = useState(0)

  // Duree maximale selon le mode choisi, qui borne aussi l'arc de progression.
  const dureeMax = mode === '60 s' ? 60 : 15

  useEffect(() => {
    if (enregistrement) chrono.demarrer()
    else chrono.arreter()
  }, [enregistrement])

  useEffect(() => () => { chrono.arreter(); chrono.poser(0) }, [])
  const camera = useRef<CameraView>(null)
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

  const outil = (nom: string) => {
    if (nom === 'Filtres' || nom === 'Effets') {
      setFiltre(v => (v + 1) % FILTRES.length); setMessage(''); return
    }
    // La lampe est une vraie capacite de l'appareil : seule la camera
    // arriere en porte une, d'ou le refus explicite en facade.
    if (nom === 'Flash') {
      if (face === 'front') {
        setMessage('La caméra avant n’a pas de lampe.')
        setTimeout(() => setMessage(''), 2600)
        return
      }
      setTorche(v => !v); setMessage(''); return
    }
    setMessage(`${nom} : ${RAISONS_OUTILS[nom] ?? 'pas encore en place.'}`)
    setTimeout(() => setMessage(''), 3200)
  }

  const galerie = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return Alert.alert('Autorisation requise', 'Autorisez l’accès à vos vidéos.')
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 90, quality: 0.7,
    })
    if (!r.canceled && r.assets[0]) onChoisir(r.assets[0].uri)
  }

  const filmer = async () => {
    if (!camera.current) return
    if (enregistrement) { camera.current.stopRecording(); return }
    setEnregistrement(true)
    try {
      const restant = Math.max(Math.round(dureeMax - chrono.valeur), 1)
      const v = await camera.current.recordAsync({ maxDuration: restant })
      if (v?.uri) setClips(l => [...l, { uri: v.uri, fin: chrono.valeur }])
    } catch {
      setMessage("L'enregistrement a échoué. Réessaie.")
    } finally {
      setEnregistrement(false)
      setCumul(chrono.valeur)
    }
  }

  // `⊗` : retire la derniere prise, apres confirmation comme sur TikTok.
  const supprimerDernier = () => {
    Alert.alert('Supprimer le dernier clip ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          const reste = clips.slice(0, -1)
          setClips(reste)
          // Le chronometre revient a la fin du clip precedent.
          const fin = reste.length ? reste[reste.length - 1].fin : 0
          chrono.poser(fin); setCumul(fin)
        },
      },
    ])
  }

  // La coche valide le montage et passe a la publication.
  const valider = () => {
    const dernier = clips[clips.length - 1]
    if (dernier) onChoisir(dernier.uri)
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
            Pour filmer une vidéo, autorisez l'accès à la caméra et au micro.
          </Text>
          <Pressable style={s.autoriser} onPress={demander}>
            <Text style={s.autoriserTexte}>Autoriser</Text>
          </Pressable>
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
        <Viseur cameraRef={camera} face={face} filtre={filtre}
          torche={torche && face === 'back'} />

      {/* Barre du haut : fermer, ajouter un son, retourner */}
      {!enregistrement && <SafeAreaView style={s.hautZone}>
        <View style={s.haut}>
          <Pressable hitSlop={12}
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
            <Pressable style={s.menuLigne} onPress={() => {
              setMenuSortie(false); setClips([]); chrono.poser(0); setCumul(0); onFermer()
            }}>
              <Corbeille taille={20} couleur="#ed2753" />
              <Text style={[s.menuTexte, s.menuSupprimer]}>Supprimer</Text>
            </Pressable>
            <Pressable style={s.menuLigne} onPress={() => {
              setMenuSortie(false)
              setMessage('Brouillon enregistré.')
              setTimeout(() => setMessage(''), 2200)
              onFermer()
            }}>
              <Brouillon taille={20} couleur="#111" />
              <Text style={s.menuTexte}>Enregistrer le brouillon</Text>
            </Pressable>
            <Pressable style={s.menuLigne} onPress={() => {
              setMenuSortie(false); outil('Envoyer à des amis')
            }}>
              <View style={s.menuAvatar} />
              <Text style={s.menuTexte}>Envoyer à des amis</Text>
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
                onPress={() => setOutilsDeplies(v => !v)}>
                <View style={outilsDeplies ? s.chevronHaut : undefined}>
                  <Icone taille={26} couleur="#fff" />
                </View>
              </Pressable>
            )
          }
          return (
            <Pressable key={nom} style={[s.outilLigne, i === 0 && s.outilPremier]}
              onPress={() => outil(nom)} hitSlop={6}>
              {outilsDeplies && !modeEffets && i > 0 && (
                <Text style={s.outilNom} numberOfLines={1}>{nom}</Text>
              )}
              <View style={s.outil}>
                {/* Lampe allumee : l'icone passe au jaune, sans quoi rien
                    ne distinguerait les deux etats du flash. */}
                <Icone taille={26}
                  couleur={nom === 'Flash' && torche && face === 'back'
                    ? '#fcd116' : '#fff'} />
                {i === 0 && <View style={s.outilFilet} />}
              </View>
            </Pressable>
          )
        })}
      </View>}

      {!!message && (
        <View style={s.message}><Text style={s.messageTexte}>{message}</Text></View>
      )}

      {/* Bas : durees, carrousel, modes */}
      <SafeAreaView style={s.basZone}>
        {enregistrement || clips.length > 0 ? (
          <Chronometre />
        ) : <View style={s.durees}>
          {DUREES.map(d => (
            <Pressable key={d} disabled={enregistrement} onPress={() => {
              if (d === '10 min' || d === 'PHOTO' || d === 'TEXTE') {
                setMessage('Ce format n’est pas encore disponible. Tu peux importer une vidéo de 90 secondes maximum.')
                setTimeout(() => setMessage(''), 2200)
                return
              }
              setMode(d)
            }}>
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
                  <Pressable key="filmer" onPress={filmer}>
                    <DisqueEnregistrement taille={tailleFilmer}
                      dureeMax={dureeMax} enCours={enregistrement}
                      separations={clips.map(c => c.fin / dureeMax)} />
                  </Pressable>
                ) : (
                  <Pressable key="filmer" disabled={!camera}
                    style={[s.filmer, {
                      width: tailleFilmer, height: tailleFilmer,
                      borderRadius: tailleFilmer / 2,
                    }]}
                    onPress={filmer}>
                    <View style={modeEffets ? s.disqueEffet : s.disqueRouge} />
                  </Pressable>
                )
              )
            }
            if (enregistrement || clips.length > 0) return null
            return (
              <Pressable key={decalage} style={[s.vignetteFiltre, tailleVignette]}
                onPress={() => { setFiltre(i); setModeEffets(true) }} />
            )
          })}
          {clips.length > 0 && !enregistrement && (
            <Pressable style={s.filtreEnPause}
              onPress={() => { setFiltre(f => (f + 1) % FILTRES.length); setModeEffets(true) }} />
          )}
          {clips.length > 0 && (
            <View style={s.montage} pointerEvents="box-none">
              {!enregistrement && (
                <Pressable style={s.montageSupprimer} onPress={supprimerDernier}>
                  <SupprimerClip taille={22} couleur="#111" />
                </Pressable>
              )}
              <Pressable style={s.montageValider} onPress={valider}>
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
        <Pressable style={s.galerie} onPress={galerie}>
          {apercuGalerie
            ? <Image source={{ uri: apercuGalerie }} style={s.galerieApercu} />
            : <Galerie taille={20} couleur="#fff" />}
        </Pressable>

        {modeEffets ? <>
          {/* Barre « Effets » : elle remplace LIVE / PUBLIER / CREER tant
              qu'un filtre est applique. */}
          <View style={s.barreEffets}>
            <Pressable hitSlop={8} onPress={() => outil('Enregistrer l’effet')}>
              <EffetEnregistrer taille={24} couleur="#fff" />
            </Pressable>
            <Text style={s.barreEffetsTitre}>Effets</Text>
            <Pressable hitSlop={8} onPress={() => outil('Agrandir')}>
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

      <ChoixSon visible={choixSon} onFermer={() => setChoixSon(false)}
        onChoisir={setSon} />
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
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
    backgroundColor: '#956d84' },

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
