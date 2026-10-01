import AsyncStorage from '@react-native-async-storage/async-storage'

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
  // Nombre de jours d'echange sans interruption, affiche en flamme
  // a cote du pseudo.
  flamme?: number
  // Ligne grise affichee a la place de l'apercu quand la conversation
  // n'a pas encore commence : « Dis bonjour a … », « Envoye aujourd'hui ».
  invite?: string
  // Vrai pour le compte « Activite et nouveaux abonnes », qui porte une
  // pastille rouge au lieu d'un avatar.
  systeme?: boolean
  // Vrai tant que l'echange vient d'un compte auquel on n'est pas
  // abonne : la conversation attend alors dans « Demandes de messages »
  // plutot que dans la boite de reception.
  demande?: boolean
  id: string
  pseudo: string
  messages: Message[]
  // Nombre de messages recus et non encore lus : alimente la pastille.
  nonLus: number
}

// Bulle de la rangee de stories de l'onglet « Amis ». Une story
// « suggestion » n'est pas un recit a regarder mais un compte a suivre : sa
// bulle porte un voile sombre et l'icone d'ajout de personne.
export type Story = {
  id: string
  pseudo: string
  // Libelle sous la bulle. Absent, le pseudo fait office de libelle.
  libelle?: string
  // Compte propose : la bulle montre le voile et l'icone d'ajout de
  // personne au lieu d'un recit a regarder.
  suggestion?: boolean
  // Recit deja regarde : l'anneau de couleur s'efface.
  vue?: boolean
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

// Rangee de stories de l'onglet « Amis ». La premiere bulle, « Creer », est
// ajoutee par l'ecran : elle appartient au compte connecte, pas aux demos.
export const storiesDemo: Story[] = [
  { id: 's1', pseudo: 'kossi_bj', libelle: 'kossi_bj' },
  { id: 's2', pseudo: 'mama_cuisine', libelle: 'mama_cuisine' },
  { id: 's3', pseudo: 'vie_cotonou', libelle: 'vie_cotonou', vue: true },
  { id: 's4', pseudo: 'ama_bj', libelle: 'ama_bj', suggestion: true },
  { id: 's5', pseudo: 'culture_bj', libelle: 'culture_bj' },
]

// Reglages de l'ecran « Parametres et confidentialite ». Ils sont ranges
// a part des donnees de demonstration : ce sont des choix de
// l'utilisateur, pas du contenu, et ils doivent survivre a un
// redemarrage de l'application.
export type Reglages = {
  // --- Notifications ---
  notifJaime: boolean
  notifCommentaires: boolean
  notifAbonnes: boolean
  notifMentions: boolean
  notifSuggestions: boolean
  notifLive: boolean
  notifMessages: boolean
  notifRappels: boolean
  // --- Visibilite ---
  comptePrive: boolean
  // --- Securite ---
  doubleFacteur: boolean
  alertesConnexion: boolean
  // --- Preferences ---
  langue: 'fr' | 'fon' | 'yo' | 'en'
  theme: 'clair' | 'sombre' | 'systeme'
  // Trois crans de taille de texte, appliques par le composant Texte
  // seulement si l'application le prevoit un jour.
  tailleTexte: 'petit' | 'normal' | 'grand'
  economieDonnees: boolean
  // --- Reglages des sections encore informatives ---
  lectureAuto: boolean
  boucle: boolean
  sonDemarrage: boolean
  animationsReduites: boolean
  sousTitresAuto: boolean
  pubPersonnalisees: boolean
  rappelPause: boolean
  syncContacts: boolean
  localisation: boolean
  telechargementWifi: boolean
  filtreCommentaires: boolean
}

export const reglagesDefaut: Reglages = {
  notifJaime: true,
  notifCommentaires: true,
  notifAbonnes: true,
  notifMentions: true,
  notifSuggestions: true,
  notifLive: true,
  notifMessages: true,
  notifRappels: false,
  comptePrive: false,
  doubleFacteur: false,
  alertesConnexion: true,
  langue: 'fr',
  theme: 'systeme',
  tailleTexte: 'normal',
  economieDonnees: false,
  lectureAuto: true,
  boucle: true,
  sonDemarrage: true,
  animationsReduites: false,
  sousTitresAuto: false,
  pubPersonnalisees: true,
  rappelPause: false,
  syncContacts: false,
  localisation: false,
  telechargementWifi: true,
  filtreCommentaires: true,
}

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
        {
          id: 'd9m1',
          texte: 'LIVE · Tes spectateurs veulent en voir davantage de ta part.',
          moi: false, date: LANCEMENT - MINUTE * 60 * 24,
        },
      ],
    },
    {
      id: 'd1', pseudo: 'kossi_bj', nonLus: 2, flamme: 16,
      messages: [
        { id: 'd1m1', texte: 'Salut ! J\'ai vu ta dernière vidéo, le cadrage est top 🔥', moi: false, date: LANCEMENT - MINUTE * 180 },
        { id: 'd1m2', texte: 'Merci beaucoup 🙏 c\'était tourné à Fidjrossè', moi: true, date: LANCEMENT - MINUTE * 172 },
        { id: 'd1m3', texte: 'Tu utilises quel objectif ?', moi: false, date: LANCEMENT - MINUTE * 14 },
        { id: 'd1m4', texte: 'On se cale un shooting ce week-end ?', moi: false, date: LANCEMENT - MINUTE * 9 },
      ],
    },
    {
      id: 'd2', pseudo: 'mama_cuisine', nonLus: 0, flamme: 107,
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
      id: 'd4', pseudo: 'rire_229', nonLus: 0, flamme: 199,
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
  ] as Conversation[],
  notifications: [
    {
      // Les notifications du canal LIVE ouvrent la liste par defaut.
      id: 'n1', canal: 'live', etiquette: 'LIVE · Activités',
      titre: 'Tes spectateurs veulent en voir davantage de ta part',
      corps: 'Ton dernier direct a retenu l\u2019attention : plus de la moitié '
        + 'des personnes présentes sont restées jusqu\u2019à la fin. Un rendez-vous '
        + 'régulier, par exemple deux soirs par semaine à la même heure, aide '
        + 'ton public à te retrouver sans avoir à te chercher. Pense aussi à '
        + 'annoncer le thème de ton direct la veille : les spectateurs '
        + 'reviennent plus volontiers quand ils savent ce qui les attend.',
      date: LANCEMENT - MINUTE * 60 * 24,
      vignette: SOURCES[0],
    },
    {
      id: 'n2', canal: 'application', etiquette: 'Vidéo Bénin · Activités',
      titre: 'Encore quelques abonnés avant de débloquer de nouveaux outils',
      corps: 'À partir de 100 abonnés, ton compte accède aux statistiques '
        + 'détaillées de chaque publication, aux directs plus longs et à la '
        + 'mise en avant dans « Communauté ». Tu es à moins de vingt abonnés '
        + 'de ce seuil : deux ou trois publications régulières devraient '
        + 'suffire à le franchir.',
      date: LANCEMENT - MINUTE * 60 * 24 * 3,
    },
    {
      id: 'n3', canal: 'application', etiquette: 'Vidéo Bénin · Mises à jour',
      titre: 'Tes vidéos font mieux que 90 % des comptes comparables',
      corps: 'Sur les trente derniers jours, la durée de visionnage moyenne de '
        + 'tes vidéos dépasse celle de neuf comptes béninois sur dix de taille '
        + 'similaire. Les publications tournées en extérieur, à Cotonou comme à '
        + 'Parakou, sont celles qui tiennent le mieux l\u2019attention. Continue '
        + 'sur ce format, et garde les dix premières secondes pour l\u2019essentiel.',
      date: LANCEMENT - MINUTE * 60 * 24 * 3,
      vignette: SOURCES[2],
    },
    {
      id: 'n4', canal: 'promotion', etiquette: 'Assistant promotion · Activités',
      titre: 'Un bon de promotion de 5 000 FCFA t\u2019attend',
      corps: 'Ce bon permet de montrer une de tes vidéos à des personnes qui ne '
        + 'te suivent pas encore, dans les départements que tu choisis. Il reste '
        + 'valable sept jours, puis il expire sans être remplacé. Récupère-le '
        + 'depuis l\u2019assistant, choisis la vidéo à pousser, et laisse la '
        + 'campagne tourner trois jours avant d\u2019en lire les résultats.',
      date: LANCEMENT - MINUTE * 60 * 24 * 5,
    },
    {
      id: 'n5', canal: 'live', etiquette: 'LIVE · Activités',
      titre: 'Ton direct de samedi a attiré deux fois plus de monde',
      corps: 'Deux cent quarante personnes ont rejoint ton direct de samedi '
        + 'soir, contre cent dix la semaine précédente. L\u2019arrivée a surtout '
        + 'eu lieu dans les dix premières minutes : lancer le direct à heure '
        + 'fixe et répondre aux premiers commentaires dès le début semble '
        + 'porter ses fruits.',
      date: LANCEMENT - MINUTE * 60 * 24 * 6,
      vignette: SOURCES[1],
    },
    {
      id: 'n6', canal: 'promotion', etiquette: 'Assistant promotion · Activités',
      titre: 'Ta campagne sur « Le marché Dantokpa un samedi matin » est terminée',
      corps: 'La campagne s\u2019est achevée hier soir : la vidéo a été vue '
        + '4 800 fois de plus, dont 3 100 fois par des comptes qui ne te '
        + 'suivaient pas. Soixante-deux nouveaux abonnés en sont venus. Le '
        + 'rapport complet reste consultable pendant trente jours dans '
        + 'l\u2019assistant.',
      date: LANCEMENT - MINUTE * 60 * 24 * 9,
    },
  ] as Notification[],
  mesVideos: [] as Video[],
  brouillons: [] as Brouillon[],
  // Publications supprimees, conservees 30 jours.
  corbeille: [] as Video[],
  // Rangee de stories de l'onglet « Amis ».
  stories: storiesDemo as Story[],
  // Identifiants des videos mises en favori par le compte connecte.
  favoris: [] as string[],
  // Pseudos auxquels le compte connecte s'est abonne.
  abonnements: [] as string[],
  // Choix faits dans l'ecran des parametres.
  reglages: { ...reglagesDefaut } as Reglages,
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

