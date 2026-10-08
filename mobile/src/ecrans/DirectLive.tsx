// ============================================================
// Pseudo-categorie « LIVE » du fil, atteinte par le clap en haut a
// gauche. Trois etats :
//
//  - « Découvrir » : les comptes en direct en ce moment (liste de l'API,
//    rafraichie toutes les 10 s) et l'entree « Passer en LIVE » ;
//  - regarder un direct, en plein ecran ;
//  - diffuser : apercu de sa camera, puis le direct lui-meme.
//
// L'image et le son passent par LiveKit (src/lib/salleLive.web.ts) ; le
// tchat et les coeurs par les messages de la salle.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, Animated, Easing, Platform, ActivityIndicator,
} from 'react-native'
import { BARRE_ETAT_WEB } from '../lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TextInput } from '../composants/Texte'
import VideoLive from '../composants/VideoLive'
import { abreger } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { useExigerCompte } from '../lib/invite'
import { apiLive, type AccesLive, type Live } from '../lib/api'
import {
  useSalleLive, preparerCamera, libererCamera, basculerCamera, type MessageSalle,
} from '../lib/salleLive'
import {
  CameraLive, Croix, ChevronHaut, CoeurPlein, Envoyer, Retourner,
} from '../composants/Icones'

// Nombre de messages gardes a l'ecran : au-dela, les plus anciens
// sortent par le haut, comme dans un tchat de direct.
const MESSAGES_VISIBLES = 6
// Rafraichissement de la liste des directs, et signe de vie du diffuseur.
const CADENCE_LISTE = 10_000
const CADENCE_PRESENCE = 20_000

type Piste = Awaited<ReturnType<typeof preparerCamera>>[number]

