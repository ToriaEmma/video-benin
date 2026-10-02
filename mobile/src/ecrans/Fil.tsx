import React, { useEffect, useState } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from '../composants/Texte'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LinearGradient } from 'expo-linear-gradient'
import { useEvent } from 'expo'
import { abreger, type Video } from '../lib/demo'
import { apiInteractions, apiVideos } from '../lib/api'
import { useAuth } from '../lib/auth'
import Commentaires from '../composants/Commentaires'
import {
  CoeurFil, BulleFil, PartageFil, Favori, LecturePleine, LiveEntete,
  LoupeEntete, NoteDisque, Chevron, Loupe, TroisPoints,
} from '../composants/Icones'
import EnvoyerA from '../composants/EnvoyerA'
import AnalyseVideo from './AnalyseVideo'
import Communaute from './Communaute'
import DirectLive from './DirectLive'

// Memes categories que app/src/pages/Fil.tsx.
const CATEGORIES = ['Communauté', 'Suivis', 'Pour toi']

// Le fil general lit les videos de l'API, qui portent `favori` ; les
// listes ouvertes depuis un autre ecran n'en ont pas toujours.
type VideoFil = Video & { favori?: boolean }

function Carte({
  item, actif, hauteur, onCommenter, onVisiter, sienne, nbCommentaires, onErreur,
}: {
  item: VideoFil; actif: boolean; hauteur: number
  onCommenter: (v: VideoFil) => void
  onVisiter?: (pseudo: string) => void
  // Sur sa propre publication, le partage devient trois points et
  // ouvre la feuille « Envoyer à ».
  sienne?: boolean
  // Compteur tenu par l'ecran : la feuille des commentaires le fait
  // varier, et la carte doit suivre sans que l'API soit reinterrogee.
  nbCommentaires: number
  onErreur: (message: string) => void
}) {
  const lecteur = useVideoPlayer(item.url, p => { p.loop = true; p.timeUpdateEventInterval = 0.25 })

  const [aime, setAime] = useState(item.aime)
  const [nbAime, setNbAime] = useState(item.nbAime)
  const [favori, setFavori] = useState(Boolean(item.favori))
  const [developpe, setDeveloppe] = useState(false)
  const [progression, setProgression] = useState(0)
  // Pause demandee par l'utilisateur, a distinguer d'un simple chargement.
  const [pauseVoulue, setPauseVoulue] = useState(false)
  const [envoyer, setEnvoyer] = useState(false)
  // « Données analytiques » de la feuille « Envoyer à » : l'ecran d'analyse
  // se pose par-dessus la carte, et se referme sur lui-meme.
  const [analyse, setAnalyse] = useState(false)

  // L'etat de lecture et la position viennent du lecteur : on les suit pour
  // afficher le bouton « lire » et la barre de progression.
  const { isPlaying } = useEvent(lecteur, 'playingChange', { isPlaying: lecteur.playing })
  useEffect(() => {
    if (!actif) { setProgression(0); return }
    const minuteur = setInterval(() => {
      const duree = lecteur.duration
      if (duree > 0) setProgression((lecteur.currentTime / duree) * 100)
    }, 250)
    return () => clearInterval(minuteur)
  }, [actif, lecteur])

  useEffect(() => {
    // Seule la carte visible lit : les autres restent en pause, pour ne pas
    // consommer de donnees sur des videos jamais regardees.
    if (actif) { setPauseVoulue(false); lecteur.play() }
    else { lecteur.pause(); lecteur.currentTime = 0 }
  }, [actif, lecteur])

  // La vue part quand la carte devient celle qu'on regarde, et non a
  // chaque rendu. L'echec est silencieux : rater un comptage ne doit pas
  // interrompre le visionnage.
  useEffect(() => {
    if (!actif) return
    apiVideos.vue(item.id).catch(() => { /* Compteur de vues indisponible. */ })
  }, [actif, item.id])

  // Le serveur renvoie le decompte reel : on l'affiche d'abord de maniere
  // optimiste, puis on se recale dessus, et on revient en arriere si la
  // requete echoue.
  const basculerAime = () => {
    const vise = !aime
    setAime(vise); setNbAime(v => v + (vise ? 1 : -1))
    const envoi = vise
      ? apiInteractions.aimer(item.id)
      : apiInteractions.retirerJaime(item.id)
    envoi
      .then(r => { setAime(r.aime); setNbAime(r.nbAime) })
      .catch((e: Error) => {
        setAime(!vise); setNbAime(v => v + (vise ? -1 : 1))
        onErreur(e.message)
      })
  }

  const basculerFavori = () => {
    const vise = !favori
    setFavori(vise)
    const envoi = vise
      ? apiInteractions.mettreEnFavori(item.id)
      : apiInteractions.retirerFavori(item.id)
    envoi
      .then(r => setFavori(r.favori))
      .catch((e: Error) => { setFavori(!vise); onErreur(e.message) })
  }

  return (
    <View style={[s.carte, { height: hauteur }]}>
      <Pressable style={StyleSheet.absoluteFill}
        onPress={() => {
          if (isPlaying) { setPauseVoulue(true); lecteur.pause() }
          else { setPauseVoulue(false); lecteur.play() }
        }}>
        <VideoView player={lecteur} style={StyleSheet.absoluteFill}
          contentFit="cover" nativeControls={false} />
      </Pressable>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,.33)']}
        style={s.ombre}
        pointerEvents="none"
      />

      {pauseVoulue && actif && (
        <Pressable style={s.lecture}
          onPress={() => { setPauseVoulue(false); lecteur.play() }}>
          <LecturePleine taille={60} couleur="rgba(255,255,255,.65)" />
        </Pressable>
      )}

      <View style={s.actions}>
        <Pressable style={s.avatar} onPress={() => onVisiter?.(item.pseudo)}>
          <Text style={s.avatarLettre}>{item.pseudo.charAt(0).toUpperCase()}</Text>
        </Pressable>

        <Pressable style={s.action} onPress={basculerAime} hitSlop={6}>
          <CoeurFil taille={34} couleur={aime ? '#ff2856' : '#fff'} />
          <Text style={s.compteur}>{abreger(nbAime)}</Text>
        </Pressable>

        <Pressable style={s.action} onPress={() => onCommenter(item)} hitSlop={6}>
          <BulleFil taille={34} couleur="#fff" />
          <Text style={s.compteur}>{abreger(nbCommentaires)}</Text>
        </Pressable>

        <Pressable style={s.action} onPress={basculerFavori} hitSlop={6}>
          <Favori taille={32} plein={favori} couleur={favori ? '#fcd116' : '#fff'} />
          <Text style={s.compteur}>Favori</Text>
        </Pressable>

        <Pressable style={s.action} hitSlop={6}
          onPress={() => setEnvoyer(true)}>
          {sienne
            ? <TroisPoints taille={34} couleur="#fff" />
            : <PartageFil taille={34} couleur="#fff" />}
          <Text style={s.compteur}>{sienne ? 'Plus' : 'Partager'}</Text>
        </Pressable>

        <View style={s.disque}>
          <NoteDisque taille={24} couleur="#fff" />
        </View>
      </View>

      <View style={s.infos}>
        <Pressable onPress={() => onVisiter?.(item.pseudo)}>
          <Text style={s.pseudo}>@{item.pseudo}</Text>
        </Pressable>
        {!!item.legende && (
          <Pressable onPress={() => setDeveloppe(!developpe)}>
            <Text style={s.legende} numberOfLines={developpe ? undefined : 2}>
              {item.legende}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={s.barre}>
        <View style={[s.barreRemplie, { width: `${progression}%` }]} />
      </View>

      <EnvoyerA visible={envoyer} legende={item.legende}
        sienne={!!sienne} auteur={item.pseudo}
        onFermer={() => setEnvoyer(false)}
        onAnalytiques={() => setAnalyse(true)} />

      {analyse && (
        <View style={StyleSheet.absoluteFill}>
          <AnalyseVideo video={item} onRetour={() => setAnalyse(false)} />
        </View>
      )}
    </View>
  )
}

export default function Fil({
  onVisiter, onRechercher, videos, indexInitial = 0, recherche, onRetour,
}: {
  onVisiter?: (pseudo: string) => void
  onRechercher?: () => void
  // Liste a lire. Par defaut le fil general ; le profil passe la sienne.
  videos?: VideoFil[]
  // Video sur laquelle s'ouvrir dans cette liste.
  indexInitial?: number
  // Terme affiche dans la barre de recherche, quand elle remplace les
  // categories ; le chevron de retour l'accompagne.
  recherche?: string
  onRetour?: () => void
}) {
  const { profil } = useAuth()
  const [categorie, setCategorie] = useState('Pour toi')
  const [index, setIndex] = useState(indexInitial)
  const autonome = videos !== undefined
  // Fil general : la liste vient de l'API. En mode autonome, l'appelant
  // fournit la sienne et aucune requete n'est lancee.
  const [listeApi, setListeApi] = useState<VideoFil[]>([])
  const [chargement, setChargement] = useState(!autonome)
  const [erreur, setErreur] = useState('')
  const liste = videos ?? listeApi
  // « Suivis » et « Pour toi » lisent deux routes distinctes : l'onglet
  // demande fait donc partie des dependances du chargement.
  const filApi = categorie === 'Suivis' ? 'Suivis' : 'Pour toi'
  // Incremente par « Réessayer » : l'effet de chargement repart.
  const [tentative, setTentative] = useState(0)

  const recharger = () => { setChargement(true); setTentative(n => n + 1) }

  useEffect(() => {
    if (autonome) return
    let valable = true
    const envoi = filApi === 'Suivis' ? apiVideos.suivis() : apiVideos.liste()
    envoi
      .then(v => { if (valable) { setListeApi(v); setErreur('') } })
      // La liste est videe avec l'erreur : garder celle de l'onglet
      // precedent ferait passer ses videos pour celles de celui-ci.
      .catch((e: Error) => { if (valable) { setListeApi([]); setErreur(e.message) } })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [autonome, filApi, tentative])

  // Les commentaires sont comptes ici : la feuille en ajoute et en retire,
  // et le compteur de la carte doit suivre sans recharger tout le fil.
  const [ajouts, setAjouts] = useState<Record<string, number>>({})
  const [videoCom, setVideoCom] = useState<VideoFil | null>(null)
  // Hauteur reelle du fil, barre de navigation deduite : c'est le pas du
  // defilement par ecran. La mesurer evite de dependre de la hauteur de la
  // fenetre, qui serait trop grande et desalignerait chaque video.
  const [hauteur, setHauteur] = useState(0)

  // Carte touchee dans la mosaique « Communauté » : le fil bascule sur
  // « Pour toi » et se positionne sur cette video, en reprenant le
  // defilement par ecran deja en place.
  // « Communauté » est le seul onglet sur fond blanc : la barre du haut
  // s'y lit en sombre.
  const clair = !autonome && categorie === 'Communauté'

  // Passer d'un fil de l'API a l'autre relance une requete : la liste
  // precedente est ecartee tout de suite, pour ne pas montrer les videos
  // de « Pour toi » sous l'onglet « Suivis » le temps du chargement.
  const changerCategorie = (c: string) => {
    const apres = c === 'Suivis' ? 'Suivis' : 'Pour toi'
    if (!autonome && (c === 'Suivis' || c === 'Pour toi') && apres !== filApi) {
      setListeApi([]); setErreur(''); setChargement(true); setIndex(0)
    }
    setCategorie(c)
  }

  // La mosaique « Communauté » lit le fil deja charge : l'onglet retrouve
  // donc sa liste telle quelle, positionnee sur la video touchee.
  const ouvrirVideo = (videoId: string) => {
    const rang = liste.findIndex(v => v.id === videoId)
    setIndex(rang < 0 ? 0 : rang)
    setCategorie(filApi)
  }

  return (
    <View style={s.page}
      onLayout={e => setHauteur(e.nativeEvent.layout.height)}>
      {!autonome && filApi === categorie && chargement ? (
        <View style={s.attente}>
          <ActivityIndicator color="#fff" />
          <Text style={s.attenteTexte}>Chargement…</Text>
        </View>
      ) : !autonome && filApi === categorie && liste.length === 0 ? (
        // Un fil vide et un fil en panne se ressemblent a l'ecran : le
        // message du serveur distingue les deux, et le bouton permet de
        // retenter sans quitter l'onglet. Sous « Suivis », le fil vide a
        // une cause precise : le lecteur ne suit encore personne.
        <View style={s.attente}>
          <Text style={s.attenteTexte}>
            {erreur || (categorie === 'Suivis'
              ? 'Tu ne suis encore personne. Abonne-toi à des comptes pour voir leurs vidéos ici.'
              : 'Aucune vidéo pour le moment.')}
          </Text>
          {!!erreur && (
            <Pressable style={s.reessayer} onPress={recharger}>
              <Text style={s.reessayerTexte}>Réessayer</Text>
            </Pressable>
          )}
        </View>
      ) : autonome || filApi === categorie ? (
        <FlatList
          data={liste}
          keyExtractor={v => v.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={hauteur || undefined}
          decelerationRate="fast"
          // La liste s'ouvre sur la video courante, et non sur le seul
          // `indexInitial` : une carte touchee dans « Communauté » change
          // `index`, et c'est la que le fil doit se poser en revenant.
          initialScrollIndex={hauteur > 0 ? index : undefined}
          getItemLayout={(_, i) => (
            { length: hauteur, offset: hauteur * i, index: i })}
          onMomentumScrollEnd={e => hauteur > 0 &&
            setIndex(Math.round(e.nativeEvent.contentOffset.y / hauteur))}
          renderItem={({ item, index: i }) => (
            <Carte item={item} actif={i === index} hauteur={hauteur}
              sienne={item.pseudo === profil?.pseudo}
              nbCommentaires={item.nbCommentaires + (ajouts[item.id] ?? 0)}
              onErreur={setErreur}
              onCommenter={setVideoCom} onVisiter={onVisiter} />
          )}
        />
      ) : categorie === 'LIVE' ? (
        // Le LIVE se tient sur toute la hauteur, entete comprise : il
        // porte sa propre barre du haut et sa propre croix de sortie.
        <DirectLive onFermer={() => changerCategorie('Pour toi')} />
      ) : (
        <Communaute onOuvrir={ouvrirVideo} />
      )}

      {/* Barre du haut, par-dessus la video. En mode autonome elle porte le
          retour et le champ de recherche ; sinon les categories du fil.
          Le LIVE la laisse de cote : il porte la sienne.

          Sur « Communauté » le fond passe au blanc : la barre garde la
          meme disposition, mais ses traits s'assombrissent, sans quoi ils
          seraient blancs sur blanc. */}
      {categorie === 'LIVE' ? null : autonome ? (
        <View style={s.enteteRecherche}>
          <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
            <Chevron taille={26} couleur="#fff" />
          </Pressable>
          <Pressable style={s.champ} onPress={onRechercher}>
            <Loupe taille={19} couleur="rgba(255,255,255,.85)" />
            <Text style={s.champTexte} numberOfLines={1}>{recherche ?? ''}</Text>
            <View style={s.champTrait} />
            <Text style={s.champBouton}>Rechercher</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[s.entete, clair && s.enteteClaire]}>
          <Pressable hitSlop={10} onPress={() => setCategorie('LIVE')}>
            <LiveEntete taille={26} couleur={clair ? '#111' : '#fff'} />
          </Pressable>

          <View style={s.categories}>
            {CATEGORIES.map(c => (
              <Pressable key={c} onPress={() => changerCategorie(c)} hitSlop={8} style={s.categorieBoite}>
                <Text style={[
                  s.categorie,
                  clair && s.categorieClaire,
                  categorie === c && (clair ? s.categorieActiveClaire : s.categorieActive),
                ]}>{c}</Text>
                {categorie === c && (
                  <View style={[s.soulignement, clair && s.soulignementClair]} />
                )}
              </Pressable>
            ))}
          </View>

          <Pressable hitSlop={10} onPress={onRechercher}>
            <LoupeEntete taille={25} couleur={clair ? '#111' : '#fff'} />
          </Pressable>
        </View>
      )}

      {/* Un j'aime ou un favori refuse par le serveur se signale ici : la
          video continue de se lire, seul le bandeau apparait. */}
      {!!erreur && (autonome || liste.length > 0) && (
        <Pressable style={s.bandeau} onPress={() => setErreur('')}>
          <Text style={s.bandeauTexte}>{erreur}</Text>
        </Pressable>
      )}

      {videoCom && (
        <Commentaires
          video={videoCom}
          pseudo={profil?.pseudo ?? 'moi'}
          onVariation={n => setAjouts(a => (
            { ...a, [videoCom.id]: (a[videoCom.id] ?? 0) + n }))}
          onFermer={() => setVideoCom(null)}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
  carte: { width: '100%', backgroundColor: '#000' },

  // Degrade du bas, comme .video-carte:after (inset 55% 0 0).
  ombre: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },

  // .fil-entete : padding 14px 12px 24px, gap 17px entre les categories.
  entete: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, paddingHorizontal: 12, paddingTop: 58, paddingBottom: 24,
  },
  // Barre du lecteur ouvert depuis le profil : retour et champ de recherche.
  enteteRecherche: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingTop: 56, paddingBottom: 20,
  },
  retour: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  champ: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9,
    height: 38, borderRadius: 19, borderWidth: 1,
    borderColor: 'rgba(255,255,255,.55)', paddingHorizontal: 14 },
  champTexte: { flex: 1, color: 'rgba(255,255,255,.9)', fontSize: 15 },
  champTrait: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,.4)' },
  champBouton: { color: '#fff', fontSize: 15, fontWeight: '500' },

  categories: { flexDirection: 'row', justifyContent: 'center', gap: 17 },
  // .fil-entete button : min-height 36px, contenu centre.
  categorieBoite: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  categorie: {
    color: 'rgba(255,255,255,.8)', fontSize: 16, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,.33)', textShadowRadius: 3,
  },
  categorieActive: { color: '#fff' },
  // Variantes sombres de la barre, pour l'onglet « Communauté ».
  enteteClaire: { backgroundColor: '#fff' },
  categorieClaire: { color: '#8a8a8e', textShadowColor: 'transparent' },
  categorieActiveClaire: { color: '#111', fontWeight: '700' },
  soulignementClair: { backgroundColor: '#111' },
  // .fil-entete .actif:after : 24px de large, 2px de haut, a -4px.
  // :after en position absolue : le trait ne decale pas le texte, donc les
  // trois categories restent sur la meme ligne que l'icone LIVE.
  soulignement: {
    position: 'absolute', bottom: 2, height: 2, width: 24,
    backgroundColor: '#fff', borderRadius: 2,
  },

  lecture: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', opacity: .65,
  },

  // .fil-ecran .actions : right 8px, bottom 16px, gap 12px.
  // 16px du web + la hauteur de la barre de navigation, qui se superpose ici.
  actions: { position: 'absolute', right: 8, bottom: 16, alignItems: 'center', gap: 12, zIndex: 2 },
  action: { alignItems: 'center', gap: 2, minWidth: 44 },
  compteur: {
    color: '#fff', fontSize: 12,
    textShadowColor: 'rgba(0,0,0,.33)', textShadowRadius: 3,
  },
  // .fil-ecran .actions .avatar : 38px, bordure 1px, fond #777.
  avatar: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#fff',
    backgroundColor: '#777', alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  avatarLettre: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // .fil-disque : 42px, fond raye, bord 7px #292929.
  disque: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#666',
    borderWidth: 7, borderColor: '#292929',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  disqueActif: {},
  disqueLettre: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // .fil-ecran .infos : left 12px, right 68px, bottom 24px.
  infos: { position: 'absolute', left: 12, right: 68, bottom: 24, zIndex: 2 },
  pseudo: {
    color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,.33)', textShadowRadius: 3,
  },
  legende: {
    color: '#fff', fontSize: 15, lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,.33)', textShadowRadius: 3,
  },

  // .fil-progression : 2px de haut, a 12px des bords, collee au bas de la
  // carte (`bottom: 0` en web), donc juste au-dessus de la barre de navigation.
  barre: {
    position: 'absolute', left: 12, right: 12, bottom: 0, height: 2,
    backgroundColor: 'rgba(255,255,255,.19)', borderRadius: 2, zIndex: 3,
  },
  barreRemplie: { height: 2, backgroundColor: 'rgba(255,255,255,.6)', borderRadius: 2 },

  attente: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  attenteTexte: { color: '#bbb', textAlign: 'center', fontSize: 15 },
  reessayer: { borderWidth: 1, borderColor: 'rgba(255,255,255,.35)',
    borderRadius: 22, paddingHorizontal: 22, minHeight: 44,
    alignItems: 'center', justifyContent: 'center' },
  reessayerTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Bandeau d'erreur pose au-dessus de la barre de navigation.
  bandeau: { position: 'absolute', left: 16, right: 16, bottom: 90, zIndex: 4,
    backgroundColor: 'rgba(90,90,90,.92)', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16 },
  bandeauTexte: { color: '#fff', fontSize: 14, textAlign: 'center' },
})
