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
} from './auth.js'
import {
  stockageConfigure,
  TYPES_VIDEO,
  TAILLE_MAX,
  construireCle,
  urlPubliqueDe,
  signerDepot,
} from './stockage.js'

const app = express()
app.use(cors())
app.use(express.json())

// ------------------------------------------------------------
// Outils communs
// ------------------------------------------------------------

// Les routes asynchrones sont enveloppees : sans cela, une promesse
// rejetee echapperait au middleware d'erreur d'Express.
const route = (traitement) => (req, res, suite) =>
  Promise.resolve(traitement(req, res, suite)).catch(suite)

// Erreur portant un code HTTP, pour distinguer un refus attendu
// (403, 404) d'une panne serveur.
class Refus extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const texteRequis = (valeur, nom) => {
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    throw new Refus(400, `Le champ « ${nom} » est requis`)
  }
  return valeur.trim()
}

const texteFacultatif = (valeur) =>
  typeof valeur === 'string' ? valeur.trim() : null

const booleenOuDefaut = (valeur, defaut) =>
  typeof valeur === 'boolean' ? valeur : defaut

const VISIBILITES = ['monde', 'amis', 'moi']

// La limite est plafonnee : une requete ne doit pas pouvoir demander
// la table entiere.
const limiteDemandee = (brut) => {
  const n = Number.parseInt(brut, 10)
  if (!Number.isFinite(n) || n <= 0) return 20
  return Math.min(n, 50)
}

// uuid attendu dans l'URL : un identifiant mal forme ferait echouer la
// requete SQL avec une erreur de type, qu'on ne veut pas remonter.
const MOTIF_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const identifiant = (brut, nom = 'identifiant') => {
  if (!MOTIF_UUID.test(brut || '')) {
    throw new Refus(400, `${nom} invalide`)
  }
  return brut
}

