// ============================================================
// Comptes et jetons de session.
//
// Le mot de passe est conserve sous forme d'empreinte bcrypt : la
// base ne contient jamais le mot de passe en clair, de sorte qu'une
// fuite de la base ne livre pas les comptes.
// ============================================================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'secret-de-developpement'
// Duree de vie d'une session. Au-dela, l'application redemande une
// connexion.
const DUREE = '30d'

export const chiffrer = (motDePasse) => bcrypt.hash(motDePasse, 10)
export const verifier = (motDePasse, empreinte) =>
  bcrypt.compare(motDePasse, empreinte)

export const signerJeton = (profilId) =>
  jwt.sign({ id: profilId }, SECRET, { expiresIn: DUREE })

// Middleware : refuse la requete si l'en-tete Authorization ne porte
// pas un jeton valide, et pose `req.profilId` sinon.
export function exigerSession(req, res, suite) {
  const entete = req.headers.authorization || ''
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : null
  if (!jeton) return res.status(401).json({ erreur: 'Session requise' })

  try {
    const charge = jwt.verify(jeton, SECRET)
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
    try { req.profilId = jwt.verify(jeton, SECRET).id } catch { /* visiteur */ }
  }
  suite()
}
