// ============================================================
// Feuille « Envoyer à » : destinataires, applications de partage,
// puis les actions sur sa propre publication.
// ============================================================

import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, Modal, Share,
  useWindowDimensions,
} from 'react-native'
import { Text } from '../composants/Texte'
import {
  Loupe, FeuilleCroix, Maillon, Telecharger, Statistiques, Flamme,
  Diffuser, Epingle, Groupe, Duo, Collage, StickerPlus, Vitesse,
  SousTitres, Crayon2, CadenasPlein, PhotoAnimee, EtiquetteGif,
  Portefeuille, MotsCles, AjoutStory, Corbeille,
  LogoWhatsApp, LogoSMS, LogoTelegram,
  Republier, Drapeau, AppliEphemere, Megaphone,
} from './Icones'
import { comptesDemo } from '../lib/demo'

type Action = {
  cle: string
  nom: string
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
}

// Deuxieme rangee : le lien et les applications externes. Chacune
// porte sa couleur de marque, sur une pastille pleine.
const APPLICATIONS = [
  { cle: 'lien', nom: 'Copier le lien', fond: '#3b7df6', Icone: Maillon },
  { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp },
  { cle: 'status', nom: 'Status', Logo: LogoSMS },
  { cle: 'telegram', nom: 'Telegram', Logo: LogoTelegram },
] as const

// Memes applications, precedees de « Republier » sur la publication
// d'autrui : on relaie le contenu plutot que de le gerer.
const APPLICATIONS_AUTRUI = [
  { cle: 'republier', nom: 'Republier', fond: '#efc02c', Icone: Republier },
  { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp },
  { cle: 'lien', nom: 'Copier le lien', fond: '#3b7df6', Icone: Maillon },
  { cle: 'status', nom: 'Status', Logo: LogoSMS },
  { cle: 'ephemere', nom: 'Messages éphémères', Logo: AppliEphemere },
  { cle: 'telegram', nom: 'Telegram', Logo: LogoTelegram },
] as const

// Actions offertes sur la publication de quelqu'un d'autre : ni
// statistiques ni suppression, mais le signalement et la reprise.
const ACTIONS_AUTRUI: Action[] = [
  { cle: 'signaler', nom: 'Signaler', Icone: Drapeau },
  { cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger },
  { cle: 'story', nom: 'Ajouter à la Story', Icone: AjoutStory },
  { cle: 'promouvoir', nom: 'Promouvoir', Icone: Megaphone },
  { cle: 'duo', nom: 'Duo', Icone: Duo },
  { cle: 'collage', nom: 'Collage', Icone: Collage },
  { cle: 'groupe', nom: 'Créer un groupe', Icone: Groupe },
  { cle: 'animee', nom: 'Photo animée', Icone: PhotoAnimee },
  { cle: 'sticker', nom: 'Créer un sticker', Icone: StickerPlus },
  { cle: 'gif', nom: 'Partager en tant que GIF', Icone: EtiquetteGif },
]

// Troisieme rangee : les actions sur sa propre publication. Elles
// defilent horizontalement, sur trois pages comme la reference.
const ACTIONS: Action[] = [
  { cle: 'stats', nom: 'Données analytiques', Icone: Statistiques },
  { cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger },
  { cle: 'booster', nom: 'Augmenter le nombre de…', Icone: Flamme },
  { cle: 'diffuser', nom: 'Diffuser', Icone: Diffuser },
  { cle: 'epingler', nom: 'Épingler', Icone: Epingle },
  { cle: 'groupe', nom: 'Créer un groupe', Icone: Groupe },
  { cle: 'duo', nom: 'Duo', Icone: Duo },
  { cle: 'collage', nom: 'Collage', Icone: Collage },
  { cle: 'sticker', nom: 'Créer un sticker', Icone: StickerPlus },
  { cle: 'vitesse', nom: 'Vitesse de lecture', Icone: Vitesse },
  { cle: 'legendes', nom: 'Modifier les légendes', Icone: SousTitres },
  { cle: 'modifier', nom: 'Modifier la publication', Icone: Crayon2 },
  { cle: 'confidentialite', nom: 'Paramètres de confiden…', Icone: CadenasPlein },
  { cle: 'animee', nom: 'Photo animée', Icone: PhotoAnimee },
  { cle: 'gif', nom: 'Partager en tant que GIF', Icone: EtiquetteGif },
  { cle: 'pub', nom: 'Paramètres publicitaires', Icone: Portefeuille },
  { cle: 'supprimer', nom: 'Supprimer', Icone: Corbeille },
  { cle: 'motscles', nom: 'Gérer les mots-clés', Icone: MotsCles },
  { cle: 'story', nom: 'Ajouter à la Story', Icone: AjoutStory },
]

