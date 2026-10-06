// Version web : raccord des morceaux separes par la suppression d'une
// prise, chacun lu jusqu'a sa duree gardee. C'est un rendu sans retouche.
import { rendreVideo } from './rendu'

export type Morceau = { uri: string; duree: number }

export function assemblerVideos(morceaux: Morceau[]): Promise<string> {
  return rendreVideo(morceaux.map(m => ({ uri: m.uri, fin: m.duree })))
}
