-- ============================================================
-- Schema de la base Neon (PostgreSQL).
--
-- A executer une fois sur le projet Neon, depuis la console SQL :
--   https://console.neon.tech -> SQL Editor -> coller ce fichier.
--
-- Les identifiants sont des uuid generes par la base : l'application
-- n'a jamais a les inventer.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Comptes ----------
CREATE TABLE IF NOT EXISTS profils (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo        text UNIQUE NOT NULL,
  nom           text,
  telephone     text UNIQUE,
  -- Empreinte du mot de passe : le mot de passe lui-meme n'est
  -- jamais conserve.
  mot_de_passe  text NOT NULL,
  bio           text NOT NULL DEFAULT '',
  avatar_url    text,
  cree_le       timestamptz NOT NULL DEFAULT now()
);

-- ---------- Publications ----------
CREATE TABLE IF NOT EXISTS videos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id        uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  url              text NOT NULL,
  legende          text NOT NULL DEFAULT '',
  departement      text,
  vues             integer NOT NULL DEFAULT 0,
  -- Reglages poses au moment de la publication.
  visibilite       text NOT NULL DEFAULT 'monde'
                   CHECK (visibilite IN ('monde', 'amis', 'moi')),
  commentaires_autorises   boolean NOT NULL DEFAULT true,
  reutilisation_autorisee  boolean NOT NULL DEFAULT true,
  son_id           text,
  -- Horodatage de suppression : une video supprimee rejoint la
  -- corbeille pendant 30 jours avant d'etre effacee.
  supprimee_le     timestamptz,
  publiee_le       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_auteur ON videos(auteur_id);
CREATE INDEX IF NOT EXISTS videos_date ON videos(publiee_le DESC);

-- ---------- Brouillons ----------
CREATE TABLE IF NOT EXISTS brouillons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id   uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  url         text NOT NULL,
  legende     text NOT NULL DEFAULT '',
  octets      bigint NOT NULL DEFAULT 0,
  cree_le     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brouillons_auteur ON brouillons(auteur_id);

-- ---------- J'aime ----------
-- La paire (video, profil) est unique : on ne peut aimer qu'une fois.
CREATE TABLE IF NOT EXISTS jaime (
  video_id   uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profil_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, profil_id)
);

-- ---------- Favoris ----------
CREATE TABLE IF NOT EXISTS favoris (
  video_id   uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profil_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, profil_id)
);

-- ---------- Abonnements ----------
CREATE TABLE IF NOT EXISTS abonnements (
  suiveur_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  suivi_id    uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  cree_le     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (suiveur_id, suivi_id),
  -- On ne s'abonne pas a soi-meme.
  CHECK (suiveur_id <> suivi_id)
);

-- ---------- Commentaires ----------
CREATE TABLE IF NOT EXISTS commentaires (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  auteur_id   uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  texte       text NOT NULL,
  cree_le     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commentaires_video ON commentaires(video_id, cree_le);

-- ---------- Messagerie ----------
CREATE TABLE IF NOT EXISTS conversations (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cree_le   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profil_id        uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  -- Date de derniere lecture : ce qui suit est non lu.
  lu_le            timestamptz,
  PRIMARY KEY (conversation_id, profil_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  auteur_id        uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  texte            text NOT NULL,
  envoye_le        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation
  ON messages(conversation_id, envoye_le);

-- ---------- Recits ----------
-- Un recit s'efface de lui-meme au bout de 24 h : la colonne de date
-- suffit, les routes de lecture ecartent ce qui a expire.
CREATE TABLE IF NOT EXISTS stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  url        text NOT NULL,
  cree_le    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_auteur ON stories(auteur_id, cree_le DESC);

-- ---------- Limitation des essais ----------
-- Une ligne par essai de connexion manque ou par inscription, notee par
-- compte vise et par adresse : au-dela d'un seuil sur 15 minutes, l'API
-- refuse (protection contre les robots qui devinent les mots de passe).
CREATE TABLE IF NOT EXISTS tentatives (
  cle      text NOT NULL,
  cree_le  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tentatives_cle ON tentatives(cle, cree_le);

-- ---------- Signalements ----------
-- Un compte signale une video une fois (son motif peut changer).
CREATE TABLE IF NOT EXISTS signalements (
  video_id   uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profil_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  motif      text NOT NULL,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, profil_id)
);

-- ---------- Sons favoris ----------
-- Ranges par compte ; `son` garde de quoi l'afficher (titre, artiste,
-- pochette…), l'adresse d'ecoute etant redemandee a l'affichage.
CREATE TABLE IF NOT EXISTS sons_favoris (
  profil_id  uuid NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  son_id     text NOT NULL,
  son        jsonb NOT NULL,
  cree_le    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profil_id, son_id)
);

-- ---------- Recuperation de compte ----------
-- Empreinte du code de recuperation (mot de passe oublie, sans SMS).
ALTER TABLE profils ADD COLUMN IF NOT EXISTS code_recuperation text;

-- ---------- Miniatures ----------
-- Image de couverture d'une video (apercu des liens, grille du profil).
ALTER TABLE videos ADD COLUMN IF NOT EXISTS miniature_url text;
