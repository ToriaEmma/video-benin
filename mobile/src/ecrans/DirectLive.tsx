// ============================================================
// Pseudo-categorie « LIVE » du fil, atteinte par le clap en haut a
// gauche. Elle se tient en deux etats :
//
//  - « Découvrir » : la feuille sombre qui liste les comptes en direct
//    et montre un apercu du direct en cours dans un panneau arrondi ;
//  - le direct en plein ecran, obtenu en depliant ce panneau par sa
//    poignee ou par un balayage vers le haut.
//
// Les deux etats partagent le meme lecteur : deplier le panneau ne
// relance donc pas la video depuis le debut.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, Animated, Easing,
} from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, TextInput } from '../composants/Texte'
import {
  etat, abreger, livesDemo, messagesLiveDemo, messagesLiveSuite,
  type MessageLive,
} from '../lib/demo'
import { useAuth } from '../lib/auth'
import {
  CalendrierEtoile, CameraLive, Croix, ChevronBas, ChevronHaut,
  Couronne, CoeurPlein, InvitesLive, CadeauLive, Emoji, PartageFil,
} from '../composants/Icones'

// Nombre de messages gardes a l'ecran : au-dela, les plus anciens
// sortent par le haut, comme dans un tchat de direct.
const MESSAGES_VISIBLES = 6
// Cadence d'arrivee des nouveaux messages.
const CADENCE = 3200

// Diffusion regardee : le premier compte en direct de la liste.
const DIFFUSION = livesDemo[0]

