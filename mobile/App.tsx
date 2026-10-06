import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, StatusBar, ActivityIndicator } from 'react-native'
import { Text, TextInput } from './src/composants/Texte'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { setAudioModeAsync } from 'expo-audio'
import { FournisseurAuth, useAuth } from './src/lib/auth'
import Connexion from './src/ecrans/Connexion'
import Fil from './src/ecrans/Fil'
import Publier from './src/ecrans/Publier'
import Camera from './src/ecrans/Camera'
import Montage from './src/ecrans/Montage'
import Profil from './src/ecrans/Profil'
import Brouillons from './src/ecrans/Brouillons'
import AmisEcran from './src/ecrans/Amis'
import MessagesEcran from './src/ecrans/Messages'
import { restaurer, type Video } from './src/lib/demo'
import type { Son } from './src/lib/sons'
import { Accueil, Amis, Messages, Plus, Personne } from './src/composants/Icones'

type Onglet = 'fil' | 'amis' | 'publier' | 'messages' | 'profil'

function Application() {
  const { profil, chargement } = useAuth()
  // Vrai tant que l'etat enregistre n'a pas ete relu : afficher avant
  // montrerait les donnees d'origine, puis les ferait sauter.
  const [restauration, setRestauration] = useState(true)
  useEffect(() => {
    restaurer().finally(() => setRestauration(false))
  }, [])
  const [onglet, setOnglet] = useState<Onglet>('fil')
  const [cleFil, setCleFil] = useState(0)
  // Video choisie a la camera, passee a l'ecran de publication.
  const [videoChoisie, setVideoChoisie] = useState<string | null>(null)
  // Son retenu au viseur ou au montage, qui accompagne cette video
  // jusqu'a la publication : le fichier video ne le porte pas.
  const [sonChoisi, setSonChoisi] = useState<Son | null>(null)
  // Vrai quand le fil affiche son espace LIVE.
  const [enLive, setEnLive] = useState(false)
  // Vrai tant qu'on est sur l'ecran de montage, avant la publication.
  const [montage, setMontage] = useState(false)
  // Pseudo du profil consulte. Null = on est sur son propre profil.
  const [profilVisite, setProfilVisite] = useState<string | null>(null)
  // Message a montrer en arrivant sur le profil, apres un enregistrement.
  const [messageProfil, setMessageProfil] = useState<string | undefined>()
  // Vrai quand la liste des brouillons recouvre le profil.
  const [brouillons, setBrouillons] = useState(false)
  // Lecteur plein ecran ouvert depuis la grille d'un profil.
  const [lecture, setLecture] = useState<{ videos: Video[]; index: number } | null>(null)

  // « Utiliser ce son » depuis le disque d'une video : la camera s'ouvre
  // avec ce son deja retenu.
  const utiliserSon = (son: Son) => {
    setLecture(null)
    setVideoChoisie(null); setMontage(false)
    setSonChoisi(son)
    setOnglet('publier')
  }

  const visiter = (pseudo: string) => {
    // Le lecteur se referme : sinon il recouvrirait le profil visite.
    setLecture(null)
    setProfilVisite(pseudo)
    setOnglet('profil')
  }

  // Profil et Messages passent la barre en theme clair, comme la regle
  // `:has(.page-profil)` de la version web.
  const clair = onglet === 'profil' || onglet === 'messages'
  // L'ecran de tournage et la liste des brouillons sont pleine page : pas de
  // barre de navigation dessous.
  const camera = onglet === 'publier'
    || (onglet === 'profil' && (brouillons || !!lecture))
    // L'espace LIVE du fil occupe tout l'ecran, sans barre de navigation.
    || (onglet === 'fil' && enLive)
  const teinte = clair ? '#111' : '#fff'
  const teinteAttenuee = clair ? 'rgba(17,17,17,.55)' : 'rgba(255,255,255,.62)'

  if (chargement || restauration) return (
    <View style={s.centre}><ActivityIndicator color="#fff" /></View>
  )

  if (!profil) return <Connexion />

  return (
    <View style={s.app}>
      <View style={s.contenu}>
        {onglet === 'fil' && (
          <Fil key={cleFil} onVisiter={visiter} onRechercher={() => setOnglet('amis')}
            onUtiliserSon={utiliserSon} onLive={setEnLive} />
        )}
        {onglet === 'amis' && (
          lecture
            ? <Fil
                videos={lecture.videos}
                indexInitial={lecture.index}
                onRetour={() => setLecture(null)}
                onVisiter={visiter}
                onUtiliserSon={utiliserSon}
              />
            : <AmisEcran
                onVisiter={visiter}
                onOuvrirVideo={(videos, index) => setLecture({ videos, index })}
              />
        )}
        {onglet === 'messages' && <MessagesEcran />}
        {onglet === 'publier' && (
          videoChoisie
            ? montage
              ? <Montage
                  uri={videoChoisie}
                  pseudo={profil.pseudo}
                  sonInitial={sonChoisi}
                  onRetour={() => {
                    setMontage(false); setVideoChoisie(null); setSonChoisi(null)
                  }}
                  onSuivant={son => { setSonChoisi(son ?? null); setMontage(false) }}
                />
              : <Publier
                  uriInitiale={videoChoisie}
                  sonInitial={sonChoisi}
                  onPublie={() => {
                    setVideoChoisie(null); setSonChoisi(null)
                    setCleFil(v => v + 1); setOnglet('fil')
                  }}
                  onAnnuler={() => { setVideoChoisie(null); setSonChoisi(null) }}
                  onBrouillon={() => {
                    setVideoChoisie(null); setSonChoisi(null); setProfilVisite(null)
                    setMessageProfil('Brouillon enregistré')
                    setOnglet('profil')
                  }}
                />
            : <Camera
                sonInitial={sonChoisi}
                onFermer={() => { setSonChoisi(null); setOnglet('fil') }}
                onChoisir={(uri, son) => {
                  setVideoChoisie(uri); setSonChoisi(son ?? null); setMontage(true)
                }}
              />
        )}
        {onglet === 'profil' && (
          lecture
            ? <Fil
                videos={lecture.videos}
                indexInitial={lecture.index}
                recherche={profilVisite ?? profil.pseudo}
                onRetour={() => setLecture(null)}
                onVisiter={visiter}
                onUtiliserSon={utiliserSon}
              />
          : brouillons
            ? <Brouillons
                onRetour={() => setBrouillons(false)}
                onPublier={b => {
                  setBrouillons(false); setVideoChoisie(b.url)
                  setSonChoisi(null); setMontage(false); setOnglet('publier')
                }}
              />
            : <Profil
                pseudoVisite={profilVisite ?? undefined}
                messageArrivee={messageProfil}
                onBrouillons={() => setBrouillons(true)}
                onVisiter={visiter}
                onOuvrirVideo={(videos, index) => setLecture({ videos, index })}
                onRetour={() => { setProfilVisite(null); setOnglet('fil') }}
              />
        )}
      </View>

      {!camera && <View style={[s.nav, clair && s.navClair]}>
        <Pressable style={s.navBouton}
          onPress={() => { setLecture(null); setOnglet('fil') }}>
          <Accueil taille={23} plein={onglet === 'fil'}
            couleur={onglet === 'fil' ? teinte : teinteAttenuee} />
          <Text style={[s.navTexte, { color: onglet === 'fil' ? teinte : teinteAttenuee }]}>Accueil</Text>
        </Pressable>

        <Pressable style={s.navBouton}
          onPress={() => { setLecture(null); setOnglet('amis') }}>
          <Amis taille={23} couleur={onglet === 'amis' ? teinte : teinteAttenuee} />
          <Text style={[s.navTexte, { color: onglet === 'amis' ? teinte : teinteAttenuee }]}>Amis</Text>
        </Pressable>

        {/* Pastille blanche avec ses deux ombres decalees : cyan a gauche,
            rouge a droite. En RN il n'y a pas de box-shadow multiple, on
            empile donc trois vues. */}
        <Pressable style={s.navCreer} onPress={() => setOnglet('publier')}>
          <View style={s.pastilleGroupe}>
            <View style={[s.pastilleOmbre, s.pastilleCyan]} />
            <View style={[s.pastilleOmbre, s.pastilleRouge]} />
            <View style={[s.pastille, clair && s.pastilleNoire]}>
              <Plus taille={21} couleur={clair ? '#fff' : '#000'} />
            </View>
          </View>
        </Pressable>

        <Pressable style={s.navBouton}
          onPress={() => { setLecture(null); setOnglet('messages') }}>
          <Messages taille={23} couleur={onglet === 'messages' ? teinte : teinteAttenuee} />
          <Text style={[s.navTexte, { color: onglet === 'messages' ? teinte : teinteAttenuee }]}>Messages</Text>
        </Pressable>

        <Pressable style={s.navBouton}
          onPress={() => {
            setProfilVisite(null); setMessageProfil(undefined)
            setBrouillons(false); setLecture(null); setOnglet('profil')
          }}>
          <Personne taille={23} plein={onglet === 'profil'}
            couleur={onglet === 'profil' ? teinte : teinteAttenuee} />
          <Text style={[s.navTexte, { color: onglet === 'profil' ? teinte : teinteAttenuee }]}>Profil</Text>
        </Pressable>
      </View>}
    </View>
  )
}