// Pourquoi chaque action reste muette. Tok 229 n'expose ni montage, ni
// publicite, ni moderation : plutot qu'une promesse vague, chaque bouton
// dit ce qui lui manque. Ce que l'API sait faire est branche dans `agir`.
const SANS_ROUTE = 'cette action n’existe pas encore dans Tok 229.'
const SANS_MONTAGE = 'Tok 229 ne fait pas encore de montage vidéo.'
const SANS_PUB = 'Tok 229 ne vend pas de publicité.'
const SANS_STORY = 'Tok 229 n’a pas encore de Stories.'

const RAISONS: Record<string, string> = {
  telecharger: 'l’enregistrement dans la pellicule n’est pas encore en place.',
  story: SANS_STORY,
  promouvoir: SANS_PUB,
  pub: SANS_PUB,
  booster: SANS_PUB,
  signaler: 'la modération n’est pas encore en place.',
  duo: SANS_MONTAGE,
  collage: SANS_MONTAGE,
  animee: SANS_MONTAGE,
  sticker: SANS_MONTAGE,
  gif: SANS_MONTAGE,
  legendes: 'Tok 229 ne génère pas encore de sous-titres.',
  vitesse: 'la vitesse de lecture n’est pas réglable ici.',
  groupe: 'les conversations de groupe n’existent pas encore.',
  diffuser: 'Tok 229 n’a pas encore de diffusion en direct.',
  epingler: 'épingler une publication n’est pas encore possible.',
  motscles: 'les mots-clés ne sont pas encore gérés.',
  // Le serveur sait modifier une publication, mais aucun ecran ne porte
  // encore le formulaire : la feuille ne peut donc rien proposer ici.
  modifier: 'l’écran de modification n’est pas encore en place.',
  confidentialite: 'l’écran de modification n’est pas encore en place.',
}

