// Version web de expo-file-system : seule la classe File est utilisee, pour
// lire le poids d'une video. Sur le web la video est un blob en memoire ; on
// renvoie une taille connue si elle a ete enregistree par la camera web.
export const tailles = new Map<string, number>()
export class File {
  uri: string
  constructor(uri: string) { this.uri = uri }
  get exists() { return tailles.has(this.uri) }
  get size() { return tailles.get(this.uri) ?? 0 }
}
export class Directory { constructor(public uri: string) {} }
export const Paths = { cache: { uri: '' }, document: { uri: '' } }
