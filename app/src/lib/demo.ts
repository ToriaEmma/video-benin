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
  // Le CDN gtv-videos-bucket renvoie 403 depuis iOS : ses fichiers ne sont
  // pas lisibles dans l'application. Ces sources-ci repondent correctement.
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_2MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
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

// Video mise de cote avant publication, depuis l'ecran de montage.
export type BrouillonDemo = {
  id: string
  url: string
  legende: string
  octets: number
  // Date d'enregistrement, en millisecondes.
  date: number
  // Son ou effet retenu, affiche sous la vignette.
  etiquette?: { type: 'son' | 'effet'; nom: string }
  // Nombre de clips : au-dela de un, la grille pose une pile de calques
  // sur la vignette.
  clips?: number
}

// Etat mutable de la session de demonstration.
export const etatDemo = {
  connecte: false,
  pseudo: '',
  videos: [...videosDemo],
  commentaires: [...commentairesDemo],
  mesVideos: [] as VideoDemo[],
  corbeille: [] as VideoDemo[],
  brouillons: [] as BrouillonDemo[],
  // Rangee de stories de l'onglet « Amis », remplie plus bas : la graine
  // est declaree apres cet objet.
  stories: [] as Story[],
  conversations: [] as Conversation[],
  // Cartes de l'ecran « Notifications système », remplies plus bas : la
  // graine est declaree apres cet objet.
  notifications: [] as Notification[],
}

// ============================================================
// Onglet « Amis », mosaique « Communauté » et pseudo-categorie « LIVE ».
// Ces donnees sont propres a ces trois ecrans : elles s'ajoutent aux
// videos du fil sans les remplacer.
// ============================================================

// Bulle de la rangee de stories de l'onglet « Amis ». Une story
// « suggestion » n'est pas un recit a regarder mais un compte a suivre : sa
// bulle porte un voile sombre et l'icone d'ajout de personne.
export type Story = {
  id: string
  pseudo: string
  // Libelle sous la bulle. Absent, le pseudo fait office de libelle.
  libelle?: string
  suggestion?: boolean
  // Recit deja regarde : l'anneau de couleur s'efface.
  vue?: boolean
}

// Entree de la mosaique « Communauté ». Chaque entree pointe sur une video
// du fil et ajoute ce que la grille montre en propre.
export type EntreeCommunaute = {
  id: string
  // Video du fil ouverte au clic de la carte.
  videoId: string
  pseudo: string
  legende: string
  nbAime: number
  // Au-dela de une, la vignette porte la pastille « diaporama » au lieu
  // du triangle de lecture.
  nbPhotos?: number
  // Rapport hauteur / largeur de la vignette : c'est lui qui donne a la
  // mosaique son decalage entre colonnes.
  rapport: number
}

// Message du tchat d'un LIVE. Un message `systeme` est un evenement de la
// diffusion, pas une parole : une seule ligne grise, sans avatar.
export type MessageLive = {
  id: string
  pseudo: string
  texte: string
  systeme?: boolean
}

// La premiere bulle, « Créer », est ajoutee par l'ecran : elle appartient
// au compte connecte, pas aux demos.
export const storiesDemo: Story[] = [
  { id: 's1', pseudo: 'kossi_bj', libelle: 'kossi_bj' },
  { id: 's2', pseudo: 'mama_cuisine', libelle: 'mama_cuisine' },
  { id: 's3', pseudo: 'vie_cotonou', libelle: 'vie_cotonou', vue: true },
  { id: 's4', pseudo: 'ama_bj', libelle: 'ama_bj', suggestion: true },
  { id: 's5', pseudo: 'culture_bj', libelle: 'culture_bj' },
]

