// ============================================================
// Vrais sons : extraits officiels de 30 secondes du catalogue Deezer
// (API publique, sans cle). Un extrait sert l'apercu et la musique
// jouee par-dessus la video.
//
// Les adresses d'extraits expirent au bout de quelques heures : une
// publication garde donc l'identifiant « dz:<numero> », et l'extrait
// est redemande a la lecture.
//
// Droits : un extrait promotionnel n'est pas une licence de
// synchronisation. Une mise en service publique demande un accord avec
// les ayants droit (maisons de disques, BUBEDRA).
// ============================================================

import { Platform } from 'react-native'
import type { Son } from './sons'

const API = 'https://api.deezer.com'

export type PisteDeezer = {
  id: number
  title: string
  title_short?: string
  duration: number
  preview: string
  rank?: number
  artist: { name: string }
  album: { cover_medium?: string; cover_small?: string }
}

// L'API Deezer ne renvoie pas d'en-tete CORS : sur le web on passe par
// JSONP (fourni par Deezer), ailleurs par un simple fetch.
let compteur = 0
function appeler<T>(chemin: string): Promise<T> {
  const url = `${API}${chemin}${chemin.includes('?') ? '&' : '?'}output=${Platform.OS === 'web' ? 'jsonp' : 'json'}`
  if (Platform.OS !== 'web') {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error('Deezer indisponible')
      return r.json() as Promise<T>
    })
  }
  return new Promise((resoudre, rejeter) => {
    const nom = `__deezer${Date.now()}_${compteur++}`
    const script = document.createElement('script')
    const fin = () => { delete (window as unknown as Record<string, unknown>)[nom]; script.remove(); clearTimeout(minuteur) }
    const minuteur = setTimeout(() => { fin(); rejeter(new Error('Deezer ne répond pas')) }, 10000)
    ;(window as unknown as Record<string, unknown>)[nom] = (donnees: T) => { fin(); resoudre(donnees) }
    script.src = `${url}&callback=${nom}`
    script.onerror = () => { fin(); rejeter(new Error('Deezer indisponible')) }
    document.head.appendChild(script)
  })
}

const TEINTES = ['#c8743f', '#4a5a7d', '#8d2230', '#e2a33c', '#2f4858', '#6b4f7d', '#3f6b8d', '#a33b33']

export function versSon(p: PisteDeezer): Son {
  return {
    id: `dz:${p.id}`,
    titre: p.title_short || p.title,
    artiste: p.artist.name,
    licence: 'Extrait Deezer · 30 s',
    // Le rang Deezer (popularite) tient lieu de compteur d'utilisations.
    publications: Math.max(1, Math.round((p.rank ?? 100000) / 100)),
    duree: 30,
    url: p.preview,
    couleur: TEINTES[p.id % TEINTES.length],
    pochette: p.album.cover_medium || p.album.cover_small,
  }
}

const garder = (liste: PisteDeezer[]) => liste.filter(p => p.preview).map(versSon)

// Recherche libre (titre, artiste).
export async function rechercherSons(terme: string): Promise<Son[]> {
  const q = terme.trim()
  if (!q) return []
  const r = await appeler<{ data: PisteDeezer[] }>(`/search?q=${encodeURIComponent(q)}&limit=30`)
  return garder(r.data ?? [])
}

// Classement mondial du moment.
export async function sonsPopulaires(): Promise<Son[]> {
  const r = await appeler<{ data: PisteDeezer[] }>('/chart/0/tracks?limit=40')
  return garder(r.data ?? [])
}

