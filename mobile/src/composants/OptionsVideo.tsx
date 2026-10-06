// ============================================================
// Feuille d'options d'une video (bouton de partage du fil).
//
// Trois rangees, comme sur TikTok :
// 1. « Envoyer à » : le lien part en message prive a un contact ;
// 2. le partage externe (lien, WhatsApp, Telegram, SMS, autres) ;
// 3. les actions : sur sa video, la gerer (statistiques, legende,
//    confidentialite, commentaires, suppression) ; sur celle d'autrui,
//    « Pas intéressé » et le signalement. Le telechargement suit le
//    reglage de l'auteur.
// Chaque bouton fait ce qu'il dit ; ce que TockTick ne sait pas faire
// n'est pas affiche.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, Modal, Share, Linking, Platform,
  ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { Text, TextInput } from './Texte'
import {
  FeuilleCroix, Maillon, Telecharger, Statistiques, Crayon2, CadenasPlein,
  Corbeille, LogoWhatsApp, LogoSMS, LogoTelegram, Drapeau, Partage, Bulle,
} from './Icones'
import { apiMessagerie, apiVideos, apiInteractions, type ApercuConversation } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useExigerCompte } from '../lib/invite'
import { lienVideo } from '../lib/lien'
import type { Video } from '../lib/demo'

type Visibilite = 'monde' | 'amis' | 'moi'

const VISIBILITES: { valeur: Visibilite; nom: string; detail: string }[] = [
  { valeur: 'monde', nom: 'Tout le monde', detail: 'Visible dans le fil de tous, même sans compte.' },
  { valeur: 'amis', nom: 'Amis', detail: 'Les comptes que tu suis et qui te suivent.' },
  { valeur: 'moi', nom: 'Moi uniquement', detail: 'Visible seulement par toi.' },
]

const MOTIFS = [
  'Violence ou contenu choquant', 'Harcèlement ou intimidation', 'Nudité ou contenu sexuel',
  'Arnaque ou fraude', 'Discours haineux', 'Fausse information', 'Spam', 'Autre',
]

// Contact a qui envoyer le lien : conversation existante, ou compte suivi
// (la conversation s'ouvre alors au premier envoi).
type Contact = { pseudo: string; avatar: string | null; conversation?: string }

type Ecran = 'principal' | 'legende' | 'confidentialite' | 'signaler' | 'supprimer'

