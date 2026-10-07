// Invitation a se connecter. Un visiteur sans compte peut regarder le fil ;
// toute interaction (aimer, commenter, suivre, creer…) lui propose de se
// connecter, au lieu d'un bouton qui ne fait rien.
//
//   const exiger = useExigerCompte()
//   <Pressable onPress={() => exiger('aimer cette vidéo') && aimer()} />
import React, { createContext, useCallback, useContext, useState } from 'react'
import { StyleSheet, Pressable, Modal } from 'react-native'
import { Text } from '../composants/Texte'
import { useAuth } from './auth'
import { ListeComptes, Inscription } from '../ecrans/Connexion'
import { useColonne } from './ecran'

type Exiger = (raison: string) => boolean

const Contexte = createContext<Exiger>(() => true)

export const useExigerCompte = () => useContext(Contexte)

export function FournisseurInvite({ children }: { children: React.ReactNode }) {
  const { profil } = useAuth()
  const [raison, setRaison] = useState<string | null>(null)
  const [feuille, setFeuille] = useState<'comptes' | 'inscription' | null>(null)

  // Vrai si l'action peut continuer ; sinon l'invitation s'ouvre.
  const exiger = useCallback<Exiger>(r => {
    if (profil) return true
    setRaison(r)
    return false
  }, [profil])

  const fermer = () => { setRaison(null); setFeuille(null) }
  // Grand ecran : la carte se centre sur la colonne, pas sur la fenetre.
  const colonne = useColonne()
  const zone = colonne ? { width: colonne.largeur, marginLeft: colonne.gauche, alignSelf: 'flex-start' as const } : undefined

  return (
    <Contexte.Provider value={exiger}>
      {children}
      <Modal visible={!!raison && !feuille} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable style={[s.voile, zone]} onPress={fermer}>
          <Pressable style={s.carte} onPress={() => { /* Garde la carte ouverte. */ }}>
            <Text style={s.titre}>Connecte-toi à TockTick</Text>
            <Text style={s.texte}>Crée un compte ou connecte-toi pour {raison}.</Text>
            <Pressable style={s.principal} onPress={() => setFeuille('comptes')}
              accessibilityRole="button">
              <Text style={s.principalTexte}>Se connecter</Text>
            </Pressable>
            <Pressable style={s.secondaire} onPress={() => setFeuille('inscription')}
              accessibilityRole="button">
              <Text style={s.secondaireTexte}>Créer un compte</Text>
            </Pressable>
            <Pressable onPress={fermer} hitSlop={8} accessibilityRole="button">
              <Text style={s.plusTard}>Plus tard</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <ListeComptes visible={feuille === 'comptes'} onFermer={fermer}
        onInscription={() => setFeuille('inscription')} onSucces={fermer} />
      <Inscription visible={feuille === 'inscription'} onFermer={fermer}
        onConnexion={() => setFeuille('comptes')} onSucces={fermer} />
    </Contexte.Provider>
  )
}

const s = StyleSheet.create({
  voile: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  carte: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignSelf: 'stretch', maxWidth: 380,
    alignItems: 'center', gap: 12 },
  titre: { fontSize: 19, fontWeight: '700', color: '#111' },
  texte: { fontSize: 14.5, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  principal: { backgroundColor: '#ff2856', borderRadius: 8, minHeight: 46, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center' },
  principalTexte: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  secondaire: { backgroundColor: '#f1f1f2', borderRadius: 8, minHeight: 46, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center' },
  secondaireTexte: { color: '#111', fontSize: 15.5, fontWeight: '600' },
  plusTard: { color: '#8e8e93', fontSize: 14, marginTop: 4 },
})
