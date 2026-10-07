// ============================================================
// API entre l'application mobile et la base Neon.
//
// L'application mobile ne parle jamais a Postgres directement :
// elle passe par ces routes, qui seules portent la chaine de
// connexion et les regles de visibilite.
// ============================================================

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { sql } from './base.js'
import {
  chiffrer,
  verifier,
  signerJeton,
  exigerSession,
  sessionFacultative,
  EMPREINTE_LEURRE,
  genererCodeRecuperation,
} from './auth.js'
import {
  stockageConfigure,
  TYPES_VIDEO,
  TAILLE_MAX,
  construireCle,
  urlPubliqueDe,
  signerDepot,
  supprimerFichier,
  prefixeDepot,
  entetesDepot,
} from './stockage.js'
import {
  Refus,
  LIMITES,
  texteRequis,
  texteFacultatif,
  booleenOuDefaut,
  pseudoValide,
  telephoneValide,
  finDeNumero,
  motDePasseValide,
  identifiant,
  sonValide,
  avatarValide,
  dateFacultative,
  limiteDemandee,
  normaliserCode,
} from './regles.js'

const app = express()
// Rien ne doit trahir la technologie du serveur.
app.disable('x-powered-by')
// Derriere le proxy de Vercel : l'adresse du client est dans X-Forwarded-For.
app.set('trust proxy', true)
// Les sessions passent par l'en-tete Authorization et non par un cookie :
// ouvrir CORS a toutes les origines n'expose donc pas aux requetes forgees.
app.use(cors({ methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
// 512 Ko : de quoi porter une photo de profil, pas davantage.
app.use(express.json({ limit: '512kb' }))
app.use((_req, res, suite) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' })
  suite()
})

// ------------------------------------------------------------
// Outils communs
// ------------------------------------------------------------

// Les routes asynchrones sont enveloppees : sans cela, une promesse
// rejetee echapperait au middleware d'erreur d'Express.
const route = (traitement) => (req, res, suite) =>
  Promise.resolve(traitement(req, res, suite)).catch(suite)

const VISIBILITES = ['monde', 'amis', 'moi']

// Projection d'un profil vu par les autres : ni l'empreinte du mot de
// passe ni le numero de telephone n'en sortent.
const profilPublic = (p) => ({
  id: p.id,
  pseudo: p.pseudo,
  nom: p.nom,
  bio: p.bio,
  avatar_url: p.avatar_url,
  cree_le: p.cree_le,
})

// Le titulaire du compte, et lui seul, revoit son numero.
const profilPrive = (p) => ({ ...profilPublic(p), telephone: p.telephone })

// Mise en forme attendue par l'application mobile (mobile/src/lib/demo.ts).
const videoPublique = (v) => ({
  id: v.id,
  url: v.url,
  legende: v.legende,
  vues: v.vues,
  pseudo: v.pseudo,
  aime: Boolean(v.aime),
  favori: Boolean(v.favori),
  nbAime: Number(v.nb_aime),
  nbCommentaires: Number(v.nb_commentaires),
  visibilite: v.visibilite,
  commentairesAutorises: v.commentaires_autorises,
  reutilisationAutorisee: v.reutilisation_autorisee,
  publieeLe: v.publiee_le,
  departement: v.departement,
  sonId: v.son_id,
  supprimeeLe: v.supprimee_le,
  auteurId: v.auteur_id,
})

const commentairePublic = (c) => ({
  id: c.id,
  videoId: c.video_id,
  texte: c.texte,
  pseudo: c.pseudo,
  date: c.cree_le,
  horodatage: new Date(c.cree_le).getTime(),
  auteurId: c.auteur_id,
})

const trouverProfilParPseudo = async (pseudo) => {
  const [profil] = await sql`
    SELECT * FROM profils WHERE pseudo = ${String(pseudo ?? '').replace(/^@/, '').toLowerCase()}
  `
  if (!profil) throw new Refus(404, 'Compte introuvable')
  return profil
}

// ------------------------------------------------------------
// Comptes
// ------------------------------------------------------------

// ------------------------------------------------------------
// Limitation des essais
//
// Sans elle, un robot pourrait essayer des milliers de mots de passe sur
// un compte, ou creer des comptes en serie. Les essais sont notes en
// base : sur un hebergement sans serveur, la memoire ne survit pas
// d'une requete a l'autre.
// ------------------------------------------------------------

const FENETRE_ESSAIS = '15 minutes'

const verifierEssais = async (regles) => {
  for (const { cle, max } of regles) {
    const [{ n }] = await sql`
      SELECT count(*)::int AS n FROM tentatives
      WHERE cle = ${cle} AND cree_le > now() - ${FENETRE_ESSAIS}::interval
    `
    if (n >= max) throw new Refus(429, 'Trop de tentatives. Réessaie dans 15 minutes.')
  }
}

const noterEssais = async (cles) => {
  for (const cle of cles) await sql`INSERT INTO tentatives (cle) VALUES (${cle})`
  // Menage au passage : rien ne sert au-dela d'une journee.
  await sql`DELETE FROM tentatives WHERE cree_le < now() - interval '1 day'`
}

const adresseClient = (req) => req.ip || 'inconnue'

app.post('/inscription', route(async (req, res) => {
  const ip = `inscription-ip:${adresseClient(req)}`
  await verifierEssais([{ cle: ip, max: 5 }])

  const telephone = telephoneValide(req.body?.telephone)
  const motDePasse = motDePasseValide(req.body?.motDePasse)
  const pseudo = pseudoValide(req.body?.pseudo)

  const existants = await sql`
    SELECT pseudo, telephone FROM profils
    WHERE pseudo = ${pseudo}
       OR right(regexp_replace(telephone, '\\D', '', 'g'), 8) = ${finDeNumero(telephone)}
  `
  if (existants.some((p) => p.pseudo === pseudo)) {
    throw new Refus(409, 'Ce pseudo est déjà pris')
  }
  if (existants.length) {
    throw new Refus(409, 'Ce numéro est déjà associé à un compte')
  }

  const empreinte = await chiffrer(motDePasse)
  // Code de recuperation : remis une seule fois, garde haché comme un mot
  // de passe. C'est lui qui permet de retrouver le compte sans SMS.
  const code = genererCodeRecuperation()
  const [profil] = await sql`
    INSERT INTO profils (pseudo, telephone, mot_de_passe, code_recuperation)
    VALUES (${pseudo}, ${telephone}, ${empreinte}, ${await chiffrer(normaliserCode(code))})
    RETURNING *
  `
  await noterEssais([ip])
  res.status(201).json({ jeton: signerJeton(profil.id), profil: profilPrive(profil), codeRecuperation: code })
}))

// Comptes designes par un pseudo ou un numero (sous toutes ses ecritures :
// compare sur ses 8 derniers chiffres). `cle` sert a limiter les essais.
async function comptesDesignes(saisi, prefixe) {
  const chiffres = saisi.replace(/\D/g, '')
  const parPseudo = /[a-z]/i.test(saisi) || chiffres.length < 8
  const pseudo = saisi.replace(/^@/, '').toLowerCase()
  const cle = `${prefixe}:${parPseudo ? pseudo : finDeNumero(chiffres)}`
  const candidats = parPseudo
    ? await sql`SELECT * FROM profils WHERE pseudo = ${pseudo}`
    : await sql`
        SELECT * FROM profils
        WHERE right(regexp_replace(telephone, '\\D', '', 'g'), 8) = ${finDeNumero(chiffres)}
      `
  return { cle, candidats }
}

app.post('/connexion', route(async (req, res) => {
  // Le champ s'appelle encore `telephone`, mais accepte aussi le pseudo.
  const saisi = texteRequis(req.body?.identifiant ?? req.body?.telephone, 'telephone', 40)
  const motDePasse = typeof req.body?.motDePasse === 'string' ? req.body.motDePasse : ''
  if (!motDePasse || motDePasse.length > 200) throw new Refus(400, 'Mot de passe requis')

  const cleIp = `connexion-ip:${adresseClient(req)}`
  const { cle: cleCompte, candidats } = await comptesDesignes(saisi, 'connexion')
  await verifierEssais([{ cle: cleCompte, max: 8 }, { cle: cleIp, max: 40 }])

  for (const profil of candidats) {
    if (await verifier(motDePasse, profil.mot_de_passe)) {
      await sql`DELETE FROM tentatives WHERE cle = ${cleCompte}`
      return res.json({ jeton: signerJeton(profil.id), profil: profilPrive(profil) })
    }
  }
  // Compte inconnu : on hache quand meme, pour que la duree de reponse ne
  // revele pas si le compte existe.
  if (!candidats.length) await verifier(motDePasse, EMPREINTE_LEURRE)
  await noterEssais([cleCompte, cleIp])
  // Un seul message pour tous les echecs : il ne doit pas reveler si le
  // compte existe.
  throw new Refus(401, 'Identifiant ou mot de passe incorrect')
}))

// ------------------------------------------------------------
// Mot de passe oublie
//
// Sans service de SMS, le compte se recupere avec le code de recuperation
// remis a l'inscription (ou regenere dans les parametres). Le code est a
// usage unique : apres une recuperation, un nouveau code est remis.
// ------------------------------------------------------------

app.post('/mot-de-passe-oublie', route(async (req, res) => {
  const saisi = texteRequis(req.body?.identifiant, 'identifiant', 40)
  const code = normaliserCode(texteRequis(req.body?.code, 'code', 40))
  const nouveau = motDePasseValide(req.body?.nouveauMotDePasse)

  const cleIp = `recuperation-ip:${adresseClient(req)}`
  const { cle, candidats } = await comptesDesignes(saisi, 'recuperation')
  // Peu d'essais : le code est la seule cle du compte.
  await verifierEssais([{ cle, max: 5 }, { cle: cleIp, max: 20 }])

  for (const profil of candidats) {
    if (profil.code_recuperation && await verifier(code, profil.code_recuperation)) {
      const nouveauCode = genererCodeRecuperation()
      const [maj] = await sql`
        UPDATE profils SET
          mot_de_passe = ${await chiffrer(nouveau)},
          code_recuperation = ${await chiffrer(normaliserCode(nouveauCode))}
        WHERE id = ${profil.id}
        RETURNING *
      `
      // Les essais rates (recuperation et connexion) sont oublies.
      await sql`DELETE FROM tentatives WHERE cle IN (${cle}, ${cle.replace('recuperation:', 'connexion:')})`
      return res.json({ jeton: signerJeton(maj.id), profil: profilPrive(maj), codeRecuperation: nouveauCode })
    }
  }
  if (!candidats.length) await verifier(code, EMPREINTE_LEURRE)
  await noterEssais([cle, cleIp])
  throw new Refus(401, 'Identifiant ou code de récupération incorrect')
}))

// Nouveau code de recuperation (l'ancien cesse de fonctionner). Le mot de
// passe actuel est exige : un telephone laisse ouvert ne suffit pas.
app.post('/moi/code-recuperation', exigerSession, route(async (req, res) => {
  const profil = await profilAvecMotDePasse(req)
  const code = genererCodeRecuperation()
  await sql`UPDATE profils SET code_recuperation = ${await chiffrer(normaliserCode(code))} WHERE id = ${profil.id}`
  res.json({ codeRecuperation: code })
}))

app.post('/moi/mot-de-passe', exigerSession, route(async (req, res) => {
  const profil = await profilAvecMotDePasse(req)
  const nouveau = motDePasseValide(req.body?.nouveauMotDePasse)
  await sql`UPDATE profils SET mot_de_passe = ${await chiffrer(nouveau)} WHERE id = ${profil.id}`
  res.json({ ok: true })
}))

// Verifie le mot de passe actuel envoye avec une action sensible.
async function profilAvecMotDePasse(req) {
  const cle = `sensible:${req.profilId}`
  await verifierEssais([{ cle, max: 5 }])
  const motDePasse = typeof req.body?.motDePasse === 'string' ? req.body.motDePasse : ''
  const [profil] = await sql`SELECT * FROM profils WHERE id = ${req.profilId}`
  if (!profil) throw new Refus(404, 'Compte introuvable')
  if (!motDePasse || !(await verifier(motDePasse, profil.mot_de_passe))) {
    await noterEssais([cle])
    throw new Refus(401, 'Mot de passe actuel incorrect')
  }
  return profil
}

app.get('/moi', exigerSession, route(async (req, res) => {
  const [profil] = await sql`SELECT * FROM profils WHERE id = ${req.profilId}`
  if (!profil) throw new Refus(404, 'Compte introuvable')
  res.json(profilPrive(profil))
}))

app.patch('/moi', exigerSession, route(async (req, res) => {
  const { nom, pseudo, bio, avatar_url: avatarUrl } = req.body || {}

  let nouveauPseudo = null
  if (pseudo !== undefined) {
    nouveauPseudo = pseudoValide(pseudo)
    const [pris] = await sql`
      SELECT id FROM profils
      WHERE pseudo = ${nouveauPseudo} AND id <> ${req.profilId}
    `
    if (pris) throw new Refus(409, 'Ce pseudo est déjà pris')
  }

  // COALESCE : un champ absent du corps garde sa valeur actuelle.
  const [profil] = await sql`
    UPDATE profils SET
      nom        = COALESCE(${nom === undefined ? null : texteFacultatif(nom, 'nom', LIMITES.nom)}, nom),
      pseudo     = COALESCE(${nouveauPseudo}, pseudo),
      bio        = COALESCE(${bio === undefined ? null : texteFacultatif(bio, 'bio', LIMITES.bio)}, bio),
      avatar_url = COALESCE(${avatarValide(avatarUrl)}, avatar_url)
    WHERE id = ${req.profilId}
    RETURNING *
  `
  if (!profil) throw new Refus(404, 'Compte introuvable')
  res.json(profilPrive(profil))
}))

// ------------------------------------------------------------
// Televersements
//
// Le client demande une autorisation d'envoi, televerse le fichier
// directement vers le stockage, puis publie l'adresse obtenue. L'API
// ne voit jamais les octets.
// ------------------------------------------------------------

app.post('/televersements', exigerSession, route(async (req, res) => {
  const type = texteRequis(req.body?.type, 'type')
  if (!TYPES_VIDEO.includes(type)) {
    throw new Refus(400, 'Format non accepté : MP4, MOV ou WebM uniquement')
  }

  const taille = Number(req.body?.taille)
  if (!Number.isSafeInteger(taille) || taille <= 0) {
    throw new Refus(400, 'La taille du fichier est requise')
  }
  if (taille > TAILLE_MAX) {
    const mo = Math.round(taille / 1024 / 1024)
    throw new Refus(
      413,
      `Vidéo trop lourde (${mo} Mo). Maximum ${TAILLE_MAX / 1024 / 1024} Mo.`,
    )
  }

  // Verifie apres la validation du corps : une requete mal formee reste
  // une erreur du client, que le stockage soit configure ou non.
  if (!stockageConfigure) {
    throw new Refus(
      503,
      'Le stockage des vidéos n’est pas configuré sur le serveur',
    )
  }

  const cle = construireCle(req.profilId, type)
  res.status(201).json({
    url: await signerDepot(cle, type, taille),
    // En-tetes a envoyer tels quels avec le fichier (ils sont signes).
    entetes: entetesDepot(type),
    cle,
    urlPublique: urlPubliqueDe(cle),
  })
}))

// ------------------------------------------------------------
// Publications
//
// Les trois routes de lecture partagent la meme projection et les
// memes regles de visibilite : 'monde' pour tous, 'amis' seulement
// entre comptes qui se suivent mutuellement, 'moi' pour l'auteur.
// ------------------------------------------------------------

// Extraits Deezer des publications, resolus par le serveur et joints aux
// videos : l'application n'a plus a interroger Deezer avant d'afficher le
// fil (un aller-retour de moins au demarrage, sensible en 3G/4G).
// Gardes en memoire jusqu'a l'expiration de leur adresse signee.
const extraitsDeezer = new Map()
const MARGE_EXTRAIT = 10 * 60

async function extraitDeezer(id) {
  const maintenant = Date.now() / 1000
  const garde = extraitsDeezer.get(id)
  if (garde && garde.expire - MARGE_EXTRAIT > maintenant) return garde.piste
  try {
    const r = await fetch(`https://api.deezer.com/track/${id}`, { signal: AbortSignal.timeout(1500) })
    const p = await r.json()
    if (!p?.preview) return null
    // Seuls les champs utilises par l'application sont renvoyes.
    const piste = {
      id: p.id, title: p.title, title_short: p.title_short, duration: p.duration,
      preview: p.preview, rank: p.rank,
      artist: { name: p.artist?.name ?? '' },
      album: { cover_medium: p.album?.cover_medium, cover_small: p.album?.cover_small },
    }
    const expire = Number(/exp=(\d+)/.exec(p.preview)?.[1]) || maintenant + 3600
    extraitsDeezer.set(id, { piste, expire })
    return piste
  } catch {
    // Deezer lent ou indisponible : l'application le demandera elle-meme.
    return null
  }
}

async function avecExtraits(videos) {
  const ids = [...new Set(videos.map(v => /^dz:(\d{1,15})$/.exec(v.sonId ?? '')?.[1]).filter(Boolean))]
  const pistes = new Map(await Promise.all(ids.map(async id => [id, await extraitDeezer(id)])))
  return videos.map(v => {
    const piste = pistes.get(/^dz:(\d{1,15})$/.exec(v.sonId ?? '')?.[1])
    return piste ? { ...v, deezer: piste } : v
  })
}

const listerVideos = async ({
  viewerId, auteurId, limite, avant, videoId, suivisSeuls = false, legende = null,
}) => {
  const lignes = await sql`
    SELECT
      v.*,
      p.pseudo,
      (SELECT count(*) FROM jaime j WHERE j.video_id = v.id)        AS nb_aime,
      (SELECT count(*) FROM commentaires c WHERE c.video_id = v.id) AS nb_commentaires,
      EXISTS (
        SELECT 1 FROM jaime j
        WHERE j.video_id = v.id AND j.profil_id = ${viewerId}
      ) AS aime,
      EXISTS (
        SELECT 1 FROM favoris f
        WHERE f.video_id = v.id AND f.profil_id = ${viewerId}
      ) AS favori
    FROM videos v
    JOIN profils p ON p.id = v.auteur_id
    WHERE v.supprimee_le IS NULL
      AND (${videoId}::uuid IS NULL OR v.id = ${videoId}::uuid)
      AND (${auteurId}::uuid IS NULL OR v.auteur_id = ${auteurId}::uuid)
      AND (${avant}::timestamptz IS NULL OR v.publiee_le < ${avant}::timestamptz)
      AND (${legende}::text IS NULL OR v.legende ILIKE ${legende}::text)
      -- Le fil « Amis » montre les comptes suivis et le lecteur lui-meme :
      -- ses propres publications y ont leur place.
      AND (NOT ${suivisSeuls} OR v.auteur_id = ${viewerId} OR EXISTS (
        SELECT 1 FROM abonnements a
        WHERE a.suiveur_id = ${viewerId} AND a.suivi_id = v.auteur_id
      ))
      AND (
        v.visibilite = 'monde'
        OR v.auteur_id = ${viewerId}
        OR (
          v.visibilite = 'amis'
          AND EXISTS (
            SELECT 1 FROM abonnements a
            WHERE a.suiveur_id = ${viewerId} AND a.suivi_id = v.auteur_id
          )
          AND EXISTS (
            SELECT 1 FROM abonnements a
            WHERE a.suiveur_id = v.auteur_id AND a.suivi_id = ${viewerId}
          )
        )
      )
    ORDER BY v.publiee_le DESC
    LIMIT ${limite}
  `
  return avecExtraits(lignes.map(videoPublique))
}

app.get('/videos', sessionFacultative, route(async (req, res) => {
  const videos = await listerVideos({
    viewerId: req.profilId || null,
    auteurId: null,
    videoId: null,
    limite: limiteDemandee(req.query.limite),
    avant: dateFacultative(req.query.avant),
  })
  res.json(videos)
}))

// Fil des abonnements : seules les publications des comptes suivis. Il
// exige une session, n'ayant aucun sens pour un visiteur.
app.get('/videos/suivis', exigerSession, route(async (req, res) => {
  const videos = await listerVideos({
    viewerId: req.profilId,
    auteurId: null,
    videoId: null,
    suivisSeuls: true,
    limite: limiteDemandee(req.query.limite),
    avant: dateFacultative(req.query.avant),
  })
  res.json(videos)
}))

app.get('/videos/:id', sessionFacultative, route(async (req, res) => {
  const [video] = await listerVideos({
    viewerId: req.profilId || null,
    auteurId: null,
    videoId: identifiant(req.params.id, 'Identifiant de vidéo'),
    limite: 1,
    avant: null,
  })
  if (!video) throw new Refus(404, 'Vidéo introuvable')
  res.json(video)
}))

app.get('/profils/:pseudo/videos', sessionFacultative, route(async (req, res) => {
  const auteur = await trouverProfilParPseudo(req.params.pseudo)
  const videos = await listerVideos({
    viewerId: req.profilId || null,
    auteurId: auteur.id,
    videoId: null,
    limite: limiteDemandee(req.query.limite),
    avant: dateFacultative(req.query.avant),
  })
  res.json(videos)
}))

// Adresse d'un fichier televerse par ce compte, et par lui seul : sans
// cette regle, une publication pourrait pointer vers n'importe quel site
// ou vers le fichier d'un autre.
const urlDeLAuteur = (brut, profilId) => {
  const url = texteRequis(brut, 'url', 500)
  const prefixe = prefixeDepot(profilId)
  const reste = url.slice(prefixe.length)
  if (!url.startsWith(prefixe) || !/^[\w.-]+$/.test(reste)) {
    throw new Refus(400, 'Adresse de vidéo invalide : téléverse d’abord la vidéo')
  }
  return url
}

app.post('/videos', exigerSession, route(async (req, res) => {
  const url = urlDeLAuteur(req.body?.url, req.profilId)
  const visibilite = req.body?.visibilite ?? 'monde'
  if (!VISIBILITES.includes(visibilite)) {
    throw new Refus(400, 'Visibilité inconnue : monde, amis ou moi')
  }

  const [video] = await sql`
    INSERT INTO videos (
      auteur_id, url, legende, departement, visibilite,
      commentaires_autorises, reutilisation_autorisee, son_id
    ) VALUES (
      ${req.profilId},
      ${url},
      ${texteFacultatif(req.body?.legende, 'legende', LIMITES.legende) ?? ''},
      ${texteFacultatif(req.body?.departement, 'departement', LIMITES.departement)},
      ${visibilite},
      ${booleenOuDefaut(req.body?.commentaires_autorises, true)},
      ${booleenOuDefaut(req.body?.reutilisation_autorisee, true)},
      ${sonValide(req.body?.son_id)}
    )
    RETURNING id
  `
  const [cree] = await listerVideos({
    viewerId: req.profilId,
    auteurId: null,
    videoId: video.id,
    limite: 1,
    avant: null,
  })
  res.status(201).json(cree)
}))

// Lit une video et verifie que le demandeur en est l'auteur.
const videoDeLAuteur = async (videoId, profilId) => {
  const [video] = await sql`SELECT * FROM videos WHERE id = ${videoId}`
  if (!video) throw new Refus(404, 'Vidéo introuvable')
  if (video.auteur_id !== profilId) {
    throw new Refus(403, 'Seul l’auteur peut modifier cette vidéo')
  }
  return video
}

app.patch('/videos/:id', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoDeLAuteur(id, req.profilId)

  const { legende, visibilite } = req.body || {}
  if (visibilite !== undefined && !VISIBILITES.includes(visibilite)) {
    throw new Refus(400, 'Visibilité inconnue : monde, amis ou moi')
  }

  await sql`
    UPDATE videos SET
      legende     = COALESCE(${legende === undefined ? null : texteFacultatif(legende, 'legende', LIMITES.legende)}, legende),
      visibilite  = COALESCE(${visibilite ?? null}, visibilite),
      commentaires_autorises = COALESCE(
        ${typeof req.body?.commentaires_autorises === 'boolean'
            ? req.body.commentaires_autorises : null},
        commentaires_autorises),
      reutilisation_autorisee = COALESCE(
        ${typeof req.body?.reutilisation_autorisee === 'boolean'
            ? req.body.reutilisation_autorisee : null},
        reutilisation_autorisee)
    WHERE id = ${id}
  `
  const [video] = await listerVideos({
    viewerId: req.profilId, auteurId: null, videoId: id, limite: 1, avant: null,
  })
  res.json(video)
}))

