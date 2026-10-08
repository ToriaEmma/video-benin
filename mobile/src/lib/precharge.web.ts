// Prechargement des videos du fil (site).
//
// Safari sur iPhone ne precharge jamais une video avant qu'elle soit
// lancee : chaque glissement repartait d'un chargement a froid (plusieurs
// secondes, le stockage etant en Europe). Les videos suivantes sont donc
// telechargees en entier en arriere-plan, une a la fois, puis lues depuis
// la memoire (adresse blob:) : au glissement, elles demarrent aussitot.
import { useEffect, useState, useSyncExternalStore } from 'react'

// Videos gardees en memoire (~1 a 2 Mo chacune).
const GARDEES = 5

type Entree = { blob: string | null; controle: AbortController }
const entrees = new Map<string, Entree>()
const file: string[] = []
let enCours: string | null = null

const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach(f => f())
const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f) } }

function suivant() {
  if (enCours) return
  const url = file.shift()
  if (!url) return
  const e = entrees.get(url)
  if (!e || e.blob) return suivant()
  enCours = url
  fetch(url, { signal: e.controle.signal })
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.blob() })
    .then(b => { e.blob = URL.createObjectURL(b); prevenir() })
    .catch(() => { entrees.delete(url) })
    .finally(() => { enCours = null; suivant() })
}

// Demande les videos a venir, dans l'ordre ; les plus anciennes sortent.
export function precharger(urls: string[]) {
  for (const url of urls) {
    if (!url || url.startsWith('blob:') || entrees.has(url)) continue
    entrees.set(url, { blob: null, controle: new AbortController() })
    file.push(url)
  }
  const garder = new Set(urls)
  for (const [url, e] of entrees) {
    if (entrees.size <= GARDEES) break
    if (garder.has(url)) continue
    e.controle.abort()
    if (e.blob) URL.revokeObjectURL(e.blob)
    entrees.delete(url)
  }
  suivant()
}

const lire = (url: string) => entrees.get(url)?.blob ?? null

// Adresse a lire pour une carte : la copie en memoire si elle est prete.
// La carte regardee garde la source avec laquelle elle a commence
// (changer de source en pleine lecture la ferait repartir de zero).
export function useSourceVideo(url: string, actif: boolean): string {
  const blob = useSyncExternalStore(abonner, () => lire(url), () => null)
  const source = blob ?? url
  const [figee, setFigee] = useState(source)
  // Ajustement pendant le rendu : la carte non regardee suit la meilleure source.
  if (!actif && figee !== source) setFigee(source)
  return actif ? figee : source
}

// Lance le prechargement des `n` videos qui suivent la carte regardee,
// une fois qu'elle joue vraiment : tant qu'elle charge, tout le debit lui
// est laisse (sinon les telechargements se partagent la connexion et la
// video regardee, et donc son son, demarrent plus tard).
export function usePrechargementFil(urls: string[], index: number, regardeeJoue: boolean, n = 2) {
  const cle = regardeeJoue ? urls.slice(index + 1, index + 1 + n).join('|') : ''
  useEffect(() => {
    if (cle) precharger(cle.split('|'))
  }, [cle])
}