export default function EnvoyerA({
  visible, legende, onFermer, onSupprimer, onAnalytiques,
  sienne = true, auteur,
}: {
  visible: boolean
  // Legende relayee au partage systeme.
  legende: string
  onFermer: () => void
  onSupprimer?: () => void
  // « Données analytiques » : ouvre l'ecran « Analyse vidéo ».
  onAnalytiques?: () => void
  // Faux sur la publication de quelqu'un d'autre : la feuille
  // propose alors de relayer et de signaler plutot que de gerer.
  sienne?: boolean
  // Pseudo de l'auteur, pour la premiere vignette « Répondre à ».
  auteur?: string
}) {
  const { height } = useWindowDimensions()
  const [message, setMessage] = useState('')

  const partager = async () => {
    try {
      await Share.share({ message: `${legende}\n\nRegarde cette vidéo sur Tok 229` })
    } catch { /* Partage annule. */ }
  }

  const agir = (cle: string, nom: string) => {
    if (['lien', 'whatsapp', 'status', 'telegram', 'ephemere', 'republier']
      .includes(cle)) { partager(); return }
    if (cle === 'supprimer') {
      if (onSupprimer) { onFermer(); onSupprimer(); return }
      // La feuille ouverte depuis le fil n'a pas recu de quoi supprimer :
      // la publication ne se retire que depuis sa grille de profil.
      setMessage('Supprimer : va sur ton profil, puis appuie longuement sur la vidéo.')
      setTimeout(() => setMessage(''), 3200)
      return
    }
    if (cle === 'stats') {
      if (onAnalytiques) { onFermer(); onAnalytiques(); return }
      setMessage('Données analytiques : disponibles depuis ta propre publication.')
      setTimeout(() => setMessage(''), 3200)
      return
    }
    setMessage(`${nom} : ${RAISONS[cle] ?? SANS_ROUTE}`)
    setTimeout(() => setMessage(''), 3200)
  }

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />

        <View style={[s.feuille, { maxHeight: height * .56 }]}>
          <View style={s.entete}>
            <Pressable hitSlop={10}><Loupe taille={24} couleur="#111" /></Pressable>
            <Text style={s.titre}>Envoyer à</Text>
            <Pressable hitSlop={10} onPress={onFermer} style={s.croix}>
              <FeuilleCroix taille={18} couleur="#111" />
            </Pressable>
          </View>

          {/* Destinataires */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={s.bande} contentContainerStyle={s.bandeContenu}>
            {!sienne && !!auteur && (
              <Pressable style={s.contact} onPress={partager}>
                <View style={[s.avatar, s.avatarReponse]}>
                  <Text style={s.avatarLettre}>
                    {auteur.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={s.actionNom} numberOfLines={2}>
                  Répondre à {auteur}
                </Text>
              </Pressable>
            )}

            {comptesDemo.map(c => (
              <Pressable key={c.id} style={s.contact} onPress={partager}>
                <View style={s.avatar}>
                  <Text style={s.avatarLettre}>
                    {c.pseudo.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={s.contactNom} numberOfLines={1}>{c.pseudo}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={s.trait} />

          {/* Applications de partage */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={s.bande} contentContainerStyle={s.bandeContenu}>
            {(sienne ? APPLICATIONS : APPLICATIONS_AUTRUI).map(a => (
              <Pressable key={a.cle} style={s.action}
                onPress={() => agir(a.cle, a.nom)}>
                {'Logo' in a
                  ? <a.Logo taille={52} />
                  : <View style={[s.pastille, { backgroundColor: a.fond }]}>
                      <a.Icone taille={24} couleur="#fff" />
                    </View>}
                <Text style={s.actionNom} numberOfLines={2}>{a.nom}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Actions sur sa publication */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={s.bande} contentContainerStyle={s.bandeContenu}>
            {(sienne ? ACTIONS : ACTIONS_AUTRUI).map(a => (
              <Pressable key={a.cle} style={s.action}
                onPress={() => agir(a.cle, a.nom)}>
                <View style={s.pastilleGrise}>
                  <a.Icone taille={23} couleur="#111" />
                </View>
                <Text style={s.actionNom} numberOfLines={2}>{a.nom}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {!!message && <Text style={s.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.35)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 16,
    borderTopRightRadius: 16, paddingBottom: 18 },

  entete: { flexDirection: 'row', alignItems: 'center', minHeight: 54,
    paddingHorizontal: 18 },
  titre: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111',
    textAlign: 'center' },
  croix: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f1f2',
    alignItems: 'center', justifyContent: 'center' },

  bande: { flexGrow: 0 },
  bandeContenu: { gap: 14, paddingHorizontal: 16, paddingVertical: 12 },

  contact: { width: 62, alignItems: 'center', gap: 7 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#6f5bd4',
    alignItems: 'center', justifyContent: 'center' },
  avatarReponse: { backgroundColor: '#8e8e93' },
  avatarLettre: { color: '#fff', fontSize: 22, fontWeight: '700' },
  contactNom: { fontSize: 11.5, color: '#111', textAlign: 'center' },

  trait: { height: 1, backgroundColor: '#f0f0f1', marginHorizontal: 0 },

  action: { width: 62, alignItems: 'center', gap: 7 },
  pastille: { width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center' },
  pastilleGrise: { width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#f1f1f2', alignItems: 'center', justifyContent: 'center' },
  actionNom: { fontSize: 11.5, color: '#111', textAlign: 'center',
    lineHeight: 15 },

  message: { fontSize: 12.5, color: '#8e8e93', textAlign: 'center',
    paddingHorizontal: 20, paddingTop: 6 },
})