// Suppression definitive : la ligne part de la base (j'aime, favoris et
// commentaires suivent par cascade) et le fichier part du stockage.
app.delete('/videos/:id', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoDeLAuteur(id, req.profilId)
  const [supprimee] = await sql`DELETE FROM videos WHERE id = ${id} RETURNING url`
  if (supprimee) await effacerFichierOrphelin(supprimee.url)
  res.json({ ok: true })
}))

// Le fichier n'est efface que si plus rien ne s'en sert : une video publiee
// depuis un brouillon partage son adresse avec lui.
async function effacerFichierOrphelin(url) {
  const [utilise] = await sql`
    SELECT 1 FROM videos WHERE url = ${url}
    UNION ALL SELECT 1 FROM brouillons WHERE url = ${url}
    LIMIT 1
  `
  if (utilise) return
  // Un fichier qui resterait ne gene personne : l'echec ne bloque pas la suppression.
  await supprimerFichier(url).catch(e => console.error('Fichier non efface', e.message))
}

app.get('/corbeille', exigerSession, route(async (req, res) => {
  const lignes = await sql`
    SELECT
      v.*, p.pseudo,
      (SELECT count(*) FROM jaime j WHERE j.video_id = v.id)        AS nb_aime,
      (SELECT count(*) FROM commentaires c WHERE c.video_id = v.id) AS nb_commentaires,
      false AS aime, false AS favori
    FROM videos v
    JOIN profils p ON p.id = v.auteur_id
    WHERE v.auteur_id = ${req.profilId}
      AND v.supprimee_le IS NOT NULL
      AND v.supprimee_le > now() - interval '30 days'
    ORDER BY v.supprimee_le DESC
  `
  res.json(lignes.map(videoPublique))
}))

