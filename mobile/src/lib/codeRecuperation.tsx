// Fenetre « Ton code de récupération ». Le code n'est montre qu'une fois
// (a l'inscription, apres une recuperation ou quand on en demande un
// nouveau) : il doit donc rester affiche quoi qu'il arrive aux ecrans
// derriere (la connexion fait changer de page). La fenetre est montee une
// fois, au sommet de l'application, et ouverte par `montrerCodeRecuperation`.
import React, { useState, useSyncExternalStore } from 'react'
import { View, StyleSheet, Pressable, Modal, Platform, Share } from 'react-native'
import { Text } from '../composants/Texte'
import { useColonne } from './ecran'

let code: string | null = null
const abonnes = new Set<() => void>()
const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f) } }
const lire = () => code

export function montrerCodeRecuperation(nouveau: string) {
  code = nouveau
  abonnes.forEach(f => f())
}

function fermer() {
  code = null
  abonnes.forEach(f => f())
}

export function FenetreCodeRecuperation() {
  const affiche = useSyncExternalStore(abonner, lire, lire)
  const [copie, setCopie] = useState(false)
  // Grand ecran : centree sur la colonne, comme les autres fenetres.
  const colonne = useColonne()
  if (!affiche) return null

  const copier = async () => {
    try {
      if (Platform.OS === 'web') await navigator.clipboard.writeText(affiche)
      else await Share.share({ message: `Mon code de récupération TockTick : ${affiche}` })
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch { /* Copie refusee : le code reste affiche, a recopier a la main. */ }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => { /* Fermeture volontaire uniquement. */ }}>
      <View style={s.fond}>
      <View style={[s.voile, colonne && { width: colonne.largeur, marginLeft: colonne.gauche }]}>
        <View style={s.carte} accessibilityRole="alert">
          <Text style={s.titre}>Ton code de récupération</Text>
          <Text style={s.texte}>
            Note-le ou fais-en une capture d’écran, et garde-le pour toi. Si tu oublies ton mot de passe,
            ce code te permettra d’en choisir un nouveau. Il ne sera plus affiché.
          </Text>
          <Text style={s.code} selectable accessibilityLabel={`Code : ${affiche.split('').join(' ')}`}>{affiche}</Text>
          <Pressable style={[s.bouton, copie && s.boutonFait]} onPress={copier} accessibilityRole="button">
            <Text style={s.boutonTexte}>{copie ? 'Code copié ✓' : 'Copier le code'}</Text>
          </Pressable>
          <Pressable style={[s.bouton, s.boutonGris]} onPress={fermer} accessibilityRole="button">
            <Text style={[s.boutonTexte, s.boutonGrisTexte]}>J’ai noté mon code</Text>
          </Pressable>
        </View>
      </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  // Fond assombri sur toute la fenetre ; la carte se centre dans `voile`
  // (la colonne sur grand ecran).
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,.6)' },
  voile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  carte: { backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 400, gap: 12 },
  titre: { fontSize: 19, fontWeight: '700', color: '#111', textAlign: 'center' },
  texte: { fontSize: 14, color: '#555', lineHeight: 20, textAlign: 'center' },
  code: { fontSize: 22, fontWeight: '800', letterSpacing: 1.5, color: '#111', textAlign: 'center',
    backgroundColor: '#f4f4f5', borderRadius: 10, paddingVertical: 14, fontVariant: ['tabular-nums'] },
  bouton: { minHeight: 46, borderRadius: 8, backgroundColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  boutonFait: { backgroundColor: '#1fa774' },
  boutonGris: { backgroundColor: '#f1f1f2' },
  boutonTexte: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  boutonGrisTexte: { color: '#111' },
})
