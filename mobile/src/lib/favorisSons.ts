// Sons mis en favoris, gardes sur l'appareil. Partages entre la feuille
// « Ajouter un son » et la feuille ouverte depuis le disque du fil.
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Son } from './sons'

const CLE = 'tocktick-sons-favoris-v1'
let favoris: Son[] = []
let charge = false
const abonnes = new Set<(l: Son[]) => void>()

const diffuser = () => abonnes.forEach(f => f(favoris))

async function charger() {
  if (charge) return
  charge = true
  try {
    const brut = await AsyncStorage.getItem(CLE)
    if (brut) favoris = JSON.parse(brut)
  } catch { /* Stockage illisible : liste vide. */ }
  diffuser()
}

export function basculerFavoriSon(son: Son) {
  favoris = favoris.some(x => x.id === son.id)
    ? favoris.filter(x => x.id !== son.id)
    : [son, ...favoris]
  diffuser()
  AsyncStorage.setItem(CLE, JSON.stringify(favoris)).catch(() => {})
}

export function useFavorisSons() {
  const [liste, setListe] = useState<Son[]>(favoris)
  useEffect(() => {
    abonnes.add(setListe)
    charger()
    return () => { abonnes.delete(setListe) }
  }, [])
  return { favoris: liste, estFavori: (id: string) => liste.some(x => x.id === id) }
}
