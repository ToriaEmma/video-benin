// ============================================================
// Connexion et inscription.
//
// Trois etats : l'onglet Profil deconnecte, la feuille d'inscription
// et la liste des comptes deja connus. Les deux feuilles remontent du
// bas et se referment par la croix.
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TextInput } from '../composants/Texte'
import {
  SilhouetteVide, Enveloppe, AideRonde,
  FeuilleCroix, ChevronDroit, Menu,
} from '../composants/Icones'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../lib/auth'

// Comptes deja utilises sur cet appareil. La liste s'ecrit a chaque
// connexion reussie : tant qu'on ne s'est jamais connecte, elle est
// vide et l'ecran propose directement de saisir ses identifiants.
const CLE_CONNUS = 'tiktok-benin-comptes-connus-v1'

type CompteConnu = { pseudo: string; telephone: string }

export async function retenirCompte(pseudo: string, telephone: string) {
  try {
    const brut = await AsyncStorage.getItem(CLE_CONNUS)
    const liste: CompteConnu[] = brut ? JSON.parse(brut) : []
    const sansDoublon = liste.filter(c => c.pseudo !== pseudo)
    await AsyncStorage.setItem(CLE_CONNUS,
      JSON.stringify([{ pseudo, telephone }, ...sansDoublon].slice(0, 5)))
  } catch { /* Stockage indisponible : la liste restera vide. */ }
}

// « +229 •• •• •• 42 » : seuls les deux derniers chiffres restent lisibles.
const masquer = (telephone: string) => {
  const chiffres = telephone.replace(/\D/g, '')
  // Compte retenu par son pseudo : rien a masquer.
  if (/[a-z]/i.test(telephone) || chiffres.length < 4) return telephone
  return `+229 •• •• •• ${chiffres.slice(-2)}`
}

// Teintes des avatars, tirees du pseudo pour qu'un compte garde la
// sienne d'un ecran a l'autre.
const TEINTES = ['#6f5bd4', '#ff2856', '#16cce0', '#e8820c', '#c43cc0']
const teinte = (pseudo: string) => {
  let somme = 0
  for (let i = 0; i < pseudo.length; i++) somme += pseudo.charCodeAt(i)
  return TEINTES[somme % TEINTES.length]
}

// En-tete commun aux deux feuilles : l'aide a gauche, la croix a droite.
function EnteteFeuille({ onFermer }: { onFermer: () => void }) {
  return (
    <View style={s.enteteFeuille}>
      <Pressable hitSlop={10}>
        <AideRonde taille={26} couleur="#111" />
      </Pressable>
      <Pressable hitSlop={10} onPress={onFermer}>
        <FeuilleCroix taille={24} couleur="#111" />
      </Pressable>
    </View>
  )
}

// ------------------------------------------------------------
// Feuille d'inscription
// ------------------------------------------------------------