// Le navigateur web ignore le reglage « taille du texte » du systeme : les
// tailles en CSS sont absolues. React Native, lui, les multiplie par ce
// reglage, ce qui fait paraitre tout l'ecran zoome sur un telephone ou il est
// augmente. On neutralise donc cette mise a l'echelle pour que mobile et web
// affichent rigoureusement les memes tailles.
//
// Le reglage se neutralise avec la propriete `allowFontScaling`, qu'il faut
// poser sur chaque <Text>. Plutot que de la repeter partout, on la place une
// fois pour toutes dans les valeurs par defaut de nos composants, exportes
// ci-dessous et utilises a la place de ceux de React Native.
//
// Ne pas revenir a `Text.defaultProps` : React 19 a supprime `defaultProps`
// sur les composants fonctionnels, l'affectation ne produit plus aucun effet
// et le reglage systeme reprend silencieusement le dessus.

export default function App() {
  // iOS coupe par defaut le son des videos quand l'interrupteur lateral est
  // sur silencieux. Le fil etant sonore comme sur TikTok, on l'autorise
  // explicitement a jouer dans ce mode.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: false,
    }).catch(() => { /* Reglage indisponible : le son suit le mode systeme. */ })
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <FournisseurAuth>
        <Application />
      </FournisseurAuth>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#000' },
  contenu: { flex: 1 },
  centre: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  // .nav : 54px + zone sure, bordure haute fine.
  nav: {
    minHeight: 54, paddingBottom: 20, flexDirection: 'row', alignItems: 'stretch',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)', backgroundColor: '#000',
  },
  navClair: { backgroundColor: '#fff', borderTopColor: 'rgba(0,0,0,.1)' },
  navBouton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  navTexte: { fontSize: 10, fontWeight: '500' },

  navCreer: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  pastilleGroupe: { width: 46, height: 27, alignItems: 'center', justifyContent: 'center' },
  // Les deux ombres decalees de la version web : cyan a -5px, rouge a +5px.
  pastilleOmbre: { position: 'absolute', width: 36, height: 27, borderRadius: 9 },
  pastilleCyan: { backgroundColor: '#16cce0', left: 0 },
  pastilleRouge: { backgroundColor: '#ff2856', right: 0 },
  pastille: {
    width: 36, height: 27, borderRadius: 9, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  pastilleNoire: { backgroundColor: '#000' },
})
