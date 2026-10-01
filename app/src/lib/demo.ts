// ============================================================
// Donnees de demonstration
//
// Permettent de voir et manipuler l'interface complete sans Supabase.
// Tout vit en memoire : rafraichir la page remet l'etat initial.
// Des que .env.local est renseigne, ce module n'est plus utilise.
// ============================================================

export type VideoDemo = {
  id: string
  url: string
  legende: string
  vues: number
  auteur_id: string
  profils: { pseudo: string } | null
  aime: boolean
  nbAime: number
  departement: string
  // Champs pilotes par l'ecran « Gerer les publications ».
  visibilite?: 'monde' | 'amis' | 'moi'
  commentairesAutorises?: boolean
  nbCommentaires?: number
  reutilisationAutorisee?: boolean
  publieeLe?: string
}

export type CommentaireDemo = {
  id: string
  video_id: string
  texte: string
  cree_le: string
  profils: { pseudo: string } | null
}

// Videos libres de droits, servies par un CDN public.
const SOURCES = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
]

export const videosDemo: VideoDemo[] = [
  {
    id: 'v1', url: SOURCES[0], auteur_id: 'u1',
    legende: 'Coucher de soleil sur la plage de Fidjrossè 🌅 #cotonou',
    vues: 12_400, nbAime: 843, aime: false,
    profils: { pseudo: 'kossi_bj' }, departement: 'Littoral',
    visibilite: 'monde', commentairesAutorises: true, nbCommentaires: 2, reutilisationAutorisee: true, publieeLe: '9-29',
  },
  {
    id: 'v2', url: SOURCES[1], auteur_id: 'u2',
    legende: 'Recette du amiwo traditionnel, étape par étape 🍲',
    vues: 8_900, nbAime: 612, aime: false,
    profils: { pseudo: 'mama_cuisine' }, departement: 'Ouémé',
    visibilite: 'monde', commentairesAutorises: true, nbCommentaires: 0, reutilisationAutorisee: true, publieeLe: '9-27',
  },
  {
    id: 'v3', url: SOURCES[2], auteur_id: 'u3',
    legende: 'Le marché Dantokpa un samedi matin — ça bouge ! 🛍️',
    vues: 23_100, nbAime: 1_920, aime: false,
    profils: { pseudo: 'vie_cotonou' }, departement: 'Littoral',
    visibilite: 'moi', commentairesAutorises: false, nbCommentaires: 0, reutilisationAutorisee: false, publieeLe: '9-17',
  },
  {
    id: 'v4', url: SOURCES[3], auteur_id: 'u4',
    legende: 'Zémidjan challenge 😂 #benin #humour',
    vues: 45_600, nbAime: 3_400, aime: false,
    profils: { pseudo: 'rire_229' }, departement: 'Atlantique',
    visibilite: 'amis', commentairesAutorises: true, nbCommentaires: 4, reutilisationAutorisee: true, publieeLe: '9-11',
  },
  {
    id: 'v5', url: SOURCES[4], auteur_id: 'u5',
    legende: 'Les tisserands de Parakou, un savoir-faire à préserver',
    vues: 6_200, nbAime: 489, aime: false,
    profils: { pseudo: 'culture_bj' }, departement: 'Borgou',
    visibilite: 'monde', commentairesAutorises: true, nbCommentaires: 0, reutilisationAutorisee: true, publieeLe: '8-14',
  },
]

export const commentairesDemo: CommentaireDemo[] = [
  { id: 'c1', video_id: 'v1', texte: 'Magnifique 😍', cree_le: new Date(Date.now() - 3.6e6).toISOString(), profils: { pseudo: 'ama_bj' } },
  { id: 'c2', video_id: 'v1', texte: "C'est où exactement ?", cree_le: new Date(Date.now() - 7.2e6).toISOString(), profils: { pseudo: 'jean229' } },
  { id: 'c3', video_id: 'v3', texte: 'Dantokpa restera Dantokpa 🙌', cree_le: new Date(Date.now() - 1.8e6).toISOString(), profils: { pseudo: 'kossi_bj' } },
  { id: 'c4', video_id: 'v4', texte: 'Mdr trop vrai', cree_le: new Date(Date.now() - 9e5).toISOString(), profils: { pseudo: 'vie_cotonou' } },
]

export const comptesDemo = [
  { id: 'u1', pseudo: 'kossi_bj', bio: 'Photographe à Cotonou' },
  { id: 'u2', pseudo: 'mama_cuisine', bio: 'Cuisine béninoise au quotidien' },
  { id: 'u3', pseudo: 'vie_cotonou', bio: 'La ville comme vous ne la voyez pas' },
  { id: 'u4', pseudo: 'rire_229', bio: 'Humour 100 % béninois' },
  { id: 'u5', pseudo: 'culture_bj', bio: 'Patrimoine et savoir-faire' },
]

// Etat mutable de la session de demonstration.
export const etatDemo = {
  connecte: false,
  pseudo: '',
  videos: [...videosDemo],
  commentaires: [...commentairesDemo],
  mesVideos: [] as VideoDemo[],
  corbeille: [] as VideoDemo[],
}
