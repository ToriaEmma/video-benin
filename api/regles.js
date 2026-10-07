// ============================================================
// Regles de validation des donnees envoyees par les clients.
//
// Tout ce qui arrive du reseau est suppose hostile : chaque champ est
// verifie (type, format, longueur) avant de toucher la base. Les
// requetes SQL sont deja parametrees ; ces regles protegent en plus
// contre les donnees aberrantes (textes geants, adresses arbitraires,
// pseudos trompeurs).
// ============================================================

// Erreur portant un code HTTP, pour distinguer un refus attendu
// (400, 403, 404, 429) d'une panne serveur.
export class Refus extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

// Longueurs maximales, en caracteres.
export const LIMITES = {
  nom: 50,
  bio: 160,
  legende: 2200,
  commentaire: 500,
  message: 2000,
  departement: 40,
  motDePasseMin: 6,
  // bcrypt ignore tout au-dela de 72 octets ; une borne evite aussi
  // de hacher des megaoctets.
  motDePasseMax: 72,
  // Photo de profil en data URL (JPEG de 400 px cote web).
  avatar: 400_000,
}

export const texteRequis = (valeur, nom, max = 10_000) => {
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    throw new Refus(400, `Le champ « ${nom} » est requis`)
  }
  const t = valeur.trim()
  if (t.length > max) throw new Refus(400, `Le champ « ${nom} » est trop long (${max} caractères maximum)`)
  return t
}

export const texteFacultatif = (valeur, nom = 'texte', max = 10_000) => {
  if (typeof valeur !== 'string') return null
  const t = valeur.trim()
  if (t.length > max) throw new Refus(400, `Le champ « ${nom} » est trop long (${max} caractères maximum)`)
  return t
}

export const booleenOuDefaut = (valeur, defaut) =>
  typeof valeur === 'boolean' ? valeur : defaut

// Pseudo : minuscules, chiffres, point et tiret bas. Les majuscules sont
// ramenees en minuscules, pour que « Kim » et « kim » ne puissent pas
// coexister et se faire passer l'un pour l'autre.
const MOTIF_PSEUDO = /^[a-z0-9._]{3,24}$/
export const pseudoValide = (valeur) => {
  const p = texteRequis(valeur, 'pseudo', 24).replace(/^@/, '').toLowerCase()
  if (!MOTIF_PSEUDO.test(p)) {
    throw new Refus(400, 'Pseudo invalide : 3 à 24 caractères, lettres, chiffres, « . » ou « _ »')
  }
  return p
}

// Numero : seuls les chiffres comptent (+229, espaces et tirets ignores).
export const telephoneValide = (valeur) => {
  const chiffres = texteRequis(valeur, 'telephone', 30).replace(/\D/g, '')
  if (chiffres.length < 8 || chiffres.length > 15) {
    throw new Refus(400, 'Numéro de téléphone invalide')
  }
  return chiffres
}

// Les 8 derniers chiffres identifient une ligne, quelle que soit
// l'ecriture (indicatif 229, ancien numero a 8 chiffres, nouveau a 10).
export const finDeNumero = (chiffres) => chiffres.slice(-8)

export const motDePasseValide = (valeur) => {
  if (typeof valeur !== 'string' || valeur.length < LIMITES.motDePasseMin) {
    throw new Refus(400, `Le mot de passe doit faire au moins ${LIMITES.motDePasseMin} caractères`)
  }
  if (new TextEncoder().encode(valeur).length > LIMITES.motDePasseMax) {
    throw new Refus(400, 'Mot de passe trop long')
  }
  return valeur
}

// Code de recuperation saisi : majuscules, sans tirets ni espaces, comme a
// sa creation (« k7qm 3xrw-pz9d h4tb » vaut « K7QM3XRWPZ9DH4TB »).
export const normaliserCode = (code) => String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')

// uuid attendu dans l'URL : un identifiant mal forme ferait echouer la
// requete SQL avec une erreur de type, qu'on ne veut pas remonter.
const MOTIF_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const identifiant = (brut, nom = 'identifiant') => {
  if (!MOTIF_UUID.test(brut || '')) throw new Refus(400, `${nom} invalide`)
  return brut
}

// Son attache a une publication : extrait Deezer (« dz:123 »), son
// original d'une autre video (« video:<uuid> ») ou son du catalogue.
const MOTIF_SON = /^(dz:\d{1,15}|video:[0-9a-f-]{36}|[a-z0-9-]{1,40})$/i
export const sonValide = (valeur) => {
  if (valeur === undefined || valeur === null || valeur === '') return null
  if (typeof valeur !== 'string' || !MOTIF_SON.test(valeur)) throw new Refus(400, 'Son invalide')
  return valeur
}

// Photo de profil : une image encodee (JPEG, PNG ou WebP) de taille
// raisonnable, ou une chaine vide pour la retirer. Une adresse externe
// est refusee : elle permettrait de pister les visiteurs ou d'afficher
// n'importe quoi.
const MOTIF_AVATAR = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
export const avatarValide = (valeur) => {
  if (valeur === undefined) return null
  if (valeur === '' ) return ''
  if (typeof valeur !== 'string' || valeur.length > LIMITES.avatar || !MOTIF_AVATAR.test(valeur)) {
    throw new Refus(400, 'Photo de profil invalide : image JPEG, PNG ou WebP de moins de 300 Ko')
  }
  return valeur
}

// Date de pagination (« avant ») : une valeur illisible est ignoree au
// lieu de provoquer une erreur SQL.
export const dateFacultative = (brut) => {
  if (typeof brut !== 'string' || !brut) return null
  return Number.isNaN(Date.parse(brut)) ? null : new Date(brut).toISOString()
}

// La limite est plafonnee : une requete ne doit pas pouvoir demander
// la table entiere.
export const limiteDemandee = (brut) => {
  const n = Number.parseInt(brut, 10)
  if (!Number.isFinite(n) || n <= 0) return 20
  return Math.min(n, 50)
}