app.post('/videos/:id/restaurer', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoDeLAuteur(id, req.profilId)
  await sql`UPDATE videos SET supprimee_le = NULL WHERE id = ${id}`
  res.json({ ok: true })
}))

// Comptage des vues : ouvert, un visiteur non connecte regarde aussi.
app.post('/videos/:id/vue', sessionFacultative, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoVisible(id, req.profilId)
  const [video] = await sql`
    UPDATE videos SET vues = vues + 1 WHERE id = ${id} RETURNING vues
  `
  res.json({ vues: video.vues })
}))

// Signalement : note pour la moderation, un seul par compte et par video.
app.post('/videos/:id/signalement', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  const motif = texteRequis(req.body?.motif, 'motif', 100)
  await videoVisible(id, req.profilId)
  await sql`
    INSERT INTO signalements (video_id, profil_id, motif)
    VALUES (${id}, ${req.profilId}, ${motif})
    ON CONFLICT (video_id, profil_id) DO UPDATE SET motif = EXCLUDED.motif, cree_le = now()
  `
  res.status(201).json({ ok: true })
}))

// ------------------------------------------------------------
// Interactions
// ------------------------------------------------------------

// Une video n'est accessible (j'aime, favori, commentaires, vue) que si
// le demandeur a le droit de la voir : memes regles que le fil. Une video
// privee repond « introuvable », sans confirmer qu'elle existe.
const videoVisible = async (videoId, viewerId) => {
  const [video] = await sql`
    SELECT v.* FROM videos v
    WHERE v.id = ${videoId}
      AND v.supprimee_le IS NULL
      AND (
        v.visibilite = 'monde'
        OR v.auteur_id = ${viewerId ?? null}
        OR (
          v.visibilite = 'amis'
          AND EXISTS (SELECT 1 FROM abonnements a
                      WHERE a.suiveur_id = ${viewerId ?? null} AND a.suivi_id = v.auteur_id)
          AND EXISTS (SELECT 1 FROM abonnements a
                      WHERE a.suiveur_id = v.auteur_id AND a.suivi_id = ${viewerId ?? null})
        )
      )
  `
  if (!video) throw new Refus(404, 'Vidéo introuvable')
  return video
}

