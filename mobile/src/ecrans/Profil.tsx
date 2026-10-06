import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, SafeAreaView, useWindowDimensions, Image,
  Alert, ActivityIndicator,
} from 'react-native'
import { Text } from '../composants/Texte'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import { abreger, poidsLisible, type Brouillon as BrouillonType, type Video } from '../lib/demo'
import {
  apiBrouillons, apiInteractions, apiVideos,
  type ProfilDetaille, type VideoApi,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import MenuProfil from '../composants/MenuProfil'
import Parametres from './Parametres'
import Solde from './Solde'
import ModifierProfil from './ModifierProfil'
import { choisirPhotoProfil } from '../lib/photoProfil'
import { oublierAvatar } from '../lib/avatars'
import ComptesProfil from '../composants/ComptesProfil'
import ListeComptes, { type SensListe } from '../composants/ListeComptes'
import {
  Crayon, Menu, AjoutPersonne, Cloche, Fleche, Chevron,
  Grille, Cadenas, Coeur, Repartage, Studio, Lecture, Plus, Triangle, FavoriContour,
  Brouillon,
} from '../composants/Icones'

// Equivalent de clamp(min, valeur en vw, max) du CSS.
const clamp = (largeurEcran: number, mini: number, vw: number, maxi: number) =>
  Math.round(Math.min(Math.max(largeurEcran * vw / 100, mini), maxi))

// Ratio 3/4, comme `aspect-ratio: 3/4` de la version web.
function Vignette({ item, largeur, onSupprimer, onOuvrir }: {
  item: Video; largeur: number
  onSupprimer?: (id: string) => void
  onOuvrir?: () => void
}) {
  const lecteur = useVideoPlayer(item.url, p => { p.muted = true })
  return (
    <Pressable style={[s.case, { width: largeur, height: largeur * 4 / 3 }]}
      onPress={onOuvrir}
      onLongPress={() => onSupprimer?.(item.id)}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
      <View style={s.vues}>
        <Lecture taille={11} couleur="#fff" />
        <Text style={s.vuesTexte}>{abreger(item.vues)}</Text>
      </View>
    </Pressable>
  )
}

// Premiere case de la grille quand des brouillons attendent : elle montre le
// dernier d'entre eux, leur nombre et le poids cumule.
function CaseBrouillons({ largeur, nombre, url, octets, onPresser }: {
  largeur: number; nombre: number; url: string; octets: number
  onPresser: () => void
}) {
  const lecteur = useVideoPlayer(url, p => { p.muted = true })
  return (
    <Pressable style={[s.case, { width: largeur, height: largeur * 4 / 3 }]}
      onPress={onPresser}>
      <VideoView player={lecteur} style={StyleSheet.absoluteFill}
        contentFit="cover" nativeControls={false} />
      <Text style={s.brouillonsTitre}>Brouillons: {nombre}</Text>
      <View style={s.vues}>
        <Brouillon taille={12} couleur="#fff" />
        <Text style={s.vuesTexte}>{poidsLisible(octets)}</Text>
      </View>
    </Pressable>
  )
}

export default function Profil({
  pseudoVisite, onRetour, messageArrivee, onBrouillons, onOuvrirVideo, onVisiter,
}: {
  pseudoVisite?: string; onRetour?: () => void
  // Message affiche brievement en arrivant, apres un enregistrement.
  messageArrivee?: string
  // Ouvre la page qui liste les brouillons.
  onBrouillons?: () => void
  // Ouvre le lecteur plein ecran sur la video choisie dans la grille.
  onOuvrirVideo?: (videos: Video[], index: number) => void
  // Ouvre le profil d'un compte touche dans les listes d'abonnement.
  onVisiter?: (pseudo: string) => void
}) {
  const { profil, deconnecter, modifierProfil } = useAuth()
  // Mesure reactive : en Expo Go la largeur n'est pas encore connue au
  // chargement du module, et elle change a la rotation. La lire au rendu
  // evite une grille et un titre calcules sur une valeur obsolete.
  const { width: largeurEcran } = useWindowDimensions()
  const largeurCase = (largeurEcran - 6) / 3
  // .profil-nom : clamp(24px, 6.3vw, 32px)
  // `@media (max-width: 350px)` : sur un ecran etroit le web reduit l'avatar
  // et les compteurs plutot que de les laisser deborder.
  const etroit = largeurEcran <= 350
  const tailleAvatar = etroit ? 82 : 102
  const petitEcran = {
    nombre: etroit ? { fontSize: 15 } : undefined,
    nom: etroit ? { fontSize: 11 } : undefined,
  }
  const tailleNom = React.useMemo(() => {
    const taille = clamp(largeurEcran, 24, 6.3, 32)
    return { fontSize: taille, lineHeight: Math.round(taille * 1.12) }
  }, [largeurEcran])
  const monProfil = !pseudoVisite || pseudoVisite === profil?.pseudo
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [parametres, setParametres] = useState(false)
  const [solde, setSolde] = useState(false)
  const [edition, setEdition] = useState(false)
  const [comptesOuverts, setComptesOuverts] = useState(false)
  // Feuille ouverte par les compteurs « Suivis » et « Followers ».
  const [listeOuverte, setListeOuverte] = useState<SensListe | null>(null)
  const [onglet, setOnglet] = useState<'videos' | 'privees' | 'repartages' | 'favoris' | 'aimees'>('videos')
  // Le bandeau gris « Brouillon enregistré » s'efface au bout de 2 secondes.
  // `efface` repart a faux a chaque nouveau message grace a la cle de l'effet.
  const [efface, setEfface] = useState(false)
  React.useEffect(() => {
    if (!messageArrivee) return
    const minuterie = setTimeout(() => setEfface(true), 2000)
    return () => clearTimeout(minuterie)
  }, [messageArrivee])
  const message = efface ? undefined : messageArrivee

  const pseudo = monProfil ? profil?.pseudo ?? '' : pseudoVisite!

  // En-tete du profil : compteurs et relation d'abonnement viennent de
  // /profils/:pseudo, qui porte aussi la bio du compte visite.
  const [entete, setEntete] = useState<ProfilDetaille | null>(null)
  // Photo affichee : la mienne vient de la session (a jour apres un
  // changement), celle d'un autre compte de son profil detaille.
  const photoAffichee = monProfil ? profil?.avatar_url ?? null : entete?.avatar_url ?? null
  const [avisPhoto, setAvisPhoto] = useState('')
  // Toucher le « + » de sa photo : choisir une nouvelle photo de profil.
  const changerPhoto = async () => {
    try {
      const donnees = await choisirPhotoProfil()
      if (!donnees || !profil) return
      await modifierProfil({ avatar_url: donnees })
      oublierAvatar(profil.pseudo, donnees)
      setAvisPhoto('Photo de profil mise à jour')
    } catch (e) {
      setAvisPhoto((e as Error).message || 'Impossible d’enregistrer la photo')
    }
    setTimeout(() => setAvisPhoto(''), 2600)
  }
  const [suivi, setSuivi] = useState(false)
  // Grille de l'onglet courant, et brouillons de son propre profil.
  const [videos, setVideos] = useState<VideoApi[]>([])
  const [brouillons, setBrouillons] = useState<BrouillonType[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!pseudo) return
    let valable = true
    apiInteractions.profil(pseudo)
      .then(p => { if (valable) { setEntete(p); setSuivi(p.suivi) } })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
    return () => { valable = false }
  }, [pseudo])

  // Chaque onglet a sa source : la grille se recharge donc quand on en
  // change, et non une seule fois a l'ouverture de l'ecran.
  useEffect(() => {
    if (!pseudo) return
    let valable = true
    const charger = async () => {
      setChargement(true)
      try {
        const v =
          onglet === 'favoris' ? await apiInteractions.favoris()
          : onglet === 'aimees' ? await apiInteractions.jaimees()
          : onglet === 'videos' ? await apiVideos.duProfil(pseudo)
          // « Privées » et « Repartages » n'ont pas de route : la grille
          // reste vide et son message d'invite s'affiche.
          : []
        if (valable) { setVideos(v); setErreur('') }
      } catch (e) {
        if (valable) { setVideos([]); setErreur((e as Error).message) }
      } finally {
        if (valable) setChargement(false)
      }
    }
    void charger()
    return () => { valable = false }
  }, [pseudo, onglet])

  // Les brouillons sont prives : on ne les demande que sur son profil.
  useEffect(() => {
    if (!monProfil || onglet !== 'videos') return
    let valable = true
    apiBrouillons.liste()
      .then(b => { if (valable) setBrouillons(b) })
      .catch(() => { /* Brouillons indisponibles : la tuile reste absente. */ })
    return () => { valable = false }
  }, [monProfil, onglet])

  // L'onglet « videos » de son propre profil est le seul a montrer la
  // tuile des brouillons, en tete de grille.
  const tuileBrouillons = monProfil && onglet === 'videos' ? brouillons : []
  const poidsBrouillons = tuileBrouillons.reduce((t, b) => t + b.octets, 0)

  // La tuile des brouillons occupe la premiere case, devant les videos.
  const cases: ({ id: string } | Video)[] = tuileBrouillons.length > 0
    ? [{ id: 'brouillons' }, ...videos]
    : videos

  const supprimer = (id: string) => {
    if (!monProfil) return
    Alert.alert('Supprimer cette vidéo ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          apiVideos.supprimer(id)
            .then(() => {
              setVideos(l => l.filter(v => v.id !== id))
              // Le compteur de publications de l'en-tete suit la grille.
              setEntete(p => (p ? { ...p, nbVideos: Math.max(0, p.nbVideos - 1) } : p))
            })
            .catch((e: Error) => setErreur(e.message))
        },
      },
    ])
  }

  const basculerSuivi = () => {
    const vise = !suivi
    setSuivi(vise)
    const envoi = vise
      ? apiInteractions.suivre(pseudo)
      : apiInteractions.nePlusSuivre(pseudo)
    envoi
      .then(r => {
        setSuivi(r.suivi)
        setEntete(p => (p ? {
          ...p, nbAbonnes: Math.max(0, p.nbAbonnes + (r.suivi ? 1 : -1)),
        } : p))
      })
      .catch((e: Error) => { setSuivi(!vise); setErreur(e.message) })
  }

  const nbSuivis = entete?.nbSuivis ?? 0
  const nbAbonnes = entete?.nbAbonnes ?? 0
  const totalAime = videos.reduce((t, v) => t + v.nbAime, 0)
  const bio = monProfil ? profil?.bio ?? '' : entete?.bio ?? ''

  if (monProfil && !profil) return null
  if (monProfil && edition) return <ModifierProfil onRetour={() => setEdition(false)} />
  if (parametres) return <Parametres pseudo={pseudo} onRetour={() => setParametres(false)} />
  if (solde) return <Solde onRetour={() => setSolde(false)} />

  return (
    <SafeAreaView style={s.page}>
      <FlatList
        data={cases}
        keyExtractor={c => c.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={s.entete}>
            {/* .profil-barre : min-height 62px, padding bas 23px */}
            <View style={s.barre}>
              {monProfil ? <>
                <Pressable style={s.barreBouton} onPress={() => setEdition(true)}>
                  <Crayon taille={25} couleur="#111" />
                </Pressable>
                <View style={s.groupe}>
                  <Pressable style={s.barreBouton}>
                    <AjoutPersonne taille={25} couleur="#111" />
                  </Pressable>
                  <Pressable style={s.barreBouton} onPress={() => setMenuOuvert(true)}>
                    <Menu taille={25} couleur="#111" />
                  </Pressable>
                </View>
              </> : <>
                <Pressable style={s.barreBouton} onPress={onRetour}>
                  <Chevron taille={25} couleur="#111" />
                </Pressable>
                <View style={s.groupe}>
                  <Pressable style={s.barreBouton}>
                    <Cloche taille={25} couleur="#111" />
                  </Pressable>
                  <Pressable style={s.barreBouton}>
                    <Fleche taille={25} couleur="#111" />
                  </Pressable>
                </View>
              </>}
            </View>

            {/* .profil-identite : gap 14px, marge bas 22px */}
            <View style={s.identite}>
              <View style={s.resume}>
                {monProfil ? (
                  <Pressable style={s.choixCompte} onPress={() => setComptesOuverts(true)}>
                    <Text style={[s.nom, tailleNom]} numberOfLines={1}>
                      {profil?.nom || pseudo}
                    </Text>
                    <Triangle taille={15} couleur="#111" />
                  </Pressable>
                ) : (
                  <Text style={[s.nom, tailleNom]} numberOfLines={1}>{pseudo}</Text>
                )}
                <Text style={s.pseudo}>@{pseudo}</Text>

                {/* .profil-stats : gap 20px, marge haute 20px */}
                <View style={s.stats}>
                  <Pressable style={s.stat} onPress={() => setListeOuverte('abonnements')}>
                    <Text style={[s.statNombre, petitEcran.nombre]} numberOfLines={1}>
                      {abreger(nbSuivis)}
                    </Text>
                    <Text style={[s.statNom, petitEcran.nom]} numberOfLines={1}>Suivis</Text>
                  </Pressable>
                  <Pressable style={s.stat} onPress={() => setListeOuverte('abonnes')}>
                    <Text style={[s.statNombre, petitEcran.nombre]} numberOfLines={1}>
                      {abreger(nbAbonnes)}
                    </Text>
                    <Text style={[s.statNom, petitEcran.nom]} numberOfLines={1}>Followers</Text>
                  </Pressable>
                  <View style={s.stat}>
                    <Text style={[s.statNombre, petitEcran.nombre]} numberOfLines={1}>
                      {abreger(totalAime)}
                    </Text>
                    <Text style={[s.statNom, petitEcran.nom]} numberOfLines={1}>J'aime</Text>
                  </View>
                </View>
              </View>

              {/* Anneau degrade autour de l'avatar + badge « plus » */}
              <View style={[s.avatarZone, { width: tailleAvatar }]}>
                {monProfil && (
                  <View style={s.note}><Text style={s.noteTexte}>Dis-nous tout</Text></View>
                )}
                <LinearGradient
                  colors={['#16cce0', '#16cce0', '#09c9e8', '#138aff']}
                  locations={[0, .45, .7, 1]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[s.anneau, {
                    width: tailleAvatar, height: tailleAvatar,
                    borderRadius: tailleAvatar / 2,
                  }]}>
                  <View style={[s.avatar, {
                    width: tailleAvatar - 8, height: tailleAvatar - 8,
                    borderRadius: (tailleAvatar - 8) / 2,
                  }]}>
                    {photoAffichee
                      ? <Image source={{ uri: photoAffichee }} style={s.avatarImage} />
                      : <Text style={s.avatarLettre}>{pseudo.charAt(0).toUpperCase()}</Text>}
                  </View>
                </LinearGradient>
                {monProfil && (
                  <Pressable style={s.avatarPlus} onPress={changerPhoto} hitSlop={8}
                    accessibilityLabel="Changer la photo de profil">
                    <Plus taille={16} couleur="#fff" />
                  </Pressable>
                )}
                {!!avisPhoto && <Text style={s.avisPhoto} numberOfLines={2}>{avisPhoto}</Text>}
              </View>
            </View>

            {/* Actions : seulement sur le profil d'autrui */}
            {!monProfil && (
              <View style={s.actions}>
                <Pressable style={[s.principal, suivi && s.principalSuivi]}
                  onPress={basculerSuivi}>
                  <Text style={[s.principalTexte, suivi && { color: '#111' }]}>
                    {suivi ? 'Abonné' : 'Suivre'}
                  </Text>
                </Pressable>
                <View style={[s.secondaire, { opacity: .45 }]}>
                  <Text style={s.secondaireTexte}>Message</Text>
                </View>
                <View style={s.carre}><AjoutPersonne taille={20} couleur="#111" /></View>
              </View>
            )}

            {/* Bio, puis Studio createur en dessous */}
            {!!bio && <Text style={s.bio}>{bio}</Text>}
            {monProfil && (
              <Pressable style={s.studio}>
                <Studio taille={18} couleur="#ff367b" />
                <Text style={s.studioTexte}>Studio créateur</Text>
              </Pressable>
            )}

            {/* .profil-onglets : bordure basse, hauteur 49px */}
            <View style={s.onglets}>
              <Pressable style={[s.onglet, onglet === 'videos' && s.ongletActif]}
                onPress={() => setOnglet('videos')}>
                <Grille taille={22} couleur={onglet === 'videos' ? '#111' : '#929292'} />
              </Pressable>
              {monProfil ? <>
                <Pressable style={[s.onglet, onglet === 'privees' && s.ongletActif]}
                  onPress={() => setOnglet('privees')}>
                  <Cadenas taille={22} couleur={onglet === 'privees' ? '#111' : '#929292'} />
                </Pressable>
                <Pressable style={[s.onglet, onglet === 'repartages' && s.ongletActif]}
                  onPress={() => setOnglet('repartages')}>
                  <Repartage taille={22} couleur={onglet === 'repartages' ? '#111' : '#929292'} />
                </Pressable>
                <Pressable style={[s.onglet, onglet === 'favoris' && s.ongletActif]}
                  onPress={() => setOnglet('favoris')}>
                  <FavoriContour taille={22} couleur={onglet === 'favoris' ? '#111' : '#929292'} />
                </Pressable>
                <Pressable style={[s.onglet, onglet === 'aimees' && s.ongletActif]}
                  onPress={() => setOnglet('aimees')}>
                  <Coeur taille={22} couleur={onglet === 'aimees' ? '#111' : '#929292'} />
                </Pressable>
              </> : (
                <Pressable style={[s.onglet, onglet === 'repartages' && s.ongletActif]}
                  onPress={() => setOnglet('repartages')}>
                  <Repartage taille={22} couleur={onglet === 'repartages' ? '#111' : '#929292'} />
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          chargement
            ? <View style={s.attente}><ActivityIndicator color="#888" /></View>
            // Une grille vide par nature et une grille en panne se
            // ressemblent : le message du serveur prime sur l'invite.
            : <Text style={s.vide}>
                {erreur || (onglet !== 'videos'
                  ? onglet === 'privees' ? 'Aucune vidéo privée'
                    : onglet === 'repartages' ? 'Aucune vidéo repartagée'
                    : onglet === 'favoris' ? 'Aucune vidéo enregistrée'
                    : 'Aucune vidéo aimée'
                  : monProfil ? "Vous n'avez pas encore publié de vidéo" : 'Aucune vidéo publiée')}
              </Text>
        }
        ListFooterComponent={
          monProfil && onglet === 'videos' && videos.length > 0
            ? <Text style={s.aide}>Appui long sur une vidéo pour la supprimer</Text>
            : null
        }
        renderItem={({ item }) => item.id === 'brouillons'
          ? <CaseBrouillons largeur={largeurCase} nombre={tuileBrouillons.length}
              url={tuileBrouillons[0].url} octets={poidsBrouillons}
              onPresser={() => onBrouillons?.()} />
          : <Vignette item={item as Video} largeur={largeurCase}
              onSupprimer={monProfil ? supprimer : undefined}
              onOuvrir={() => onOuvrirVideo?.(
                videos, videos.indexOf(item as VideoApi))} />}
      />

      {!!message && (
        <View style={s.toast} pointerEvents="none">
          <Text style={s.toastTexte}>{message}</Text>
        </View>
      )}

      {/* Echec d'un abonnement ou d'une suppression, la grille restant
          affichee : le bandeau se referme au toucher. */}
      {!!erreur && videos.length > 0 && (
        <Pressable style={s.toastErreur} onPress={() => setErreur('')}>
          <Text style={s.toastTexte}>{erreur}</Text>
        </Pressable>
      )}

      {comptesOuverts && (
        <ComptesProfil pseudo={pseudo} avatar={profil?.avatar_url}
          onFermer={() => setComptesOuverts(false)} />
      )}

      {!!listeOuverte && (
        <ListeComptes pseudo={pseudo} sens={listeOuverte}
          onFermer={() => setListeOuverte(null)} onVisiter={onVisiter} />
      )}

      {menuOuvert && (
        <MenuProfil onFermer={() => setMenuOuvert(false)} onDeconnecter={deconnecter}
          onSolde={() => { setMenuOuvert(false); setSolde(true) }}
          onParametres={() => { setMenuOuvert(false); setParametres(true) }} />
      )}
    </SafeAreaView>
  )
}

// .page-profil : fond blanc, texte #111, padding 12px 16px 28px.
const s = StyleSheet.create({
  avisPhoto: { position: 'absolute', top: '100%', marginTop: 8, width: 170, alignSelf: 'center', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#ff2856' },
  page: { flex: 1, backgroundColor: '#fff' },
  entete: { paddingHorizontal: 16, paddingTop: 12 },

  barre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: 62, paddingBottom: 23, marginHorizontal: -6 },
  barreBouton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  groupe: { flexDirection: 'row', gap: 12 },

  identite: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 22 },
  resume: { flex: 1, flexShrink: 1, minWidth: 0, paddingTop: 5 },
  nom: { color: '#111', fontWeight: '800', letterSpacing: -1 },
  pseudo: { color: '#111', fontSize: 14, fontWeight: '500', marginTop: 7 },

  stats: { flexDirection: 'row', gap: 20, marginTop: 20, flexShrink: 1 },
  stat: { alignItems: 'flex-start', flexShrink: 1 },
  statNombre: { color: '#111', fontSize: 17, fontWeight: '600', lineHeight: 20 },
  statNom: { color: '#888', fontSize: 13, lineHeight: 18 },

  avatarZone: { width: 102, flexShrink: 0, alignSelf: 'center' },
  anneau: { width: 102, height: 102, borderRadius: 51, padding: 4,
    alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#eee', overflow: 'hidden',
    borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#111', fontSize: 36, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlus: { position: 'absolute', right: -2, bottom: 0, width: 31, height: 31,
    borderRadius: 16, borderWidth: 3, borderColor: '#fff', backgroundColor: '#09c7e8',
    alignItems: 'center', justifyContent: 'center' },

  choixCompte: { flexDirection: 'row', alignItems: 'center', gap: 9, maxWidth: '100%' },
  note: { position: 'absolute', zIndex: 1, top: -13, left: 0, right: 0,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 13,
    paddingVertical: 8, paddingHorizontal: 4 },
  noteTexte: { color: '#888', fontSize: 9, fontWeight: '600', textAlign: 'center' },
  bio: { color: '#111', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  studio: { flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 14 },
  studioTexte: { color: '#111', fontSize: 14, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 8, marginBottom: 23 },
  principal: { flex: 1, backgroundColor: '#ff2856', borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  principalSuivi: { backgroundColor: '#f2f2f2' },
  principalTexte: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaire: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaireTexte: { color: '#111', fontWeight: '600', fontSize: 15 },
  carre: { width: 46, backgroundColor: '#f2f2f2', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', minHeight: 44 },

  onglets: { flexDirection: 'row', marginTop: 4, marginHorizontal: -16,
    borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  onglet: { flex: 1, alignItems: 'center', paddingVertical: 12, minHeight: 49,
    justifyContent: 'center' },
  ongletActif: { borderBottomWidth: 2, borderBottomColor: '#111' },

  vide: { color: '#888', textAlign: 'center', padding: 40, fontSize: 14 },
  attente: { padding: 40, alignItems: 'center' },
  aide: { fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center',
    paddingHorizontal: 16, paddingBottom: 28 },
  // Bandeau gris de confirmation, centre sous la barre du haut.
  toast: { position: 'absolute', top: 120, alignSelf: 'center',
    backgroundColor: 'rgba(90,90,90,.9)', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 20, maxWidth: '80%' },
  toastTexte: { color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  // Meme bandeau, pose en bas : il ne doit pas recouvrir l'en-tete du profil.
  toastErreur: { position: 'absolute', bottom: 28, alignSelf: 'center',
    backgroundColor: 'rgba(90,90,90,.92)', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 20, maxWidth: '85%' },

  case: { margin: 1, backgroundColor: '#f2f2f2' },
  // « Brouillons: 11 » pose en haut a gauche de la premiere case.
  brouillonsTitre: { position: 'absolute', left: 8, top: 7, color: '#fff',
    fontSize: 15, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 4 },
  vues: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row',
    alignItems: 'center', gap: 3 },
  vuesTexte: { color: '#fff', fontSize: 11 },
})