export default function OptionsVideo({
  visible, video, onFermer, onAnalytiques, onSupprimee, onModifiee, onPasInteresse,
}: {
  visible: boolean
  video: Video
  onFermer: () => void
  onAnalytiques: () => void
  onSupprimee: (id: string) => void
  onModifiee: (id: string, valeurs: Partial<Video>) => void
  onPasInteresse: (id: string) => void
}) {
  const { height } = useWindowDimensions()
  const { profil } = useAuth()
  const exiger = useExigerCompte()
  const sienne = !!profil && profil.pseudo === video.pseudo
  const lien = lienVideo(video.id)

  const [ecran, setEcran] = useState<Ecran>('principal')
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [legende, setLegende] = useState(video.legende)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [envoyes, setEnvoyes] = useState<Set<string>>(() => new Set())

  // Contacts relus a chaque ouverture (la feuille est montee a l'ouverture,
  // son etat repart donc de zero).
  useEffect(() => {
    if (!visible || !profil) return
    let valable = true
    Promise.all([
      apiMessagerie.conversations().catch(() => [] as ApercuConversation[]),
      apiInteractions.abonnements(profil.pseudo, { limite: 30 }).catch(() => []),
    ]).then(([conversations, suivis]) => {
      if (!valable) return
      const vus = new Set<string>()
      const liste: Contact[] = []
      for (const c of conversations) {
        if (c.pseudo && !vus.has(c.pseudo)) { vus.add(c.pseudo); liste.push({ pseudo: c.pseudo, avatar: c.avatarUrl, conversation: c.id }) }
      }
      for (const c of suivis) {
        if (!vus.has(c.pseudo)) { vus.add(c.pseudo); liste.push({ pseudo: c.pseudo, avatar: c.avatar_url }) }
      }
      setContacts(liste)
    })
    return () => { valable = false }
  }, [visible, profil])

  const avertir = (texte: string) => {
    setMessage(texte)
    setTimeout(() => setMessage(m => (m === texte ? '' : m)), 3000)
  }

  const envoyerA = async (c: Contact) => {
    if (envoyes.has(c.pseudo)) return
    try {
      const id = c.conversation ?? (await apiMessagerie.ouvrirConversation(c.pseudo)).id
      await apiMessagerie.envoyer(id, `${video.legende ? `${video.legende}\n` : ''}${lien}`)
      setEnvoyes(e => new Set(e).add(c.pseudo))
    } catch (e) { avertir(e instanceof Error ? e.message : 'Envoi impossible.') }
  }

  const copierLien = async () => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(lien)
        avertir('Lien copié.')
      } else {
        await Share.share({ message: lien })
      }
    } catch { avertir(lien) }
  }

  const ouvrir = (url: string) => Linking.openURL(url).catch(() => avertir('Application introuvable.'))
  const texteMessage = encodeURIComponent(`${video.legende ? `${video.legende} ` : ''}${lien}`)
  const partageSysteme = async () => {
    try {
      if (Platform.OS === 'web' && navigator.share) await navigator.share({ title: 'TockTick', text: video.legende, url: lien })
      else await Share.share({ message: `${video.legende}\n${lien}`, url: lien })
    } catch { /* Partage annule. */ }
  }

  // Telechargement : le fichier de la video, si l'auteur l'autorise.
  const telecharger = async () => {
    if (!sienne && video.reutilisationAutorisee === false) {
      avertir('L’auteur n’autorise pas le téléchargement de cette vidéo.'); return
    }
    if (Platform.OS !== 'web') { ouvrir(video.url); return }
    setOccupe(true)
    try {
      const blob = await (await fetch(video.url)).blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `tocktick-${video.pseudo}-${video.id.slice(0, 8)}.${blob.type.includes('webm') ? 'webm' : 'mp4'}`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
      avertir('Vidéo téléchargée.')
    } catch { avertir('Le téléchargement a échoué.') } finally { setOccupe(false) }
  }

  const modifier = async (valeurs: Parameters<typeof apiVideos.modifier>[1], local: Partial<Video>, avis: string) => {
    setOccupe(true)
    try {
      await apiVideos.modifier(video.id, valeurs)
      onModifiee(video.id, local)
      setEcran('principal')
      avertir(avis)
    } catch (e) { avertir(e instanceof Error ? e.message : 'Modification impossible.') } finally { setOccupe(false) }
  }

  const supprimer = async () => {
    setOccupe(true)
    try {
      await apiVideos.supprimer(video.id)
      onFermer()
      onSupprimee(video.id)
    } catch (e) { avertir(e instanceof Error ? e.message : 'Suppression impossible.') } finally { setOccupe(false) }
  }

  const signaler = async (motif: string) => {
    setOccupe(true)
    try {
      await apiVideos.signaler(video.id, motif)
      setEcran('principal')
      avertir('Merci, ton signalement a été envoyé.')
    } catch (e) { avertir(e instanceof Error ? e.message : 'Signalement impossible.') } finally { setOccupe(false) }
  }

  const actions = sienne ? [
    { cle: 'stats', nom: 'Données analytiques', Icone: Statistiques, agir: () => { onFermer(); onAnalytiques() } },
    { cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger, agir: telecharger },
    { cle: 'legende', nom: 'Modifier la légende', Icone: Crayon2, agir: () => setEcran('legende') },
    { cle: 'confidentialite', nom: 'Confidentialité', Icone: CadenasPlein, agir: () => setEcran('confidentialite') },
    {
      cle: 'commentaires',
      nom: video.commentairesAutorises === false ? 'Activer les commentaires' : 'Désactiver les commentaires',
      Icone: Bulle,
      agir: () => {
        const autorises = video.commentairesAutorises === false
        modifier({ commentaires_autorises: autorises }, { commentairesAutorises: autorises },
          autorises ? 'Commentaires activés.' : 'Commentaires désactivés.')
      },
    },
    { cle: 'supprimer', nom: 'Supprimer', Icone: Corbeille, agir: () => setEcran('supprimer'), danger: true },
  ] : [
    { cle: 'pasinteresse', nom: 'Pas intéressé', Icone: FeuilleCroix, agir: () => { onFermer(); onPasInteresse(video.id) } },
    { cle: 'signaler', nom: 'Signaler', Icone: Drapeau, agir: () => { if (exiger('signaler une vidéo')) setEcran('signaler') } },
    ...(video.reutilisationAutorisee === false ? [] : [{ cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger, agir: telecharger }]),
  ]

  const partages = [
    { cle: 'lien', nom: 'Copier le lien', fond: '#3b7df6', Icone: Maillon, agir: copierLien },
    { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp, agir: () => ouvrir(`https://wa.me/?text=${texteMessage}`) },
    { cle: 'telegram', nom: 'Telegram', Logo: LogoTelegram, agir: () => ouvrir(`https://t.me/share/url?url=${encodeURIComponent(lien)}&text=${encodeURIComponent(video.legende)}`) },
    { cle: 'sms', nom: 'SMS', Logo: LogoSMS, agir: () => ouvrir(`sms:?&body=${texteMessage}`) },
    { cle: 'autres', nom: 'Autres', fond: '#8e8e93', Icone: Partage, agir: partageSysteme },
  ]

  const titre = { principal: 'Envoyer à', legende: 'Modifier la légende', confidentialite: 'Qui peut regarder', signaler: 'Signaler', supprimer: 'Supprimer la vidéo' }[ecran]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} accessibilityLabel="Fermer" />
        <View style={[s.feuille, { maxHeight: height * .7 }]}>
          <View style={s.entete}>
            {ecran !== 'principal'
              ? <Pressable hitSlop={10} onPress={() => setEcran('principal')} accessibilityRole="button"><Text style={s.retour}>Retour</Text></Pressable>
              : <View style={s.croix} />}
            <Text style={s.titre}>{titre}</Text>
            <Pressable hitSlop={10} onPress={onFermer} style={s.croix} accessibilityRole="button" accessibilityLabel="Fermer">
              <FeuilleCroix taille={18} couleur="#111" />
            </Pressable>
          </View>

          {ecran === 'principal' && <ScrollView>
            {profil ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bande}>
                {contacts.length === 0 && <Text style={s.vide}>Suis des comptes ou écris-leur pour leur envoyer des vidéos.</Text>}
                {contacts.map(c => (
                  <Pressable key={c.pseudo} style={s.element} onPress={() => envoyerA(c)} accessibilityRole="button"
                    accessibilityLabel={`Envoyer à ${c.pseudo}`}>
                    <View style={s.avatar}><Text style={s.avatarLettre}>{c.pseudo.charAt(0).toUpperCase()}</Text></View>
                    <Text style={s.nom} numberOfLines={1}>{c.pseudo}</Text>
                    <Text style={[s.etat, envoyes.has(c.pseudo) && s.etatEnvoye]}>{envoyes.has(c.pseudo) ? 'Envoyé' : 'Envoyer'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Pressable style={s.invite} onPress={() => exiger('envoyer des vidéos à tes amis')}>
                <Text style={s.inviteTexte}>Connecte-toi pour envoyer des vidéos à tes amis.</Text>
              </Pressable>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bande}>
              {partages.map(p => (
                <Pressable key={p.cle} style={s.element} onPress={p.agir} accessibilityRole="button" accessibilityLabel={p.nom}>
                  {'Logo' in p && p.Logo
                    ? <p.Logo taille={52} />
                    : <View style={[s.pastille, { backgroundColor: p.fond }]}>{p.Icone && <p.Icone taille={24} couleur="#fff" />}</View>}
                  <Text style={s.nom} numberOfLines={2}>{p.nom}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={s.separateur} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bande}>
              {actions.map(a => (
                <Pressable key={a.cle} style={s.element} onPress={a.agir} disabled={occupe} accessibilityRole="button" accessibilityLabel={a.nom}>
                  <View style={s.pastilleGrise}><a.Icone taille={24} couleur={'danger' in a && a.danger ? '#ed2753' : '#111'} /></View>
                  <Text style={[s.nom, 'danger' in a && a.danger && s.danger]} numberOfLines={2}>{a.nom}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </ScrollView>}

          {ecran === 'legende' && (
            <View style={s.corps}>
              <TextInput style={s.saisie} value={legende} onChangeText={setLegende} multiline maxLength={2200}
                placeholder="Décris ta vidéo" placeholderTextColor="#999" autoFocus />
              <Pressable style={s.bouton} disabled={occupe} accessibilityRole="button"
                onPress={() => modifier({ legende: legende.trim() }, { legende: legende.trim() }, 'Légende modifiée.')}>
                {occupe ? <ActivityIndicator color="#fff" /> : <Text style={s.boutonTexte}>Enregistrer</Text>}
              </Pressable>
            </View>
          )}

          {ecran === 'confidentialite' && (
            <View style={s.corps}>
              {VISIBILITES.map(v => (
                <Pressable key={v.valeur} style={s.ligne} disabled={occupe} accessibilityRole="radio"
                  accessibilityState={{ checked: (video.visibilite ?? 'monde') === v.valeur }}
                  onPress={() => modifier({ visibilite: v.valeur }, { visibilite: v.valeur }, `Visible par : ${v.nom.toLowerCase()}.`)}>
                  <View style={s.ligneCorps}>
                    <Text style={s.ligneNom}>{v.nom}</Text>
                    <Text style={s.ligneDetail}>{v.detail}</Text>
                  </View>
                  <View style={[s.radio, (video.visibilite ?? 'monde') === v.valeur && s.radioChoisi]} />
                </Pressable>
              ))}
            </View>
          )}

          {ecran === 'signaler' && (
            <ScrollView contentContainerStyle={s.corps}>
              <Text style={s.ligneDetail}>Pourquoi signales-tu cette vidéo ? Ton signalement est anonyme.</Text>
              {MOTIFS.map(m => (
                <Pressable key={m} style={s.ligne} disabled={occupe} onPress={() => signaler(m)} accessibilityRole="button">
                  <Text style={s.ligneNom}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {ecran === 'supprimer' && (
            <View style={s.corps}>
              <Text style={s.ligneDetail}>La vidéo, ses j’aime et ses commentaires seront effacés définitivement.</Text>
              <Pressable style={[s.bouton, s.boutonDanger]} disabled={occupe} onPress={supprimer} accessibilityRole="button">
                {occupe ? <ActivityIndicator color="#fff" /> : <Text style={s.boutonTexte}>Supprimer définitivement</Text>}
              </Pressable>
              <Pressable style={[s.bouton, s.boutonGris]} onPress={() => setEcran('principal')} accessibilityRole="button">
                <Text style={[s.boutonTexte, s.boutonGrisTexte]}>Annuler</Text>
              </Pressable>
            </View>
          )}

          {!!message && <Text style={s.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingBottom: 24 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  titre: { fontSize: 15.5, fontWeight: '700', color: '#111' },
  croix: { width: 52, alignItems: 'flex-end' },
  retour: { width: 52, fontSize: 14.5, color: '#111', fontWeight: '600' },
  bande: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  element: { width: 72, alignItems: 'center', gap: 6 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e8485c', alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontSize: 20, fontWeight: '700' },
  pastille: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pastilleGrise: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f1f1f2', alignItems: 'center', justifyContent: 'center' },
  nom: { fontSize: 11.5, color: '#333', textAlign: 'center' },
  danger: { color: '#ed2753' },
  etat: { fontSize: 11, color: '#ff2856', fontWeight: '600' },
  etatEnvoye: { color: '#8e8e93' },
  vide: { fontSize: 13, color: '#8e8e93', paddingHorizontal: 6, paddingVertical: 18 },
  invite: { marginHorizontal: 16, marginVertical: 8, padding: 14, borderRadius: 10, backgroundColor: '#f6f6f7' },
  inviteTexte: { fontSize: 13.5, color: '#333', textAlign: 'center' },
  separateur: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e5e5', marginHorizontal: 16, marginVertical: 4 },
  corps: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  saisie: { minHeight: 110, borderRadius: 10, backgroundColor: '#f6f6f7', padding: 12, fontSize: 15, color: '#111', textAlignVertical: 'top' },
  bouton: { backgroundColor: '#ff2856', borderRadius: 8, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  boutonDanger: { backgroundColor: '#ed2753' },
  boutonGris: { backgroundColor: '#f1f1f2' },
  boutonTexte: { color: '#fff', fontSize: 15, fontWeight: '700' },
  boutonGrisTexte: { color: '#111' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  ligneCorps: { flex: 1, gap: 2 },
  ligneNom: { fontSize: 15, color: '#111', fontWeight: '500' },
  ligneDetail: { fontSize: 13, color: '#777', lineHeight: 18 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc' },
  radioChoisi: { borderColor: '#ff2856', borderWidth: 6 },
  message: { textAlign: 'center', fontSize: 13.5, color: '#111', paddingTop: 10, paddingHorizontal: 16 },
})
