// Sons mis en favoris, ranges sur le compte (API /sons-favoris) : ils
// suivent l'utilisateur d'un appareil a l'autre, et un visiteur sans compte
// n'en a pas. Partages entre la feuille « Ajouter un son » et la feuille
// ouverte depuis le disque du fil.
import { useSyncExternalStore } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiSonsFavoris } from './api'
import { estSonDistant, resoudreSon } from './resolutionSons'
import type { Son } from './sons'

// Anciens favoris gardes sur l'appareil : repris une fois sur le compte.
const CLE_ANCIENNE = 'tocktick-sons-favoris-v1'

let favoris: Son[] = []
let compte: string | null = null
const abonnes = new Set<() => void>()
const diffuser = () => abonnes.forEach(f => f())
const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f) } }
const lire = () => favoris

// Complete un favori garde par le serveur en son jouable (adresse fraiche).
async function rendreJouable(f: Partial<Son> & { id: string }): Promise<Son> {
  const base: Son = {
    id: f.id, titre: f.titre ?? 'son', artiste: f.artiste ?? '', licence: f.licence ?? '',
    publications: 0, duree: f.duree ?? 0, url: '', couleur: f.couleur ?? '#3a3a3c',
    original: f.original, pochette: f.pochette,
  }
  if (!estSonDistant(f.id)) return base
  const frais = await resoudreSon(f.id).catch(() => null)
  return frais ? { ...base, url: frais.url, duree: frais.duree || base.duree, pochette: frais.pochette ?? base.pochette } : base
}

// Appele a chaque changement de compte (connexion, deconnexion).
export async function chargerFavorisSons(profilId: string | null) {
  if (profilId === compte) return
  compte = profilId
  favoris = []
  diffuser()
  if (!profilId) return
  try {
    let liste = await apiSonsFavoris.liste()
    // Premiere connexion apres la mise a jour : les favoris de l'appareil
    // rejoignent le compte, puis la copie locale est effacee.
    const brut = await AsyncStorage.getItem(CLE_ANCIENNE).catch(() => null)
    if (brut) {
      const anciens: Son[] = JSON.parse(brut)
      await Promise.all(anciens.filter(a => !liste.some(l => l.id === a.id)).map(a => apiSonsFavoris.ajouter(a).catch(() => null)))
      await AsyncStorage.removeItem(CLE_ANCIENNE).catch(() => {})
      liste = await apiSonsFavoris.liste()
    }
    const jouables = await Promise.all(liste.map(rendreJouable))
    if (compte === profilId) { favoris = jouables; diffuser() }
  } catch { /* Favoris indisponibles : la liste reste vide. */ }
}

export function basculerFavoriSon(son: Son) {
  if (!compte) return
  const etait = favoris.some(x => x.id === son.id)
  favoris = etait ? favoris.filter(x => x.id !== son.id) : [son, ...favoris]
  diffuser()
  const envoi = etait ? apiSonsFavoris.retirer(son.id) : apiSonsFavoris.ajouter(son)
  envoi.catch(() => {
    // Refus du serveur : on revient a l'etat precedent.
    favoris = etait ? [son, ...favoris] : favoris.filter(x => x.id !== son.id)
    diffuser()
  })
}

export function useFavorisSons() {
  const liste = useSyncExternalStore(abonner, lire, lire)
  return { favoris: liste, estFavori: (id: string) => liste.some(x => x.id === id) }
}
