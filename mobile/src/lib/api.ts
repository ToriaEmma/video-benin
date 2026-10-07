// ============================================================
// Client de l'API TockTick (api/serveur.js).
import type { Son } from './sons'
//
// Tout l'acces reseau de l'application passe par ce fichier : les
// ecrans appellent les enveloppes typees et n'ont jamais a connaitre
// ni l'adresse du serveur ni la forme du jeton.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage'

import type {
  Brouillon,
  Commentaire,
  Message,
  Video,
} from './demo'

// Adresse de repli pour le developpement local : sur un appareil reel il
// faut renseigner EXPO_PUBLIC_API_URL, « localhost » y designant le
// telephone lui-meme.
export const URL_API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'

const CLE_JETON = 'tok229-jeton-api-v1'

// Le jeton est garde en memoire en plus d'AsyncStorage : chaque requete
// le relit, et un aller-retour vers le stockage a chaque appel serait
// inutilement couteux.
let jetonEnMemoire: string | null = null
let jetonCharge = false

export async function poserJeton(j: string | null) {
  jetonEnMemoire = j
  jetonCharge = true
  try {
    if (j) await AsyncStorage.setItem(CLE_JETON, j)
    else await AsyncStorage.removeItem(CLE_JETON)
  } catch { /* Stockage bloque : la session reste valable jusqu'a la fermeture. */ }
}

export async function lireJeton(): Promise<string | null> {
  if (jetonCharge) return jetonEnMemoire
  try {
    jetonEnMemoire = await AsyncStorage.getItem(CLE_JETON)
  } catch {
    jetonEnMemoire = null
  }
  jetonCharge = true
  return jetonEnMemoire
}

export type OptionsRequete = {
  methode?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  // Corps serialise en JSON par le client.
  corps?: unknown
  // Requete anonyme : utile pour l'inscription et la connexion, qui ne
  // doivent pas porter un jeton perime.
  sansJeton?: boolean
}

export async function requete<T>(chemin: string, options: OptionsRequete = {}): Promise<T> {
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!options.sansJeton) {
    const jeton = await lireJeton()
    if (jeton) entetes.Authorization = `Bearer ${jeton}`
  }

  let reponse: Response
  try {
    reponse = await fetch(`${URL_API}${chemin}`, {
      method: options.methode ?? 'GET',
      headers: entetes,
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
    })
  } catch {
    throw new Error('Impossible de joindre le serveur')
  }

  // Le corps peut etre vide ou illisible (502 d'un intermediaire) : on
  // retombe alors sur un message utilisable plutot que sur une erreur
  // d'analyse JSON.
  let donnees: unknown = null
  const texte = await reponse.text()
  if (texte) {
    try {
      donnees = JSON.parse(texte)
    } catch {
      if (reponse.ok) throw new Error('Réponse du serveur illisible')
    }
  }

  if (!reponse.ok) {
    const erreur = (donnees as { erreur?: string } | null)?.erreur
    throw new Error(erreur || 'Le serveur a refusé la requête')
  }
  return donnees as T
}

// ------------------------------------------------------------
// Formes renvoyees par l'API
// ------------------------------------------------------------

// Projection de `profilPublic` cote serveur.
export type ProfilApi = {
  id: string
  pseudo: string
  nom: string | null
  bio: string | null
  avatar_url: string | null
  telephone: string | null
  cree_le?: string
}

// GET /profils/:pseudo ajoute les compteurs et la relation d'abonnement.
export type ProfilDetaille = ProfilApi & {
  nbAbonnes: number
  nbSuivis: number
  nbVideos: number
  suivi: boolean
}

export type Session = { jeton: string; profil: ProfilApi }

// Ligne de compte rendue par la recherche, les listes d'abonnement et
// les suggestions : partout la meme, avec son bouton d'abonnement.
export type CompteApi = {
  id: string
  pseudo: string
  nom: string | null
  avatar_url: string | null
  bio: string | null
  nbAbonnes: number
  suivi: boolean
}

// La video de l'API porte deux champs de plus que celle de demo.ts :
// l'identifiant de l'auteur et la date de mise a la corbeille.
export type VideoApi = Video & {
  favori: boolean
  sonId: string | null
  supprimeeLe: string | null
  auteurId: string
}

