// ============================================================
// Connexion et inscription.
//
// Trois etats : l'onglet Profil deconnecte, la feuille d'inscription
// et la liste des comptes deja connus. Les deux feuilles remontent du
// bas et se referment par la croix.
// ============================================================

import React, { useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, TextInput } from '../composants/Texte'
import {
  SilhouetteVide, Enveloppe, AideRonde, AvatarVide,
  FeuilleCroix, ChevronDroit, Menu,
} from '../composants/Icones'
import { useAuth } from '../lib/auth'
import { comptesDemo } from '../lib/demo'

// Comptes deja connus de l'appareil, avec l'identifiant qui a servi a
// les creer. La vraie liste viendra de la base ; ceux-ci donnent sa
// forme a l'ecran « Ravis de te revoir ».
const CONNUS = [
  { pseudo: comptesDemo[0].pseudo, identifiant: '+229 •••• 8025' },
  { pseudo: comptesDemo[1].pseudo, identifiant: 'm•••e@gmail.com' },
  { pseudo: comptesDemo[2].pseudo, identifiant: 'Sans portrait', vide: true },
]

// Teintes des avatars, tirees du pseudo pour qu'un compte garde la
// sienne d'un ecran a l'autre.
const TEINTES = ['#6f5bd4', '#ff2856', '#16cce0', '#e8820c', '#1aa260']
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

function Inscription({ visible, onFermer, onConnexion, onSucces }: {
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
                  ? 'Inscription à Vidéo Bénin'
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

function ListeComptes({ visible, onFermer, onInscription, onSucces }: {
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

  const entrer = async () => {
    setErreur('')
    const chiffres = tel.replace(/\D/g, '')
    if (chiffres.length < 8) { setErreur('Numéro de téléphone incomplet'); return }
    if (mdp.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères'); return
    }
    setOccupe(true)
    try {
      await connecter(chiffres, mdp)
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
                {choisi ? 'Entre ton mot de passe' : 'Ravis de te revoir'}
              </Text>

              {choisi ? <>
                <View style={s.champ}>
                  <TextInput style={s.saisie} placeholder="Numéro de téléphone"
                    placeholderTextColor="#aaa" keyboardType="phone-pad"
                    value={tel} onChangeText={setTel} />
                </View>
                <View style={s.champ}>
                  <TextInput style={s.saisie} placeholder="Mot de passe"
                    placeholderTextColor="#aaa" secureTextEntry
                    value={mdp} onChangeText={setMdp} />
                </View>

                <Pressable style={[s.principal, occupe && s.principalInactif]}
                  onPress={entrer} disabled={occupe}>
                  {occupe
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.principalTexte}>Connexion</Text>}
                </Pressable>

                <Pressable hitSlop={8} onPress={() => setChoisi(null)}>
                  <Text style={s.retourEtape}>Choisir un autre compte</Text>
                </Pressable>
              </> : <>
                {CONNUS.map(c => (
                  <Pressable key={c.pseudo} style={s.ligneCompte}
                    onPress={() => setChoisi(c.pseudo)}>
                    {c.vide
                      ? <AvatarVide taille={56} />
                      : <View style={[s.avatar,
                          { backgroundColor: teinte(c.pseudo) }]}>
                          <Text style={s.avatarLettre}>
                            {c.pseudo.charAt(0).toUpperCase()}
                          </Text>
                        </View>}
                    <View style={s.compteCorps}>
                      <Text style={s.comptePseudo}>{c.pseudo}</Text>
                      <Text style={s.compteIdentifiant}>{c.identifiant}</Text>
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
        <SilhouetteVide taille={110} couleur="#b4b4b6" />
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
  titre: { color: '#111', fontSize: 17, fontWeight: '700' },
  menu: { position: 'absolute', right: 16 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, marginTop: -40 },
  invite: { color: '#8e8e93', fontSize: 16, marginTop: 18, marginBottom: 26 },
  bouton: { backgroundColor: '#ef4a5e', borderRadius: 10, minHeight: 52,
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  boutonTexte: { color: '#fff', fontSize: 17, fontWeight: '600' },

  // --- Feuilles ---
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 14,
    borderTopRightRadius: 14 },
  enteteFeuille: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16,
    paddingBottom: 4 },
  corpsFeuille: { paddingHorizontal: 24, paddingBottom: 20 },

  grandTitre: { color: '#111', fontSize: 28, fontWeight: '800',
    letterSpacing: -.6, marginTop: 24, marginBottom: 30 },

  champTelephone: { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f1f1f2', borderRadius: 7, paddingHorizontal: 14,
    minHeight: 50, marginBottom: 12 },
  indicatif: { color: '#111', fontSize: 16, fontWeight: '600' },
  traitChamp: { width: 1, height: 22, backgroundColor: '#d4d4d6' },
  saisieTelephone: { flex: 1, color: '#111', fontSize: 16 },

  champ: { backgroundColor: '#f1f1f2', borderRadius: 7, paddingHorizontal: 14,
    minHeight: 50, justifyContent: 'center', marginBottom: 12 },
  saisie: { color: '#111', fontSize: 16 },

  principal: { backgroundColor: '#ef4a5e', borderRadius: 26, minHeight: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  principalInactif: { backgroundColor: '#f3a9b2' },
  principalTexte: { color: '#fff', fontSize: 17, fontWeight: '600' },

  separateur: { flexDirection: 'row', alignItems: 'center', gap: 14,
    marginVertical: 24 },
  trait: { flex: 1, height: 1, backgroundColor: '#ececee' },
  ou: { color: '#8e8e93', fontSize: 14 },

  autre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#f1f1f2', borderRadius: 7, minHeight: 50,
    marginBottom: 12 },
  autreTexte: { color: '#111', fontSize: 16, fontWeight: '600' },

  retourEtape: { color: '#8e8e93', fontSize: 14, textAlign: 'center',
    marginTop: 16 },
  erreur: { color: '#ef4a5e', fontSize: 14, textAlign: 'center',
    marginTop: 14 },
  mentions: { color: '#8e8e93', fontSize: 12, lineHeight: 17,
    textAlign: 'center', marginTop: 28 },

  piedFeuille: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', minHeight: 56, borderTopWidth: 1,
    borderTopColor: '#f0f0f1', backgroundColor: '#fafafa' },
  piedTexte: { color: '#8e8e93', fontSize: 15 },
  piedLien: { color: '#ef4a5e', fontSize: 15, fontWeight: '700' },

  // --- Liste des comptes ---
  ligneCompte: { flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f1' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center',
    justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontSize: 22, fontWeight: '700' },
  compteCorps: { flex: 1, gap: 4 },
  comptePseudo: { color: '#111', fontSize: 17 },
  compteIdentifiant: { color: '#8e8e93', fontSize: 15 },

  avatarAjout: { width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f1f1f2', alignItems: 'center', justifyContent: 'center' },
  plus: { color: '#111', fontSize: 28, lineHeight: 32 },
  ajoutTexte: { flex: 1, color: '#111', fontSize: 17 },

  gerer: { alignItems: 'center', paddingVertical: 24 },
  gererTexte: { color: '#111', fontSize: 16, fontWeight: '600' },
})