app.post('/videos/:id/jaime', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoVisible(id, req.profilId)
  // ON CONFLICT : un double appui ne doit pas devenir une erreur.
  await sql`
    INSERT INTO jaime (video_id, profil_id) VALUES (${id}, ${req.profilId})
    ON CONFLICT DO NOTHING
  `
  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM jaime WHERE video_id = ${id}
  `
  res.json({ aime: true, nbAime: count })
}))

app.delete('/videos/:id/jaime', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await sql`
    DELETE FROM jaime WHERE video_id = ${id} AND profil_id = ${req.profilId}
  `
  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM jaime WHERE video_id = ${id}
  `
  res.json({ aime: false, nbAime: count })
}))

app.post('/videos/:id/favori', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoVisible(id, req.profilId)
  await sql`
    INSERT INTO favoris (video_id, profil_id) VALUES (${id}, ${req.profilId})
    ON CONFLICT DO NOTHING
  `
  res.json({ favori: true })
}))

app.delete('/videos/:id/favori', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await sql`
    DELETE FROM favoris WHERE video_id = ${id} AND profil_id = ${req.profilId}
  `
  res.json({ favori: false })
}))

// Les deux listes personnelles partagent leur forme : seule la table
// de jointure change.
const listerDepuisTable = async (table, profilId) => {
  const lignes = table === 'favoris'
    ? await sql`
        SELECT v.*, p.pseudo,
          (SELECT count(*) FROM jaime j WHERE j.video_id = v.id)        AS nb_aime,
          (SELECT count(*) FROM commentaires c WHERE c.video_id = v.id) AS nb_commentaires,
          EXISTS (SELECT 1 FROM jaime j
                  WHERE j.video_id = v.id AND j.profil_id = ${profilId}) AS aime,
          true AS favori
        FROM favoris t
        JOIN videos v ON v.id = t.video_id
        JOIN profils p ON p.id = v.auteur_id
        WHERE t.profil_id = ${profilId} AND v.supprimee_le IS NULL
          AND (v.visibilite = 'monde' OR v.auteur_id = ${profilId} OR (
            v.visibilite = 'amis'
            AND EXISTS (SELECT 1 FROM abonnements a WHERE a.suiveur_id = ${profilId} AND a.suivi_id = v.auteur_id)
            AND EXISTS (SELECT 1 FROM abonnements a WHERE a.suiveur_id = v.auteur_id AND a.suivi_id = ${profilId})))
        ORDER BY t.cree_le DESC
      `
    : await sql`
        SELECT v.*, p.pseudo,
          (SELECT count(*) FROM jaime j WHERE j.video_id = v.id)        AS nb_aime,
          (SELECT count(*) FROM commentaires c WHERE c.video_id = v.id) AS nb_commentaires,
          true AS aime,
          EXISTS (SELECT 1 FROM favoris f
                  WHERE f.video_id = v.id AND f.profil_id = ${profilId}) AS favori
        FROM jaime t
        JOIN videos v ON v.id = t.video_id
        JOIN profils p ON p.id = v.auteur_id
        WHERE t.profil_id = ${profilId} AND v.supprimee_le IS NULL
          AND (v.visibilite = 'monde' OR v.auteur_id = ${profilId} OR (
            v.visibilite = 'amis'
            AND EXISTS (SELECT 1 FROM abonnements a WHERE a.suiveur_id = ${profilId} AND a.suivi_id = v.auteur_id)
            AND EXISTS (SELECT 1 FROM abonnements a WHERE a.suiveur_id = v.auteur_id AND a.suivi_id = ${profilId})))
        ORDER BY t.cree_le DESC
      `
  return lignes.map(videoPublique)
}

