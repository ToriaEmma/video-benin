// ============================================================
// Stockage des fichiers video (stockage objet Neon, compatible S3).
//
// Les octets ne traversent pas l'API : le client recoit une URL signee
// et televerse directement vers le stockage. L'hebergement sans serveur
// plafonne la taille d'un corps de requete bien en dessous d'une video,
// et faire transiter le fichier par la fonction le gaspillerait.
// ============================================================

import 'dotenv/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const POINT_DACCES = process.env.STOCKAGE_ENDPOINT
  || 'https://br-long-snow-b2sxuksr.storage.c-6.eu-central-1.aws.neon.tech'
const REGION = process.env.STOCKAGE_REGION || 'eu-central-1'
// Le seau doit etre en lecture publique : une video doit se lire depuis
// n'importe quel appareil, sans signature ni session.
const SEAU = process.env.STOCKAGE_SEAU || 'videos-publiques'

const cleAcces = process.env.STOCKAGE_CLE_ACCES
const cleSecrete = process.env.STOCKAGE_CLE_SECRETE

export const stockageConfigure = Boolean(cleAcces && cleSecrete)

// Types acceptes : ce que les deux clients produisent reellement.
export const TYPES_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
// Miniature d'une video (image de couverture), produite par l'application.
export const TYPES_IMAGE = ['image/jpeg']

export const TAILLE_MAX = 100 * 1024 * 1024
export const TAILLE_MAX_IMAGE = 500 * 1024

// `force_path_style` : le stockage Neon expose le seau dans le chemin et
// non dans le sous-domaine, contrairement a S3 par defaut.
const client = stockageConfigure
  ? new S3Client({
      region: REGION,
      endpoint: POINT_DACCES,
      forcePathStyle: true,
      credentials: { accessKeyId: cleAcces, secretAccessKey: cleSecrete },
    })
  : null

// Extension deduite du type : elle n'a pas d'effet sur la lecture, mais
// rend les objets lisibles dans la console de stockage.
const EXTENSIONS = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'image/jpeg': 'jpg',
}

// Une cle par profil et par envoi : deux publications simultanees ne
// peuvent pas se recouvrir.
export const construireCle = (profilId, type) =>
  `videos/${profilId}/${Date.now()}-${randomUUID()}.${EXTENSIONS[type] ?? 'mp4'}`

export const urlPubliqueDe = (cle) =>
  `${POINT_DACCES}/${SEAU}/${cle}`

// Adresse de lecture : le meme fichier, servi par le CDN du site (cache
// proche des spectateurs, au lieu du stockage en Allemagne, 5 a 20 fois
// plus lent depuis le Benin). La base garde l'adresse du stockage, qui
// sert aux controles de propriete et a la suppression.
const CDN_MEDIAS = process.env.CDN_MEDIAS ?? 'https://tocktick-web.vercel.app/media'
export const urlDiffusion = (url) => {
  const base = urlPubliqueDe('')
  return url && CDN_MEDIAS && url.startsWith(base) ? `${CDN_MEDIAS}/${url.slice(base.length)}` : url
}

// L'URL signee expire : elle ne sert qu'au televersement qui suit
// immediatement, pas a un acces durable.
// La taille annoncee est signee avec l'autorisation : le stockage refuse
// un fichier d'une autre taille, ce qui empeche de contourner TAILLE_MAX.
//
// Un fichier publie ne change jamais (chaque envoi a sa propre cle) : les
// navigateurs peuvent le garder un an. Une video revue n'est donc pas
// retelechargee, ce qui economise les donnees du visiteur et le transfert
// de l'hebergement. Le client doit renvoyer exactement ENTETES_DEPOT.
export const CACHE_FICHIER = 'public, max-age=31536000, immutable'
export const entetesDepot = (type) => ({ 'Content-Type': type, 'Cache-Control': CACHE_FICHIER })

export const signerDepot = (cle, type, taille) =>
  getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: SEAU, Key: cle, ContentType: type, ContentLength: taille, CacheControl: CACHE_FICHIER }),
    { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length', 'cache-control']) },
  )

// Dossier des fichiers d'un compte : une publication ne peut pointer que
// vers un fichier que son auteur a lui-meme televerse.
export const prefixeDepot = (profilId) => urlPubliqueDe(`videos/${profilId}/`)

// Efface le fichier d'une video de notre seau. Une adresse etrangere (autre
// hebergement, ancien stockage) est ignoree : il n'y a rien a effacer ici.
export async function supprimerFichier(url) {
  const prefixe = `${POINT_DACCES}/${SEAU}/`
  if (!client || typeof url !== 'string' || !url.startsWith(prefixe)) return
  const cle = decodeURIComponent(url.slice(prefixe.length).split('?')[0])
  await client.send(new DeleteObjectCommand({ Bucket: SEAU, Key: cle }))
}
