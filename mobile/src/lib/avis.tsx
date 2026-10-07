// Bulle de confirmation passagere (« Vous êtes abonné(e) à … »), commune a
// toute l'application. Montee une fois au sommet ; `montrerAvis` l'affiche
// 2,2 s, un nouvel avis remplacant le precedent.
import React, { useSyncExternalStore } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../composants/Texte'

let avis: { texte: string; n: number } | null = null
let minuterie: ReturnType<typeof setTimeout> | null = null
const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach(f => f())
const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f) } }
const lire = () => avis

export function montrerAvis(texte: string) {
  avis = { texte, n: (avis?.n ?? 0) + 1 }
  prevenir()
  if (minuterie) clearTimeout(minuterie)
  minuterie = setTimeout(() => { avis = null; prevenir() }, 2200)
}

export function BulleAvis() {
  const courant = useSyncExternalStore(abonner, lire, lire)
  if (!courant) return null
  return (
    <View style={s.zone} pointerEvents="none">
      <View style={s.bulle} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Text style={s.texte}>{courant.texte}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  zone: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center', zIndex: 9999 },
  bulle: { backgroundColor: 'rgba(22,22,24,.9)', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, maxWidth: '86%' },
  texte: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
