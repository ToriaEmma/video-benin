import React, { useRef, useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, SafeAreaView, Image,
  type TextInput as TypeSaisie,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Svg, { Path } from 'react-native-svg'
import { Text, TextInput } from '../composants/Texte'
import { useAuth } from '../lib/auth'
import { Chevron, Menu } from '../composants/Icones'

type Cle = 'nom' | 'pseudo' | 'bio'

// Regle de la version web : lettres, chiffres, points et tirets bas, 3 a 24.
const PSEUDO_VALIDE = /^[a-zA-Z0-9_.]{3,24}$/

// Coche verte affichee quand le pseudo respecte le format (.edition-saisie svg).
const Coche = ({ taille = 19 }: { taille?: number }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke="#00ce96" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 12 5 6 9-12" />
  </Svg>
)

// Appareil photo pose sur l'avatar (.modifier-photo-rond svg).
const AppareilPhoto = ({ taille = 38 }: { taille?: number }) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="white">
    <Path fillRule="evenodd" d="M8 4 6 6H4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-2l-2-2H8Zm4 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
  </Svg>
)

export default function ModifierProfil({ onRetour }: { onRetour: () => void }) {
  const { profil, modifierProfil } = useAuth()
  const champBio = useRef<TypeSaisie>(null)
  const [champ, setChamp] = useState<Cle | null>(null)
  const [valeur, setValeur] = useState('')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)

  if (!profil) return null

  const ouvrir = (cle: Cle) => {
    setChamp(cle)
    setValeur(profil[cle] ?? profil.pseudo)
    setMessage('')
  }

  const sauver = async () => {
    if (!champ) return
    if (champ === 'pseudo' && !PSEUDO_VALIDE.test(valeur.trim())) {
      setMessage('Utilise 3 à 24 lettres, chiffres, points ou tirets bas.')
      return
    }
    setOccupe(true)
    try {
      await modifierProfil({ [champ]: valeur.trim() })
      setChamp(null); setMessage('')
    } catch {
      setMessage("Impossible d'enregistrer. Réessaie ou choisis un autre nom d'utilisateur.")
    } finally {
      setOccupe(false)
    }
  }

  const choisirPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: .7, base64: true,
    })
    if (r.canceled || !r.assets[0]) return
    const image = r.assets[0]
    // Meme garde-fou que le web : au-dela de 2 Mo, on refuse l'image.
    if ((image.fileSize ?? 0) > 2_000_000) {
      setMessage('Choisis une image de moins de 2 Mo.')
      return
    }
    try {
      const donnees = image.base64
        ? `data:image/jpeg;base64,${image.base64}`
        : image.uri
      await modifierProfil({ avatar_url: donnees })
      setMessage('Photo enregistrée.')
    } catch {
      setMessage("Impossible d'enregistrer la photo.")
    }
  }

  // ---- Sous-ecran d'edition d'un champ ----
  if (champ) {
    const titre = champ === 'nom' ? 'Nom'
      : champ === 'pseudo' ? "Nom d'utilisateur" : 'Bio'
    const limite = champ === 'nom' ? 30 : champ === 'pseudo' ? 24 : 160
    const valide = champ === 'bio'
      ? true
      : champ === 'nom' ? valeur.trim().length > 0 : PSEUDO_VALIDE.test(valeur.trim())
    const change = valeur.trim() !== (profil[champ] ?? profil.pseudo)
    const aide = champ === 'nom'
      ? "Ton nom est le surnom affiché sur ton profil. Il peut être différent de ton nom d'utilisateur."
      : champ === 'pseudo'
        ? "Les noms d'utilisateur ne peuvent contenir que des lettres, des chiffres, des tirets bas et des points."
        : 'Tu peux modifier ta biographie à tout moment.'

    // Insere « @ » a la position du curseur, comme le bouton Mention du web.
    const mentionner = () => {
      const debut = selection.start ?? valeur.length
      const fin = selection.end ?? debut
      if (valeur.length - (fin - debut) >= limite) return
      setValeur(valeur.slice(0, debut) + '@' + valeur.slice(fin))
      setSelection({ start: debut + 1, end: debut + 1 })
      requestAnimationFrame(() => champBio.current?.focus())
    }

    return (
      <SafeAreaView style={s.pageEdition}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={s.editionActions}>
            <Pressable onPress={() => { setChamp(null); setMessage('') }}>
              <Text style={s.editionAnnuler}>Annuler</Text>
            </Pressable>
            <Pressable
              disabled={occupe || !change || !valide || valeur.length > limite}
              onPress={sauver}>
              <Text style={[
                s.editionEnregistrer,
                (occupe || !change || !valide || valeur.length > limite) && s.editionDesactive,
              ]}>
                {occupe ? 'Enregistrement…' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>

          <Text style={s.editionTitre}>{titre}</Text>
          <Text style={s.editionAide}>{aide}</Text>

          <View style={s.editionSaisie}>
            {champ === 'bio' ? (
              <TextInput ref={champBio} style={[s.saisie, s.saisieBio]} autoFocus
                multiline value={valeur} maxLength={limite}
                selection={selection}
                onSelectionChange={e => setSelection(e.nativeEvent.selection)}
                onChangeText={setValeur} />
            ) : (
              <>
                <TextInput style={s.saisie} autoFocus value={valeur} maxLength={limite}
                  autoCapitalize={champ === 'pseudo' ? 'none' : 'words'}
                  autoCorrect={champ !== 'pseudo'}
                  onChangeText={setValeur} />
                {champ === 'pseudo' && <>
                  {valide && <Coche />}
                  <Pressable style={s.editionEffacer} onPress={() => setValeur('')}>
                    <Text style={s.editionEffacerTexte}>×</Text>
                  </Pressable>
                </>}
              </>
            )}
          </View>

          <Text style={s.editionCompteur}>{valeur.length}/{limite}</Text>
          {!!message && <Text style={s.message}>{message}</Text>}

          {champ === 'bio' && (
            <Pressable style={s.editionMention} onPress={mentionner}>
              <Text style={s.editionMentionTexte}>@ Mention</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---- Ecran principal ----
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.corps}>
        <View style={s.entete}>
          <Pressable onPress={onRetour} hitSlop={10} style={s.enteteBouton}>
            <Chevron taille={24} couleur="#111" />
          </Pressable>
          <Text style={s.enteteTitre}>Modifier le profil</Text>
          <View style={s.enteteBouton} />
        </View>

        <Pressable style={s.photo} onPress={choisirPhoto}>
          <View style={s.photoRond}>
            {profil.avatar_url
              ? <Image source={{ uri: profil.avatar_url }} style={s.photoImage} />
              : <Text style={s.photoLettre}>{profil.pseudo.charAt(0).toUpperCase()}</Text>}
            <View style={s.photoIcone}><AppareilPhoto /></View>
          </View>
          <Text style={s.photoTexte}>Changer de photo</Text>
        </Pressable>

        <View style={s.carte}>
          <Pressable style={s.ligne} onPress={() => ouvrir('nom')}>
            <Text style={s.ligneCle}>Nom</Text>
            <Text style={s.ligneValeur} numberOfLines={1}>{profil.nom ?? profil.pseudo}</Text>
            <Chevron taille={18} couleur="#888" />
          </Pressable>
          <Pressable style={s.ligne} onPress={() => ouvrir('pseudo')}>
            <Text style={s.ligneCle}>Nom{'\n'}d'utilisateur</Text>
            <Text style={s.ligneValeur} numberOfLines={1}>{profil.pseudo}</Text>
            <Chevron taille={18} couleur="#888" />
          </Pressable>
        </View>

        <Text style={s.section}>Informations de base</Text>
        <View style={s.carte}>
          <Pressable style={[s.ligne, s.ligneBio]} onPress={() => ouvrir('bio')}>
            <Text style={s.ligneCle}>Bio</Text>
            <Text style={s.ligneValeur} numberOfLines={5}>
              {profil.bio || 'Ajouter une bio'}
            </Text>
            <Chevron taille={18} couleur="#888" />
          </Pressable>
        </View>

        <Text style={s.section}>Modifier l'ordre d'affichage</Text>
        <View style={[s.carte, s.studio]}>
          <Text style={s.studioTexte}>Studio créateur</Text>
          <Menu taille={20} couleur="#888" />
        </View>

        {!!message && <Text style={s.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  )
}

// Valeurs reprises de app/src/pages/profil.css (.modifier-*, .edition-*).
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },
  corps: { padding: 16, paddingHorizontal: 12, paddingBottom: 40 },

  entete: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  enteteBouton: { width: 32, minHeight: 40, justifyContent: 'center' },
  enteteTitre: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#111' },

  photo: { alignItems: 'center', gap: 12, marginBottom: 24 },
  photoRond: { width: 116, height: 116, borderRadius: 58, overflow: 'hidden',
    backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: '100%', height: '100%', opacity: .65 },
  photoLettre: { color: '#fff', fontSize: 42, fontWeight: '700' },
  photoIcone: { position: 'absolute' },
  photoTexte: { color: '#008b9d', fontSize: 16, fontWeight: '500' },

  carte: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 17, paddingHorizontal: 16, minHeight: 58 },
  ligneBio: { alignItems: 'flex-start' },
  ligneCle: { width: '32%', color: '#666', fontSize: 15, lineHeight: 18 },
  ligneValeur: { flex: 1, color: '#111', fontSize: 15, fontWeight: '500', lineHeight: 20 },
  section: { fontSize: 13, color: '#999', marginTop: 20, marginBottom: 9, marginHorizontal: 16 },

  studio: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  studioTexte: { color: '#111', fontSize: 15, fontWeight: '500' },
  message: { fontSize: 13, lineHeight: 20, color: '#666', paddingVertical: 12, paddingHorizontal: 4 },

  // Sous-ecran d'edition (.edition-champ) : fond blanc plein.
  pageEdition: { flex: 1, backgroundColor: '#fff', padding: 16 },
  editionActions: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 36 },
  editionAnnuler: { color: '#111', fontSize: 16, minHeight: 44, lineHeight: 44 },
  editionEnregistrer: { color: '#ff2856', fontSize: 16, fontWeight: '500',
    minHeight: 44, lineHeight: 44 },
  editionDesactive: { color: '#ffb5c5' },
  editionTitre: { fontSize: 25, fontWeight: '700', letterSpacing: -.5,
    lineHeight: 30, color: '#111', marginBottom: 16 },
  editionAide: { fontSize: 14, lineHeight: 20, color: '#666', marginBottom: 25 },
  editionSaisie: { flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#e7e7e7', borderRadius: 11, padding: 14 },
  saisie: { flex: 1, color: '#111', fontSize: 16, lineHeight: 20, padding: 0 },
  saisieBio: { minHeight: 132, textAlignVertical: 'top' },
  editionEffacer: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#a1a1a1',
    alignItems: 'center', justifyContent: 'center' },
  editionEffacerTexte: { color: '#fff', fontSize: 15, lineHeight: 17 },
  editionCompteur: { textAlign: 'right', color: '#aaa', fontSize: 13,
    marginTop: 10, marginHorizontal: 4 },
  editionMention: { marginTop: 70, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingVertical: 7, paddingHorizontal: 10, alignSelf: 'flex-start' },
  editionMentionTexte: { color: '#111', fontSize: 15 },
})
