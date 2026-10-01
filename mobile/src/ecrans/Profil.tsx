import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, SafeAreaView, useWindowDimensions, Image,
  Alert,
} from 'react-native'
import { Text } from '../composants/Texte'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import { etat, comptesDemo, abreger, poidsLisible, type Video } from '../lib/demo'
import { useAuth } from '../lib/auth'
import MenuProfil from '../composants/MenuProfil'
import Parametres from './Parametres'
import Solde from './Solde'
import ModifierProfil from './ModifierProfil'
import ComptesProfil from '../composants/ComptesProfil'
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
  pseudoVisite, onRetour, messageArrivee, onBrouillons, onOuvrirVideo,
}: {
  pseudoVisite?: string; onRetour?: () => void
  // Message affiche brievement en arrivant, apres un enregistrement.
  messageArrivee?: string
  // Ouvre la page qui liste les brouillons.
  onBrouillons?: () => void
  // Ouvre le lecteur plein ecran sur la video choisie dans la grille.
  onOuvrirVideo?: (videos: Video[], index: number) => void
}) {
  const { profil, deconnecter } = useAuth()
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
  // Force le reaffichage de la grille apres une suppression.
  const [, setRevision] = useState(0)
  const [suivi, setSuivi] = useState(false)
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
  const videos = monProfil
    ? etat.mesVideos
    : etat.videos.filter(v => v.pseudo === pseudoVisite)

  // Seul l'onglet « videos » a du contenu pour l'instant.
  const videosOnglet = onglet === 'videos' ? videos : []
  // Les brouillons n'apparaissent que sur son propre profil, en tete de grille.
  const brouillons = monProfil && onglet === 'videos' ? etat.brouillons : []
  const poidsBrouillons = brouillons.reduce((t, b) => t + b.octets, 0)

  // La tuile des brouillons occupe la premiere case, devant les videos.
  const cases: ({ id: string } | Video)[] = brouillons.length > 0
    ? [{ id: 'brouillons' }, ...videosOnglet]
    : videosOnglet

  const supprimer = (id: string) => {
    if (!monProfil) return
    Alert.alert('Supprimer cette vidéo ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          etat.videos = etat.videos.filter(v => v.id !== id)
          etat.mesVideos = etat.mesVideos.filter(v => v.id !== id)
          setRevision(n => n + 1)
        },
      },
    ])
  }

  const nbSuivis = monProfil ? 0 : 23
  const nbAbonnes = monProfil ? 0 : 3418 + (suivi ? 1 : 0)
  const totalAime = videos.reduce((t, v) => t + v.nbAime, 0)
  const compteVisite = pseudoVisite
    ? comptesDemo.find(c => c.pseudo === pseudoVisite)
    : undefined
  const bio = monProfil ? profil?.bio ?? '' : compteVisite?.bio ?? ''

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
                  <View style={s.stat}>
                    <Text style={[s.statNombre, petitEcran.nombre]} numberOfLines={1}>
                      {abreger(nbSuivis)}
                    </Text>
                    <Text style={[s.statNom, petitEcran.nom]} numberOfLines={1}>Suivis</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={[s.statNombre, petitEcran.nombre]} numberOfLines={1}>
                      {abreger(nbAbonnes)}
                    </Text>
                    <Text style={[s.statNom, petitEcran.nom]} numberOfLines={1}>Followers</Text>
                  </View>
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
                  colors={['#00ddab', '#00ddab', '#09c9e8', '#138aff']}
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
                    {monProfil && profil?.avatar_url
                      ? <Image source={{ uri: profil.avatar_url }} style={s.avatarImage} />
                      : <Text style={s.avatarLettre}>{pseudo.charAt(0).toUpperCase()}</Text>}
                  </View>
                </LinearGradient>
                {monProfil && (
                  <View style={s.avatarPlus}><Plus taille={16} couleur="#fff" /></View>
                )}
              </View>
            </View>

            {/* Actions : seulement sur le profil d'autrui */}
            {!monProfil && (
              <View style={s.actions}>
                <Pressable style={[s.principal, suivi && s.principalSuivi]}
                  onPress={() => setSuivi(!suivi)}>
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
          <Text style={s.vide}>
            {onglet !== 'videos'
              ? onglet === 'privees' ? 'Aucune vidéo privée'
                : onglet === 'repartages' ? 'Aucune vidéo repartagée'
                : onglet === 'favoris' ? 'Aucune vidéo enregistrée'
                : 'Aucune vidéo aimée'
              : monProfil ? "Vous n'avez pas encore publié de vidéo" : 'Aucune vidéo publiée'}
          </Text>
        }
        ListFooterComponent={
          monProfil && videosOnglet.length > 0
            ? <Text style={s.aide}>Appui long sur une vidéo pour la supprimer</Text>
            : null
        }
        renderItem={({ item }) => item.id === 'brouillons'
          ? <CaseBrouillons largeur={largeurCase} nombre={brouillons.length}
              url={brouillons[0].url} octets={poidsBrouillons}
              onPresser={() => onBrouillons?.()} />
          : <Vignette item={item as Video} largeur={largeurCase}
              onSupprimer={monProfil ? supprimer : undefined}
              onOuvrir={() => onOuvrirVideo?.(
                videosOnglet, videosOnglet.indexOf(item as Video))} />}
      />

      {!!message && (
        <View style={s.toast} pointerEvents="none">
          <Text style={s.toastTexte}>{message}</Text>
        </View>
      )}

      {comptesOuverts && (
        <ComptesProfil pseudo={pseudo} avatar={profil?.avatar_url}
          onFermer={() => setComptesOuverts(false)} />
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
  aide: { fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center',
    paddingHorizontal: 16, paddingBottom: 28 },
  // Bandeau gris de confirmation, centre sous la barre du haut.
  toast: { position: 'absolute', top: 120, alignSelf: 'center',
    backgroundColor: 'rgba(90,90,90,.9)', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 20, maxWidth: '80%' },
  toastTexte: { color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' },

  case: { margin: 1, backgroundColor: '#f2f2f2' },
  // « Brouillons: 11 » pose en haut a gauche de la premiere case.
  brouillonsTitre: { position: 'absolute', left: 8, top: 7, color: '#fff',
    fontSize: 15, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 4 },
  vues: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row',
    alignItems: 'center', gap: 3 },
  vuesTexte: { color: '#fff', fontSize: 11 },
})