// Conversation telle que la liste la renvoie : les messages ne sont pas
// inclus, ils se chargent a l'ouverture du fil.
export type ApercuConversation = {
  id: string
  pseudo: string | null
  profilId: string | null
  avatarUrl: string | null
  nonLus: number
  luLe: string | null
  dernierMessage: { texte: string; date: number; moi: boolean } | null
}

export type ConversationOuverte = { id: string; pseudo: string; nouvelle: boolean }

export type NouvelleVideo = {
  url: string
  legende?: string
  departement?: string | null
  visibilite?: 'monde' | 'amis' | 'moi'
  commentaires_autorises?: boolean
  reutilisation_autorisee?: boolean
  son_id?: string | null
}

export type ModificationVideo = {
  legende?: string
  visibilite?: 'monde' | 'amis' | 'moi'
  commentaires_autorises?: boolean
  reutilisation_autorisee?: boolean
}

// Un champ a null ou absent garde sa valeur actuelle (COALESCE cote API) :
// seule une chaine ecrase le contenu existant.
export type ModificationProfil = Partial<{
  nom: string | null
  pseudo: string
  bio: string | null
  avatar_url: string | null
}>

// Pagination par curseur : `avant` est la date de publication de la
// derniere video recue.
export type Pagination = { limite?: number; avant?: string }

const parametres = (p: Pagination = {}) => {
  const bouts: string[] = []
  if (p.limite !== undefined) bouts.push(`limite=${p.limite}`)
  if (p.avant) bouts.push(`avant=${encodeURIComponent(p.avant)}`)
  return bouts.length ? `?${bouts.join('&')}` : ''
}

const pseudoUrl = (pseudo: string) => encodeURIComponent(pseudo)

// ------------------------------------------------------------
// Televersements
// ------------------------------------------------------------

export type AutorisationDepot = {
  url: string
  cle: string
  urlPublique: string
  // En-tetes signes avec l'autorisation, a renvoyer tels quels.
  entetes?: Record<string, string>
}

const TYPES_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']

// Le selecteur de medias rend un chemin local : l'extension sert a
// deviner le type, le fichier ne portant pas cette information.
const typeDepuisUri = (uri: string) => {
  const bout = uri.split('?')[0].split('.').pop()?.toLowerCase()
  if (bout === 'mov') return 'video/quicktime'
  if (bout === 'webm') return 'video/webm'
  return 'video/mp4'
}

// Televerse la video designee par son URI locale et rend l'adresse
// durable. Les octets vont directement au stockage : l'API ne delivre
// que l'autorisation d'envoi.
export async function televerser(
  uri: string,
  surEtape?: (etape: 'preparation' | 'envoi' | 'fini', pourcentage?: number) => void,
): Promise<string> {
  surEtape?.('preparation')

  // Le fichier est relu depuis le disque de l'appareil pour connaitre sa
  // taille reelle, que l'API exige avant de signer l'autorisation.
  let blob: Blob
  try {
    const r = await fetch(uri)
    blob = await r.blob()
  } catch {
    throw new Error('Vidéo introuvable sur l’appareil')
  }

  // « video/webm;codecs=vp9,opus » : le type de base seul compte.
  const typeBrut = blob.type.split(';')[0]
  const type = TYPES_VIDEO.includes(typeBrut) ? typeBrut : typeDepuisUri(uri)

  const depot = await requete<AutorisationDepot>('/televersements', {
    methode: 'POST',
    corps: { type, taille: blob.size },
  })

  // XMLHttpRequest plutot que fetch : lui seul donne l'avancement de l'envoi,
  // affiche en pourcentage sur l'ecran de publication.
  surEtape?.('envoi', 0)
  await new Promise<void>((resoudre, rejeter) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', depot.url)
    Object.entries(depot.entetes ?? { 'Content-Type': type })
      .forEach(([nom, valeur]) => xhr.setRequestHeader(nom, valeur))
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) surEtape?.('envoi', Math.min(99, Math.round(e.loaded / e.total * 100)))
    }
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resoudre()
      : rejeter(new Error(`Le stockage a refusé la vidéo (erreur ${xhr.status})`))
    xhr.onerror = () => rejeter(new Error('L’envoi de la vidéo a échoué : vérifiez votre connexion'))
    xhr.send(blob)
  })

  surEtape?.('fini')
  return depot.urlPublique
}

// ------------------------------------------------------------
// Comptes
// ------------------------------------------------------------

