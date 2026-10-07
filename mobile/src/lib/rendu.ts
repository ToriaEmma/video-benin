// Rendu final d'une video : types partages, et version mobile. Sur mobile,
// aucun moteur de rendu n'est embarque : la video part telle quelle (seul
// le premier morceau), les retouches restent celles de l'apercu.
// La version web (rendu.web.ts) grave reellement les retouches.

// Un texte ou un sticker, place par son centre en fraction de l'image
// (0 a 1) ; `taille` est la hauteur de police en fraction de la largeur.
export type Calque = {
  genre: 'texte' | 'sticker'
  contenu: string
  couleur: string
  x: number
  y: number
  taille: number
}

// Un morceau de video, lu de `debut` a `fin` (secondes). `duree` : ancien
// nom de `fin` pour un morceau lu depuis le debut.
export type Morceau = { uri: string; debut?: number; fin?: number; duree?: number }

export type Reglages = {
  voile?: { couleur: string; melange: string }
  // Vitesse de lecture gravee (2 = deux fois plus rapide).
  debit?: number
  // Faux : la hauteur de la voix suit la vitesse (effets Grave et Aigu).
  hauteurPreservee?: boolean
  calques?: Calque[]
  sousTitre?: string
  sansSon?: boolean
  // Effet vocal traite par le rendu.
  voix?: 'robot' | 'echo'
  retouche?: boolean
  surProgression?: (part: number) => void
}

export async function rendreVideo(morceaux: Morceau[], _r: Reglages = {}): Promise<string> {
  return morceaux[0].uri
}

// Dimensions de la video (web) ; inconnues sur mobile.
export async function dimensionsVideo(_uri: string): Promise<{ l: number; h: number; duree: number } | null> {
  return null
}

// Dessin sur toile : ces fonctions n'existent que sur le web.
export type Peintre = (g: CanvasRenderingContext2D, l: number, h: number, t: number) => void

export function dessinerHabillage(_g: CanvasRenderingContext2D, _l: number, _h: number, _r: Reglages): void {
  // Sans toile sur mobile.
}

export async function chargerImage(_uri: string): Promise<HTMLImageElement> {
  throw new Error('Disponible sur la version web')
}

export async function videoFixe(_peindre: Peintre, _duree = 5, _surProgression?: (p: number) => void): Promise<string> {
  throw new Error('Disponible sur la version web')
}
