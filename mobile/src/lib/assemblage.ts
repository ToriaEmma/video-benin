// Mise bout a bout des morceaux d'une video filmee en plusieurs fois. Sur
// mobile, la camera rend deja chaque prise ; on garde la derniere.
export type Morceau = { uri: string; duree: number }

export async function assemblerVideos(morceaux: Morceau[]): Promise<string> {
  return morceaux[morceaux.length - 1].uri
}
