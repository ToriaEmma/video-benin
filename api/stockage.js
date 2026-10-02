// ============================================================
// Stockage des fichiers video (stockage objet Neon, compatible S3).
//
// Les octets ne traversent pas l'API : le client recoit une URL signee
// et televerse directement vers le stockage. L'hebergement sans serveur
// plafonne la taille d'un corps de requete bien en dessous d'une video,
// et faire transiter le fichier par la fonction le gaspillerait.
// ============================================================

import 'dotenv/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

export const TAILLE_MAX = 100 * 1024 * 1024

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
}

// Une cle par profil et par envoi : deux publications simultanees ne
// peuvent pas se recouvrir.
export const construireCle = (profilId, type) =>
  `videos/${profilId}/${Date.now()}-${randomUUID()}.${EXTENSIONS[type] ?? 'mp4'}`

export const urlPubliqueDe = (cle) =>
  `${POINT_DACCES}/${SEAU}/${cle}`

// L'URL signee expire : elle ne sert qu'au televersement qui suit
// immediatement, pas a un acces durable.
export const signerDepot = (cle, type) =>
  getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: SEAU, Key: cle, ContentType: type }),
    { expiresIn: 600 },
  )
