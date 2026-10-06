// Menu de gauche de la mise en page large (ordinateur, tablette), a la place
// de la barre du bas du telephone : memes destinations, comme TikTok sur
// ordinateur.
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from './Texte'
import { Accueil, Amis, Messages, Plus, Personne } from './Icones'

export type Destination = 'fil' | 'amis' | 'publier' | 'messages' | 'profil'

const ENTREES: { cle: Destination; nom: string; Icone: React.ComponentType<{ taille?: number; couleur?: string; plein?: boolean }> }[] = [
  { cle: 'fil', nom: 'Pour toi', Icone: Accueil },
  { cle: 'amis', nom: 'Amis', Icone: Amis },
  { cle: 'publier', nom: 'Créer', Icone: Plus },
  { cle: 'messages', nom: 'Messages', Icone: Messages },
  { cle: 'profil', nom: 'Profil', Icone: Personne },
]

export default function MenuLateral({ actif, pseudo, compact, clair = false, onAller }: {
  actif: Destination
  // Compte connecte, ou null pour un visiteur.
  pseudo: string | null
  // Tablette en portrait : icones seules, pour laisser la place a la video.
  compact: boolean
  // Pages claires (profil, messages) : le menu passe en clair avec elles.
  clair?: boolean
  onAller: (destination: Destination) => void
}) {
  return (
    <View style={[s.menu, compact && s.menuCompact, clair && s.menuClair]} accessibilityRole="menu">
      <Text style={[s.logo, clair && s.texteSombre]}>{compact ? 'T' : 'TockTick'}</Text>
      {ENTREES.map(({ cle, nom, Icone }) => {
        const choisi = actif === cle
        return (
          <Pressable key={cle} onPress={() => onAller(cle)} accessibilityRole="menuitem"
            accessibilityLabel={nom} accessibilityState={{ selected: choisi }}
            style={etat => [s.entree, compact && s.entreeCompacte,
              // react-native-web ajoute « hovered » a l'etat (survol souris).
              (etat as { hovered?: boolean }).hovered && s.entreeSurvol]}>
            <Icone taille={26} plein={choisi} couleur={choisi ? '#ff2856' : clair ? '#111' : '#fff'} />
            {!compact && <Text style={[s.nom, clair && s.texteSombre, choisi && s.nomChoisi]}>{nom}</Text>}
          </Pressable>
        )
      })}
      <View style={s.separateur} />
      {pseudo ? (
        <Pressable style={[s.compte, compact && s.entreeCompacte]} onPress={() => onAller('profil')}
          accessibilityRole="button" accessibilityLabel="Mon profil">
          <View style={s.avatar}><Text style={s.avatarLettre}>{pseudo.charAt(0).toUpperCase()}</Text></View>
          {!compact && <Text style={[s.pseudo, clair && s.texteSombre]} numberOfLines={1}>{pseudo}</Text>}
        </Pressable>
      ) : !compact && (
        <View style={s.invite}>
          <Text style={s.inviteTexte}>Connecte-toi pour suivre des comptes, aimer des vidéos et voir les commentaires.</Text>
          <Pressable style={s.connexion} onPress={() => onAller('profil')} accessibilityRole="button">
            <Text style={s.connexionTexte}>Se connecter</Text>
          </Pressable>
        </View>
      )}
      {!compact && <Text style={s.pied}>© 2026 TockTick · Bénin</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  menu: { width: 240, paddingHorizontal: 12, paddingVertical: 20, gap: 4, backgroundColor: '#000',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(255,255,255,.12)' },
  menuCompact: { width: 76, alignItems: 'center' },
  menuClair: { backgroundColor: '#fff', borderRightColor: 'rgba(0,0,0,.08)' },
  texteSombre: { color: '#111' },
  logo: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -.5, paddingHorizontal: 10, marginBottom: 18 },
  entree: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 8 },
  entreeCompacte: { paddingHorizontal: 12, justifyContent: 'center' },
  entreeSurvol: { backgroundColor: 'rgba(255,255,255,.08)' },
  nom: { color: '#fff', fontSize: 17, fontWeight: '600' },
  nomChoisi: { color: '#ff2856' },
  separateur: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,.14)', marginVertical: 14, alignSelf: 'stretch' },
  compte: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8485c', alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pseudo: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  invite: { paddingHorizontal: 10, gap: 12 },
  inviteTexte: { color: 'rgba(255,255,255,.6)', fontSize: 13.5, lineHeight: 19 },
  connexion: { borderWidth: 1, borderColor: '#ff2856', borderRadius: 6, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  connexionTexte: { color: '#ff2856', fontSize: 15.5, fontWeight: '700' },
  pied: { color: 'rgba(255,255,255,.35)', fontSize: 12, marginTop: 'auto', paddingHorizontal: 10 },
})
