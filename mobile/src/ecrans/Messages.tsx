// ============================================================
// Boite de reception : la liste des conversations, puis le fil
// d'une conversation ouverte par-dessus.
//
// Deux sources cohabitent ici, et il ne faut pas les confondre :
//
//   - REEL : les conversations entre comptes viennent de l'API
//     (GET /conversations, /conversations/:id/messages). Ce sont les
//     seules dont les messages partent vraiment sur le serveur.
//
//   - DECOR LOCAL (src/lib/demo.ts) : les comptes de service
//     (« Activité et nouveaux abonnés », « Notifications système »),
//     la section « Demandes de messages », la flamme et la ligne
//     d'invitation. L'API n'a aucune notion de tout cela : ces lignes
//     restent du decor tant que le serveur ne les expose pas.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TextInput } from '../composants/Texte'
import {
  Loupe, Chevron, EnvoiMessage, Messages as IconeMessages,
  NouveauGroupe, Eclair, BulleDemande,
} from '../composants/Icones'
import {
  etat, dateRelative, dernierMessage, demandesMessages,
  type Conversation, type Message,
} from '../lib/demo'
import { apiMessagerie, type ApercuConversation } from '../lib/api'
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

// Ligne de la boite de reception. `source` dit d'ou elle vient : seules
// les lignes « api » ouvrent un fil qui parle au serveur.
type Ligne = {
  id: string
  pseudo: string
  apercu: string
  date: number | null
  nonLus: number
  source: 'api' | 'service' | 'demande'
}

const ligneDepuisApi = (c: ApercuConversation): Ligne => ({
  id: c.id,
  // `pseudo` est nul quand l'autre participant a disparu : la ligne
  // reste lisible plutot que d'afficher « null ».
  pseudo: c.pseudo ?? 'Compte supprimé',
  apercu: c.dernierMessage
    ? `${c.dernierMessage.moi ? 'Vous : ' : ''}${c.dernierMessage.texte}`
    : 'Nouvelle conversation',
  date: c.dernierMessage?.date ?? null,
  nonLus: c.nonLus,
  source: 'api',
})

