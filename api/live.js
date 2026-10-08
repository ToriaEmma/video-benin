// ============================================================
// Diffusions en direct (LIVE), relayees par LiveKit Cloud.
//
// L'image et le son ne passent pas par cette API : le telephone qui
// filme les envoie au serveur LiveKit, qui les redistribue aux
// spectateurs (WebRTC, ~1 s de decalage). L'API tient seulement le
// registre des directs en cours et delivre les jetons d'acces a une
// salle : publier pour le diffuseur, regarder pour les autres.
// ============================================================

import jwt from 'jsonwebtoken'

const URL_LIVEKIT = process.env.LIVEKIT_URL || ''
const CLE = process.env.LIVEKIT_CLE || ''
const SECRET = process.env.LIVEKIT_SECRET || ''

export const liveConfigure = () => Boolean(URL_LIVEKIT && CLE && SECRET)
export const urlLiveKit = () => URL_LIVEKIT

// Duree de validite d'un jeton : il ne sert qu'a entrer dans la salle,
// la connexion etablie reste ouverte au-dela.
const DUREE_JETON = 6 * 60 * 60

// Jeton d'acces LiveKit (JWT HS256 signe avec le secret du projet).
// - diffuseur : publie camera et micro ;
// - spectateur connecte : regarde, et ecrit dans le tchat (donnees) ;
// - visiteur sans compte : regarde seulement.
export function jetonSalle({ salle, identite, nom, diffuseur = false, tchat = false }) {
  const maintenant = Math.floor(Date.now() / 1000)
  return jwt.sign({
    iss: CLE,
    sub: identite,
    name: nom,
    nbf: maintenant - 10,
    exp: maintenant + DUREE_JETON,
    video: {
      room: salle,
      roomJoin: true,
      canSubscribe: true,
      canPublish: diffuseur,
      canPublishData: diffuseur || tchat,
      // Seul le diffuseur peut changer les informations de la salle.
      canUpdateOwnMetadata: diffuseur,
    },
  }, SECRET, { algorithm: 'HS256' })
}
