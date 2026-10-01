import React, { useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, SafeAreaView
} from 'react-native'
import { Text, TextInput } from '../composants/Texte'
import { useAuth } from '../lib/auth'

export default function Connexion({ onSucces }: { onSucces?: () => void } = {}) {
  const { connecter, inscrire } = useAuth()
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion')
  const [tel, setTel] = useState('')
  const [mdp, setMdp] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const valider = async () => {
    setErreur('')
    const chiffres = tel.replace(/\D/g, '')
    if (chiffres.length < 8) return setErreur('Numéro de téléphone incomplet')
    if (mdp.length < 6) return setErreur('Le mot de passe doit faire au moins 6 caractères')
    if (mode === 'inscription' && pseudo.trim().length < 3)
      return setErreur('Le pseudo doit faire au moins 3 caractères')

    setOccupe(true)
    try {
      if (mode === 'connexion') await connecter(chiffres, mdp)
      else await inscrire(chiffres, mdp, pseudo.trim().toLowerCase())
      onSucces?.()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.corps} keyboardShouldPersistTaps="handled">
          <Text style={s.titre}>{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</Text>
          <Text style={s.sousTitre}>
            {mode === 'connexion'
              ? 'Entrez votre numéro pour continuer'
              : 'Rejoignez la plateforme et publiez vos vidéos'}
          </Text>

          {!!erreur && <View style={s.erreur}><Text style={s.erreurTexte}>{erreur}</Text></View>}

          <Text style={s.etiquette}>Numéro de téléphone</Text>
          <TextInput style={s.champ} keyboardType="phone-pad" placeholder="01 XX XX XX XX"
            placeholderTextColor="#666" value={tel} onChangeText={setTel} />

          {mode === 'inscription' && <>
            <Text style={s.etiquette}>Pseudo</Text>
            <TextInput style={s.champ} autoCapitalize="none" placeholder="votre_pseudo"
              placeholderTextColor="#666" value={pseudo} onChangeText={setPseudo} />
          </>}

          <Text style={s.etiquette}>Mot de passe</Text>
          <TextInput style={s.champ} secureTextEntry placeholder="6 caractères minimum"
            placeholderTextColor="#666" value={mdp} onChangeText={setMdp} />

          <Pressable style={[s.bouton, occupe && { opacity: .5 }]} onPress={valider} disabled={occupe}>
            <Text style={s.boutonTexte}>
              {occupe ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          </Pressable>

          <Pressable onPress={() => { setMode(mode === 'connexion' ? 'inscription' : 'connexion'); setErreur('') }}>
            <Text style={s.lien}>
              {mode === 'connexion' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#000' },
  corps: { padding: 20, paddingTop: 30 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 6 },
  sousTitre: { color: 'rgba(255,255,255,.62)', fontSize: 14, marginBottom: 28 },
  etiquette: { color: 'rgba(255,255,255,.62)', fontSize: 13, marginBottom: 6 },
  champ: {
    backgroundColor: '#161616', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
    borderRadius: 10, padding: 14, fontSize: 16, color: '#fff', marginBottom: 16,
  },
  bouton: {
    backgroundColor: '#00a550', borderRadius: 10, padding: 15,
    alignItems: 'center', marginTop: 4, minHeight: 48, justifyContent: 'center',
  },
  boutonTexte: { color: '#000', fontWeight: '700', fontSize: 16 },
  lien: { color: '#00a550', textAlign: 'center', marginTop: 18, fontSize: 14 },
  erreur: {
    backgroundColor: 'rgba(232,51,74,.15)', borderWidth: 1, borderColor: '#e8334a',
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  erreurTexte: { color: '#ff8b9b', fontSize: 14 },
})