app.get('/favoris', exigerSession, route(async (req, res) => {
  res.json(await listerDepuisTable('favoris', req.profilId))
}))

app.get('/jaimees', exigerSession, route(async (req, res) => {
  res.json(await listerDepuisTable('jaime', req.profilId))
}))

app.post('/profils/:pseudo/abonnement', exigerSession, route(async (req, res) => {
  const cible = await trouverProfilParPseudo(req.params.pseudo)
  if (cible.id === req.profilId) {
    throw new Refus(400, 'On ne peut pas s’abonner à soi-même')
  }
  await sql`
    INSERT INTO abonnements (suiveur_id, suivi_id)
    VALUES (${req.profilId}, ${cible.id})
    ON CONFLICT DO NOTHING
  `
  res.json({ suivi: true })
}))

app.delete('/profils/:pseudo/abonnement', exigerSession, route(async (req, res) => {
  const cible = await trouverProfilParPseudo(req.params.pseudo)
  await sql`
    DELETE FROM abonnements
    WHERE suiveur_id = ${req.profilId} AND suivi_id = ${cible.id}
  `
  res.json({ suivi: false })
}))

app.get('/profils/:pseudo', sessionFacultative, route(async (req, res) => {
  const viewerId = req.profilId || null
  const [profil] = await sql`
    SELECT
      p.*,
      (SELECT count(*)::int FROM abonnements a WHERE a.suivi_id = p.id)   AS nb_abonnes,
      (SELECT count(*)::int FROM abonnements a WHERE a.suiveur_id = p.id) AS nb_suivis,
      (SELECT count(*)::int FROM videos v
       WHERE v.auteur_id = p.id AND v.supprimee_le IS NULL)               AS nb_videos,
      EXISTS (
        SELECT 1 FROM abonnements a
        WHERE a.suiveur_id = ${viewerId} AND a.suivi_id = p.id
      ) AS suivi
    FROM profils p
    WHERE p.pseudo = ${req.params.pseudo}
  `
  if (!profil) throw new Refus(404, 'Compte introuvable')
  res.json({
    ...profilPublic(profil),
    nbAbonnes: profil.nb_abonnes,
    nbSuivis: profil.nb_suivis,
    nbVideos: profil.nb_videos,
    suivi: Boolean(profil.suivi),
  })
}))

// ------------------------------------------------------------
// Recherche et decouverte
//
// Les quatre routes rendent la meme forme de compte : l'application
// affiche partout la meme ligne, avec son bouton d'abonnement.
// ------------------------------------------------------------

