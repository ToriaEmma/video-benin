-- ============================================================
-- Plateforme nationale de vidéo courte — schéma de base
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- ============================================================

-- ---------- PROFILS ----------
-- Étend auth.users avec les données publiques du compte.
create table if not exists profils (
  id uuid primary key references auth.users on delete cascade,
  pseudo text unique not null,
  nom text,
  telephone text,
  bio text default '',
  avatar_url text,
  cree_le timestamptz default now()
);

alter table profils enable row level security;

create policy "Profils visibles par tous"
  on profils for select using (true);

create policy "Chacun modifie son profil"
  on profils for update using (auth.uid() = id);

create policy "Creation de son propre profil"
  on profils for insert with check (auth.uid() = id);

-- ---------- VIDEOS ----------
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null references profils(id) on delete cascade,
  url text not null,
  vignette_url text,
  legende text default '',
  duree_s numeric,
  departement text,
  langue text default 'francais',
  vues int default 0,
  publiee_le timestamptz default now()
);

create index if not exists videos_publiee_le_idx on videos (publiee_le desc);
create index if not exists videos_auteur_idx on videos (auteur_id);

alter table videos enable row level security;

create policy "Videos visibles par tous"
  on videos for select using (true);

create policy "Publier ses propres videos"
  on videos for insert with check (auth.uid() = auteur_id);

create policy "Supprimer ses propres videos"
  on videos for delete using (auth.uid() = auteur_id);

-- ---------- MENTIONS J'AIME ----------
create table if not exists jaime (
  video_id uuid not null references videos(id) on delete cascade,
  profil_id uuid not null references profils(id) on delete cascade,
  cree_le timestamptz default now(),
  primary key (video_id, profil_id)
);

alter table jaime enable row level security;

create policy "J'aime visibles par tous"
  on jaime for select using (true);

create policy "Aimer une video"
  on jaime for insert with check (auth.uid() = profil_id);

create policy "Retirer son j'aime"
  on jaime for delete using (auth.uid() = profil_id);

-- ---------- COMMENTAIRES ----------
create table if not exists commentaires (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  auteur_id uuid not null references profils(id) on delete cascade,
  texte text not null,
  cree_le timestamptz default now()
);

create index if not exists commentaires_video_idx on commentaires (video_id, cree_le desc);

alter table commentaires enable row level security;

create policy "Commentaires visibles par tous"
  on commentaires for select using (true);

create policy "Commenter"
  on commentaires for insert with check (auth.uid() = auteur_id);

create policy "Supprimer son commentaire"
  on commentaires for delete using (auth.uid() = auteur_id);

-- ---------- ABONNEMENTS ----------
create table if not exists abonnements (
  abonne_id uuid not null references profils(id) on delete cascade,
  createur_id uuid not null references profils(id) on delete cascade,
  cree_le timestamptz default now(),
  primary key (abonne_id, createur_id),
  check (abonne_id <> createur_id)
);

alter table abonnements enable row level security;

create policy "Abonnements visibles par tous"
  on abonnements for select using (true);

create policy "S'abonner"
  on abonnements for insert with check (auth.uid() = abonne_id);

create policy "Se desabonner"
  on abonnements for delete using (auth.uid() = abonne_id);

-- ---------- COMPTEUR DE VUES ----------
-- Incrément atomique, appelé depuis le client.
create or replace function incrementer_vues(id_video uuid)
returns void
language sql
security definer
as $$
  update videos set vues = vues + 1 where id = id_video;
$$;

-- ---------- STOCKAGE ----------
-- Deux compartiments publics : vidéos et avatars.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Videos lisibles par tous"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Envoi de video par un compte connecte"
  on storage.objects for insert
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');

create policy "Avatars lisibles par tous"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Envoi d'avatar par un compte connecte"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