// Age d'une notification, tel que la fin du paragraphe l'affiche : « 3 h »,
// « 1 j », puis la date passe le mois.
export const ageCourt = (date: number) => {
  const heures = Math.floor((Date.now() - date) / (60 * MINUTE))
  if (heures < 1) return 'maintenant'
  if (heures < 24) return `${heures} h`
  const jours = Math.floor(heures / 24)
  if (jours < 30) return `${jours} j`
  const { jour, mois } = jourEtMois(date)
  return `${jour} ${mois}`
}

// Dernier message d'une conversation, utilise pour l'apercu et pour trier la
// liste du plus recent au plus ancien.
export const dernierMessage = (c: Conversation) =>
  c.messages.length > 0 ? c.messages[c.messages.length - 1] : undefined

// Boite de reception : les demandes en sont exclues, elles ont leur
// propre ecran. Le compte de service reste en tete.
export const conversationsTriees = () =>
  [...etat.conversations]
    .filter(c => !c.demande)
    .sort((a, b) => {
      if (a.systeme !== b.systeme) return a.systeme ? -1 : 1
      return (dernierMessage(b)?.date ?? 0) - (dernierMessage(a)?.date ?? 0)
    })

// Messages recus de comptes auxquels on n'est pas abonne.
export const demandesMessages = () =>
  etat.conversations.filter(c => c.demande)

