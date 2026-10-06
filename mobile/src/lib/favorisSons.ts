// Sons mis en favoris, gardes sur l'appareil. Partages entre la feuille
// « Ajouter un son » et la feuille ouverte depuis le disque du fil.
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Son } from './sons'
import { estSonDistant, resoudreSon } from './resolutionSons'

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
  rafraichir()
}

// Les extraits Deezer ont une adresse signee qui expire en un jour : un
// favori garde tel quel ne se lirait plus. On redemande chaque son distant
// (Deezer ou son original d'une video) a l'ouverture.
async function rafraichir() {
  const frais = await Promise.all(favoris.map(async f => {
    if (!estSonDistant(f.id)) return f
    const r = await resoudreSon(f.id).catch(() => null)
    // Son original : on garde l'identite du favori (video d'origine), avec
    // l'adresse a jour.
    if (!r || (f.original && !r.original)) return f
    return { ...f, url: r.url, duree: r.duree || f.duree, pochette: r.pochette ?? f.pochette }
  }))
  // La liste a pu changer pendant la resolution : on ne met a jour que les adresses.
  const parId = new Map(frais.map(f => [f.id, f]))
  favoris = favoris.map(f => parId.get(f.id) ?? f)
  diffuser()
  AsyncStorage.setItem(CLE, JSON.stringify(favoris)).catch(() => {})
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
