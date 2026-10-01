import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, PanResponder, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { File } from 'expo-file-system'
import { Text, TextInput } from '../composants/Texte'
import Feuille from '../composants/Feuille'
import Interrupteur from '../composants/Interrupteur'
import ChoixSon from './ChoixSon'
import { etat, enregistrer } from '../lib/demo'
import { feuille as F } from '../lib/theme'
import type { Son } from '../lib/sons'
import {
  Chevron, Croix, SonNote, Corbeille, Brouillon, CocheValider,
  MontageReglages, MontagePartage, MontageDuree, MontageClips,
  MontageTexte, MontageSticker, MontageEffets, MontageVoix,
  MontageFiltres, MontageSousTitres, OutilPlus, Vitesse, Emoji,
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
  '#ffffff', '#111111', '#e8485c', '#ef8d3c', '#eece4a', '#72c45f',
  '#3fbfa2', '#45b4d8', '#3f7ff0', '#2b3fae',
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
const EFFETS_VOCAUX = [
  { nom: 'Normal', debit: 1, hauteur: true },
  { nom: 'Grave', debit: 0.78, hauteur: false },
  { nom: 'Aigu', debit: 1.35, hauteur: false },
  { nom: 'Robot', debit: 1, hauteur: true, apercu: true },
  { nom: 'Écho', debit: 1, hauteur: true, apercu: true },
]

// Les reglages sont poses sur le lecteur ici, hors du composant : une
// propriete d'objet venant d'un hook ne se modifie pas dans le rendu.
function reglerLecture(p: {
  loop: boolean; muted: boolean; playbackRate: number; preservesPitch: boolean
}, r: { boucle?: boolean; coupe?: boolean; debit?: number; hauteur?: boolean }) {
  if (r.boucle !== undefined) p.loop = r.boucle
  if (r.coupe !== undefined) p.muted = r.coupe
  if (r.hauteur !== undefined) p.preservesPitch = r.hauteur
  if (r.debit !== undefined) p.playbackRate = r.debit
}

// Identifiants des calques : un compteur plutot que l'horloge, que la regle
// de purete interdit de lire pendant le rendu.
const compteur = { n: 0, suivant() { this.n += 1; return this.n } }

// Horodatage du brouillon, lu hors du rendu pour la meme raison.
const horloge = () => Date.now()

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

export default function Montage({ uri, pseudo, onRetour, onSuivant, onOutil }: {
  uri: string
  pseudo: string
  onRetour: () => void
  onSuivant: () => void
  // Reserve aux actions qui sortent du montage ; le reste est traite ici.
  onOutil?: (nom: string) => void
}) {
  const marges = useSafeAreaInsets()
  // Meme menu de sortie que l'ecran de tournage.
  const [menuSortie, setMenuSortie] = useState(false)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  const lecteur = useVideoPlayer(uri, p => { p.loop = true; p.muted = false })

  // Avis passager, affiche en bas de l'apercu.
  const [message, setMessage] = useState('')
  // Barre ouverte sous l'apercu : filtres, vitesse ou saisie de sous-titre.
  const [barre, setBarre] = useState<'filtres' | 'vitesse' | 'sousTitres' | null>(null)
  // Feuille ouverte : reglages, stickers ou effets vocaux.
  const [feuilleOuverte, setFeuilleOuverte] = useState<'reglages' | 'stickers' | 'voix' | null>(null)
  const [choixSon, setChoixSon] = useState(false)
  const [son, setSon] = useState<Son | null>(null)

  const [filtre, setFiltre] = useState(0)
  const [vitesse, setVitesse] = useState(1)
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

  useEffect(() => {
    lecteur.play()
  }, [lecteur])

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

  // Menu de sortie : la video rejoint les brouillons conserves.
  const enregistrerBrouillon = () => {
    let octets = 0
    try {
      const fichier = new File(uri)
      if (fichier.exists) octets = fichier.size
    } catch { /* Poids illisible : la tuile n'affichera pas de taille. */ }

    const legende = calques.filter(c => c.genre === 'texte')
      .map(c => c.contenu).join(' ').trim()
    const date = horloge()
    etat.brouillons.unshift({
      id: `b${date}`, url: uri, legende, octets, date,
      etiquette: son ? { type: 'son', nom: son.titre } : undefined,
    })
    enregistrer()
    setMenuSortie(false)
    onRetour()
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
      case 'Effets':
        // Les effets visuels reprennent les voiles des filtres.
        setBarre('filtres')
        avertir('Les effets reprennent les filtres pour le moment.')
        return
      default:
        avertir(`${nom} : pas encore disponible dans cette version.`)
        onOutil?.(nom)
    }
  }

  const voile = FILTRES[filtre]

  return (
    <View style={[s.page, { paddingTop: marges.top }]}>
      <View style={s.viseur}>
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
          <Pressable onPress={() => setMenuSortie(true)} hitSlop={12} style={s.hautBouton}>
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
              <Pressable style={s.menuLigne} onPress={() => {
                setMenuSortie(false)
                avertir('Envoyer à des amis : pas encore disponible.')
              }}>
                <View style={s.menuAvatar} />
                <Text style={s.menuTexte}>Envoyer à des amis</Text>
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

        {!barre && !enEdition && (
          <Pressable style={s.autocut}
            onPress={() => avertir('AutoCut : pas encore disponible dans cette version.')}>
            <MontageEffets taille={17} couleur="#fff" />
            <Text style={s.autocutTexte}>AutoCut</Text>
          </Pressable>
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
                  f.voile !== 'transparent' && { backgroundColor: f.voile },
                  i === filtre && s.filtreRondChoisi]} />
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
        <Pressable style={s.story}
          onPress={() => avertir('Ta Story : pas encore disponible dans cette version.')}>
          <View style={s.storyAvatar}>
            <Text style={s.storyLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.storyTexte}>Ta Story</Text>
        </Pressable>
        <Pressable style={s.suivant} onPress={onSuivant}>
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
            if (e.apercu) avertir(`${e.nom} : aperçu, l’effet n’est pas encore rendu.`)
          }}>
            <Emoji taille={F.icone} couleur="#111" />
            <View style={s.voixCorps}>
              <Text style={s.voixNom}>{e.nom}</Text>
              {e.apercu && <Text style={s.voixApercu}>aperçu</Text>}
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

  autocut: { position: 'absolute', bottom: 18, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(51,51,51,.6)', borderRadius: 20,
    paddingVertical: 9, paddingHorizontal: 16 },
  autocutTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Calques poses sur la video : ils partent du centre de l'apercu.
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
  filtreRond: { width: 48, height: 48, borderRadius: 24, borderWidth: 2,
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