// Les rapports sont volontairement varies : deux colonnes de cartes de
// meme hauteur ne decaleraient pas, et la mosaique ressemblerait a une
// grille ordinaire.
export const communauteDemo: EntreeCommunaute[] = [
  { id: 'g1', videoId: 'v1', pseudo: 'kossi_bj', legende: 'Coucher de soleil sur la plage de Fidjrossè 🌅', nbAime: 843, rapport: 1.34 },
  { id: 'g2', videoId: 'v2', pseudo: 'mama_cuisine', legende: 'Recette du amiwo traditionnel, étape par étape', nbAime: 612, nbPhotos: 6, rapport: 1.06 },
  { id: 'g3', videoId: 'v3', pseudo: 'vie_cotonou', legende: 'Le marché Dantokpa un samedi matin', nbAime: 1920, rapport: 1.45 },
  { id: 'g4', videoId: 'v4', pseudo: 'rire_229', legende: 'Zémidjan challenge 😂', nbAime: 3400, rapport: 1.18 },
  { id: 'g5', videoId: 'v5', pseudo: 'culture_bj', legende: 'Les tisserands de Parakou', nbAime: 489, nbPhotos: 4, rapport: 1.5 },
  { id: 'g6', videoId: 'v1', pseudo: 'ama_bj', legende: 'La route des pêches au petit matin', nbAime: 1204, rapport: 1.12 },
  { id: 'g7', videoId: 'v3', pseudo: 'jean229', legende: 'Trois adresses à Ganhi pour manger à midi sans se ruiner', nbAime: 731, nbPhotos: 3, rapport: 1.28 },
  { id: 'g8', videoId: 'v2', pseudo: 'studio_229', legende: 'Montage de la semaine', nbAime: 2150, rapport: 1.4 },
  { id: 'g9', videoId: 'v5', pseudo: 'culture_bj', legende: 'Abomey, les bas-reliefs du palais royal', nbAime: 968, rapport: 1.0 },
  { id: 'g10', videoId: 'v4', pseudo: 'kossi_bj', legende: 'Le pont de Cotonou vu du zémidjan', nbAime: 1572, rapport: 1.22 },
]

// Comptes en direct, montres en rond en haut de la feuille « Découvrir ».
export const livesDemo = [
  { id: 'l1', pseudo: 'vie_cotonou', spectateurs: 5700, abonnes: 671600 },
  { id: 'l2', pseudo: 'rire_229', spectateurs: 1240, abonnes: 92300 },
  { id: 'l3', pseudo: 'mama_cuisine', spectateurs: 860, abonnes: 45100 },
  { id: 'l4', pseudo: 'studio_229', spectateurs: 410, abonnes: 18700 },
]

// Tchat du LIVE au moment ou on le rejoint.
export const messagesLiveDemo: MessageLive[] = [
  { id: 'm1', pseudo: 'kossi_bj', texte: 'Bonsoir tout le monde 👋' },
  { id: 'm2', pseudo: 'ama_bj', texte: 'Le son est parfait ce soir' },
  { id: 'm3', pseudo: 'jean229', texte: 'a partagé la vidéo LIVE', systeme: true },
  { id: 'm4', pseudo: 'mama_cuisine', texte: 'Tu passes à Dantokpa après ?' },
  { id: 'm5', pseudo: 'culture_bj', texte: 'On te suit depuis Parakou 🇧🇯' },
  { id: 'm6', pseudo: 'rire_229', texte: 'Mets la musique plus fort 😂' },
]

// Messages ajoutes un a un par le minuteur du tchat, pour que le fil ne
// reste pas fige.
export const messagesLiveSuite: MessageLive[] = [
  { id: 'x1', pseudo: 'studio_229', texte: 'Grosse ambiance ce soir' },
  { id: 'x2', pseudo: 'ama_bj', texte: 'a partagé la vidéo LIVE', systeme: true },
  { id: 'x3', pseudo: 'jean229', texte: 'Tu refais un direct demain ?' },
  { id: 'x4', pseudo: 'kossi_bj', texte: 'La lumière est top 🔥' },
  { id: 'x5', pseudo: 'vie_cotonou', texte: 'Salut les nouveaux arrivants' },
  { id: 'x6', pseudo: 'culture_bj', texte: 'a partagé la vidéo LIVE', systeme: true },
  { id: 'x7', pseudo: 'mama_cuisine', texte: 'Je prépare le dîner en écoutant 😋' },
]

