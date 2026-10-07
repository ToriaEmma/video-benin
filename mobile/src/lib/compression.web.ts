// Compression d'une video importee de la galerie (web).
//
// Une video de telephone pese souvent 10 a 15 Mo (1080p, debit eleve) :
// chaque lecture la ferait telecharger en entier, ce qui coute cher en
// donnees mobiles et en transfert pour l'hebergement. Au-dela d'un certain
// poids ou d'une certaine taille, elle est re-encodee en 540 px de large
// (~1 Mbit/s, comme les videos filmees sur le site) et limitee a 90 s.
import { dimensionsVideo, rendreVideo } from './rendu'

const POIDS_MAX = 3.5 * 1024 * 1024
const COTE_MAX = 960
const DUREE_MAX = 90

export async function compresserSiLourde(uri: string, surProgression?: (part: number) => void): Promise<string> {
  const [poids, dims] = await Promise.all([
    fetch(uri).then(r => r.blob()).then(b => b.size).catch(() => 0),
    dimensionsVideo(uri).catch(() => null),
  ])
  if (!dims) return uri
  const legere = poids > 0 && poids <= POIDS_MAX && Math.max(dims.l, dims.h) <= COTE_MAX && dims.duree <= DUREE_MAX
  if (legere) return uri
  const fin = dims.duree > 0 ? Math.min(dims.duree, DUREE_MAX) : DUREE_MAX
  return rendreVideo([{ uri, fin }], { surProgression })
}