export function Inscription({ visible, onFermer, onConnexion, onSucces }: {
  visible: boolean
  onFermer: () => void
  // Bascule vers la liste des comptes connus.
  onConnexion: () => void
  onSucces?: () => void
}) {
  const { height } = useWindowDimensions()
  const { inscrire } = useAuth()
  const [tel, setTel] = useState('')
  const [etape, setEtape] = useState<'telephone' | 'compte'>('telephone')
  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const chiffres = tel.replace(/\D/g, '')

  const continuer = () => {
    setErreur('')
    if (chiffres.length < 8) { setErreur('Numéro de téléphone incomplet'); return }
    setEtape('compte')
  }

  const creer = async () => {
    setErreur('')
    if (pseudo.trim().length < 3) {
      setErreur('Le pseudo doit faire au moins 3 caractères'); return
    }
    if (mdp.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères'); return
    }
    setOccupe(true)
    try {
      await inscrire(chiffres, mdp, pseudo.trim().toLowerCase())
      onSucces?.(); onFermer()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally { setOccupe(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.feuille, { maxHeight: height * .92 }]}>
            <EnteteFeuille onFermer={onFermer} />

            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={s.corpsFeuille}
              keyboardShouldPersistTaps="handled">
              <Text style={s.grandTitre}>
                {etape === 'telephone'
                  ? 'Inscription à TockTick'
                  : 'Choisis ton pseudo'}
              </Text>

              {etape === 'telephone' ? <>
                <View style={s.champTelephone}>
                  <Text style={s.indicatif}>BJ +229</Text>
                  <View style={s.traitChamp} />
                  <TextInput style={s.saisieTelephone}
                    placeholder="Numéro de téléphone" placeholderTextColor="#aaa"
                    keyboardType="phone-pad" value={tel} onChangeText={setTel} />
                </View>

                <Pressable style={[s.principal, !chiffres && s.principalInactif]}
                  onPress={continuer} disabled={!chiffres}>
                  <Text style={s.principalTexte}>Continuer</Text>
                </Pressable>

                <View style={s.separateur}>
                  <View style={s.trait} />
                  <Text style={s.ou}>ou</Text>
                  <View style={s.trait} />
                </View>

                <Pressable style={s.autre}>
                  <Enveloppe taille={22} couleur="#111" />
                  <Text style={s.autreTexte}>Continuer avec un e-mail</Text>
                </Pressable>
              </> : <>
                <View style={s.champ}>
                  <TextInput style={s.saisie} placeholder="Pseudo"
                    placeholderTextColor="#aaa" autoCapitalize="none"
                    value={pseudo} onChangeText={setPseudo} />
                </View>
                <View style={s.champ}>
                  <TextInput style={s.saisie} placeholder="Mot de passe"
                    placeholderTextColor="#aaa" secureTextEntry
                    value={mdp} onChangeText={setMdp} />
                </View>

                <Pressable style={[s.principal, occupe && s.principalInactif]}
                  onPress={creer} disabled={occupe}>
                  {occupe
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.principalTexte}>Créer le compte</Text>}
                </Pressable>

                <Pressable hitSlop={8} onPress={() => setEtape('telephone')}>
                  <Text style={s.retourEtape}>Modifier le numéro</Text>
                </Pressable>
              </>}

              {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

              <Text style={s.mentions}>
                En continuant avec un compte situé au Bénin, tu acceptes nos
                conditions d’utilisation et reconnais avoir lu notre politique
                de confidentialité.
              </Text>
            </ScrollView>

            <View style={s.piedFeuille}>
              <Text style={s.piedTexte}>Tu as déjà un compte ? </Text>
              <Pressable hitSlop={8} onPress={onConnexion}>
                <Text style={s.piedLien}>Se connecter</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ------------------------------------------------------------
// Feuille « Ravis de te revoir » : les comptes deja connus
// ------------------------------------------------------------

export function ListeComptes({ visible, onFermer, onInscription, onSucces }: {
  visible: boolean
  onFermer: () => void
  onInscription: () => void
  onSucces?: () => void
}) {
  const { height } = useWindowDimensions()
  const { connecter } = useAuth()
  // Compte choisi dans la liste : le mot de passe lui est demande.
  const [choisi, setChoisi] = useState<string | null>(null)
  const [tel, setTel] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  // Comptes deja utilises sur cet appareil, relus a l'ouverture.
  const [connus, setConnus] = useState<CompteConnu[]>([])

  useEffect(() => {
    let vivant = true
    AsyncStorage.getItem(CLE_CONNUS)
      .then(brut => { if (vivant && brut) setConnus(JSON.parse(brut)) })
      .catch(() => { /* Stockage illisible : la liste reste vide. */ })
    return () => { vivant = false }
  }, [])

  const entrer = async (telephone?: string) => {
    setErreur('')
    // Numero (sous n'importe quelle forme : +229, 01…, espaces) ou pseudo.
    const saisi = (telephone ?? tel).trim()
    const chiffres = saisi.replace(/\D/g, '')
    const parPseudo = /[a-z]/i.test(saisi)
    if (!saisi) { setErreur('Entre ton numéro de téléphone ou ton pseudo'); return }
    if (!parPseudo && chiffres.length < 8) { setErreur('Numéro de téléphone incomplet'); return }
    if (!mdp) { setErreur('Entre ton mot de passe'); return }
    const identifiant = parPseudo ? saisi.replace(/^@/, '').toLowerCase() : chiffres
    setOccupe(true)
    try {
      await connecter(identifiant, mdp)
      await retenirCompte(choisi ?? identifiant, identifiant)
      onSucces?.(); onFermer()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally { setOccupe(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fond}>
        <Pressable style={s.voile} onPress={onFermer} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.feuille, { maxHeight: height * .92 }]}>
            <EnteteFeuille onFermer={onFermer} />

            <ScrollView showsVerticalScrollIndicator={false}
              contentContainerStyle={s.corpsFeuille}
              keyboardShouldPersistTaps="handled">
              <Text style={s.grandTitre}>
                {connus.length === 0 ? 'Connexion'
                  : choisi ? 'Entre ton mot de passe'
                  : 'Ravis de te revoir'}
              </Text>

              {(choisi || connus.length === 0) ? <>
                <View style={s.champ}>
                  {/* Identifiants enregistres par le navigateur ou le telephone :
                      `username` / `current-password` les font remplir ici. */}
                  <TextInput style={s.saisie} placeholder="Numéro de téléphone ou pseudo"
                    placeholderTextColor="#aaa" autoCapitalize="none" autoCorrect={false}
                    autoComplete="username" textContentType="username"
                    value={tel} onChangeText={setTel} />
                </View>
                <View style={s.champ}>
                  <TextInput style={s.saisie} placeholder="Mot de passe"
                    placeholderTextColor="#aaa" secureTextEntry
                    autoComplete="current-password" textContentType="password"
                    value={mdp} onChangeText={setMdp} onSubmitEditing={() => entrer()} />
                </View>

                <Pressable style={[s.principal, occupe && s.principalInactif]}
                  onPress={() => entrer()} disabled={occupe}>
                  {occupe
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.principalTexte}>Connexion</Text>}
                </Pressable>

                {connus.length > 0 && (
                  <Pressable hitSlop={8} onPress={() => setChoisi(null)}>
                    <Text style={s.retourEtape}>Choisir un autre compte</Text>
                  </Pressable>
                )}
              </> : <>
                {connus.map(c => (
                  <Pressable key={c.pseudo} style={s.ligneCompte}
                    onPress={() => { setChoisi(c.pseudo); setTel(c.telephone) }}>
                    <View style={[s.avatar,
                      { backgroundColor: teinte(c.pseudo) }]}>
                      <Text style={s.avatarLettre}>
                        {c.pseudo.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.compteCorps}>
                      <Text style={s.comptePseudo}>{c.pseudo}</Text>
                      <Text style={s.compteIdentifiant}>
                        {masquer(c.telephone)}
                      </Text>
                    </View>
                    <ChevronDroit taille={20} couleur="#c4c4c6" />
                  </Pressable>
                ))}

                <Pressable style={s.ligneCompte} onPress={onInscription}>
                  <View style={s.avatarAjout}>
                    <Text style={s.plus}>+</Text>
                  </View>
                  <Text style={s.ajoutTexte}>Ajouter un autre compte</Text>
                </Pressable>

                <Pressable style={s.gerer} hitSlop={8}>
                  <Text style={s.gererTexte}>Gérer les comptes</Text>
                </Pressable>
              </>}

              {!!erreur && <Text style={s.erreur}>{erreur}</Text>}
            </ScrollView>

            <View style={s.piedFeuille}>
              <Text style={s.piedTexte}>Tu n’as pas de compte ? </Text>
              <Pressable hitSlop={8} onPress={onInscription}>
                <Text style={s.piedLien}>Inscription</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ------------------------------------------------------------
// Onglet Profil deconnecte
// ------------------------------------------------------------

export default function Connexion({ onSucces }: { onSucces?: () => void } = {}) {
  const [feuille, setFeuille] = useState<'comptes' | 'inscription' | null>(null)

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <View style={s.barre}>
        <Text style={s.titre}>Profil</Text>
        <Pressable style={s.menu} hitSlop={10}>
          <Menu taille={26} couleur="#111" />
        </Pressable>
      </View>

      <View style={s.centre}>
        <SilhouetteVide taille={92} couleur="#b4b4b6" />
        <Text style={s.invite}>Connecte-toi à un compte existant</Text>
        <Pressable style={s.bouton} onPress={() => setFeuille('comptes')}>
          <Text style={s.boutonTexte}>Connexion</Text>
        </Pressable>
      </View>

      <ListeComptes visible={feuille === 'comptes'} onSucces={onSucces}
        onFermer={() => setFeuille(null)}
        onInscription={() => setFeuille('inscription')} />

      <Inscription visible={feuille === 'inscription'} onSucces={onSucces}
        onFermer={() => setFeuille(null)}
        onConnexion={() => setFeuille('comptes')} />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },

  // --- Onglet deconnecte ---
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 52, paddingHorizontal: 16, borderBottomWidth: 1,
    borderBottomColor: '#f0f0f1' },
  titre: { color: '#111', fontSize: 16.5, fontWeight: '700' },
  menu: { position: 'absolute', right: 16 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, marginTop: -40 },
  invite: { color: '#8e8e93', fontSize: 14, marginTop: 16, marginBottom: 22 },
  bouton: { backgroundColor: '#ef4a5e', borderRadius: 9, minHeight: 46,
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  boutonTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // --- Feuilles ---
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 14,
    borderTopRightRadius: 14 },
  enteteFeuille: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16,
    paddingBottom: 4 },
  corpsFeuille: { paddingHorizontal: 24, paddingBottom: 20 },

  grandTitre: { color: '#111', fontSize: 21, fontWeight: '800',
    letterSpacing: -.4, marginTop: 18, marginBottom: 24 },

  champTelephone: { flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: '#f1f1f2', borderRadius: 7, paddingHorizontal: 13,
    minHeight: 46, marginBottom: 10 },
  indicatif: { color: '#111', fontSize: 14.5, fontWeight: '600' },
  traitChamp: { width: 1, height: 22, backgroundColor: '#d4d4d6' },
  saisieTelephone: { flex: 1, color: '#111', fontSize: 14.5 },

  champ: { backgroundColor: '#f1f1f2', borderRadius: 7, paddingHorizontal: 13,
    minHeight: 46, justifyContent: 'center', marginBottom: 10 },
  saisie: { color: '#111', fontSize: 14.5 },

  principal: { backgroundColor: '#ef4a5e', borderRadius: 23, minHeight: 46,
    alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  principalInactif: { backgroundColor: '#f3a9b2' },
  principalTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },

  separateur: { flexDirection: 'row', alignItems: 'center', gap: 14,
    marginVertical: 24 },
  trait: { flex: 1, height: 1, backgroundColor: '#ececee' },
  ou: { color: '#8e8e93', fontSize: 12.5 },

  autre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 11, backgroundColor: '#f1f1f2', borderRadius: 7, minHeight: 46,
    marginBottom: 10 },
  autreTexte: { color: '#111', fontSize: 14.5, fontWeight: '600' },

  retourEtape: { color: '#8e8e93', fontSize: 12.5, textAlign: 'center',
    marginTop: 14 },
  erreur: { color: '#ef4a5e', fontSize: 12.5, textAlign: 'center',
    marginTop: 12 },
  mentions: { color: '#8e8e93', fontSize: 11, lineHeight: 15,
    textAlign: 'center', marginTop: 22 },

  piedFeuille: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', minHeight: 56, borderTopWidth: 1,
    borderTopColor: '#f0f0f1', backgroundColor: '#fafafa' },
  piedTexte: { color: '#8e8e93', fontSize: 13 },
  piedLien: { color: '#ef4a5e', fontSize: 13, fontWeight: '700' },

  // --- Liste des comptes ---
  ligneCompte: { flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f1' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center',
    justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontSize: 18, fontWeight: '700' },
  compteCorps: { flex: 1, gap: 4 },
  comptePseudo: { color: '#111', fontSize: 15 },
  compteIdentifiant: { color: '#8e8e93', fontSize: 12.5 },

  avatarAjout: { width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#f1f1f2', alignItems: 'center', justifyContent: 'center' },
  plus: { color: '#111', fontSize: 23, lineHeight: 27 },
  ajoutTexte: { flex: 1, color: '#111', fontSize: 15 },

  gerer: { alignItems: 'center', paddingVertical: 24 },
  gererTexte: { color: '#111', fontSize: 14, fontWeight: '600' },
})