const comptePublic = (c) => ({
  id: c.id,
  pseudo: c.pseudo,
  nom: c.nom,
  avatar_url: c.avatar_url,
  bio: c.bio,
  nbAbonnes: Number(c.nb_abonnes),
  suivi: Boolean(c.suivi),
})

// Le terme devient un motif ILIKE. Les jokers saisis par l'utilisateur
// sont neutralises : « % » seul ramenerait la table entiere.
const motifRecherche = (terme) =>
  `%${terme.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

app.get('/recherche', sessionFacultative, route(async (req, res) => {
  const terme = req.query.q
  if (typeof terme !== 'string' || terme.trim() === '') {
    throw new Refus(400, 'Indique ce que tu cherches')
  }
  if (terme.length > 100) throw new Refus(400, 'Recherche trop longue')
  const motif = motifRecherche(terme.trim())
  const viewerId = req.profilId || null
  const limite = limiteDemandee(req.query.limite)

  const comptes = await sql`
    SELECT
      p.id, p.pseudo, p.nom, p.avatar_url, p.bio,
      (SELECT count(*)::int FROM abonnements a WHERE a.suivi_id = p.id) AS nb_abonnes,
      EXISTS (
        SELECT 1 FROM abonnements a
        WHERE a.suiveur_id = ${viewerId} AND a.suivi_id = p.id
      ) AS suivi
    FROM profils p
    WHERE p.pseudo ILIKE ${motif} OR p.nom ILIKE ${motif}
    -- Le pseudo qui commence par le terme passe devant : c'est le compte
    -- que l'on cherchait le plus probablement.
    ORDER BY (p.pseudo ILIKE ${terme.trim() + '%'}) DESC, nb_abonnes DESC, p.pseudo
    LIMIT ${limite}
  `

  const videos = await listerVideos({
    viewerId,
    auteurId: null,
    videoId: null,
    legende: motif,
    limite,
    avant: null,
  })

  res.json({ comptes: comptes.map(comptePublic), videos })
}))

// Les deux listes d'abonnement ne different que par la colonne jointe.
const listerComptesLies = async ({ profilId, viewerId, sens, limite }) => {
  const lignes = sens === 'abonnes'
    ? await sql`
        SELECT
          p.id, p.pseudo, p.nom, p.avatar_url, p.bio,
          (SELECT count(*)::int FROM abonnements x WHERE x.suivi_id = p.id) AS nb_abonnes,
          EXISTS (
            SELECT 1 FROM abonnements x
            WHERE x.suiveur_id = ${viewerId} AND x.suivi_id = p.id
          ) AS suivi
        FROM abonnements a
        JOIN profils p ON p.id = a.suiveur_id
        WHERE a.suivi_id = ${profilId}
        ORDER BY a.cree_le DESC
        LIMIT ${limite}
      `
    : await sql`
        SELECT
          p.id, p.pseudo, p.nom, p.avatar_url, p.bio,
          (SELECT count(*)::int FROM abonnements x WHERE x.suivi_id = p.id) AS nb_abonnes,
          EXISTS (
            SELECT 1 FROM abonnements x
            WHERE x.suiveur_id = ${viewerId} AND x.suivi_id = p.id
          ) AS suivi
        FROM abonnements a
        JOIN profils p ON p.id = a.suivi_id
        WHERE a.suiveur_id = ${profilId}
        ORDER BY a.cree_le DESC
        LIMIT ${limite}
      `
  return lignes.map(comptePublic)
}

app.get('/profils/:pseudo/abonnes', sessionFacultative, route(async (req, res) => {
  const cible = await trouverProfilParPseudo(req.params.pseudo)
  res.json(await listerComptesLies({
    profilId: cible.id,
    viewerId: req.profilId || null,
    sens: 'abonnes',
    limite: limiteDemandee(req.query.limite),
  }))
}))

app.get('/profils/:pseudo/abonnements', sessionFacultative, route(async (req, res) => {
  const cible = await trouverProfilParPseudo(req.params.pseudo)
  res.json(await listerComptesLies({
    profilId: cible.id,
    viewerId: req.profilId || null,
    sens: 'abonnements',
    limite: limiteDemandee(req.query.limite),
  }))
}))

// Comptes a suivre : les plus suivis que le lecteur ne suit pas encore.
// C'est la sortie de secours d'un fil « Suivis » vide.
app.get('/suggestions', exigerSession, route(async (req, res) => {
  const lignes = await sql`
    SELECT
      p.id, p.pseudo, p.nom, p.avatar_url, p.bio,
      (SELECT count(*)::int FROM abonnements a WHERE a.suivi_id = p.id) AS nb_abonnes,
      false AS suivi
    FROM profils p
    WHERE p.id <> ${req.profilId}
      AND NOT EXISTS (
        SELECT 1 FROM abonnements a
        WHERE a.suiveur_id = ${req.profilId} AND a.suivi_id = p.id
      )
    ORDER BY nb_abonnes DESC, p.cree_le DESC
    LIMIT ${limiteDemandee(req.query.limite)}
  `
  res.json(lignes.map(comptePublic))
}))

// ------------------------------------------------------------
// Sons favoris
//
// Ranges par compte (ils suivent l'utilisateur d'un appareil a l'autre).
// Seuls l'identifiant et de quoi afficher le son sont gardes : l'adresse
// d'un extrait Deezer expire, le client la redemande a l'affichage.
// ------------------------------------------------------------

const sonFavoriPublic = (l) => ({ ...l.son, id: l.son_id })

app.get('/sons-favoris', exigerSession, route(async (req, res) => {
  const lignes = await sql`
    SELECT son_id, son FROM sons_favoris WHERE profil_id = ${req.profilId}
    ORDER BY cree_le DESC LIMIT 200
  `
  res.json(lignes.map(sonFavoriPublic))
}))

app.put('/sons-favoris/:id', exigerSession, route(async (req, res) => {
  const id = sonValide(req.params.id)
  if (!id) throw new Refus(400, 'Son invalide')
  const b = req.body || {}
  const son = {
    titre: texteRequis(b.titre, 'titre', 200),
    artiste: texteFacultatif(b.artiste, 'artiste', 200) ?? '',
    pochette: typeof b.pochette === 'string' && /^https:\/\//.test(b.pochette) && b.pochette.length < 500 ? b.pochette : null,
    duree: Number.isFinite(b.duree) && b.duree >= 0 && b.duree < 3600 ? Math.round(b.duree) : 0,
    couleur: typeof b.couleur === 'string' && /^#[0-9a-f]{6}$/i.test(b.couleur) ? b.couleur : '#3a3a3c',
    original: b.original === true,
    licence: texteFacultatif(b.licence, 'licence', 200) ?? '',
  }
  await sql`
    INSERT INTO sons_favoris (profil_id, son_id, son) VALUES (${req.profilId}, ${id}, ${JSON.stringify(son)}::jsonb)
    ON CONFLICT (profil_id, son_id) DO UPDATE SET son = EXCLUDED.son
  `
  res.json({ favori: true })
}))

app.delete('/sons-favoris/:id', exigerSession, route(async (req, res) => {
  const id = sonValide(req.params.id)
  if (!id) throw new Refus(400, 'Son invalide')
  await sql`DELETE FROM sons_favoris WHERE profil_id = ${req.profilId} AND son_id = ${id}`
  res.json({ favori: false })
}))

// ------------------------------------------------------------
// Commentaires
// ------------------------------------------------------------

app.get('/videos/:id/commentaires', sessionFacultative, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoVisible(id, req.profilId)
  const lignes = await sql`
    SELECT c.*, p.pseudo
    FROM commentaires c
    JOIN profils p ON p.id = c.auteur_id
    WHERE c.video_id = ${id}
    ORDER BY c.cree_le
  `
  res.json(lignes.map(commentairePublic))
}))

app.post('/videos/:id/commentaires', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  const texte = texteRequis(req.body?.texte, 'texte', LIMITES.commentaire)

  const video = await videoVisible(id, req.profilId)
  if (!video.commentaires_autorises) {
    throw new Refus(403, 'Les commentaires sont fermés sur cette vidéo')
  }

  const [cree] = await sql`
    INSERT INTO commentaires (video_id, auteur_id, texte)
    VALUES (${id}, ${req.profilId}, ${texte})
    RETURNING *
  `
  const [{ pseudo }] = await sql`
    SELECT pseudo FROM profils WHERE id = ${req.profilId}
  `
  res.status(201).json(commentairePublic({ ...cree, pseudo }))
}))

// L'auteur du commentaire peut le retirer, et l'auteur de la video
// peut moderer son fil.
app.delete('/commentaires/:id', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de commentaire')
  const [ligne] = await sql`
    SELECT c.auteur_id, v.auteur_id AS auteur_video
    FROM commentaires c
    JOIN videos v ON v.id = c.video_id
    WHERE c.id = ${id}
  `
  if (!ligne) throw new Refus(404, 'Commentaire introuvable')
  if (ligne.auteur_id !== req.profilId && ligne.auteur_video !== req.profilId) {
    throw new Refus(403, 'Suppression réservée à l’auteur')
  }
  await sql`DELETE FROM commentaires WHERE id = ${id}`
  res.json({ ok: true })
}))

// ------------------------------------------------------------
// Brouillons
// ------------------------------------------------------------

app.get('/brouillons', exigerSession, route(async (req, res) => {
  const lignes = await sql`
    SELECT * FROM brouillons WHERE auteur_id = ${req.profilId}
    ORDER BY cree_le DESC
  `
  res.json(lignes.map((b) => ({
    id: b.id,
    url: b.url,
    legende: b.legende,
    octets: Number(b.octets),
    date: new Date(b.cree_le).getTime(),
  })))
}))

app.post('/brouillons', exigerSession, route(async (req, res) => {
  const url = urlDeLAuteur(req.body?.url, req.profilId)
  const octets = Number(req.body?.octets ?? 0)
  if (!Number.isSafeInteger(octets) || octets < 0) {
    throw new Refus(400, 'Le champ « octets » doit être un nombre positif')
  }
  const [b] = await sql`
    INSERT INTO brouillons (auteur_id, url, legende, octets)
    VALUES (${req.profilId}, ${url},
            ${texteFacultatif(req.body?.legende, 'legende', LIMITES.legende) ?? ''}, ${octets})
    RETURNING *
  `
  res.status(201).json({
    id: b.id,
    url: b.url,
    legende: b.legende,
    octets: Number(b.octets),
    date: new Date(b.cree_le).getTime(),
  })
}))

app.delete('/brouillons/:id', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de brouillon')
  const [supprime] = await sql`
    DELETE FROM brouillons
    WHERE id = ${id} AND auteur_id = ${req.profilId}
    RETURNING url
  `
  if (!supprime) throw new Refus(404, 'Brouillon introuvable')
  await effacerFichierOrphelin(supprime.url)
  res.json({ ok: true })
}))

// ------------------------------------------------------------
// Messagerie
// ------------------------------------------------------------

const exigerParticipant = async (conversationId, profilId) => {
  const [p] = await sql`
    SELECT * FROM participants
    WHERE conversation_id = ${conversationId} AND profil_id = ${profilId}
  `
  if (!p) throw new Refus(403, 'Conversation réservée à ses participants')
  return p
}

app.get('/conversations', exigerSession, route(async (req, res) => {
  const lignes = await sql`
    SELECT
      c.id,
      c.cree_le,
      moi.lu_le,
      autre_p.pseudo      AS pseudo,
      autre_p.id          AS profil_id,
      autre_p.avatar_url  AS avatar_url,
      dernier.texte       AS dernier_texte,
      dernier.envoye_le   AS dernier_envoye_le,
      dernier.auteur_id   AS dernier_auteur_id,
      (
        SELECT count(*)::int FROM messages m
        WHERE m.conversation_id = c.id
          AND m.auteur_id <> ${req.profilId}
          AND (moi.lu_le IS NULL OR m.envoye_le > moi.lu_le)
      ) AS non_lus
    FROM conversations c
    JOIN participants moi
      ON moi.conversation_id = c.id AND moi.profil_id = ${req.profilId}
    LEFT JOIN participants autre
      ON autre.conversation_id = c.id AND autre.profil_id <> ${req.profilId}
    LEFT JOIN profils autre_p ON autre_p.id = autre.profil_id
    LEFT JOIN LATERAL (
      SELECT m.texte, m.envoye_le, m.auteur_id
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.envoye_le DESC
      LIMIT 1
    ) dernier ON true
    ORDER BY COALESCE(dernier.envoye_le, c.cree_le) DESC
  `
  res.json(lignes.map((c) => ({
    id: c.id,
    pseudo: c.pseudo,
    profilId: c.profil_id,
    avatarUrl: c.avatar_url,
    nonLus: c.non_lus,
    luLe: c.lu_le,
    dernierMessage: c.dernier_texte === null ? null : {
      texte: c.dernier_texte,
      date: new Date(c.dernier_envoye_le).getTime(),
      moi: c.dernier_auteur_id === req.profilId,
    },
  })))
}))

app.get('/conversations/:id/messages', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de conversation')
  await exigerParticipant(id, req.profilId)
  const lignes = await sql`
    SELECT * FROM messages WHERE conversation_id = ${id} ORDER BY envoye_le
  `
  res.json(lignes.map((m) => ({
    id: m.id,
    texte: m.texte,
    moi: m.auteur_id === req.profilId,
    date: new Date(m.envoye_le).getTime(),
  })))
}))

app.post('/conversations/:id/messages', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de conversation')
  await exigerParticipant(id, req.profilId)
  const texte = texteRequis(req.body?.texte, 'texte', LIMITES.message)

  const [m] = await sql`
    INSERT INTO messages (conversation_id, auteur_id, texte)
    VALUES (${id}, ${req.profilId}, ${texte})
    RETURNING *
  `
  res.status(201).json({
    id: m.id,
    texte: m.texte,
    moi: true,
    date: new Date(m.envoye_le).getTime(),
  })
}))

app.post('/conversations', exigerSession, route(async (req, res) => {
  const pseudo = texteRequis(req.body?.pseudo, 'pseudo', 40)
  const autre = await trouverProfilParPseudo(pseudo)
  if (autre.id === req.profilId) {
    throw new Refus(400, 'Impossible d’ouvrir une conversation avec soi-même')
  }

  // Une conversation a deux exactement, portant les deux profils : on
  // la reutilise plutot que d'en empiler une nouvelle a chaque ouverture.
  const [existante] = await sql`
    SELECT c.id
    FROM conversations c
    JOIN participants a ON a.conversation_id = c.id AND a.profil_id = ${req.profilId}
    JOIN participants b ON b.conversation_id = c.id AND b.profil_id = ${autre.id}
    WHERE (SELECT count(*) FROM participants p WHERE p.conversation_id = c.id) = 2
    LIMIT 1
  `
  if (existante) {
    return res.json({ id: existante.id, pseudo: autre.pseudo, nouvelle: false })
  }

  const [creee] = await sql`INSERT INTO conversations DEFAULT VALUES RETURNING id`
  await sql`
    INSERT INTO participants (conversation_id, profil_id)
    VALUES (${creee.id}, ${req.profilId}), (${creee.id}, ${autre.id})
  `
  res.status(201).json({ id: creee.id, pseudo: autre.pseudo, nouvelle: true })
}))

app.post('/conversations/:id/lu', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de conversation')
  await exigerParticipant(id, req.profilId)
  await sql`
    UPDATE participants SET lu_le = now()
    WHERE conversation_id = ${id} AND profil_id = ${req.profilId}
  `
  res.json({ ok: true })
}))

// ------------------------------------------------------------
// Recits
//
// Un recit vit 24 h. Rien ne les efface : les deux routes ecartent ce
// qui a depasse l'heure, ce qui evite une tache de menage planifiee et
// garde une publication rejouable le temps du debogage.
// ------------------------------------------------------------

const DUREE_RECIT = '24 hours'

app.post('/stories', exigerSession, route(async (req, res) => {
  const url = urlDeLAuteur(req.body?.url, req.profilId)
  const [recit] = await sql`
    INSERT INTO stories (auteur_id, url) VALUES (${req.profilId}, ${url})
    RETURNING id, url, cree_le
  `
  res.status(201).json({
    id: recit.id,
    url: recit.url,
    date: new Date(recit.cree_le).getTime(),
  })
}))

// Les recits du lecteur et de ceux qu'il suit, groupes par auteur : la
// bande n'affiche qu'une bulle par compte, portant son recit le plus
// recent.
app.get('/stories', sessionFacultative, route(async (req, res) => {
  const viewerId = req.profilId || null
  const lignes = await sql`
    SELECT
      p.id AS auteur_id, p.pseudo, p.avatar_url,
      count(*)::int   AS nb,
      max(s.cree_le)  AS derniere,
      (array_agg(s.url ORDER BY s.cree_le DESC))[1] AS url
    FROM stories s
    JOIN profils p ON p.id = s.auteur_id
    WHERE s.cree_le > now() - ${DUREE_RECIT}::interval
      AND (
        s.auteur_id = ${viewerId}
        OR EXISTS (
          SELECT 1 FROM abonnements a
          WHERE a.suiveur_id = ${viewerId} AND a.suivi_id = s.auteur_id
        )
      )
    GROUP BY p.id, p.pseudo, p.avatar_url
    ORDER BY derniere DESC
    LIMIT ${limiteDemandee(req.query.limite)}
  `
  res.json(lignes.map((l) => ({
    id: l.auteur_id,
    pseudo: l.pseudo,
    avatarUrl: l.avatar_url,
    url: l.url,
    nb: l.nb,
    date: new Date(l.derniere).getTime(),
    moi: l.auteur_id === viewerId,
  })))
}))

// ------------------------------------------------------------
// Notifications
//
// Les trois evenements qui concernent le lecteur sont reunis en une
// seule liste triee : un abonnement a son compte, un j'aime ou un
// commentaire sur l'une de ses videos.
// ------------------------------------------------------------

app.get('/notifications', exigerSession, route(async (req, res) => {
  const limite = limiteDemandee(req.query.limite)
  const lignes = await sql`
    SELECT genre, acteur_pseudo, acteur_avatar, video_id, texte, date FROM (
      SELECT
        'abonnement' AS genre,
        p.pseudo     AS acteur_pseudo,
        p.avatar_url AS acteur_avatar,
        NULL::uuid   AS video_id,
        NULL::text   AS texte,
        a.cree_le    AS date
      FROM abonnements a
      JOIN profils p ON p.id = a.suiveur_id
      WHERE a.suivi_id = ${req.profilId}

      UNION ALL

      SELECT 'jaime', p.pseudo, p.avatar_url, v.id, NULL::text, j.cree_le
      FROM jaime j
      JOIN videos v ON v.id = j.video_id
      JOIN profils p ON p.id = j.profil_id
      WHERE v.auteur_id = ${req.profilId}
        AND v.supprimee_le IS NULL
        AND j.profil_id <> ${req.profilId}

      UNION ALL

      SELECT 'commentaire', p.pseudo, p.avatar_url, v.id, c.texte, c.cree_le
      FROM commentaires c
      JOIN videos v ON v.id = c.video_id
      JOIN profils p ON p.id = c.auteur_id
      WHERE v.auteur_id = ${req.profilId}
        AND v.supprimee_le IS NULL
        AND c.auteur_id <> ${req.profilId}
    ) evenements
    ORDER BY date DESC
    LIMIT ${limite}
  `
  res.json(lignes.map((l) => ({
    genre: l.genre,
    pseudo: l.acteur_pseudo,
    avatarUrl: l.acteur_avatar,
    videoId: l.video_id,
    texte: l.texte,
    date: new Date(l.date).getTime(),
  })))
}))

// ------------------------------------------------------------
// Technique
// ------------------------------------------------------------

app.get('/sante', (_req, res) => res.json({ ok: true }))

app.use((_req, res) => res.status(404).json({ erreur: 'Route inconnue' }))

// Dernier filet : le detail de l'erreur reste dans les journaux du
// serveur, le client ne recoit qu'un message generique. Une erreur SQL
// expose la structure de la base, et une pile expose les chemins.
app.use((erreur, _req, res, _suite) => {
  if (erreur instanceof Refus) {
    return res.status(erreur.code).json({ erreur: erreur.message })
  }
  if (erreur?.type === 'entity.parse.failed') {
    return res.status(400).json({ erreur: 'Corps de requête illisible' })
  }
  console.error('[erreur]', erreur)
  res.status(500).json({ erreur: 'Erreur interne du serveur' })
})

const port = process.env.PORT || 4000
// En local, le serveur ecoute lui-meme. Sur Vercel, la plateforme
// importe `app` et se charge de l'ecoute : ouvrir un port y echouerait.
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`API à l'écoute sur le port ${port}`))
}

export default app
