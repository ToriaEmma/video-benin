// ============================================================
// Valeurs partagees par l'ecran de publication et ses feuilles.
//
// Elles vivent hors du module des feuilles : un fichier qui exporte des
// composants ne doit exporter que cela, sans quoi le rechargement a chaud
// de Vite retombe sur un rechargement complet de la page.
// ============================================================

// Les douze departements du Benin, dans l'ordre alphabetique.
export const DEPARTEMENTS = [
  'Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Couffo',
  'Donga', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou',
] as const

export type Departement = typeof DEPARTEMENTS[number]

// Qui peut voir la publication : la valeur choisie sur la page de publication.
export type Audience = 'tous' | 'amis' | 'moi'

export const AUDIENCES: Record<Audience, string> = {
  tous: 'Tout le monde peut voir cette publication',
  amis: 'Tes ami(e)s peuvent voir cette publication',
  moi: 'Toi seul(e) peux voir cette publication',
}

// Les reglages de « Plus d'options », rassembles pour que la page de
// publication n'en garde qu'un seul etat.
export type Options = {
  commentaires: boolean
  reutilisation: boolean
  genereIA: boolean
  droitsSon: boolean
  rechercheVisuelle: boolean
  hauteQualite: boolean
  surAppareil: boolean
  filigrane: boolean
  publicAdulte: boolean
}

export const OPTIONS_PAR_DEFAUT: Options = {
  commentaires: true,
  reutilisation: true,
  genereIA: false,
  droitsSon: false,
  rechercheVisuelle: true,
  hauteQualite: false,
  surAppareil: true,
  filigrane: false,
  publicAdulte: false,
}

// Applications vers lesquelles la publication peut etre relayee.
export const APPLICATIONS = ['whatsapp', 'facebook', 'sms'] as const

export type Application = typeof APPLICATIONS[number]
