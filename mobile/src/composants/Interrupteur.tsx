import React from 'react'
import { Pressable, View, StyleSheet } from 'react-native'

// Interrupteur de la page de publication : piste cyan une fois active,
// grise au repos, avec la pastille blanche qui glisse d'un bord a l'autre.
export default function Interrupteur({ actif, onChange }: {
  actif: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Pressable hitSlop={8} onPress={() => onChange(!actif)}
      style={[s.piste, actif ? s.pisteActive : s.pisteInactive]}>
      <View style={[s.pastille, actif && s.pastilleActive]} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  piste: { width: 48, height: 28, borderRadius: 14, padding: 2.5,
    justifyContent: 'center' },
  pisteActive: { backgroundColor: '#5ad2ec' },
  pisteInactive: { backgroundColor: '#e3e3e5' },
  pastille: { width: 23, height: 23, borderRadius: 11.5, backgroundColor: '#fff' },
  pastilleActive: { alignSelf: 'flex-end' },
})
