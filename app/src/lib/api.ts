// ============================================================
// Client de l'API Tok 229 (api/serveur.js).
//
// Jumeau web de mobile/src/lib/api.ts : meme surface, meme forme de
// reponses. Tout l'acces reseau passe par ce fichier, les ecrans n'ont
// donc a connaitre ni l'adresse du serveur ni la forme du jeton.
// ============================================================

// L'adresse se regle a la compilation. Le repli vise le deploiement
// public : une application servie sans fichier .env reste fonctionnelle.
export const URL_API =
  (import.meta.env.VITE_API_URL as string | undefined)
  || 'https://tok-229-api.vercel.app'

const CLE_JETON = 'tok229-jeton-api-v1'

// Le jeton est garde en memoire en plus de localStorage : chaque requete
// le relit, et un acces au stockage a chaque appel serait inutile.
let jetonEnMemoire: string | null = null
let jetonCharge = false

export function poserJeton(j: string | null) {
  jetonEnMemoire = j
  jetonCharge = true
  try {
    if (j) localStorage.setItem(CLE_JETON, j)
    else localStorage.removeItem(CLE_JETON)
  } catch { /* Stockage bloque : la session reste valable jusqu'a la fermeture. */ }
}

// Synchrone, contrairement a la version mobile : localStorage repond
// immediatement, la ou AsyncStorage impose une promesse.
export function lireJeton(): string | null {
  if (jetonCharge) return jetonEnMemoire
  try {
    jetonEnMemoire = localStorage.getItem(CLE_JETON)
  } catch {
    jetonEnMemoire = null
  }
  jetonCharge = true
  return jetonEnMemoire
}

export type OptionsRequete = {
  methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  // Corps serialise en JSON par le client.
  corps?: unknown
  // Requete anonyme : utile pour l'inscription et la connexion, qui ne
  // doivent pas porter un jeton perime.
  sansJeton?: boolean
}

export async function requete<T>(chemin: string, options: OptionsRequete = {}): Promise<T> {
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!options.sansJeton) {
    const jeton = lireJeton()
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

// Projection de `videoPublique` cote serveur. Le pseudo de l'auteur arrive
// a plat, la ou les ecrans de demonstration le nichaient dans `profils`.
export type VideoApi = {
  id: string
  url: string
  legende: string
  vues: number
  pseudo: string
  aime: boolean
  favori: boolean
  nbAime: number
  nbCommentaires: number
  visibilite: 'monde' | 'amis' | 'moi'
  commentairesAutorises: boolean
  reutilisationAutorisee: boolean
  publieeLe: string
  departement: string | null
  sonId: string | null
  supprimeeLe: string | null
  auteurId: string
}

export type CommentaireApi = {
  id: string
  videoId: string
  texte: string
  pseudo: string
  date: string
  horodatage: number
  auteurId: string
}

export type BrouillonApi = {
  id: string
  url: string
  legende: string
  octets: number
  // Date d'enregistrement, en millisecondes.
  date: number
}

export type MessageApi = {
  id: string
  texte: string
  moi: boolean
  date: number
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
}

// Types acceptes par l'API : un autre format est refuse avant l'envoi,
// plutot qu'apres avoir consomme le forfait de l'utilisateur.
const TYPES_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']

// Televerse le fichier vers le stockage et rend l'adresse durable a
// enregistrer. Les octets ne passent pas par l'API : elle ne delivre que
// l'autorisation d'envoi.
export async function televerser(
  fichier: Blob,
  surProgression?: (centiemes: number) => void,
): Promise<string> {
  const type = TYPES_VIDEO.includes(fichier.type) ? fichier.type : 'video/mp4'

  const depot = await requete<AutorisationDepot>('/televersements', {
    methode: 'POST',
    corps: { type, taille: fichier.size },
  })

  // XMLHttpRequest et non fetch : lui seul rapporte l'avancement de
  // l'envoi, qu'une video sur reseau mobile rend necessaire.
  await new Promise<void>((resoudre, rejeter) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', depot.url)
    xhr.setRequestHeader('Content-Type', type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) surProgression?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resoudre()
      else rejeter(new Error(`Le stockage a refusé la vidéo (erreur ${xhr.status})`))
    }
    xhr.onerror = () => rejeter(new Error("L'envoi de la vidéo a échoué"))
    xhr.onabort = () => rejeter(new Error ('Envoi de la vidéo interrompu'))
    xhr.send(fichier)
  })

  return depot.urlPublique
}

// Recupere un blob: ou une URL locale pour en faire un fichier envoyable.
export async function fichierDepuisUrl(url: string): Promise<Blob> {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Vidéo locale illisible')
  return r.blob()
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

  // Fil des abonnements : exige une session, et ne renvoie que les
  // publications des comptes suivis.
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
}

// ------------------------------------------------------------
// Commentaires
// ------------------------------------------------------------

export const apiCommentaires = {
  liste: (videoId: string) =>
    requete<CommentaireApi[]>(`/videos/${videoId}/commentaires`),

  ajouter: (videoId: string, texte: string) =>
    requete<CommentaireApi>(`/videos/${videoId}/commentaires`, {
      methode: 'POST',
      corps: { texte },
    }),

  supprimer: (id: string) =>
    requete<{ ok: true }>(`/commentaires/${id}`, { methode: 'DELETE' }),
}

// ------------------------------------------------------------
// Brouillons
// ------------------------------------------------------------

export const apiBrouillons = {
  liste: () => requete<BrouillonApi[]>('/brouillons'),

  creer: (url: string, legende = '', octets = 0) =>
    requete<BrouillonApi>('/brouillons', {
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
    requete<MessageApi[]>(`/conversations/${conversationId}/messages`),

  envoyer: (conversationId: string, texte: string) =>
    requete<MessageApi>(`/conversations/${conversationId}/messages`, {
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
