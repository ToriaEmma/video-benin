import React, { useEffect, useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, Alert
} from 'react-native'
import { Text, TextInput } from '../composants/Texte'
import * as ImagePicker from 'expo-image-picker'
import { useVideoPlayer, VideoView } from 'expo-video'
import { File } from 'expo-file-system'
import Couverture from './Couverture'
import {
  FeuilleLien, FeuilleAudience, FeuilleOptions, FeuillePartage,
  FeuilleDepartement,
  AUDIENCES, OPTIONS_PAR_DEFAUT,
  type Audience, type Options, type Application, type Departement,
} from './FeuillesPublication'
import { apiBrouillons, apiVideos, televerser, type NouvelleVideo } from '../lib/api'
import {
  Camera, Chevron, ChevronDroit, Brouillon,
  PubLien, PubMonde, PubOptions, PubPublier, MontagePartage, PubLieu,
} from '../composants/Icones'

const DUREE_MAX = 90

// L'ecran parle d'audience, l'API de visibilite : « tous » y devient
// « monde », les deux autres valeurs portent le meme nom.
const VISIBILITES: Record<Audience, NonNullable<NouvelleVideo['visibilite']>> = {
  tous: 'monde',
  amis: 'amis',
  moi: 'moi',
}

export default function Publier({ onPublie, uriInitiale, onAnnuler, onBrouillon }: {
  onPublie: () => void; uriInitiale?: string; onAnnuler?: () => void
  // Brouillon enregistre : la page appelante bascule sur le profil.
  onBrouillon?: () => void
}) {
  const [uri, setUri] = useState<string | null>(uriInitiale ?? null)
  const lecteur = useVideoPlayer(uri ?? '', p => { p.loop = true; p.muted = true })

  useEffect(() => {
    if (uri) lecteur.play()
  }, [uri, lecteur])
  const [legende, setLegende] = useState('')
  const [envoi, setEnvoi] = useState(false)
  // Libelle de l'etape en cours : le televersement d'une video peut durer
  // sur un reseau mobile, et un bouton muet laisse croire a un blocage.
  const [etape, setEtape] = useState('')
  const [couverture, setCouverture] = useState(false)
  // Feuille ouverte depuis la liste d'options, s'il y en a une.
  const [feuille, setFeuille] =
    useState<'lien' | 'audience' | 'departement' | 'options' | 'partage' | null>(null)
  // Applications vers lesquelles relayer la publication, une fois publiee.
  const [partages, setPartages] = useState<Application[]>([])
  const [audience, setAudience] = useState<Audience>('tous')
  // Departement du Benin ou la video a ete filmee, obligatoire comme sur
  // la version web, ou il est pre-rempli sur « Littoral ».
  const [departement, setDepartement] = useState<Departement>('Littoral')
  const [options, setOptions] = useState<Options>(OPTIONS_PAR_DEFAUT)

  const choisir = async (source: 'camera' | 'galerie') => {
    // Les autorisations sont demandees au moment du besoin : c'est ce
    // qu'attendent Android et iOS, plutot qu'un bloc de permissions au
    // demarrage que l'utilisateur refuse souvent.
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!perm.granted) {
      Alert.alert(
        'Autorisation requise',
        source === 'camera'
          ? "Autorisez l'accès à la caméra pour filmer une vidéo."
          : "Autorisez l'accès à vos vidéos pour en importer une.",
      )
      return
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: DUREE_MAX,
      quality: 0.7,
    }

    const r = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options)

    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0]
      if (a.duration && a.duration / 1000 > DUREE_MAX) {
        Alert.alert('Vidéo trop longue', `Maximum ${DUREE_MAX} secondes.`)
        return
      }
      setUri(a.uri)
    }
  }

  // La video est televersee avant l'enregistrement : publier l'URI locale
  // ne donnerait une video lisible que sur cet appareil.
  const publier = async () => {
    if (!uri || envoi) return
    setEnvoi(true)
    try {
      const url = await televerser(uri, (e) =>
        setEtape(e === 'preparation' ? 'Préparation…' : 'Envoi de la vidéo…'))

      setEtape('Publication…')
      await apiVideos.creer({
        url,
        legende: legende.trim(),
        departement,
        visibilite: VISIBILITES[audience],
        // Les deux premiers interrupteurs de « Plus d'options » sont les
        // seuls que l'API connaisse ; les autres restent locaux a l'ecran.
        commentaires_autorises: options.commentaires,
        reutilisation_autorisee: options.reutilisation,
      })
      setUri(null)
      setLegende('')
      onPublie()
    } catch (e) {
      // Aucune video n'est creee si l'envoi echoue : la raison reelle est
      // montree telle quelle.
      Alert.alert('Publication impossible', (e as Error).message)
    } finally {
      setEnvoi(false)
      setEtape('')
    }
  }

  // « Brouillons » : la video est mise de cote avec sa description, puis
  // on repart sur le profil ou la tuile des brouillons l'affiche.
  const enregistrerBrouillon = async () => {
    if (!uri) { onAnnuler?.(); return }
    if (envoi) return
    let octets = 0
    try {
      const fichier = new File(uri)
      if (fichier.exists) octets = fichier.size
    } catch { /* Poids illisible : la tuile n'affichera pas de taille. */ }

    setEnvoi(true)
    try {
      // Un brouillon porte lui aussi un fichier : sans televersement il
      // serait perdu des la reinstallation de l'application.
      const url = await televerser(uri, (e) =>
        setEtape(e === 'preparation' ? 'Préparation…' : 'Envoi de la vidéo…'))
      await apiBrouillons.creer(url, legende.trim(), octets)
      setUri(null)
      setLegende('')
      if (onBrouillon) onBrouillon()
      else onAnnuler?.()
    } catch (e) {
      Alert.alert('Enregistrement impossible', (e as Error).message)
    } finally {
      setEnvoi(false)
      setEtape('')
    }
  }

  // Sans video choisie : l'ecran d'import.
  if (!uri) return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.corps}>
        <Text style={s.titre}>Publier une vidéo</Text>
        <Text style={s.sousTitre}>90 secondes maximum</Text>

        <Pressable style={s.depot} onPress={() => choisir('camera')}>
          <Camera taille={44} couleur="rgba(255,255,255,.62)" />
          <Text style={s.depotTitre}>Filmer une vidéo</Text>
          <Text style={s.depotTexte}>Ouvre la caméra de votre téléphone</Text>
        </Pressable>

        <Pressable style={[s.bouton, s.secondaire]} onPress={() => choisir('galerie')}>
          <Text style={s.secondaireTexte}>Choisir dans la galerie</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )

  if (couverture && uri) return (
    <Couverture uri={uri}
      onAnnuler={() => setCouverture(false)}
      onEnregistrer={() => setCouverture(false)} />
  )

  // --- Ecran de publication, quand une video est prete ---
  return (
    <SafeAreaView style={s.pagePub}>
      <ScrollView contentContainerStyle={s.corpsPub} keyboardShouldPersistTaps="handled">
        <Pressable style={s.retour} onPress={() => { setUri(null); onAnnuler?.() }}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>

        {/* Description a gauche, apercu de la video a droite */}
        <View style={s.enTete}>
          <TextInput style={s.description} multiline maxLength={2200}
            placeholder="Ajouter une description…" placeholderTextColor="#9a9a9a"
            value={legende} onChangeText={setLegende} />
          <View style={s.apercuPub}>
            <VideoView player={lecteur} style={StyleSheet.absoluteFill}
              contentFit="cover" nativeControls={false} />
            <Text style={s.apercuTitre}>Aperçu</Text>
            <Pressable style={s.couverture} onPress={() => setCouverture(true)}>
              <Text style={s.couvertureTexte}>Modifier la couverture</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.etiquettes}>
          <Pressable style={s.etiquettePub}
            onPress={() => setLegende(l => l + '#')}>
            <Text style={s.etiquetteTexte}># Hashtags</Text>
          </Pressable>
          <Pressable style={s.etiquettePub}
            onPress={() => setLegende(l => l + '@')}>
            <Text style={s.etiquetteTexte}>@ Mention</Text>
          </Pressable>
        </View>

        <View style={s.separateur} />

        <Pressable style={s.ligne} onPress={() => setFeuille('lien')}>
          <PubLien taille={22} couleur="#111" />
          <Text style={s.ligneTexte}>Ajouter un lien</Text>
          <ChevronDroit taille={18} couleur="#c4c4c6" />
        </Pressable>

        <Pressable style={s.ligne} onPress={() => setFeuille('audience')}>
          <PubMonde taille={22} couleur="#111" />
          <Text style={s.ligneTexte}>{AUDIENCES[audience]}</Text>
          <ChevronDroit taille={18} couleur="#c4c4c6" />
        </Pressable>

        <Pressable style={s.ligne} onPress={() => setFeuille('departement')}>
          <PubLieu taille={22} couleur="#111" />
          <Text style={s.ligneTexte}>Département</Text>
          <Text style={s.ligneValeur}>{departement}</Text>
          <ChevronDroit taille={18} couleur="#c4c4c6" />
        </Pressable>

        <Pressable style={s.ligne} onPress={() => setFeuille('options')}>
          <PubOptions taille={22} couleur="#111" />
          <Text style={s.ligneTexte}>Plus d&apos;options</Text>
          <ChevronDroit taille={18} couleur="#c4c4c6" />
        </Pressable>

        <Pressable style={s.ligne} onPress={() => setFeuille('partage')}>
          <MontagePartage taille={22} couleur="#111" />
          <Text style={s.ligneTexte}>Partager sur</Text>
          <ChevronDroit taille={18} couleur="#c4c4c6" />
        </Pressable>
      </ScrollView>

      <View style={s.piedPub}>
        <Pressable style={s.brouillons} onPress={enregistrerBrouillon}>
          <Brouillon taille={20} couleur="#111" />
          <Text style={s.brouillonsTexte}>Brouillons</Text>
        </Pressable>
        <Pressable style={s.publier} onPress={publier} disabled={envoi}>
          {envoi ? <>
            <ActivityIndicator color="#fff" />
            <Text style={s.publierTexte}>{etape || 'Envoi…'}</Text>
          </> : <>
            <PubPublier taille={20} couleur="#fff" />
            <Text style={s.publierTexte}>Publier</Text>
          </>}
        </Pressable>
      </View>

      <FeuilleLien visible={feuille === 'lien'} onFermer={() => setFeuille(null)} />
      <FeuilleAudience visible={feuille === 'audience'} audience={audience}
        onChoisir={a => { setAudience(a); setFeuille(null) }}
        onFermer={() => setFeuille(null)} />
      <FeuilleDepartement visible={feuille === 'departement'} departement={departement}
        onChoisir={d => { setDepartement(d); setFeuille(null) }}
        onFermer={() => setFeuille(null)} />
      <FeuilleOptions visible={feuille === 'options'} options={options}
        onChange={setOptions} onFermer={() => setFeuille(null)} />
      <FeuillePartage visible={feuille === 'partage'} choisies={partages}
        onBasculer={a => setPartages(l =>
          l.includes(a) ? l.filter(x => x !== a) : [...l, a])}
        onFermer={() => setFeuille(null)} />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
  corps: { padding: 20 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sousTitre: { color: 'rgba(255,255,255,.62)', fontSize: 14, marginBottom: 28 },
  depot: {
    borderWidth: 2, borderColor: 'rgba(255,255,255,.12)', borderStyle: 'dashed',
    borderRadius: 14, padding: 40, alignItems: 'center', marginBottom: 16, gap: 10,
  },
  depotTitre: { color: '#fff', fontWeight: '700', fontSize: 16 },
  depotTexte: { color: 'rgba(255,255,255,.62)', fontSize: 13 },
  apercu: { width: '100%', height: 300, borderRadius: 14, backgroundColor: '#111', marginBottom: 16 },
  etiquette: { color: 'rgba(255,255,255,.62)', fontSize: 13, marginBottom: 6 },
  champ: {
    backgroundColor: '#161616', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
    borderRadius: 10, padding: 14, fontSize: 16, color: '#fff', minHeight: 90,
    textAlignVertical: 'top',
  },
  compteur: { color: 'rgba(255,255,255,.5)', fontSize: 12, textAlign: 'right', marginVertical: 6 },
  bouton: {
    backgroundColor: '#ff2856', borderRadius: 10, padding: 15,
    alignItems: 'center', marginTop: 10, minHeight: 48, justifyContent: 'center',
  },
  boutonTexte: { color: '#000', fontWeight: '700', fontSize: 16 },
  secondaire: { backgroundColor: '#232323' },
  secondaireTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // --- Ecran de publication : fond clair, liste d'options ---
  pagePub: { flex: 1, backgroundColor: '#fff' },
  corpsPub: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  retour: { width: 44, minHeight: 44, justifyContent: 'center' },

  enTete: { flexDirection: 'row', gap: 16, marginTop: 8 },
  description: { flex: 1, color: '#111', fontSize: 15, lineHeight: 21,
    minHeight: 150, textAlignVertical: 'top', padding: 0 },
  apercuPub: { width: 102, height: 142, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#eee' },
  apercuTitre: { position: 'absolute', top: 10, left: 12,
    color: '#fff', fontSize: 15, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 4 },
  couverture: { position: 'absolute', left: 8, right: 8, bottom: 10,
    backgroundColor: 'rgba(90,86,80,.82)', borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 8 },
  couvertureTexte: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center',
    lineHeight: 17 },

  etiquettes: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 20 },
  etiquettePub: { backgroundColor: '#f1f1f2', borderRadius: 9,
    paddingVertical: 10, paddingHorizontal: 14 },
  etiquetteTexte: { color: '#111', fontSize: 15, fontWeight: '600' },

  separateur: { height: 1, backgroundColor: '#ececec', marginTop: 4, marginBottom: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, minHeight: 56 },
  ligneTexte: { flex: 1, color: '#111', fontSize: 15 },
  ligneValeur: { color: '#8e8e93', fontSize: 15 },

  piedPub: { flexDirection: 'row', gap: 12, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 18 },
  brouillons: { flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, backgroundColor: '#f1f1f2',
    borderRadius: 24, minHeight: 48 },
  brouillonsTexte: { color: '#111', fontSize: 15, fontWeight: '600' },
  publier: { flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: '#ff2856',
    borderRadius: 24, minHeight: 48 },
  publierTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
