# Application — mise en route

Trois étapes, environ 10 minutes.

---

## 1. Créer la base de données

1. Ouvrir [supabase.com](https://supabase.com) et se connecter
2. Créer un nouveau projet (ou réutiliser un projet existant)
3. Aller dans **SQL Editor** → **New query**
4. Copier tout le contenu de `supabase-schema.sql` et le coller
5. Cliquer sur **Run**

Cela crée les tables (profils, vidéos, j'aime, commentaires, abonnements), les règles de sécurité et les deux compartiments de stockage.

---

## 2. Désactiver la confirmation par email

L'inscription se fait par numéro de téléphone. Supabase attend une adresse email, donc l'application en fabrique une technique à partir du numéro — elle n'est jamais affichée ni utilisée pour écrire à l'utilisateur.

Il faut donc désactiver la confirmation, sinon personne ne pourra se connecter :

**Authentication** → **Providers** → **Email** → décocher **Confirm email** → **Save**

---

## 3. Renseigner les clés

Dans **Project Settings** → **API**, copier :
- **Project URL**
- **anon public** (la clé publique, pas la `service_role`)

Puis créer un fichier `.env.local` à la racine de `app/` :

```
VITE_SUPABASE_URL=https://votreprojet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## Lancer

```bash
cd ~/Documents/tiktok-benin/app
npm run dev -- --host
```

L'adresse réseau affichée est accessible depuis un téléphone sur le même Wi-Fi.

---

## Ce qui fonctionne

| Fonctionnalité | État |
|---|---|
| Inscription par numéro + mot de passe | ✅ |
| Connexion, session persistante | ✅ |
| Publication d'une vidéo (caméra ou galerie) | ✅ |
| Contrôle de durée (90 s) et de taille (50 Mo) | ✅ |
| Fil vertical avec défilement par vidéo | ✅ |
| Lecture automatique de la vidéo visible uniquement | ✅ |
| J'aime, avec compteur | ✅ |
| Commentaires | ✅ |
| Partage (natif ou copie de lien) | ✅ |
| Comptage des vues | ✅ |
| Recherche de comptes et de vidéos | ✅ |
| Vidéos populaires | ✅ |
| Profil, statistiques, suppression | ✅ |

## Ce qui n'y est pas

Ces éléments figurent au cahier des charges mais dépassent le périmètre d'une première livraison :

- Vérification du numéro par SMS (nécessite un compte opérateur payant)
- Transcodage multi-qualité (240p à 720p)
- Retrait en mobile money
- Modération automatique
- Abonnements entre comptes (table créée, interface à faire)

---

## Déployer en ligne

```bash
cd ~/Documents/tiktok-benin/app
npx vercel --prod
```

Penser à renseigner les deux variables d'environnement dans les réglages du projet Vercel.