export const apiComptes = {
  inscription: (telephone: string, motDePasse: string, pseudo: string) =>
    requete<Session>('/inscription', {
      methode: 'POST',
      corps: { telephone, motDePasse, pseudo },
      sansJeton: true,
    }),

  connexion: (telephone: string, motDePasse: string) =>
    requete<Session>('/connexion', {
      methode: 'POST',
      corps: { telephone, motDePasse },
      sansJeton: true,
    }),

  moi: () => requete<ProfilApi>('/moi'),

  modifierProfil: (valeurs: ModificationProfil) =>
    requete<ProfilApi>('/moi', { methode: 'PATCH', corps: valeurs }),
}

// ------------------------------------------------------------
// Publications
// ------------------------------------------------------------

export const apiVideos = {
  liste: (p?: Pagination) => requete<VideoApi[]>(`/videos${parametres(p)}`),

  // Fil des abonnements : exige une session, et renvoie une liste vide
  // quand le lecteur ne suit encore personne.
  suivis: (p?: Pagination) => requete<VideoApi[]>(`/videos/suivis${parametres(p)}`),

  une: (id: string) => requete<VideoApi>(`/videos/${id}`),

  duProfil: (pseudo: string, p?: Pagination) =>
    requete<VideoApi[]>(`/profils/${pseudoUrl(pseudo)}/videos${parametres(p)}`),

  creer: (video: NouvelleVideo) =>
    requete<VideoApi>('/videos', { methode: 'POST', corps: video }),

  modifier: (id: string, valeurs: ModificationVideo) =>
    requete<VideoApi>(`/videos/${id}`, { methode: 'PATCH', corps: valeurs }),

  supprimer: (id: string) =>
    requete<{ ok: true }>(`/videos/${id}`, { methode: 'DELETE' }),

  corbeille: () => requete<VideoApi[]>('/corbeille'),

  restaurer: (id: string) =>
    requete<{ ok: true }>(`/videos/${id}/restaurer`, { methode: 'POST' }),

  // Signalement a la moderation ; un compte ne signale qu'une fois.
  signaler: (id: string, motif: string) =>
    requete<{ ok: true }>(`/videos/${id}/signalement`, { methode: 'POST', corps: { motif } }),

  vue: (id: string) =>
    requete<{ vues: number }>(`/videos/${id}/vue`, { methode: 'POST' }),
}

// ------------------------------------------------------------
// Interactions
// ------------------------------------------------------------

export const apiInteractions = {
  aimer: (videoId: string) =>
    requete<{ aime: boolean; nbAime: number }>(`/videos/${videoId}/jaime`, { methode: 'POST' }),

  retirerJaime: (videoId: string) =>
    requete<{ aime: boolean; nbAime: number }>(`/videos/${videoId}/jaime`, { methode: 'DELETE' }),

  mettreEnFavori: (videoId: string) =>
    requete<{ favori: boolean }>(`/videos/${videoId}/favori`, { methode: 'POST' }),

  retirerFavori: (videoId: string) =>
    requete<{ favori: boolean }>(`/videos/${videoId}/favori`, { methode: 'DELETE' }),

  favoris: () => requete<VideoApi[]>('/favoris'),

  jaimees: () => requete<VideoApi[]>('/jaimees'),

  suivre: (pseudo: string) =>
    requete<{ suivi: boolean }>(`/profils/${pseudoUrl(pseudo)}/abonnement`, { methode: 'POST' }),

  nePlusSuivre: (pseudo: string) =>
    requete<{ suivi: boolean }>(`/profils/${pseudoUrl(pseudo)}/abonnement`, { methode: 'DELETE' }),

  profil: (pseudo: string) => requete<ProfilDetaille>(`/profils/${pseudoUrl(pseudo)}`),

  // Les comptes qui suivent ce profil.
  abonnes: (pseudo: string, p?: Pagination) =>
    requete<CompteApi[]>(`/profils/${pseudoUrl(pseudo)}/abonnes${parametres(p)}`),

  // Les comptes que ce profil suit.
  abonnements: (pseudo: string, p?: Pagination) =>
    requete<CompteApi[]>(`/profils/${pseudoUrl(pseudo)}/abonnements${parametres(p)}`),

  // Comptes a suivre, les plus suivis d'abord : de quoi sortir d'un fil
  // « Suivis » vide.
  suggestions: (p?: Pagination) =>
    requete<CompteApi[]>(`/suggestions${parametres(p)}`),
}