// Mois abreges, pour la date de publication de l'analyse video.
const MOIS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

export const jourEtMois = (date: number) => {
  const d = new Date(date)
  return { jour: d.getDate(), mois: MOIS[d.getMonth()] }
}

export const abreger = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)} K`
  : String(n)

etatDemo.stories = [...storiesDemo]

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
  // Nombre de jours d'echange sans interruption, affiche en flamme
  // a cote du pseudo.
  flamme?: number
  // Ligne grise affichee a la place de l'apercu quand la conversation
  // n'a pas encore commence.
  invite?: string
  // Vrai pour les comptes de service, qui portent une pastille au lieu
  // d'un avatar et menent aux notifications systeme.
  systeme?: boolean
  // Vrai tant que l'echange vient d'un compte auquel on n'est pas
  // abonne : la conversation attend alors dans « Demandes de messages ».
  demande?: boolean
}

// Bulle de la rangee de stories. Une story « suggestion » n'est pas un recit
// a regarder mais un compte a suivre : sa bulle porte un voile sombre et
// l'icone d'ajout de personne.

// Canal emetteur d'une notification systeme : il donne la couleur de la
// pastille et sert de filtre en haut de l'ecran « Notifications système ».
export type CanalNotification = 'live' | 'application' | 'promotion'

// Une carte de l'ecran « Notifications système ». Le corps reste tronque a
// trois lignes tant que « Voir plus » n'a pas ete presse.
export type Notification = {
  id: string
  canal: CanalNotification
  // Etiquette complete de la carte : « LIVE · Activités ».
  etiquette: string
  titre: string
  corps: string
  // Date de reception en millisecondes : l'age relatif (« 1 j ») en decoule.
  date: number
  // Vignette carree posee a droite du corps, quand la notification en porte.
  vignette?: string
}

const MINUTE = 60_000
const LANCEMENT = Date.now()

// Rangee de stories, partagee par l'onglet Amis et la boite de reception. La
// premiere bulle, « Créer », est ajoutee par la bande : elle appartient au
// compte connecte, pas aux demos.

export const conversationsDemo: Conversation[] = [
  {
    // Compte de service : il ouvre la liste et porte une pastille
    // rouge au lieu d'un avatar.
    id: 'd0', pseudo: 'Activité et nouveaux abonnés', nonLus: 2, systeme: true,
    messages: [
      { id: 'd0m1', texte: 'culture_bj a enregistré ta vidéo.', moi: false, date: LANCEMENT - MINUTE * 40 },
    ],
  },
  {
    // Second compte de service : il ouvre l'ecran
    // « Notifications système » plutot qu'un fil de discussion.
    id: 'd9', pseudo: 'Notifications système', nonLus: 1, systeme: true,
    messages: [
      { id: 'd9m1', texte: 'LIVE · Tes spectateurs veulent en voir davantage de ta part.', moi: false, date: LANCEMENT - MINUTE * 60 * 24 },
    ],
  },
  {
    id: 'd1', pseudo: 'kossi_bj', nonLus: 2, flamme: 16,
    messages: [
      { id: 'd1m1', texte: "Salut ! J'ai vu ta dernière vidéo, le cadrage est top 🔥", moi: false, date: LANCEMENT - MINUTE * 180 },
      { id: 'd1m2', texte: "Merci beaucoup 🙏 c'était tourné à Fidjrossè", moi: true, date: LANCEMENT - MINUTE * 172 },
      { id: 'd1m3', texte: 'Tu utilises quel objectif ?', moi: false, date: LANCEMENT - MINUTE * 14 },
      { id: 'd1m4', texte: 'On se cale un shooting ce week-end ?', moi: false, date: LANCEMENT - MINUTE * 9 },
    ],
  },
  {
    id: 'd2', pseudo: 'mama_cuisine', nonLus: 0, flamme: 107,
    messages: [
      { id: 'd2m1', texte: "Bonsoir, la recette de l'amiwo est en ligne", moi: false, date: LANCEMENT - MINUTE * 400 },
      { id: 'd2m2', texte: "Je viens de la regarder, j'essaie demain 😋", moi: true, date: LANCEMENT - MINUTE * 95 },
      { id: 'd2m3', texte: "Dis-moi ce que ça donne !", moi: false, date: LANCEMENT - MINUTE * 92 },
    ],
  },
  {
    id: 'd3', pseudo: 'vie_cotonou', nonLus: 1,
    messages: [
      { id: 'd3m1', texte: 'On tourne au marché Dantokpa samedi matin, tu viens ?', moi: false, date: LANCEMENT - MINUTE * 1500 },
    ],
  },
  {
    id: 'd4', pseudo: 'rire_229', nonLus: 0, flamme: 199,
    messages: [
      { id: 'd4m1', texte: 'Le zémidjan challenge 😂😂', moi: false, date: LANCEMENT - MINUTE * 2900 },
      { id: 'd4m2', texte: "Mdr j'ai regardé trois fois", moi: true, date: LANCEMENT - MINUTE * 2880 },
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
  {
    // Echange pas encore entame : la ligne grise invite a ecrire.
    id: 'd6', pseudo: 'ama_bj', nonLus: 0,
    invite: 'Dis bonjour à ama_bj', messages: [],
  },
  // --- Demandes : comptes auxquels on n'est pas abonne ---
  {
    id: 'd7', pseudo: 'jean229', nonLus: 1, demande: true,
    messages: [
      { id: 'd7m1', texte: 'Bonjour, je prépare une vidéo sur Cotonou, on peut échanger ?', moi: false, date: LANCEMENT - MINUTE * 300 },
    ],
  },
  {
    id: 'd8', pseudo: 'studio_229', nonLus: 1, demande: true,
    messages: [
      { id: 'd8m1', texte: 'Salut ! On aimerait collaborer avec toi.', moi: false, date: LANCEMENT - MINUTE * 1200 },
    ],
  },
]

export const notificationsDemo: Notification[] = [
  {
    // Les notifications du canal LIVE ouvrent la liste par defaut.
    id: 'n1', canal: 'live', etiquette: 'LIVE · Activités',
    titre: 'Tes spectateurs veulent en voir davantage de ta part',
    corps: 'Ton dernier direct a retenu l’attention : plus de la moitié '
      + 'des personnes présentes sont restées jusqu’à la fin. Un rendez-vous '
      + 'régulier, par exemple deux soirs par semaine à la même heure, aide '
      + 'ton public à te retrouver sans avoir à te chercher. Pense aussi à '
      + 'annoncer le thème de ton direct la veille : les spectateurs '
      + 'reviennent plus volontiers quand ils savent ce qui les attend.',
    date: LANCEMENT - MINUTE * 60 * 24,
    vignette: SOURCES[0],
  },
  {
    id: 'n2', canal: 'application', etiquette: 'Tok 229 · Activités',
    titre: 'Encore quelques abonnés avant de débloquer de nouveaux outils',
    corps: 'À partir de 100 abonnés, ton compte accède aux statistiques '
      + 'détaillées de chaque publication, aux directs plus longs et à la '
      + 'mise en avant dans « Communauté ». Tu es à moins de vingt abonnés '
      + 'de ce seuil : deux ou trois publications régulières devraient '
      + 'suffire à le franchir.',
    date: LANCEMENT - MINUTE * 60 * 24 * 3,
  },
  {
    id: 'n3', canal: 'application', etiquette: 'Tok 229 · Mises à jour',
    titre: 'Tes vidéos font mieux que 90 % des comptes comparables',
    corps: 'Sur les trente derniers jours, la durée de visionnage moyenne de '
      + 'tes vidéos dépasse celle de neuf comptes béninois sur dix de taille '
      + 'similaire. Les publications tournées en extérieur, à Cotonou comme à '
      + 'Parakou, sont celles qui tiennent le mieux l’attention. Continue '
      + 'sur ce format, et garde les dix premières secondes pour l’essentiel.',
    date: LANCEMENT - MINUTE * 60 * 24 * 3,
    vignette: SOURCES[2],
  },
  {
    id: 'n4', canal: 'promotion', etiquette: 'Assistant promotion · Activités',
    titre: 'Un bon de promotion de 5 000 FCFA t’attend',
    corps: 'Ce bon permet de montrer une de tes vidéos à des personnes qui ne '
      + 'te suivent pas encore, dans les départements que tu choisis. Il reste '
      + 'valable sept jours, puis il expire sans être remplacé. Récupère-le '
      + 'depuis l’assistant, choisis la vidéo à pousser, et laisse la '
      + 'campagne tourner trois jours avant d’en lire les résultats.',
    date: LANCEMENT - MINUTE * 60 * 24 * 5,
  },
  {
    id: 'n5', canal: 'live', etiquette: 'LIVE · Activités',
    titre: 'Ton direct de samedi a attiré deux fois plus de monde',
    corps: 'Deux cent quarante personnes ont rejoint ton direct de samedi '
      + 'soir, contre cent dix la semaine précédente. L’arrivée a surtout '
      + 'eu lieu dans les dix premières minutes : lancer le direct à heure '
      + 'fixe et répondre aux premiers commentaires dès le début semble '
      + 'porter ses fruits.',
    date: LANCEMENT - MINUTE * 60 * 24 * 6,
    vignette: SOURCES[1],
  },
  {
    id: 'n6', canal: 'promotion', etiquette: 'Assistant promotion · Activités',
    titre: 'Ta campagne sur « Le marché Dantokpa un samedi matin » est terminée',
    corps: 'La campagne s’est achevée hier soir : la vidéo a été vue '
      + '4 800 fois de plus, dont 3 100 fois par des comptes qui ne te '
      + 'suivaient pas. Soixante-deux nouveaux abonnés en sont venus. Le '
      + 'rapport complet reste consultable pendant trente jours dans '
      + 'l’assistant.',
    date: LANCEMENT - MINUTE * 60 * 24 * 9,
  },
]

// Mois abreges, tels que les affiche un horodatage passe la semaine.

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
  const d = new Date(date)
  return `${d.getDate()} ${MOIS[d.getMonth()]}`
}

// Age d'une notification, tel que la fin du paragraphe l'affiche : « 3 h »,
// « 1 j », puis la date passe le mois.
export const ageCourt = (date: number) => {
  const heures = Math.floor((Date.now() - date) / (60 * MINUTE))
  if (heures < 1) return 'maintenant'
  if (heures < 24) return `${heures} h`
  const jours = Math.floor(heures / 24)
  if (jours < 30) return `${jours} j`
  const d = new Date(date)
  return `${d.getDate()} ${MOIS[d.getMonth()]}`
}

// Dernier message d'une conversation, utilise pour l'apercu et pour trier la
// liste du plus recent au plus ancien.
// Conversations de demonstration. Le compte de service ouvre la liste,
// deux echanges viennent de comptes non suivis et attendent donc dans
// « Demandes de messages ».
etatDemo.conversations = [
  {
    id: 'd0', pseudo: 'Activité et nouveaux abonnés', nonLus: 2, systeme: true,
    messages: [
      { id: 'd0m1', texte: 'culture_bj a enregistré ta vidéo.', moi: false, date: LANCEMENT - MINUTE * 40 },
    ],
  },
  {
    id: 'd1', pseudo: 'kossi_bj', nonLus: 2, flamme: 16,
    messages: [
      { id: 'd1m1', texte: 'Salut ! J\'ai vu ta dernière vidéo, le cadrage est top 🔥', moi: false, date: LANCEMENT - MINUTE * 180 },
      { id: 'd1m2', texte: 'Merci beaucoup 🙏 c\'était tourné à Fidjrossè', moi: true, date: LANCEMENT - MINUTE * 172 },
      { id: 'd1m3', texte: 'Tu utilises quel objectif ?', moi: false, date: LANCEMENT - MINUTE * 14 },
    ],
  },
  {
    id: 'd2', pseudo: 'mama_cuisine', nonLus: 0, flamme: 107,
    messages: [
      { id: 'd2m1', texte: 'Bonsoir, la recette de l\'amiwo est en ligne', moi: false, date: LANCEMENT - MINUTE * 400 },
      { id: 'd2m2', texte: 'Je viens de la regarder, j\'essaie demain 😋', moi: true, date: LANCEMENT - MINUTE * 95 },
    ],
  },
  {
    id: 'd3', pseudo: 'vie_cotonou', nonLus: 1,
    messages: [
      { id: 'd3m1', texte: 'On tourne au marché Dantokpa samedi matin, tu viens ?', moi: false, date: LANCEMENT - MINUTE * 1500 },
    ],
  },
  {
    id: 'd6', pseudo: 'ama_bj', nonLus: 0,
    invite: 'Dis bonjour à ama_bj', messages: [],
  },
  {
    id: 'd7', pseudo: 'jean229', nonLus: 1, demande: true,
    messages: [
      { id: 'd7m1', texte: 'Bonjour, je prépare une vidéo sur Cotonou, on peut échanger ?', moi: false, date: LANCEMENT - MINUTE * 300 },
    ],
  },
  {
    id: 'd8', pseudo: 'studio_229', nonLus: 1, demande: true,
    messages: [
      { id: 'd8m1', texte: 'Salut ! On aimerait collaborer avec toi.', moi: false, date: LANCEMENT - MINUTE * 1200 },
    ],
  },
]

export const dernierMessage = (c: Conversation) =>
  c.messages.length > 0 ? c.messages[c.messages.length - 1] : undefined

// Boite de reception : les demandes en sont exclues, elles ont leur
// propre ecran. Les comptes de service restent en tete.
export const conversationsTriees = () =>
  [...etatDemo.conversations]
    .filter(c => !c.demande)
    .sort((a, b) => {
      if (a.systeme !== b.systeme) return a.systeme ? -1 : 1
      return (dernierMessage(b)?.date ?? 0) - (dernierMessage(a)?.date ?? 0)
    })

// Messages recus de comptes auxquels on n'est pas abonne.
export const demandesMessages = () =>
  etatDemo.conversations.filter(c => c.demande)

etatDemo.notifications = [...notificationsDemo]

// « 86.0MB » : le poids affiche sur la grille des brouillons.
export const poidsLisible = (octets: number) =>
  octets >= 1 << 30 ? `${(octets / (1 << 30)).toFixed(1)}GB`
  : octets >= 1 << 20 ? `${(octets / (1 << 20)).toFixed(1)}MB`
  : `${Math.max(1, Math.round(octets / 1024))}KB`

// Brouillons de demonstration : la grille serait vide sans eux, puisque
// rien n'a encore ete mis de cote depuis le montage.
etatDemo.brouillons = [
  {
    id: 'b1', url: SOURCES[0], legende: 'Coucher de soleil à Fidjrossè',
    octets: 42 * (1 << 20), date: LANCEMENT - MINUTE * 60 * 5,
    etiquette: { type: 'son', nom: 'Afrobeat 229' }, clips: 3,
  },
  {
    id: 'b2', url: SOURCES[1], legende: '', octets: 18 * (1 << 20),
    date: LANCEMENT - MINUTE * 60 * 30,
    etiquette: { type: 'effet', nom: 'Lueur douce' },
  },
  {
    id: 'b3', url: SOURCES[2], legende: 'Essai de montage',
    octets: 9 * (1 << 20), date: LANCEMENT - MINUTE * 60 * 24 * 2, clips: 2,
  },
  {
    id: 'b4', url: SOURCES[3], legende: 'Parakou, marché du matin',
    octets: 26 * (1 << 20), date: LANCEMENT - MINUTE * 60 * 24 * 4,
    etiquette: { type: 'son', nom: 'Son original' },
  },
  {
    id: 'b5', url: SOURCES[1], legende: '', octets: 1_400_000,
    date: LANCEMENT - MINUTE * 60 * 24 * 9,
  },
]
