export type Video = {
  id: string
  url: string
  legende: string
  vues: number
  pseudo: string
  aime: boolean
  nbAime: number
  nbCommentaires: number
  // Champs repris de app/src/lib/demo.ts : ils alimentent l'ecran
  // « Gérer les publications ».
  visibilite?: 'monde' | 'amis' | 'moi'
  commentairesAutorises?: boolean
  reutilisationAutorisee?: boolean
  publieeLe?: string
  // Departement du Benin choisi au moment de la publication.
  departement?: string
}

// Video mise de cote avant publication. Le poids sert a l'etiquette de la
// tuile « Brouillons » du profil.
export type Brouillon = {
  id: string
  url: string
  legende: string
  octets: number
  // Date d'enregistrement, en millisecondes : la pastille de la grille
  // l'affiche sous la forme « 1 oct. ».
  date: number
  // Nombre de clips : au-dela de un, la grille pose une pile de calques
  // sur la vignette.
  clips?: number
  // Son ou effet utilise, affiche en bas de la vignette.
  etiquette?: { type: 'son' | 'effet'; nom: string }
}

// Message d'une conversation de la boite de reception. `moi` distingue les
// messages envoyes par l'utilisateur (bulle rouge a droite) de ceux recus
// (bulle grise a gauche).
export type Message = {
  id: string
  texte: string
  moi: boolean
  // Horodatage en millisecondes : le fil s'en sert pour les separateurs.
  date: number
}

// Fil de discussion avec un autre compte. Les messages sont ranges du plus
// ancien au plus recent : le fil s'affiche donc de haut en bas.
export type Conversation = {
  id: string
  pseudo: string
  messages: Message[]
  // Nombre de messages recus et non encore lus : alimente la pastille.
  nonLus: number
}

export type Commentaire = {
  id: string
  videoId: string
  texte: string
  pseudo: string
  date: string
  // Date d'ecriture en millisecondes : l'horodatage relatif
  // (« il y a 5 min ») en decoule. Absent, on retombe sur `date`.
  horodatage?: number
}

const SOURCES = [
  // Le CDN gtv-videos-bucket renvoie 403 depuis iOS : ses fichiers ne sont
  // pas lisibles dans l'application. Ces sources-ci repondent correctement.
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_2MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
]

// Comptes de demonstration, repris de app/src/lib/demo.ts : ils fournissent
// la bio affichee quand on consulte le profil de quelqu'un d'autre.
export const comptesDemo = [
  { id: 'u1', pseudo: 'kossi_bj', bio: 'Photographe à Cotonou' },
  { id: 'u2', pseudo: 'mama_cuisine', bio: 'Cuisine béninoise au quotidien' },
  { id: 'u3', pseudo: 'vie_cotonou', bio: 'La ville comme vous ne la voyez pas' },
  { id: 'u4', pseudo: 'rire_229', bio: 'Humour 100 % béninois' },
  { id: 'u5', pseudo: 'culture_bj', bio: 'Patrimoine et savoir-faire' },
]

// Les dates des conversations de demonstration sont exprimees en minutes
// avant le lancement : l'horodatage reste coherent quelle que soit la date.
const MINUTE = 60_000
const LANCEMENT = Date.now()