// Selection « Pour toi » : artistes afro et francophones ecoutes au Benin.
const ARTISTES = ['Tiakola', 'Burna Boy', 'Fally Ipupa', 'Aya Nakamura', 'Asake', 'Tayc', 'Rema', 'Gaz Mawete', 'Ninho', 'Wizkid', 'Innoss\'B', 'Zeynab']
export async function sonsPourToi(): Promise<Son[]> {
  // L'artiste exact d'abord, puis ses titres les plus ecoutes : une recherche
  // par nom ramenait des homonymes sans rapport.
  const meme = (x: string, y: string) => x.localeCompare(y, 'fr', { sensitivity: 'base' }) === 0
  const titresDe = async (nom: string) => {
    const a = await appeler<{ data: { id: number; name: string }[] }>(`/search/artist?q=${encodeURIComponent(nom)}&limit=1`)
    const artiste = a.data?.[0]
    let pistes: PisteDeezer[] = []
    if (artiste) {
      const t = await appeler<{ data: PisteDeezer[] }>(`/artist/${artiste.id}/top?limit=12`)
      pistes = t.data ?? []
    }
    // Secours : recherche des titres de l'artiste quand son classement est vide.
    if (!pistes.length) {
      const r = await appeler<{ data: PisteDeezer[] }>(`/search?q=${encodeURIComponent(nom)}&limit=15`)
      pistes = r.data ?? []
    }
    // Ses propres titres d'abord, les featurings ensuite.
    const nomExact = artiste?.name ?? nom
    const siens = pistes.filter(p => meme(p.artist.name, nomExact))
    const autres = pistes.filter(p => !meme(p.artist.name, nomExact))
    return garder([...siens, ...autres]).slice(0, 4)
  }
  const resultats = await Promise.allSettled(ARTISTES.map(titresDe))
  // On alterne les artistes : un titre de chacun, puis le suivant.
  const listes = resultats.map(r => (r.status === 'fulfilled' ? r.value : []))
  const melange: Son[] = []
  for (let i = 0; i < 4; i++) for (const l of listes) if (l[i]) melange.push(l[i])
  if (!melange.length) throw new Error('Deezer indisponible')
  return melange
}

// Son d'une publication : l'extrait est redemande (adresse fraiche).
//
// Les sons deja resolus sont gardes sur l'appareil jusqu'a l'expiration de
// leur adresse signee (parametre « exp » de Deezer, environ un jour) : a la
// reouverture, le fil n'attend plus Deezer avant d'afficher ses videos.
const cache = new Map<string, Promise<Son | null>>()
const CLE_SONS = 'tocktick-sons-deezer-v1'
// Marge de securite : une adresse qui expire dans moins de 10 min est redemandee.
const MARGE_EXPIRATION = 10 * 60

type SonGarde = { son: Son; expire: number }

function lireGardes(): Record<string, SonGarde> {
  try { return JSON.parse(globalThis.localStorage?.getItem(CLE_SONS) ?? '{}') } catch { return {} }
}

function garderSon(id: string, son: Son) {
  const expire = Number(/exp=(\d+)/.exec(son.url)?.[1] ?? 0)
  if (!expire) return
  try {
    const maintenant = Date.now() / 1000
    const gardes = lireGardes()
    // Menage des sons expires au passage.
    for (const [cle, g] of Object.entries(gardes)) if (g.expire < maintenant) delete gardes[cle]
    gardes[id] = { son, expire }
    globalThis.localStorage?.setItem(CLE_SONS, JSON.stringify(gardes))
  } catch { /* Stockage plein ou indisponible : on redemandera a Deezer. */ }
}

export function sonDeezer(id: string): Promise<Son | null> {
  if (!id.startsWith('dz:')) return Promise.resolve(null)
  if (!cache.has(id)) {
    const garde = lireGardes()[id]
    if (garde && garde.expire - MARGE_EXPIRATION > Date.now() / 1000) {
      cache.set(id, Promise.resolve(garde.son))
      return cache.get(id)!
    }
    const promesse = appeler<PisteDeezer & { error?: unknown }>(`/track/${id.slice(3)}`)
      .then(p => {
        const son = p && !p.error && p.preview ? versSon(p) : null
        if (son) garderSon(id, son)
        return son
      })
      .catch(() => { cache.delete(id); return null })
    cache.set(id, promesse)
  }
  return cache.get(id)!
}
