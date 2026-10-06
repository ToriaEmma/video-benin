// ============================================================
// Catalogue de sons de la plateforme.
//
// Toutes les pistes viennent d'Internet Archive et portent une
// licence qui autorise leur diffusion (CC-BY, CC0 ou domaine
// public). Le champ `licence` doit rester affiche quelque part :
// la mention de l'auteur est la condition des licences CC-BY.
//
// Pour ajouter une piste : verifier sa licence sur archive.org,
// puis relever l'URL de son fichier .mp3 sous /download/.
//
// Garder les fichiers legers (1 a 3 Mo). archive.org ne sert pas
// de plage d'octets fiable et sa latence depasse souvent 3 s : un
// fichier de 18 Mo laissait l'apercu muet pendant quinze secondes,
// ce que l'utilisateur prenait pour une panne.
// ============================================================

export type Son = {
  id: string
  titre: string
  artiste: string
  // Licence de la piste, a crediter.
  licence: string
  // Nombre de publications utilisant ce son.
  publications: number
  // Duree en secondes.
  duree: number
  url: string
  // Teinte de la pochette, faute de visuel.
  couleur: string
  // Vrai pour un « son original » enregistre par un compte.
  original?: boolean
  // Image de l'album (sons Deezer).
  pochette?: string
}

export const SONS: Son[] = [
  {
    id: 's1', titre: "Epic Battle",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 24900, duree: 144, couleur: '#c8743f',
    url: 'https://archive.org/download/twin-musicom-epic-battle/Twin%20Musicom%20-%20Epic%20Battle.mp3',
  },
  {
    id: 's2', titre: "Hackerland",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 65900, duree: 108, couleur: '#4a5a7d',
    url: 'https://archive.org/download/twin-musicom-hackerland/Twin%20Musicom%20-%20Hackerland.mp3',
  },
  {
    id: 's3', titre: "Night At The Dance Hall",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 14800, duree: 90, couleur: '#8d2230',
    url: 'https://archive.org/download/twin-musicom-night-at-the-dance-hall/Night%20at%20the%20Dance%20Hall.mp3',
  },
  {
    id: 's4', titre: "Santo Rico",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 30600, duree: 90, couleur: '#e2a33c',
    url: 'https://archive.org/download/santo-rico/Santo%20Rico.mp3',
  },
  {
    id: 's5', titre: "Italian Afternoon",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 66100, duree: 90, couleur: '#2f4858',
    url: 'https://archive.org/download/twin-musicom-italian-afternoon/Italian%20Afternoon.mp3',
  },
  {
    id: 's6', titre: "Carefree Melody",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 14300, duree: 90, couleur: '#6b4f7d',
    url: 'https://archive.org/download/twin-musicom-carefree-melody/Carefree%20Melody.mp3',
  },
  {
    id: 's7', titre: "Retro Dreamscape",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 3714, duree: 90, couleur: '#3f6b8d',
    url: 'https://archive.org/download/retro-dreamscape/Retro%20Dreamscape.mp3',
  },
  {
    id: 's8', titre: "Elvish Presto",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 39000, duree: 85, couleur: '#a33b33',
    url: 'https://archive.org/download/twin-musicom-elvish-presto/Elvish%20Presto.mp3',
  },
  {
    id: 's9', titre: "Classical Carnivale",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 1119, duree: 88, couleur: '#6a5a7d',
    url: 'https://archive.org/download/twin-musicom-classical-carnivale/Classical%20Carnivale.mp3',
  },
  {
    id: 's10', titre: "Stopping By The Inn",
    artiste: "Twin Musicom",
    licence: "CC-BY 4.0",
    publications: 859, duree: 72, couleur: '#7d5a4f',
    url: 'https://archive.org/download/twin-musicom-stopping-by-the-inn/Stopping%20By%20the%20Inn.mp3',
  },]

// « 24,9K publications » : le compteur sous le titre d'un son.
export const abregerPublications = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')}K` : String(n)

// « 1:06 » : la duree d'un son.
export const dureeLisible = (secondes: number) =>
  `${Math.floor(secondes / 60)}:${String(Math.round(secondes % 60)).padStart(2, '0')}`

// Classement « Populaire » : les plus utilises en tete.
export const parPopularite = (liste: Son[]) =>
  [...liste].sort((a, b) => b.publications - a.publications)

// Retrouve un son du catalogue par l'identifiant stocke sur la
// publication. Un son retire du catalogue laisse une publication qui
// renvoie `son_id` : le fil doit alors retomber sur « son original ».
export const sonParId = (id: string | null | undefined) =>
  id ? SONS.find(x => x.id === id) ?? null : null

// Ligne de son d'une carte du fil. Sans son attache, c'est le compte de
// l'auteur qui s'affiche : la piste est alors celle de la video elle-meme.
export const libelleSon = (son: Son | null, pseudo: string) =>
  son ? `${son.titre} - ${son.artiste}` : `son original - ${pseudo}`