export const etat = {
  connecte: false,
  pseudo: '',
  videos: [
    { id: 'v1', url: SOURCES[0], pseudo: 'kossi_bj', legende: 'Coucher de soleil sur la plage de Fidjrossè 🌅 #cotonou', vues: 12400, nbAime: 843, aime: false, nbCommentaires: 2, visibilite: 'monde', commentairesAutorises: true, reutilisationAutorisee: true, publieeLe: '9-29', },
    { id: 'v2', url: SOURCES[1], pseudo: 'mama_cuisine', legende: 'Recette du amiwo traditionnel, étape par étape', vues: 8900, nbAime: 612, aime: false, nbCommentaires: 0, visibilite: 'monde', commentairesAutorises: true, reutilisationAutorisee: true, publieeLe: '9-27', },
    { id: 'v3', url: SOURCES[2], pseudo: 'vie_cotonou', legende: 'Le marché Dantokpa un samedi matin', vues: 23100, nbAime: 1920, aime: false, nbCommentaires: 1, visibilite: 'moi', commentairesAutorises: false, reutilisationAutorisee: false, publieeLe: '9-17', },
    { id: 'v4', url: SOURCES[3], pseudo: 'rire_229', legende: 'Zémidjan challenge 😂 #benin #humour', vues: 45600, nbAime: 3400, aime: false, nbCommentaires: 1, visibilite: 'amis', commentairesAutorises: true, reutilisationAutorisee: true, publieeLe: '9-11', },
    { id: 'v5', url: SOURCES[4], pseudo: 'culture_bj', legende: 'Les tisserands de Parakou', vues: 6200, nbAime: 489, aime: false, nbCommentaires: 0, visibilite: 'monde', commentairesAutorises: true, reutilisationAutorisee: true, publieeLe: '8-14', },
  ] as Video[],
  commentaires: [
    { id: 'c1', videoId: 'v1', texte: 'Magnifique 😍', pseudo: 'ama_bj', date: 'il y a 1 h', horodatage: LANCEMENT - 60 * MINUTE },
    { id: 'c2', videoId: 'v1', texte: "C'est où exactement ?", pseudo: 'jean229', date: 'il y a 2 h', horodatage: LANCEMENT - 120 * MINUTE },
    { id: 'c3', videoId: 'v3', texte: 'Dantokpa restera Dantokpa', pseudo: 'kossi_bj', date: 'il y a 30 min', horodatage: LANCEMENT - 30 * MINUTE },
    { id: 'c4', videoId: 'v4', texte: 'Mdr trop vrai', pseudo: 'vie_cotonou', date: 'il y a 15 min', horodatage: LANCEMENT - 15 * MINUTE },
  ] as Commentaire[],
  conversations: [
    {
      id: 'd1', pseudo: 'kossi_bj', nonLus: 2,
      messages: [
        { id: 'd1m1', texte: 'Salut ! J\'ai vu ta dernière vidéo, le cadrage est top 🔥', moi: false, date: LANCEMENT - MINUTE * 180 },
        { id: 'd1m2', texte: 'Merci beaucoup 🙏 c\'était tourné à Fidjrossè', moi: true, date: LANCEMENT - MINUTE * 172 },
        { id: 'd1m3', texte: 'Tu utilises quel objectif ?', moi: false, date: LANCEMENT - MINUTE * 14 },
        { id: 'd1m4', texte: 'On se cale un shooting ce week-end ?', moi: false, date: LANCEMENT - MINUTE * 9 },
      ],
    },
    {
      id: 'd2', pseudo: 'mama_cuisine', nonLus: 0,
      messages: [
        { id: 'd2m1', texte: 'Bonsoir, la recette de l\'amiwo est en ligne', moi: false, date: LANCEMENT - MINUTE * 400 },
        { id: 'd2m2', texte: 'Je viens de la regarder, j\'essaie demain 😋', moi: true, date: LANCEMENT - MINUTE * 95 },
        { id: 'd2m3', texte: 'Dis-moi ce que ça donne !', moi: false, date: LANCEMENT - MINUTE * 92 },
      ],
    },
    {
      id: 'd3', pseudo: 'vie_cotonou', nonLus: 1,
      messages: [
        { id: 'd3m1', texte: 'On tourne au marché Dantokpa samedi matin, tu viens ?', moi: false, date: LANCEMENT - MINUTE * 1500 },
      ],
    },
    {
      id: 'd4', pseudo: 'rire_229', nonLus: 0,
      messages: [
        { id: 'd4m1', texte: 'Le zémidjan challenge 😂😂', moi: false, date: LANCEMENT - MINUTE * 2900 },
        { id: 'd4m2', texte: 'Mdr j\'ai regardé trois fois', moi: true, date: LANCEMENT - MINUTE * 2880 },
        { id: 'd4m3', texte: 'La suite arrive la semaine prochaine', moi: false, date: LANCEMENT - MINUTE * 2870 },
      ],
    },
    {
      id: 'd5', pseudo: 'culture_bj', nonLus: 0,
      messages: [
        { id: 'd5m1', texte: 'Merci pour le partage sur les tisserands de Parakou', moi: true, date: LANCEMENT - MINUTE * 11000 },
        { id: 'd5m2', texte: 'Avec plaisir, on prépare un reportage à Abomey', moi: false, date: LANCEMENT - MINUTE * 10800 },
      ],
    },
  ] as Conversation[],
  mesVideos: [] as Video[],
  brouillons: [] as Brouillon[],
  // Publications supprimees, conservees 30 jours.
  corbeille: [] as Video[],
}

// Mois abreges tels que les affiche la pastille de date d'un brouillon.
const MOIS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

export const jourEtMois = (date: number) => {
  const d = new Date(date)
  return { jour: d.getDate(), mois: MOIS[d.getMonth()] }
}

// « 86.0MB » : le poids affiche sur la tuile des brouillons.
export const poidsLisible = (octets: number) =>
  octets >= 1 << 30 ? `${(octets / (1 << 30)).toFixed(1)}GB`
  : octets >= 1 << 20 ? `${(octets / (1 << 20)).toFixed(1)}MB`
  : `${Math.max(1, Math.round(octets / 1024))}KB`

export const abreger = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)} K`
  : String(n)

// Horodatage court de la liste des conversations : « 9 min », « 3 h »,
// « 2 j », puis la date passe la semaine.
export const dateRelative = (date: number) => {
  const minutes = Math.floor((Date.now() - date) / MINUTE)
  if (minutes < 1) return 'maintenant'
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `${heures} h`
  const jours = Math.floor(heures / 24)
  if (jours < 7) return `${jours} j`
  const { jour, mois } = jourEtMois(date)
  return `${jour} ${mois}`
}

// Dernier message d'une conversation, utilise pour l'apercu et pour trier la
// liste du plus recent au plus ancien.
export const dernierMessage = (c: Conversation) =>
  c.messages.length > 0 ? c.messages[c.messages.length - 1] : undefined

export const conversationsTriees = () =>
  [...etat.conversations].sort(
    (a, b) => (dernierMessage(b)?.date ?? 0) - (dernierMessage(a)?.date ?? 0))