// Projection d'un profil : l'empreinte du mot de passe n'en sort jamais.
const profilPublic = (p) => ({
  id: p.id,
  pseudo: p.pseudo,
  nom: p.nom,
  bio: p.bio,
  avatar_url: p.avatar_url,
  telephone: p.telephone,
  cree_le: p.cree_le,
})

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
    SELECT * FROM profils WHERE pseudo = ${pseudo}
  `
  if (!profil) throw new Refus(404, 'Compte introuvable')
  return profil
}

// ------------------------------------------------------------
// Comptes
// ------------------------------------------------------------

app.post('/inscription', route(async (req, res) => {
  const telephone = texteRequis(req.body?.telephone, 'telephone')
  const motDePasse = texteRequis(req.body?.motDePasse, 'motDePasse')
  const pseudo = texteRequis(req.body?.pseudo, 'pseudo')

  if (motDePasse.length < 6) {
    throw new Refus(400, 'Le mot de passe doit faire au moins 6 caractères')
  }

  const existants = await sql`
    SELECT pseudo, telephone FROM profils
    WHERE pseudo = ${pseudo} OR telephone = ${telephone}
  `
  if (existants.some((p) => p.pseudo === pseudo)) {
    throw new Refus(409, 'Ce pseudo est déjà pris')
  }
  if (existants.some((p) => p.telephone === telephone)) {
    throw new Refus(409, 'Ce numéro est déjà associé à un compte')
  }

  const empreinte = await chiffrer(motDePasse)
  const [profil] = await sql`
    INSERT INTO profils (pseudo, telephone, mot_de_passe)
    VALUES (${pseudo}, ${telephone}, ${empreinte})
    RETURNING *
  `
  res.status(201).json({ jeton: signerJeton(profil.id), profil: profilPublic(profil) })
}))

app.post('/connexion', route(async (req, res) => {
  const telephone = texteRequis(req.body?.telephone, 'telephone')
  const motDePasse = texteRequis(req.body?.motDePasse, 'motDePasse')

  const [profil] = await sql`
    SELECT * FROM profils WHERE telephone = ${telephone}
  `
  // Un seul message pour les deux echecs : il ne doit pas reveler
  // si le numero existe dans la base.
  const refus = new Refus(401, 'Numéro ou mot de passe incorrect')
  if (!profil) throw refus
  if (!(await verifier(motDePasse, profil.mot_de_passe))) throw refus

  res.json({ jeton: signerJeton(profil.id), profil: profilPublic(profil) })
}))

app.get('/moi', exigerSession, route(async (req, res) => {
  const [profil] = await sql`SELECT * FROM profils WHERE id = ${req.profilId}`
  if (!profil) throw new Refus(404, 'Compte introuvable')
  res.json(profilPublic(profil))
}))

app.patch('/moi', exigerSession, route(async (req, res) => {
  const { nom, pseudo, bio, avatar_url: avatarUrl } = req.body || {}

  let nouveauPseudo = null
  if (pseudo !== undefined) {
    nouveauPseudo = texteRequis(pseudo, 'pseudo')
    const [pris] = await sql`
      SELECT id FROM profils
      WHERE pseudo = ${nouveauPseudo} AND id <> ${req.profilId}
    `
    if (pris) throw new Refus(409, 'Ce pseudo est déjà pris')
  }

  // COALESCE : un champ absent du corps garde sa valeur actuelle.
  const [profil] = await sql`
    UPDATE profils SET
      nom        = COALESCE(${nom === undefined ? null : texteFacultatif(nom)}, nom),
      pseudo     = COALESCE(${nouveauPseudo}, pseudo),
      bio        = COALESCE(${bio === undefined ? null : texteFacultatif(bio)}, bio),
      avatar_url = COALESCE(${avatarUrl === undefined ? null : texteFacultatif(avatarUrl)}, avatar_url)
    WHERE id = ${req.profilId}
    RETURNING *
  `
  if (!profil) throw new Refus(404, 'Compte introuvable')
  res.json(profilPublic(profil))
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
  if (!Number.isFinite(taille) || taille <= 0) {
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
    url: await signerDepot(cle, type),
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
  return lignes.map(videoPublique)
}

app.get('/videos', sessionFacultative, route(async (req, res) => {
  const videos = await listerVideos({
    viewerId: req.profilId || null,
    auteurId: null,
    videoId: null,
    limite: limiteDemandee(req.query.limite),
    avant: req.query.avant || null,
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
    avant: req.query.avant || null,
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
    avant: req.query.avant || null,
  })
  res.json(videos)
}))

app.post('/videos', exigerSession, route(async (req, res) => {
  const url = texteRequis(req.body?.url, 'url')
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
      ${texteFacultatif(req.body?.legende) ?? ''},
      ${texteFacultatif(req.body?.departement)},
      ${visibilite},
      ${booleenOuDefaut(req.body?.commentaires_autorises, true)},
      ${booleenOuDefaut(req.body?.reutilisation_autorisee, true)},
      ${texteFacultatif(req.body?.son_id)}
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
      legende     = COALESCE(${legende === undefined ? null : texteFacultatif(legende)}, legende),
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

// Suppression douce : la video rejoint la corbeille pendant 30 jours.
app.delete('/videos/:id', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoDeLAuteur(id, req.profilId)
  await sql`UPDATE videos SET supprimee_le = now() WHERE id = ${id}`
  res.json({ ok: true })
}))

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
app.post('/videos/:id/vue', route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  const [video] = await sql`
    UPDATE videos SET vues = vues + 1
    WHERE id = ${id} AND supprimee_le IS NULL
    RETURNING vues
  `
  if (!video) throw new Refus(404, 'Vidéo introuvable')
  res.json({ vues: video.vues })
}))

// ------------------------------------------------------------
// Interactions
// ------------------------------------------------------------

const videoVivante = async (videoId) => {
  const [video] = await sql`
    SELECT * FROM videos WHERE id = ${videoId} AND supprimee_le IS NULL
  `
  if (!video) throw new Refus(404, 'Vidéo introuvable')
  return video
}

app.post('/videos/:id/jaime', exigerSession, route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
  await videoVivante(id)
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
  await videoVivante(id)
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
// Commentaires
// ------------------------------------------------------------

app.get('/videos/:id/commentaires', route(async (req, res) => {
  const id = identifiant(req.params.id, 'Identifiant de vidéo')
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
  const texte = texteRequis(req.body?.texte, 'texte')

  const video = await videoVivante(id)
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
  const url = texteRequis(req.body?.url, 'url')
  const octets = Number(req.body?.octets ?? 0)
  if (!Number.isFinite(octets) || octets < 0) {
    throw new Refus(400, 'Le champ « octets » doit être un nombre positif')
  }
  const [b] = await sql`
    INSERT INTO brouillons (auteur_id, url, legende, octets)
    VALUES (${req.profilId}, ${url},
            ${texteFacultatif(req.body?.legende) ?? ''}, ${Math.round(octets)})
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
    RETURNING id
  `
  if (!supprime) throw new Refus(404, 'Brouillon introuvable')
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
  const texte = texteRequis(req.body?.texte, 'texte')

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
  const pseudo = texteRequis(req.body?.pseudo, 'pseudo')
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
  const url = texteRequis(req.body?.url, 'url')
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