// ------------------------------------------------------------
// Recherche
// ------------------------------------------------------------

export type ResultatRecherche = { comptes: CompteApi[]; videos: VideoApi[] }

export const apiRecherche = {
  // Comptes et videos en un seul aller-retour. Le terme accepte les
  // fragments : le serveur compare en ILIKE sur le pseudo et le nom.
  tout: (q: string, p?: Pagination) =>
    requete<ResultatRecherche>(
      `/recherche?q=${encodeURIComponent(q)}${parametres(p).replace('?', '&')}`,
    ),
}

// ------------------------------------------------------------
// Commentaires
// ------------------------------------------------------------

export const apiCommentaires = {
  liste: (videoId: string) =>
    requete<Commentaire[]>(`/videos/${videoId}/commentaires`),

  ajouter: (videoId: string, texte: string) =>
    requete<Commentaire>(`/videos/${videoId}/commentaires`, {
      methode: 'POST',
      corps: { texte },
    }),

  supprimer: (id: string) =>
    requete<{ ok: true }>(`/commentaires/${id}`, { methode: 'DELETE' }),
}

// ------------------------------------------------------------
// Brouillons
// ------------------------------------------------------------

// Sons favoris, ranges par compte. L'identifiant (« dz:123 », « video:… »)
// passe dans l'adresse : il est encode.
export const apiSonsFavoris = {
  liste: () => requete<(Partial<Son> & { id: string })[]>('/sons-favoris'),
  ajouter: (son: Son) => requete<{ favori: true }>(`/sons-favoris/${encodeURIComponent(son.id)}`, {
    methode: 'PUT',
    corps: { titre: son.titre, artiste: son.artiste, pochette: son.pochette, duree: son.duree,
      couleur: son.couleur, original: !!son.original, licence: son.licence },
  }),
  retirer: (id: string) => requete<{ favori: false }>(`/sons-favoris/${encodeURIComponent(id)}`, { methode: 'DELETE' }),
}

export const apiBrouillons = {
  liste: () => requete<Brouillon[]>('/brouillons'),

  creer: (url: string, legende = '', octets = 0) =>
    requete<Brouillon>('/brouillons', {
      methode: 'POST',
      corps: { url, legende, octets },
    }),

  supprimer: (id: string) =>
    requete<{ ok: true }>(`/brouillons/${id}`, { methode: 'DELETE' }),
}

// ------------------------------------------------------------
// Messagerie
// ------------------------------------------------------------

export const apiMessagerie = {
  conversations: () => requete<ApercuConversation[]>('/conversations'),

  messages: (conversationId: string) =>
    requete<Message[]>(`/conversations/${conversationId}/messages`),

  envoyer: (conversationId: string, texte: string) =>
    requete<Message>(`/conversations/${conversationId}/messages`, {
      methode: 'POST',
      corps: { texte },
    }),

  ouvrirConversation: (pseudo: string) =>
    requete<ConversationOuverte>('/conversations', {
      methode: 'POST',
      corps: { pseudo },
    }),

  marquerLu: (conversationId: string) =>
    requete<{ ok: true }>(`/conversations/${conversationId}/lu`, { methode: 'POST' }),
}

// ------------------------------------------------------------
// Recits
// ------------------------------------------------------------

// Une bulle de la bande : un auteur et son recit le plus recent. L'API
// groupe par auteur, la bande n'affichant qu'une bulle par compte.
export type RecitApi = {
  id: string
  pseudo: string
  avatarUrl: string | null
  url: string
  nb: number
  date: number
  moi: boolean
}

export const apiStories = {
  // Les recits du lecteur et de ceux qu'il suit, les expires ecartes.
  liste: () => requete<RecitApi[]>('/stories'),

  publier: (url: string) =>
    requete<{ id: string; url: string; date: number }>('/stories', {
      methode: 'POST',
      corps: { url },
    }),
}

// ------------------------------------------------------------
// Notifications
// ------------------------------------------------------------

// Evenement reel concernant le lecteur. `videoId` et `texte` ne sont
// portes que par les genres qui s'y rapportent.
export type EvenementApi = {
  genre: 'abonnement' | 'jaime' | 'commentaire'
  pseudo: string
  avatarUrl: string | null
  videoId: string | null
  texte: string | null
  date: number
}

export const apiNotifications = {
  liste: () => requete<EvenementApi[]>('/notifications'),
}