// ============================================================
// Persistance de l'etat.
//
// Sans elle, tout disparait a la fermeture de l'application :
// publications, brouillons, j'aime, favoris, abonnements et
// conversations ne vivent que dans cet objet.
//
// L'enregistrement est differe : une rafale de modifications (une
// serie de j'aime, par exemple) ne declenche qu'une seule ecriture.
// ============================================================

const CLE_ETAT = 'tiktok-benin-etat-v1'

// Seules ces entrees sont conservees : les comptes de demonstration
// et les videos d'origine se retrouvent dans le code.
type EtatConserve = Pick<typeof etat,
  'videos' | 'mesVideos' | 'brouillons' | 'corbeille'
  | 'commentaires' | 'conversations' | 'favoris' | 'abonnements'
  | 'reglages'>

let minuterie: ReturnType<typeof setTimeout> | null = null

// Appelee apres chaque modification : l'ecriture part 400 ms plus
// tard, et toute nouvelle modification entre-temps la repousse.
export function enregistrer() {
  if (minuterie) clearTimeout(minuterie)
  minuterie = setTimeout(() => {
    minuterie = null
    const aConserver: EtatConserve = {
      videos: etat.videos,
      mesVideos: etat.mesVideos,
      brouillons: etat.brouillons,
      corbeille: etat.corbeille,
      commentaires: etat.commentaires,
      conversations: etat.conversations,
      favoris: etat.favoris,
      abonnements: etat.abonnements,
      reglages: etat.reglages,
    }
    AsyncStorage.setItem(CLE_ETAT, JSON.stringify(aConserver))
      .catch(() => { /* Stockage indisponible : la session reste utilisable. */ })
  }, 400)
}

// Appelee une fois au demarrage, avant le premier rendu.
export async function restaurer() {
  try {
    const brut = await AsyncStorage.getItem(CLE_ETAT)
    if (!brut) return
    const conserve = JSON.parse(brut) as Partial<EtatConserve>
    // Chaque entree est reprise seulement si elle est bien une liste :
    // un enregistrement tronque ne doit pas vider l'application.
    for (const cle of [
      'videos', 'mesVideos', 'brouillons', 'corbeille',
      'commentaires', 'conversations', 'favoris', 'abonnements',
    ] as const) {
      const valeur = conserve[cle]
      if (Array.isArray(valeur)) (etat as Record<string, unknown>)[cle] = valeur
    }
    // Les reglages sont un objet, pas une liste : on repart des valeurs
    // par defaut et on ne reprend que les cles reconnues, pour qu'un
    // enregistrement ecrit par une version plus ancienne reste lisible.
    if (conserve.reglages && typeof conserve.reglages === 'object') {
      const lus = conserve.reglages as Record<string, unknown>
      const fusion = { ...reglagesDefaut } as Record<string, unknown>
      for (const cle of Object.keys(reglagesDefaut)) {
        if (typeof lus[cle] === typeof fusion[cle]) fusion[cle] = lus[cle]
      }
      etat.reglages = fusion as unknown as Reglages
    }
  } catch { /* Enregistrement illisible : on repart des donnees d'origine. */ }
}