// ------------------------------------------------------------
// Avatar : une initiale dans un rond gris, faute de portrait.
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
  // Valeur stable sur la duree de vie du coeur : `useState` avec une
  // fonction d'initialisation la cree une seule fois, la ou un `useRef`
  // ferait lire `.current` pendant le rendu.
  const [montee] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(montee, {
      toValue: 1, duration: 2600, easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onFini() })
  }, [montee, onFini])

  return (
    <Animated.View style={[s.coeurVolant, {
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

// ------------------------------------------------------------
// Tchat du direct, en bas a gauche.
// ------------------------------------------------------------
function Tchat({ messages }: { messages: MessageLive[] }) {
  return (
    <View style={s.tchat} pointerEvents="none">
      {messages.map(m => (
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

export default function DirectLive({ onFermer }: {
  // Croix de l'entete : le fil revient a la categorie precedente.
  onFermer: () => void
}) {
  const { profil } = useAuth()
  const moi = profil?.pseudo ?? 'moi'

  // Plein ecran ou feuille « Découvrir ».
  const [plein, setPlein] = useState(false)
  const [suivi, setSuivi] = useState(false)
  const [messages, setMessages] = useState<MessageLive[]>(
    () => messagesLiveDemo.slice(-MESSAGES_VISIBLES),
  )
  // Coeurs en vol : chaque entree porte son identifiant et son ecart au
  // bord, pour que deux coeurs ne se superposent pas exactement.
  const [coeurs, setCoeurs] = useState<{ id: number; decalage: number }[]>([])
  const [saisie, setSaisie] = useState('')

  // Video du direct : la premiere du fil, faute de vraie diffusion.
  const url = useMemo(
    () => etat.videos[0]?.url ?? '', [],
  )
  const lecteur = useVideoPlayer(url, p => { p.loop = true; p.play() })

  // Arrivee des messages et des coeurs : la mise a jour se fait dans la
  // fonction du minuteur, jamais dans le corps de l'effet.
  //
  // Les coeurs ne sont semes qu'en plein ecran : ailleurs, rien ne les
  // affiche, donc rien ne signalerait la fin de leur animation et la
  // liste n'arreterait pas de grandir.
  useEffect(() => {
    let rang = 0
    const minuteur = setInterval(() => {
      const modele = messagesLiveSuite[rang % messagesLiveSuite.length]
      rang += 1
      const suite = rang
      setMessages(liste => [
        ...liste, { ...modele, id: `${modele.id}-${suite}` },
      ].slice(-MESSAGES_VISIBLES))
      if (plein) {
        setCoeurs(liste => [
          ...liste, { id: Date.now() + suite, decalage: 10 + (suite % 3) * 16 },
        ])
      }
    }, CADENCE)
    return () => clearInterval(minuteur)
  }, [plein])

  const retirerCoeur = (id: number) =>
    setCoeurs(liste => liste.filter(c => c.id !== id))

  // ----------------------------------------------------------
  // Etat B : le direct en plein ecran.
  // ----------------------------------------------------------
  if (plein) {
    return (
      <View style={s.pagePleine}>
        {/* Plein ecran : « contain », pour qu'un direct filme en paysage
            ne perde pas ses bords. L'apercu reduit du bas garde « cover »,
            son cadre etant une vignette. */}
        <VideoView player={lecteur} style={StyleSheet.absoluteFill}
          contentFit="contain" nativeControls={false} />

        <LinearGradient colors={['rgba(0,0,0,.45)', 'transparent']}
          style={s.voileHaut} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,.55)']}
          style={s.voileBas} pointerEvents="none" />

        {/* Premiere rangee : le diffuseur, le nombre de spectateurs et
            les deux boutons de sortie. */}
        <View style={s.rangeeHaute}>
          <View style={s.pilleDiffuseur}>
            <Avatar pseudo={DIFFUSION.pseudo} taille={30} bordure />
            <View style={s.diffuseurTextes}>
              <Text style={s.diffuseurPseudo} numberOfLines={1}>
                {DIFFUSION.pseudo}
              </Text>
              <View style={s.diffuseurAbonnes}>
                <CoeurPlein taille={10} couleur="#ff6b86" />
                <Text style={s.diffuseurCompte}>
                  {abreger(DIFFUSION.abonnes)}
                </Text>
              </View>
            </View>
            <Pressable style={[s.suivre, suivi && s.suivreFait]} hitSlop={6}
              onPress={() => setSuivi(!suivi)}>
              <Text style={s.suivreTexte}>
                {suivi ? 'Suivi' : '+ Suivre'}
              </Text>
            </Pressable>
          </View>

          <View style={s.pilleSpectateurs}>
            <Text style={s.spectateursTexte}>
              20+ · {abreger(DIFFUSION.spectateurs)}
            </Text>
          </View>

          <Pressable style={s.rond} hitSlop={6}
            onPress={() => { setPlein(false); setCoeurs([]) }}>
            <ChevronBas taille={17} couleur="#fff" />
          </Pressable>
          <Pressable style={s.rond} hitSlop={6} onPress={onFermer}>
            <Croix taille={17} couleur="#fff" />
          </Pressable>
        </View>

        {/* Seconde rangee : le rang de la ligue et le compte de places. */}
        <View style={s.rangeeRang}>
          <View style={s.pilleLigue}>
            <Text style={s.ligueTexte}>Top 80 % de la Ligue C5</Text>
          </View>
          <View style={s.pillePlaces}>
            <Couronne taille={13} couleur="#fcd116" />
            <Text style={s.placesTexte}>0/4</Text>
          </View>
        </View>

        <Tchat messages={messages} />

        {coeurs.map(c => (
          <CoeurVolant key={c.id} decalage={c.decalage}
            onFini={() => retirerCoeur(c.id)} />
        ))}

        {/* Barre du bas : le bouton coloré, la saisie, puis les actions. */}
        <View style={s.barreBasse}>
          <Pressable style={s.boutonCouleur} hitSlop={4}>
            <Text style={s.boutonCouleurTexte}>229</Text>
          </Pressable>

          <View style={s.champ}>
            <TextInput style={s.champSaisie} value={saisie}
              onChangeText={setSaisie}
              placeholder="Saisis ton message…"
              placeholderTextColor="rgba(255,255,255,.65)" />
          </View>

          <Pressable style={s.action} hitSlop={6}>
            <Emoji taille={23} couleur="#fff" />
          </Pressable>
          <Pressable style={s.action} hitSlop={6}>
            <InvitesLive taille={23} couleur="#fff" />
          </Pressable>
          <Pressable style={s.action} hitSlop={6}>
            <CadeauLive taille={23} couleur="#fff" />
          </Pressable>
          <Pressable style={s.action} hitSlop={6}>
            <PartageFil taille={23} couleur="#fff" />
            <Text style={s.actionCompte}>12</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ----------------------------------------------------------
  // Etat A : la feuille « Découvrir ».
  // ----------------------------------------------------------
  return (
    <View style={s.pageSombre}>
      <View style={s.enteteDecouvrir}>
        <Pressable hitSlop={10}>
          <CalendrierEtoile taille={22} couleur="#fff" />
        </Pressable>
        <Text style={s.titreDecouvrir}>Découvrir</Text>
        <Pressable hitSlop={10} onPress={onFermer}>
          <Croix taille={22} couleur="#fff" />
        </Pressable>
      </View>

      {/* Rangee des ronds : d'abord le compte connecte, qui lance sa
          propre diffusion, puis les comptes deja en direct. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.rangeeRonds} contentContainerStyle={s.rondsContenu}>
        <Pressable style={s.entree}>
          <View style={s.entreeRond}>
            <Avatar pseudo={moi} taille={58} />
            <View style={s.badgeCamera}>
              <CameraLive taille={12} couleur="#fff" />
            </View>
          </View>
          <Text style={s.entreeLibelle} numberOfLines={1}>Passer en LIVE</Text>
        </Pressable>

        {livesDemo.map(l => (
          <Pressable key={l.id} style={s.entree} onPress={() => setPlein(true)}>
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

      {/* Panneau d'apercu : sa poignee et son chevron deplient le direct
          en plein ecran. */}
      <Pressable style={s.panneau} onPress={() => setPlein(true)}>
        <View style={s.poignee} />
        <View style={s.chevronPanneau}>
          <ChevronHaut taille={18} couleur="rgba(255,255,255,.9)" />
        </View>
        <View style={s.apercu}>
          <VideoView player={lecteur} style={StyleSheet.absoluteFill}
            contentFit="cover" nativeControls={false} />
          <View style={s.apercuPille}>
            <Text style={s.apercuPilleTexte} numberOfLines={1}>
              {DIFFUSION.pseudo} · {abreger(DIFFUSION.spectateurs)}
            </Text>
          </View>
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
    paddingHorizontal: 14, paddingTop: 58, paddingBottom: 14,
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
    position: 'absolute', left: 8, right: 8, top: 54, zIndex: 3,
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
})
