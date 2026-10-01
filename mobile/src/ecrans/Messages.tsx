// ============================================================
// Boite de reception : la liste des conversations, puis le fil
// d'une conversation ouverte par-dessus.
// ============================================================

import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TextInput } from '../composants/Texte'
import {
  Loupe, Chevron, EnvoiMessage, Messages as IconeMessages,
  NouveauGroupe, Eclair, BulleDemande,
} from '../composants/Icones'
import {
  etat, dateRelative, dernierMessage, conversationsTriees,
  type Conversation, type Message,
} from '../lib/demo'
import BandeStories from '../composants/BandeStories'
import { useAuth } from '../lib/auth'
import Notifications from './Notifications'

// Teintes des avatars, piochees d'apres le pseudo : deux comptes differents
// gardent ainsi la meme couleur d'un ecran a l'autre.
const TEINTES = ['#6f5bd4', '#ff2856', '#16cce0', '#e8820c', '#1aa260', '#c43cc0']

const teinteAvatar = (pseudo: string) => {
  let somme = 0
  for (let i = 0; i < pseudo.length; i++) somme += pseudo.charCodeAt(i)
  return TEINTES[somme % TEINTES.length]
}

// Rond colore portant l'initiale du pseudo, comme ailleurs dans
// l'application (profil, « Envoyer à », commentaires).
function Avatar({ pseudo, taille }: { pseudo: string; taille: number }) {
  return (
    <View style={[s.avatar, {
      width: taille, height: taille, borderRadius: taille / 2,
      backgroundColor: teinteAvatar(pseudo),
    }]}>
      <Text style={[s.avatarLettre, { fontSize: taille * .4 }]}>
        {pseudo.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}

// ------------------------------------------------------------
// Fil d'une conversation
// ------------------------------------------------------------

function Fil({ conversation, onRetour }: {
  conversation: Conversation
  onRetour: () => void
}) {
  const [texte, setTexte] = useState('')
  // Copie locale, du plus recent au plus ancien : c'est l'ordre attendu par
  // la liste renversee. L'etat partage reste la source, cette copie ne sert
  // qu'a redessiner le fil apres un envoi.
  const [messages, setMessages] = useState<Message[]>(
    () => [...conversation.messages].reverse())

  const envoyer = () => {
    const contenu = texte.trim()
    if (!contenu) return
    const message: Message = {
      id: `m${Date.now()}`, texte: contenu, moi: true, date: Date.now(),
    }
    conversation.messages.push(message)
    setMessages(l => [message, ...l])
    setTexte('')
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barreFil}>
        <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Avatar pseudo={conversation.pseudo} taille={34} />
        <Text style={s.filPseudo} numberOfLines={1}>{conversation.pseudo}</Text>
      </View>

      <KeyboardAvoidingView style={s.filCorps}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Le fil est renverse : la liste part du bas, les nouveaux
            messages apparaissent donc sous les precedents sans qu'on ait
            a la faire defiler nous-memes. */}
        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          inverted
          style={s.filListe}
          contentContainerStyle={s.filContenu}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={[s.ligneBulle, item.moi && s.ligneBulleMoi]}>
              <View style={[s.bulle, item.moi ? s.bulleMoi : s.bulleAutre]}>
                <Text style={[s.bulleTexte, item.moi && s.bulleTexteMoi]}>
                  {item.texte}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={s.redaction}>
          <TextInput
            style={s.champ}
            placeholder="Envoyer un message…"
            placeholderTextColor="#8e8e93"
            value={texte}
            onChangeText={setTexte}
            multiline
            maxLength={1000}
          />
          <Pressable hitSlop={8} onPress={envoyer}
            style={[s.boutonEnvoi, !texte.trim() && s.boutonEnvoiInactif]}>
            <EnvoiMessage taille={20} couleur="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// Liste des conversations
// ------------------------------------------------------------

export default function Messages() {
  const { profil } = useAuth()
  // Conversation ouverte. Null = on est sur la boite de reception.
  const [ouverte, setOuverte] = useState<Conversation | null>(null)
  // Vrai quand un compte de service est ouvert : l'ecran
  // « Notifications système » remplace alors le fil de discussion.
  const [notifications, setNotifications] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [chercher, setChercher] = useState(false)
  // Incremente au retour d'un fil : la liste reprend alors le dernier
  // message et la pastille de non-lus a jour.
  const [, setRevision] = useState(0)

  const terme = recherche.trim().toLowerCase()
  const conversations = conversationsTriees().filter(c => !terme
    || c.pseudo.toLowerCase().includes(terme)
    || (dernierMessage(c)?.texte.toLowerCase().includes(terme) ?? false))

  const ouvrir = (c: Conversation) => {
    // Ouvrir la conversation vaut lecture : la pastille disparait.
    c.nonLus = 0
    // Les comptes de service n'ont pas de fil : ils menent aux
    // notifications systeme.
    if (c.systeme) { setNotifications(true); setRevision(n => n + 1); return }
    setOuverte(c)
  }

  if (notifications) return (
    <Notifications onRetour={() => setNotifications(false)} />
  )

  if (ouverte) return (
    <Fil conversation={ouverte}
      onRetour={() => { setOuverte(null); setRevision(n => n + 1) }} />
  )

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Pressable hitSlop={10}>
          <NouveauGroupe taille={26} couleur="#111" />
        </Pressable>
        <Text style={s.titre}>Messages</Text>
        <Pressable hitSlop={10} onPress={() => {
          setChercher(v => !v)
          if (chercher) setRecherche('')
        }}>
          <Loupe taille={25} couleur="#111" />
        </Pressable>
      </View>

      {chercher && (
        <View style={s.zoneRecherche}>
          <Loupe taille={17} couleur="#8e8e93" />
          <TextInput
            style={s.champRecherche}
            placeholder="Rechercher"
            placeholderTextColor="#8e8e93"
            value={recherche}
            onChangeText={setRecherche}
            autoFocus
          />
        </View>
      )}

      <BandeStories pseudo={profil?.pseudo ?? 'moi'} stories={etat.stories}
        clair />

      <FlatList
        data={conversations}
        keyExtractor={c => c.id}
        contentContainerStyle={s.liste}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.vide}>
            <IconeMessages taille={46} couleur="#c7c7cc" />
            <Text style={s.videTitre}>
              {recherche.trim() ? 'Aucun résultat' : 'Aucun message'}
            </Text>
            <Text style={s.videTexte}>
              {recherche.trim()
                ? 'Essayez un autre pseudo ou un autre mot.'
                : 'Vos conversations apparaîtront ici.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const dernier = dernierMessage(item)
          return (
            <Pressable style={s.ligne} onPress={() => ouvrir(item)}>
              <Avatar pseudo={item.pseudo} taille={52} />
              <View style={s.ligneCorps}>
                <Text style={s.lignePseudo} numberOfLines={1}>{item.pseudo}</Text>
                <Text style={[s.apercu, item.nonLus > 0 && s.apercuNonLu]}
                  numberOfLines={1}>
                  {dernier
                    ? `${dernier.moi ? 'Vous : ' : ''}${dernier.texte}`
                    : 'Nouvelle conversation'}
                </Text>
              </View>
              <View style={s.ligneFin}>
                {!!dernier && (
                  <Text style={s.heure}>{dateRelative(dernier.date)}</Text>
                )}
                {item.nonLus > 0 && <View style={s.pastilleNonLu} />}
              </View>
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },

  // Barre du haut de la boite de reception.
  barre: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 16 },
  titre: { color: '#111', fontSize: 17, fontWeight: '700' },

  zoneRecherche: { flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 6, backgroundColor: '#f1f1f2',
    borderRadius: 10, paddingHorizontal: 11, minHeight: 38 },
  champRecherche: { flex: 1, color: '#111', fontSize: 15, paddingVertical: 8 },

  liste: { paddingVertical: 4, flexGrow: 1 },

  // Une conversation de la liste.
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 9 },
  ligneCorps: { flex: 1, gap: 3 },
  lignePseudo: { color: '#111', fontSize: 15, fontWeight: '600' },
  apercu: { color: '#8e8e93', fontSize: 13.5 },
  apercuNonLu: { color: '#111', fontWeight: '600' },
  ligneFin: { alignItems: 'flex-end', gap: 7 },
  heure: { color: '#8e8e93', fontSize: 12 },
  pastilleNonLu: { width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#ff2856' },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontWeight: '700' },

  vide: { alignItems: 'center', gap: 9, paddingTop: '28%',
    paddingHorizontal: 40 },
  videTitre: { color: '#111', fontSize: 16, fontWeight: '700' },
  videTexte: { color: '#8e8e93', fontSize: 13.5, textAlign: 'center',
    lineHeight: 19 },

  // Barre du haut d'une conversation.
  barreFil: { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingRight: 16, paddingLeft: 8, minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f1' },
  retour: { width: 34, height: 44, justifyContent: 'center' },
  filPseudo: { flex: 1, color: '#111', fontSize: 16, fontWeight: '600' },

  filCorps: { flex: 1 },
  filListe: { flex: 1 },
  filContenu: { paddingHorizontal: 12, paddingVertical: 12, gap: 7 },

  ligneBulle: { flexDirection: 'row', justifyContent: 'flex-start' },
  ligneBulleMoi: { justifyContent: 'flex-end' },
  bulle: { maxWidth: '76%', borderRadius: 18, paddingHorizontal: 13,
    paddingVertical: 9 },
  bulleAutre: { backgroundColor: '#f1f1f2' },
  bulleMoi: { backgroundColor: '#ff2856' },
  bulleTexte: { color: '#111', fontSize: 15, lineHeight: 20 },
  bulleTexteMoi: { color: '#fff' },

  // Champ de saisie, en pied du fil.
  redaction: { flexDirection: 'row', alignItems: 'flex-end', gap: 9,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10,
    borderTopWidth: 1, borderTopColor: '#f0f0f1' },
  champ: { flex: 1, backgroundColor: '#f1f1f2', borderRadius: 20,
    paddingHorizontal: 14, paddingTop: 9, paddingBottom: 9,
    color: '#111', fontSize: 15, maxHeight: 110 },
  boutonEnvoi: { width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  boutonEnvoiInactif: { backgroundColor: '#f7adbf' },
})
