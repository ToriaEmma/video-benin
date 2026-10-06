// ============================================================
// Comptes et jetons de session.
//
// Le mot de passe est conserve sous forme d'empreinte bcrypt : la
// base ne contient jamais le mot de passe en clair, de sorte qu'une
// fuite de la base ne livre pas les comptes.
// ============================================================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// En production, un secret manquant rendrait les jetons falsifiables
// (n'importe qui connaitrait le secret de developpement) : le serveur
// refuse alors de demarrer.
const SECRET = process.env.JWT_SECRET || ''
const EN_PRODUCTION = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production'
if (!SECRET && EN_PRODUCTION) throw new Error('JWT_SECRET manquant')
if (SECRET && SECRET.length < 32) console.warn('JWT_SECRET court : 32 caractères aléatoires minimum conseillés.')
const SECRET_EFFECTIF = SECRET || 'secret-de-developpement-local-uniquement'
// Un seul algorithme accepte : un jeton signe autrement est refuse.
const ALGORITHMES = ['HS256']
// Duree de vie d'une session. Au-dela, l'application redemande une
// connexion.
const DUREE = '30d'

export const chiffrer = (motDePasse) => bcrypt.hash(motDePasse, 10)
export const verifier = (motDePasse, empreinte) =>
  bcrypt.compare(motDePasse, empreinte)

// Empreinte d'un mot de passe que personne ne connait : comparee quand le
// compte n'existe pas, pour que la reponse prenne le meme temps.
export const EMPREINTE_LEURRE = '$2b$10$br3qb3YdkRiAtaReNPaxzuWn2f2tVeNbg0PHGLNUy/KlCa4.ozJti'

export const signerJeton = (profilId) =>
  jwt.sign({ id: profilId }, SECRET_EFFECTIF, { expiresIn: DUREE, algorithm: 'HS256' })

// Middleware : refuse la requete si l'en-tete Authorization ne porte
// pas un jeton valide, et pose `req.profilId` sinon.
export function exigerSession(req, res, suite) {
  const entete = req.headers.authorization || ''
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : null
  if (!jeton) return res.status(401).json({ erreur: 'Session requise' })

  try {
    const charge = jwt.verify(jeton, SECRET_EFFECTIF, { algorithms: ALGORITHMES })
    req.profilId = charge.id
    suite()
  } catch {
    res.status(401).json({ erreur: 'Session expirée' })
  }
}

// Variante tolerante : pose `req.profilId` s'il y a un jeton valide,
// mais laisse passer les visiteurs. Sert aux routes de lecture, qui
// doivent savoir ce que le visiteur a deja aime.
export function sessionFacultative(req, _res, suite) {
  const entete = req.headers.authorization || ''
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : null
  if (jeton) {
    try { req.profilId = jwt.verify(jeton, SECRET_EFFECTIF, { algorithms: ALGORITHMES }).id } catch { /* visiteur */ }
  }
  suite()
}