const ligneDepuisDemo = (c: Conversation, source: 'service' | 'demande'): Ligne => {
  const dernier = dernierMessage(c)
  return {
    id: `demo-${c.id}`,
    pseudo: c.pseudo,
    apercu: dernier
      ? `${dernier.moi ? 'Vous : ' : ''}${dernier.texte}`
      : c.invite ?? 'Nouvelle conversation',
    date: dernier?.date ?? null,
    nonLus: c.nonLus,
    source,
  }
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
// Fil d'une conversation : entierement servi par l'API.
// ------------------------------------------------------------

function Fil({ conversationId, pseudo, onRetour, onLu }: {
  conversationId: string
  pseudo: string
  onRetour: () => void
  // Prevenu quand le serveur a enregistre la lecture : la boite de
  // reception efface alors sa pastille sans tout recharger.
  onLu: (id: string) => void
}) {
  const [texte, setTexte] = useState('')
  // Du plus recent au plus ancien : c'est l'ordre attendu par la liste
  // renversee, alors que l'API rend les messages par date croissante.
  const [messages, setMessages] = useState<Message[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  // Incremente par « Réessayer » : l'effet de chargement repart sans
  // qu'il faille en dupliquer le corps hors du cycle de vie.
  const [tentative, setTentative] = useState(0)

  useEffect(() => {
    let valable = true
    apiMessagerie.messages(conversationId)
      .then(l => {
        if (!valable) return undefined
        setMessages([...l].reverse())
        setErreur('')
        // Marquer lu n'a de valeur que si le fil s'est bien affiche :
        // la pastille ne doit pas tomber sur un fil qu'on n'a pas vu.
        return apiMessagerie.marquerLu(conversationId)
          .then(() => { if (valable) onLu(conversationId) })
          .catch(() => { /* La pastille se videra au prochain passage. */ })
      })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
    // `onLu` est volontairement hors des dependances : la boite de
    // reception la recree a chaque rendu, et le fil se rechargerait alors
    // en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, tentative])

  const envoyer = () => {
    const contenu = texte.trim()
    if (!contenu || envoiEnCours) return
    setEnvoiEnCours(true)
    setTexte('')
    apiMessagerie.envoyer(conversationId, contenu)
      .then(m => { setMessages(l => [m, ...l]); setErreur('') })
      .catch((e: Error) => {
        // Le texte revient dans le champ : il serait perdu sinon.
        setTexte(contenu)
        setErreur(e.message)
      })
      .finally(() => setEnvoiEnCours(false))
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barreFil}>
        <Pressable hitSlop={10} onPress={onRetour} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Avatar pseudo={pseudo} taille={34} />
        <Text style={s.filPseudo} numberOfLines={1}>{pseudo}</Text>
      </View>

      <KeyboardAvoidingView style={s.filCorps}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {chargement ? (
          <View style={s.attente}>
            <ActivityIndicator color="#ff2856" />
            <Text style={s.attenteTexte}>Chargement…</Text>
          </View>
        ) : messages.length === 0 && erreur ? (
          <View style={s.attente}>
            <Text style={s.attenteTexte}>{erreur}</Text>
            <Pressable style={s.reessayer}
              onPress={() => { setChargement(true); setTentative(n => n + 1) }}>
              <Text style={s.reessayerTexte}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          // Le fil est renverse : la liste part du bas, les nouveaux
          // messages apparaissent donc sous les precedents sans qu'on ait
          // a la faire defiler nous-memes.
          <FlatList
            data={messages}
            keyExtractor={m => m.id}
            inverted
            style={s.filListe}
            contentContainerStyle={s.filContenu}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.filVide}>
                <Text style={s.attenteTexte}>
                  Écrivez le premier message à {pseudo}.
                </Text>
              </View>
            }
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
        )}

        {/* Un envoi refuse se signale ici : le fil deja charge reste
            visible, seul le bandeau apparait. */}
        {!!erreur && messages.length > 0 && (
          <Pressable style={s.bandeau} onPress={() => setErreur('')}>
            <Text style={s.bandeauTexte}>{erreur}</Text>
          </Pressable>
        )}

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
            style={[s.boutonEnvoi,
              (!texte.trim() || envoiEnCours) && s.boutonEnvoiInactif]}>
            <EnvoiMessage taille={20} couleur="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// Ouverture d'une nouvelle conversation par pseudo.
// ------------------------------------------------------------

function NouvelleConversation({ onOuverte, onFermer }: {
  onOuverte: (id: string, pseudo: string) => void
  onFermer: () => void
}) {
  const [pseudo, setPseudo] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const ouvrir = () => {
    const saisi = pseudo.trim()
    if (!saisi || envoi) return
    setEnvoi(true)
    apiMessagerie.ouvrirConversation(saisi)
      .then(c => { setErreur(''); onOuverte(c.id, c.pseudo) })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setEnvoi(false))
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barreFil}>
        <Pressable hitSlop={10} onPress={onFermer} style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.filPseudo}>Nouveau message</Text>
      </View>

      <View style={s.nouveauCorps}>
        <View style={s.zoneRecherche}>
          <Loupe taille={17} couleur="#8e8e93" />
          <TextInput
            style={s.champRecherche}
            placeholder="Pseudo du destinataire"
            placeholderTextColor="#8e8e93"
            value={pseudo}
            onChangeText={setPseudo}
            autoCapitalize="none"
            autoFocus
          />
        </View>

        {!!erreur && <Text style={s.nouveauErreur}>{erreur}</Text>}

        <Pressable onPress={ouvrir}
          style={[s.nouveauBouton,
            (!pseudo.trim() || envoi) && s.nouveauBoutonInactif]}>
          {envoi
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.nouveauBoutonTexte}>Ouvrir la conversation</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// Liste des conversations
// ------------------------------------------------------------

export default function Messages() {
  const { profil } = useAuth()
  // Conversation ouverte. Null = on est sur la boite de reception.
  const [ouverte, setOuverte] = useState<{ id: string; pseudo: string } | null>(null)
  // Vrai quand un compte de service est ouvert : l'ecran
  // « Notifications système » remplace alors le fil de discussion.
  const [notifications, setNotifications] = useState(false)
  const [nouvelle, setNouvelle] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [chercher, setChercher] = useState(false)
  const [demandesOuvertes, setDemandesOuvertes] = useState(false)

  const [apercus, setApercus] = useState<ApercuConversation[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Incremente a chaque retour d'un fil : la boite de reception reprend
  // alors le dernier message et la pastille aupres du serveur.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let valable = true
    apiMessagerie.conversations()
      .then(l => { if (valable) { setApercus(l); setErreur('') } })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [revision])

  const recharger = () => { setChargement(true); setRevision(n => n + 1) }

  // DECOR LOCAL : comptes de service et demandes. Le serveur n'expose
  // ni l'un ni l'autre, ils restent donc lus dans demo.ts.
  const services = etat.conversations.filter(c => c.systeme)
  const demandes = demandesMessages()

  const terme = recherche.trim().toLowerCase()
  const correspond = (l: Ligne) => !terme
    || l.pseudo.toLowerCase().includes(terme)
    || l.apercu.toLowerCase().includes(terme)

  // Les comptes de service restent en tete, les conversations reelles
  // suivent dans l'ordre que le serveur a deja etabli.
  const lignes = [
    ...services.map(c => ligneDepuisDemo(c, 'service')),
    ...apercus.map(ligneDepuisApi),
  ].filter(correspond)

  const lignesDemandes = demandes
    .map(c => ligneDepuisDemo(c, 'demande'))
    .filter(correspond)

  const ouvrir = (l: Ligne) => {
    // Les comptes de service n'ont pas de fil : ils menent aux
    // notifications systeme.
    if (l.source === 'service') { setNotifications(true); return }
    // Une demande est du decor : son fil n'existe pas cote serveur, et
    // ouvrir une vraie conversation avec ce pseudo creerait une ligne
    // en double. Elle reste donc inerte au toucher.
    if (l.source === 'demande') return
    setOuverte({ id: l.id, pseudo: l.pseudo })
  }

  // La pastille tombe des que le serveur a enregistre la lecture : la
  // liste n'attend pas le rechargement pour s'y conformer.
  const marquerLu = (id: string) => setApercus(l => l.map(
    c => (c.id === id ? { ...c, nonLus: 0 } : c)))

  if (notifications) return (
    <Notifications onRetour={() => setNotifications(false)} />
  )

  if (nouvelle) return (
    <NouvelleConversation
      onFermer={() => setNouvelle(false)}
      onOuverte={(id, pseudo) => {
        setNouvelle(false)
        setOuverte({ id, pseudo })
      }}
    />
  )

  if (ouverte) return (
    <Fil conversationId={ouverte.id} pseudo={ouverte.pseudo} onLu={marquerLu}
      onRetour={() => { setOuverte(null); setRevision(n => n + 1) }} />
  )

  if (demandesOuvertes) return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barreFil}>
        <Pressable hitSlop={10} onPress={() => setDemandesOuvertes(false)}
          style={s.retour}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.filPseudo}>Demandes de messages</Text>
      </View>
      <FlatList
        data={demandes.map(c => ligneDepuisDemo(c, 'demande'))}
        keyExtractor={l => l.id}
        contentContainerStyle={s.liste}
        renderItem={({ item }) => (
          <View style={s.ligne}>
            <Avatar pseudo={item.pseudo} taille={52} />
            <View style={s.ligneCorps}>
              <Text style={s.lignePseudo} numberOfLines={1}>{item.pseudo}</Text>
              <Text style={[s.apercu, item.nonLus > 0 && s.apercuNonLu]}
                numberOfLines={1}>{item.apercu}</Text>
            </View>
            {!!item.date && (
              <Text style={s.heure}>{dateRelative(item.date)}</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Pressable hitSlop={10} onPress={() => setNouvelle(true)}>
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

      {/* DECOR LOCAL : il n'existe pas d'API de recits. */}
      <BandeStories pseudo={profil?.pseudo ?? 'moi'} stories={etat.stories}
        clair />

      {chargement ? (
        <View style={s.attente}>
          <ActivityIndicator color="#ff2856" />
          <Text style={s.attenteTexte}>Chargement…</Text>
        </View>
      ) : (
        <FlatList
          data={lignes}
          keyExtractor={l => l.id}
          contentContainerStyle={s.liste}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            // Une boite vide et une messagerie en panne se ressemblent a
            // l'ecran : le message du serveur distingue les deux.
            erreur ? (
              <View style={s.panne}>
                <Text style={s.attenteTexte}>{erreur}</Text>
                <Pressable style={s.reessayer} onPress={recharger}>
                  <Text style={s.reessayerTexte}>Réessayer</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListFooterComponent={
            lignesDemandes.length > 0 ? (
              <Pressable style={s.ligne}
                onPress={() => setDemandesOuvertes(true)}>
                <View style={s.pastilleDemande}>
                  <BulleDemande taille={26} couleur="#fff" />
                </View>
                <View style={s.ligneCorps}>
                  <Text style={s.lignePseudo}>Demandes de messages</Text>
                  <Text style={s.apercu} numberOfLines={1}>
                    {lignesDemandes.length} en attente
                  </Text>
                </View>
                <View style={s.ligneFin}>
                  <Eclair taille={16} couleur="#8e8e93" />
                </View>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            erreur ? null : (
              <View style={s.vide}>
                <IconeMessages taille={46} couleur="#c7c7cc" />
                <Text style={s.videTitre}>
                  {terme ? 'Aucun résultat' : 'Aucun message'}
                </Text>
                <Text style={s.videTexte}>
                  {terme
                    ? 'Essayez un autre pseudo ou un autre mot.'
                    : 'Vos conversations apparaîtront ici.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable style={s.ligne} onPress={() => ouvrir(item)}>
              <Avatar pseudo={item.pseudo} taille={52} />
              <View style={s.ligneCorps}>
                <Text style={s.lignePseudo} numberOfLines={1}>{item.pseudo}</Text>
                <Text style={[s.apercu, item.nonLus > 0 && s.apercuNonLu]}
                  numberOfLines={1}>{item.apercu}</Text>
              </View>
              <View style={s.ligneFin}>
                {!!item.date && (
                  <Text style={s.heure}>{dateRelative(item.date)}</Text>
                )}
                {item.nonLus > 0 && <View style={s.pastilleNonLu} />}
              </View>
            </Pressable>
          )}
        />
      )}
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
  // Pastille de la ligne « Demandes de messages », a la place d'un avatar.
  pastilleDemande: { width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#8e8e93', alignItems: 'center', justifyContent: 'center' },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontWeight: '700' },

  vide: { alignItems: 'center', gap: 9, paddingTop: '28%',
    paddingHorizontal: 40 },
  videTitre: { color: '#111', fontSize: 16, fontWeight: '700' },
  videTexte: { color: '#8e8e93', fontSize: 13.5, textAlign: 'center',
    lineHeight: 19 },

  attente: { flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 14 },
  attenteTexte: { color: '#8e8e93', textAlign: 'center', fontSize: 14.5,
    lineHeight: 20 },
  panne: { alignItems: 'center', gap: 14, paddingVertical: 28,
    paddingHorizontal: 40 },
  reessayer: { borderWidth: 1, borderColor: '#d9d9de', borderRadius: 22,
    paddingHorizontal: 22, minHeight: 44,
    alignItems: 'center', justifyContent: 'center' },
  reessayerTexte: { color: '#111', fontSize: 15, fontWeight: '600' },

  // Barre du haut d'une conversation.
  barreFil: { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingRight: 16, paddingLeft: 8, minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f1' },
  retour: { width: 34, height: 44, justifyContent: 'center' },
  filPseudo: { flex: 1, color: '#111', fontSize: 16, fontWeight: '600' },

  filCorps: { flex: 1 },
  filListe: { flex: 1 },
  filContenu: { paddingHorizontal: 12, paddingVertical: 12, gap: 7 },
  // La liste etant renversee, son contenu vide le serait aussi : on le
  // remet d'aplomb.
  filVide: { paddingTop: 40, paddingHorizontal: 30,
    transform: [{ scaleY: -1 }] },

  ligneBulle: { flexDirection: 'row', justifyContent: 'flex-start' },
  ligneBulleMoi: { justifyContent: 'flex-end' },
  bulle: { maxWidth: '76%', borderRadius: 18, paddingHorizontal: 13,
    paddingVertical: 9 },
  bulleAutre: { backgroundColor: '#f1f1f2' },
  bulleMoi: { backgroundColor: '#ff2856' },
  bulleTexte: { color: '#111', fontSize: 15, lineHeight: 20 },
  bulleTexteMoi: { color: '#fff' },

  // Bandeau d'erreur, pose juste au-dessus du champ de saisie.
  bandeau: { marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(90,90,90,.92)', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16 },
  bandeauTexte: { color: '#fff', fontSize: 14, textAlign: 'center' },

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

  // Ecran « Nouveau message ».
  nouveauCorps: { padding: 16, gap: 16 },
  nouveauErreur: { color: '#ff2856', fontSize: 14, paddingHorizontal: 4 },
  nouveauBouton: { backgroundColor: '#ff2856', borderRadius: 22,
    minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  nouveauBoutonInactif: { backgroundColor: '#f7adbf' },
  nouveauBoutonTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