// ------------------------------------------------------------
// Avatar : la photo du compte, sinon son initiale dans un rond gris.
// ------------------------------------------------------------
function Avatar({ pseudo, taille, bordure = false }: {
  pseudo: string; taille: number; bordure?: boolean
}) {
  return (
    <View style={[
      s.avatar,
      { width: taille, height: taille, borderRadius: taille / 2 },
      bordure && s.avatarBordure,
    ]}>
      <Text style={[s.avatarLettre, { fontSize: taille * 0.42 }]}>
        {pseudo.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

// ------------------------------------------------------------
// Coeur qui monte le long du bord droit. Chaque coeur vit le temps de
// son animation, puis l'ecran le retire de la liste.
// ------------------------------------------------------------
function CoeurVolant({ decalage, onFini }: {
  decalage: number; onFini: () => void
}) {
  const [montee] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(montee, {
      toValue: 1, duration: 2600, easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => { if (finished) onFini() })
  }, [montee, onFini])

  return (
    <Animated.View pointerEvents="none" style={[s.coeurVolant, {
      right: decalage,
      opacity: montee.interpolate({
        inputRange: [0, 0.7, 1], outputRange: [0.9, 0.6, 0],
      }),
      transform: [{
        translateY: montee.interpolate({
          inputRange: [0, 1], outputRange: [0, -190],
        }),
      }],
    }]}>
      <CoeurPlein taille={22} couleur="#ff2856" />
    </Animated.View>
  )
}

// Coeurs en vol : un par coeur recu (le compteur de la salle augmente).
function useCoeursVolants(total: number) {
  const [coeurs, setCoeurs] = useState<{ id: number; decalage: number }[]>([])
  const [vus, setVus] = useState(total)
  if (total !== vus) {
    // Ajustement pendant le rendu (et non dans un effet) : un seul rendu.
    setVus(total)
    if (total > vus) {
      const nouveaux = Array.from({ length: Math.min(total - vus, 5) }, (_, i) => ({
        id: vus + i + 1, decalage: 10 + ((total + i) % 3) * 16,
      }))
      setCoeurs(l => [...l, ...nouveaux].slice(-20))
    }
  }
  const retirer = useCallback((id: number) => setCoeurs(l => l.filter(c => c.id !== id)), [])
  return { coeurs, retirer }
}

// ------------------------------------------------------------
// Tchat du direct, en bas a gauche.
// ------------------------------------------------------------
function Tchat({ messages }: { messages: MessageSalle[] }) {
  return (
    <View style={s.tchat} pointerEvents="none">
      {messages.slice(-MESSAGES_VISIBLES).map(m => (
        <View key={m.id} style={s.message}>
          {m.systeme ? (
            <Text style={s.messageSysteme} numberOfLines={2}>
              <Text style={s.messageNom}>{m.pseudo} </Text>
              {m.texte}
            </Text>
          ) : (
            <>
              <Avatar pseudo={m.pseudo} taille={17} />
              <Text style={s.messageTexte} numberOfLines={2}>
                <Text style={s.messageNom}>{m.pseudo}  </Text>
                {m.texte}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  )
}

// ------------------------------------------------------------
// Le direct en plein ecran, cote spectateur ou cote diffuseur.
// ------------------------------------------------------------
function Salle({ acces, diffuseur, pistes, onQuitter }: {
  acces: AccesLive
  diffuseur: boolean
  pistes?: Piste[]
  onQuitter: () => void
}) {
  const { profil } = useAuth()
  const exiger = useExigerCompte()
  const moi = profil?.pseudo ?? 'visiteur'
  const salle = useSalleLive(acces, { diffuseur, pistes: pistes as never, moi })
  const { coeurs, retirer } = useCoeursVolants(salle.coeurs)
  const [saisie, setSaisie] = useState('')
  const [face, setFace] = useState<'user' | 'environment'>('user')

  // Signe de vie du diffuseur : sans lui, le direct sort de la liste.
  useEffect(() => {
    if (!diffuseur) return
    const t = setInterval(() => { apiLive.presence(acces.live.id).catch(() => { /* Reessaye. */ }) }, CADENCE_PRESENCE)
    return () => clearInterval(t)
  }, [diffuseur, acces.live.id])

  const envoyer = () => {
    if (!exiger('écrire dans le LIVE')) return
    salle.envoyer(saisie)
    setSaisie('')
  }

  return (
    <View style={s.pagePleine}>
      <VideoLive refVideo={salle.refVideo} miroir={diffuseur && face === 'user'}
        ajuster={diffuseur ? 'cover' : 'contain'} />

      <LinearGradient colors={['rgba(0,0,0,.45)', 'transparent']}
        style={s.voileHaut} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,.55)']}
        style={s.voileBas} pointerEvents="none" />

      {/* Toucher l'image : un coeur (comme sur TikTok). */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (exiger('envoyer des cœurs')) salle.envoyerCoeur() }}
        accessibilityLabel="Envoyer un cœur" />

      <View style={s.rangeeHaute}>
        <View style={s.pilleDiffuseur}>
          <Avatar pseudo={acces.live.pseudo} taille={30} bordure />
          <View style={s.diffuseurTextes}>
            <Text style={s.diffuseurPseudo} numberOfLines={1}>{acces.live.pseudo}</Text>
            <View style={s.diffuseurAbonnes}>
              <CoeurPlein taille={10} couleur="#ff6b86" />
              <Text style={s.diffuseurCompte}>{abreger(salle.coeurs)}</Text>
            </View>
          </View>
          <View style={s.badgeEnDirect}><Text style={s.badgeDirectTexte}>LIVE</Text></View>
        </View>

        <View style={s.pilleSpectateurs}>
          <Text style={s.spectateursTexte}>👁 {abreger(salle.spectateurs)}</Text>
        </View>

        <View style={{ flex: 1 }} />
        {diffuseur && (
          <Pressable style={s.rond} hitSlop={6} accessibilityLabel="Retourner la caméra"
            onPress={() => {
              const suivante = face === 'user' ? 'environment' : 'user'
              setFace(suivante)
              basculerCamera(pistes as never ?? [], suivante).catch(() => setFace(face))
            }}>
            <Retourner taille={17} couleur="#fff" />
          </Pressable>
        )}
        <Pressable style={[s.rond, diffuseur && s.rondTerminer]} hitSlop={6} onPress={onQuitter}
          accessibilityLabel={diffuseur ? 'Terminer le LIVE' : 'Quitter le LIVE'}>
          {diffuseur ? <Text style={s.terminerTexte}>Terminer</Text> : <Croix taille={17} couleur="#fff" />}
        </Pressable>
      </View>

      {acces.live.titre ? (
        <View style={s.rangeeRang} pointerEvents="none">
          <View style={s.pilleLigue}><Text style={s.ligueTexte} numberOfLines={1}>{acces.live.titre}</Text></View>
        </View>
      ) : null}

      {salle.etat === 'connexion' && (
        <View style={s.centre} pointerEvents="none">
          <ActivityIndicator color="#fff" />
          <Text style={s.centreTexte}>{diffuseur ? 'Lancement du LIVE…' : 'Connexion au LIVE…'}</Text>
        </View>
      )}
      {(salle.etat === 'termine' || salle.etat === 'erreur') && (
        <View style={s.fin}>
          <Text style={s.finTitre}>{salle.etat === 'termine' ? 'Le LIVE est terminé' : 'Connexion au LIVE impossible'}</Text>
          {salle.etat === 'erreur' && <Text style={s.centreTexte}>Vérifie ta connexion internet puis réessaie.</Text>}
          <Pressable style={s.principal} onPress={onQuitter}><Text style={s.principalTexte}>Retour</Text></Pressable>
        </View>
      )}
      {salle.sonBloque && salle.etat === 'direct' && (
        <Pressable style={s.activerSon} onPress={salle.activerSon}>
          <Text style={s.activerSonTexte}>🔊 Touche pour activer le son</Text>
        </Pressable>
      )}

      <Tchat messages={salle.messages} />

      {coeurs.map(c => (
        <CoeurVolant key={c.id} decalage={c.decalage} onFini={() => retirer(c.id)} />
      ))}

      <View style={s.barreBasse}>
        <View style={s.champ}>
          <TextInput style={s.champSaisie} value={saisie}
            onChangeText={setSaisie} maxLength={150}
            onFocus={() => { exiger('écrire dans le LIVE') }}
            onSubmitEditing={envoyer} returnKeyType="send"
            placeholder={profil ? 'Saisis ton message…' : 'Connecte-toi pour écrire…'}
            placeholderTextColor="rgba(255,255,255,.65)" />
        </View>
        {!!saisie.trim() && (
          <Pressable style={s.action} hitSlop={6} onPress={envoyer} accessibilityLabel="Envoyer">
            <Envoyer taille={23} couleur="#fff" />
          </Pressable>
        )}
        <Pressable style={s.action} hitSlop={6} accessibilityLabel="Envoyer un cœur"
          onPress={() => { if (exiger('envoyer des cœurs')) salle.envoyerCoeur() }}>
          <CoeurPlein taille={25} couleur="#ff2856" />
        </Pressable>
      </View>
    </View>
  )
}

// ------------------------------------------------------------
// Avant de diffuser : la camera, un titre, puis « Lancer le LIVE ».
// ------------------------------------------------------------
function Preparation({ onLance, onAnnuler }: {
  onLance: (acces: AccesLive, pistes: Piste[]) => void
  onAnnuler: () => void
}) {
  const [pistes, setPistes] = useState<Piste[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [titre, setTitre] = useState('')
  const [envoi, setEnvoi] = useState(false)
  // Pistes confiees au direct : la fermeture de cet ecran ne les coupe plus.
  const lance = useRef(false)

  useEffect(() => {
    let annule = false
    let obtenues: Piste[] = []
    preparerCamera('user')
      .then(p => { obtenues = p; if (annule) libererCamera(p); else setPistes(p) })
      .catch((e: Error) => {
        if (annule) return
        setErreur(e?.name === 'NotAllowedError'
          ? 'Autorise la caméra et le micro pour passer en LIVE (aA › Réglages du site web sur iPhone), puis recharge la page.'
          : e?.message || 'Caméra indisponible.')
      })
    return () => { annule = true; if (!lance.current) libererCamera(obtenues) }
  }, [])

  const apercu = useCallback((e: HTMLVideoElement | null) => {
    const v = pistes?.find(p => (p as { kind?: string }).kind === 'video') as { attach?: (el: HTMLVideoElement) => void } | undefined
    if (e && v?.attach) v.attach(e)
  }, [pistes])

  const lancer = () => {
    if (!pistes || envoi) return
    setEnvoi(true)
    apiLive.lancer(titre.trim())
      .then(acces => { lance.current = true; onLance(acces, pistes) })
      .catch((e: Error) => { setErreur(e.message); setEnvoi(false) })
  }

  return (
    <View style={s.pagePleine}>
      {pistes && <VideoLive refVideo={apercu} miroir />}
      <LinearGradient colors={['rgba(0,0,0,.5)', 'transparent']} style={s.voileHaut} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,.7)']} style={s.voileBas} pointerEvents="none" />
      <View style={s.rangeeHaute}>
        <View style={{ flex: 1 }} />
        <Pressable style={s.rond} hitSlop={6} onPress={onAnnuler} accessibilityLabel="Annuler">
          <Croix taille={17} couleur="#fff" />
        </Pressable>
      </View>
      {!pistes && !erreur && (
        <View style={s.centre}><ActivityIndicator color="#fff" /><Text style={s.centreTexte}>Ouverture de la caméra…</Text></View>
      )}
      <View style={s.preparation}>
        {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
        <TextInput style={s.titreLive} value={titre} onChangeText={setTitre} maxLength={80}
          placeholder="Titre du LIVE (facultatif)" placeholderTextColor="rgba(255,255,255,.6)" />
        <Pressable style={[s.principal, (!pistes || envoi) && { opacity: 0.5 }]} disabled={!pistes || envoi} onPress={lancer}>
          <Text style={s.principalTexte}>{envoi ? 'Lancement…' : 'Lancer le LIVE'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function DirectLive({ onFermer }: {
  // Croix de l'entete : le fil revient a la categorie precedente.
  onFermer: () => void
}) {
  const { profil } = useAuth()
  const exiger = useExigerCompte()
  const moi = profil?.pseudo ?? 'moi'

  const [lives, setLives] = useState<Live[] | null>(null)
  const [disponible, setDisponible] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  // Direct regarde, ou diffuse.
  const [regarde, setRegarde] = useState<AccesLive | null>(null)
  const [diffusion, setDiffusion] = useState<{ acces: AccesLive; pistes: Piste[] } | null>(null)
  const [preparation, setPreparation] = useState(false)
  const [ouverture, setOuverture] = useState<string | null>(null)

  // Liste des directs, rafraichie tant que la feuille est affichee.
  useEffect(() => {
    if (regarde || diffusion || preparation) return
    let valable = true
    const charger = () => apiLive.liste()
      .then(r => { if (valable) { setLives(r.lives); setDisponible(r.disponible) } })
      .catch(() => { if (valable) setLives(l => l ?? []) })
    charger()
    const t = setInterval(charger, CADENCE_LISTE)
    return () => { valable = false; clearInterval(t) }
  }, [regarde, diffusion, preparation])

  const regarder = (live: Live) => {
    if (ouverture) return
    setOuverture(live.id); setErreur(null)
    apiLive.rejoindre(live.id)
      .then(setRegarde)
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setOuverture(null))
  }

  const passerEnLive = () => {
    if (!exiger('passer en LIVE')) return
    if (Platform.OS !== 'web') { setErreur('Le LIVE est disponible sur le site tocktick-web.vercel.app'); return }
    if (!disponible) { setErreur('Le LIVE n’est pas encore disponible.'); return }
    setPreparation(true)
  }

  const terminer = () => {
    if (!diffusion) return
    apiLive.terminer(diffusion.acces.live.id).catch(() => { /* Expire seul en 60 s. */ })
    libererCamera(diffusion.pistes)
    setDiffusion(null)
  }

  if (diffusion) {
    return <Salle acces={diffusion.acces} diffuseur pistes={diffusion.pistes} onQuitter={terminer} />
  }
  if (preparation) {
    return <Preparation onAnnuler={() => setPreparation(false)}
      onLance={(acces, pistes) => { setPreparation(false); setDiffusion({ acces, pistes }) }} />
  }
  if (regarde) {
    return <Salle acces={regarde} diffuseur={false} onQuitter={() => setRegarde(null)} />
  }

  const premier = lives?.[0]

  return (
    <View style={s.pageSombre}>
      <View style={s.enteteDecouvrir}>
        <View style={{ width: 22 }} />
        <Text style={s.titreDecouvrir}>Découvrir</Text>
        <Pressable hitSlop={10} onPress={onFermer} accessibilityLabel="Fermer">
          <Croix taille={22} couleur="#fff" />
        </Pressable>
      </View>

      {/* Rangee des ronds : d'abord le compte connecte, qui lance sa
          propre diffusion, puis les comptes deja en direct. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.rangeeRonds} contentContainerStyle={s.rondsContenu}>
        <Pressable style={s.entree} onPress={passerEnLive}>
          <View style={s.entreeRond}>
            <Avatar pseudo={moi} taille={58} />
            <View style={s.badgeCamera}>
              <CameraLive taille={12} couleur="#fff" />
            </View>
          </View>
          <Text style={s.entreeLibelle} numberOfLines={1}>Passer en LIVE</Text>
        </Pressable>

        {(lives ?? []).map(l => (
          <Pressable key={l.id} style={s.entree} onPress={() => regarder(l)}>
            <View style={s.entreeRond}>
              <Avatar pseudo={l.pseudo} taille={58} bordure />
              <View style={s.badgeDirect}>
                <Text style={s.badgeDirectTexte}>LIVE</Text>
              </View>
            </View>
            <Text style={s.entreeLibelle} numberOfLines={1}>{l.pseudo}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {erreur ? <Text style={s.erreurListe}>{erreur}</Text> : null}

      {/* Panneau : le direct le plus recent, ou l'invitation a lancer le sien. */}
      <Pressable style={s.panneau} onPress={() => premier ? regarder(premier) : passerEnLive()}>
        <View style={s.poignee} />
        <View style={s.chevronPanneau}>
          <ChevronHaut taille={18} couleur="rgba(255,255,255,.9)" />
        </View>
        <View style={[s.apercu, s.apercuVide]}>
          {lives === null ? <ActivityIndicator color="#fff" /> : premier ? <>
            <Avatar pseudo={premier.pseudo} taille={84} bordure />
            <Text style={s.videTitre}>{premier.pseudo} est en LIVE</Text>
            {premier.titre ? <Text style={s.videTexte}>{premier.titre}</Text> : null}
            <View style={s.principal}><Text style={s.principalTexte}>
              {ouverture === premier.id ? 'Connexion…' : 'Regarder'}
            </Text></View>
          </> : <>
            <CameraLive taille={40} couleur="#fff" />
            <Text style={s.videTitre}>Personne n’est en LIVE pour le moment</Text>
            <Text style={s.videTexte}>Lance le premier : tes abonnés pourront te regarder et t’écrire en direct.</Text>
            <View style={s.principal}><Text style={s.principalTexte}>Passer en LIVE</Text></View>
          </>}
        </View>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  pageSombre: { flex: 1, backgroundColor: '#000' },
  pagePleine: { flex: 1, backgroundColor: '#000' },

  // --- Avatars ---
  avatar: {
    backgroundColor: '#6d6d75',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBordure: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,.85)' },
  avatarLettre: { color: '#fff', fontWeight: '700' },

  // --- Etat A : feuille « Découvrir » ---
  enteteDecouvrir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 58 - BARRE_ETAT_WEB, paddingBottom: 14,
  },
  titreDecouvrir: { color: '#fff', fontSize: 16.5, fontWeight: '700' },

  rangeeRonds: { flexGrow: 0 },
  rondsContenu: { paddingHorizontal: 12, gap: 14, paddingBottom: 16 },
  entree: { width: 64, alignItems: 'center', gap: 6 },
  entreeRond: { width: 58, height: 58 },
  // Pastille rose de la camera, au coin bas droit de son propre avatar.
  badgeCamera: {
    position: 'absolute', right: -2, bottom: -2,
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#ff2856',
    borderWidth: 2, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  // Etiquette « LIVE » sous l'avatar d'un compte en direct.
  badgeDirect: {
    position: 'absolute', bottom: -4, alignSelf: 'center', left: 0, right: 0,
    alignItems: 'center',
  },
  badgeDirectTexte: {
    color: '#fff', fontSize: 9, fontWeight: '800',
    backgroundColor: '#ff2856', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1.5, overflow: 'hidden',
  },
  entreeLibelle: { color: 'rgba(255,255,255,.82)', fontSize: 11.5 },

  // Panneau d'apercu : coins hauts arrondis, teinte claire en attendant
  // la video, et la poignee de depliement en son sommet.
  panneau: {
    flex: 1, backgroundColor: '#d8d2d4',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 8, overflow: 'hidden',
  },
  poignee: {
    alignSelf: 'center', width: 42, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,.28)',
  },
  chevronPanneau: { alignItems: 'center', paddingVertical: 2 },
  apercu: { flex: 1, backgroundColor: '#1b1b1d', overflow: 'hidden' },
  apercuPille: {
    position: 'absolute', left: 12, top: 12,
    backgroundColor: 'rgba(0,0,0,.45)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: '70%',
  },
  apercuPilleTexte: { color: '#fff', fontSize: 11.5, fontWeight: '600' },

  // --- Etat B : plein ecran ---
  voileHaut: { position: 'absolute', left: 0, right: 0, top: 0, height: 200 },
  voileBas: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },

  rangeeHaute: {
    position: 'absolute', left: 8, right: 8, top: 54 - BARRE_ETAT_WEB, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  pilleDiffuseur: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(0,0,0,.38)', borderRadius: 19,
    paddingLeft: 3, paddingRight: 4, paddingVertical: 3, maxWidth: 196,
  },
  diffuseurTextes: { maxWidth: 82 },
  diffuseurPseudo: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  diffuseurAbonnes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  diffuseurCompte: { color: 'rgba(255,255,255,.85)', fontSize: 11 },
  suivre: {
    backgroundColor: '#ff2856', borderRadius: 13,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  suivreFait: { backgroundColor: 'rgba(255,255,255,.22)' },
  suivreTexte: { color: '#fff', fontSize: 11.5, fontWeight: '700' },

  pilleSpectateurs: {
    backgroundColor: 'rgba(0,0,0,.38)', borderRadius: 14,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  spectateursTexte: { color: '#fff', fontSize: 11.5, fontWeight: '600' },

  rond: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,.38)',
    alignItems: 'center', justifyContent: 'center',
  },

  rangeeRang: {
    position: 'absolute', left: 8, right: 8, top: 96, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pilleLigue: {
    backgroundColor: 'rgba(0,0,0,.38)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  ligueTexte: { color: 'rgba(255,255,255,.9)', fontSize: 11 },
  pillePlaces: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,.38)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  placesTexte: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Tchat : ancre en bas a gauche, au-dessus de la barre d'actions.
  tchat: {
    position: 'absolute', left: 10, right: 92, bottom: 70, zIndex: 2, gap: 7,
  },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  messageTexte: {
    flex: 1, color: '#fff', fontSize: 12.5, fontWeight: '700', lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 3,
  },
  messageNom: { color: 'rgba(255,255,255,.62)', fontWeight: '400' },
  messageSysteme: {
    flex: 1, color: 'rgba(255,255,255,.72)', fontSize: 12, lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 3,
  },

  coeurVolant: { position: 'absolute', bottom: 80, zIndex: 2 },

  barreBasse: {
    position: 'absolute', left: 8, right: 8, bottom: 14, zIndex: 4,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  boutonCouleur: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#ff2856',
    alignItems: 'center', justifyContent: 'center',
  },
  boutonCouleurTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  champ: {
    flex: 1, height: 32, borderRadius: 16, justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.16)', paddingHorizontal: 12,
  },
  champSaisie: { color: '#fff', fontSize: 12.5, padding: 0 },
  action: { alignItems: 'center', justifyContent: 'center', minWidth: 26 },
  actionCompte: { color: '#fff', fontSize: 10.5, marginTop: -2 },

  // --- Etats du direct ---
  badgeEnDirect: { marginRight: 4 },
  rondTerminer: { width: undefined, paddingHorizontal: 12, backgroundColor: '#ff2856' },
  terminerTexte: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  centre: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centreTexte: { color: 'rgba(255,255,255,.85)', fontSize: 13.5, textAlign: 'center', paddingHorizontal: 24 },
  fin: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6, backgroundColor: 'rgba(0,0,0,.82)',
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
  },
  finTitre: { color: '#fff', fontSize: 19, fontWeight: '700', textAlign: 'center' },
  principal: {
    backgroundColor: '#ff2856', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 26,
    alignItems: 'center', alignSelf: 'center',
  },
  principalTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
  activerSon: {
    position: 'absolute', top: '45%', alignSelf: 'center', zIndex: 5,
    backgroundColor: 'rgba(0,0,0,.7)', borderRadius: 22, paddingVertical: 11, paddingHorizontal: 18,
  },
  activerSonTexte: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  preparation: { position: 'absolute', left: 16, right: 16, bottom: 30, zIndex: 4, gap: 14 },
  titreLive: {
    color: '#fff', fontSize: 15, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,.16)',
  },
  erreur: { color: '#ffd166', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  erreurListe: { color: '#ffd166', fontSize: 13, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  apercuVide: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  videTitre: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  videTexte: { color: 'rgba(255,255,255,.75)', fontSize: 13.5, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
})
