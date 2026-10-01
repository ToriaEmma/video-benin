# Spécifications des écrans

**Projet :** Plateforme nationale de vidéo courte
**Version :** 1.0 — 29 septembre 2026
**Destinataires :** designers et développeurs Android

---

## Conventions de lecture

| Notation | Signification |
|---|---|
| **P0** | Indispensable au lancement |
| **P1** | Souhaitable au lancement |
| **P2** | Reporté en phase 2 |
| `dp` | Unité de densité Android (1 dp = 1 px sur écran 160 ppp) |

**Règles transversales :**
- Zone de touche minimale : **44 × 44 dp**
- Grille d'espacement : multiples de **4 dp**
- Contraste texte sur vidéo : **AA minimum** (4,5:1) — lisibilité en plein soleil
- Interface sombre par défaut

---

## 1. Navigation générale

Barre inférieure fixe à **cinq entrées**, hauteur 56 dp.

```
┌──────────────────────────────────────────┐
│                                          │
│              CONTENU                     │
│                                          │
├──────────────────────────────────────────┤
│  Accueil  Découvrir  [+]  Boîte  Profil  │  56 dp
└──────────────────────────────────────────┘
```

| Position | Onglet | Icône | Priorité |
|---|---|---|---|
| 1 | Accueil | Maison | P0 |
| 2 | Découvrir | Loupe | P0 |
| 3 | **Créer** | Plus, encadré, plus large | P0 |
| 4 | Boîte de réception | Message | P1 |
| 5 | Profil | Silhouette | P0 |

**Comportements :**
- La barre **disparaît** en lecture plein écran immersive (appui long sur la vidéo)
- Le bouton central est visuellement distinct : plus large (44 × 32 dp), encadré
- L'onglet actif est signalé par la couleur, pas seulement par le poids typographique

---

## 2. Écran d'accueil — le fil

**Priorité : P0.** C'est l'écran qui détermine le succès du produit.

### 2.1 Disposition

```
┌─────────────────────────────────────┐
│     Abonnements  │  Pour toi        │ ← 48 dp, fond dégradé noir→transparent
│                                     │
│                                     │
│                                     │      ┌──────┐
│                                     │      │  ○   │ avatar 48 dp
│         VIDÉO PLEIN ÉCRAN           │      │  +   │ badge s'abonner
│         lecture auto, boucle        │      └──────┘
│                                     │      ┌──────┐
│                                     │      │  ♥   │ 32 dp
│                                     │      │ 12,4K│ compteur
│                                     │      └──────┘
│                                     │      ┌──────┐
│                                     │      │  💬  │
│                                     │      │  843 │
│                                     │      └──────┘
│                                     │      ┌──────┐
│                                     │      │  ↗   │
│                                     │      │  2,1K│
│                                     │      └──────┘
│  @pseudo                            │      ┌──────┐
│  Légende sur deux lignes maximum,   │      │  ♫   │ disque rotatif
│  tronquée avec « plus »             │      └──────┘
│  ♪ Titre du son — Artiste           │
├─────────────────────────────────────┤
│  Accueil  Découvrir  [+]  Boîte  Profil │
└─────────────────────────────────────┘
```

### 2.2 Sous-onglets supérieurs

| Élément | Spécification |
|---|---|
| Position | Centrés, 16 dp sous la barre d'état |
| Onglet actif | Opacité 100 %, soulignement 2 dp |
| Onglet inactif | Opacité 60 % |
| Bascule | Balayage horizontal ou appui |
| Par défaut | « Pour toi » |

### 2.3 Colonne d'actions

Alignée à droite, 12 dp du bord, empilement vertical de bas en haut.

| Élément | Taille | Comportement |
|---|---|---|
| **Avatar** | 48 dp, cercle | Appui → profil du créateur |
| **Badge s'abonner** | 20 dp, sous l'avatar | Disparaît avec animation après abonnement |
| **J'aime** | 32 dp | Appui → bascule, animation de remplissage, compteur mis à jour |
| **Commentaires** | 32 dp | Appui → feuille modale (§2.6) |
| **Partager** | 32 dp | Appui → feuille système, **WhatsApp en premier** |
| **Son** | 40 dp, disque | Rotation continue, appui → page du son |

**Compteurs :** format abrégé — 1 234 → « 1,2 K » ; 1 234 567 → « 1,2 M ».

### 2.4 Bloc d'information

Aligné à gauche, 16 dp du bord, au-dessus de la barre de navigation.

| Élément | Spécification |
|---|---|
| Pseudo | 16 sp, gras, préfixé de `@` |
| Légende | 14 sp, 2 lignes max, « plus » si tronquée |
| Hashtags | Couleur d'accent, cliquables |
| Son | 13 sp, icône note, texte défilant si trop long |

### 2.5 Gestes

| Geste | Action |
|---|---|
| Balayage haut | Vidéo suivante |
| Balayage bas | Vidéo précédente |
| Appui simple | Pause / reprise |
| **Double appui** | J'aime, animation cœur au point de contact |
| Appui long | Menu contextuel : signaler, enregistrer, ne plus recommander, vitesse |
| Balayage droite | Profil du créateur |
| Balayage gauche | Retour au fil |

### 2.6 Feuille de commentaires

Feuille modale couvrant 70 % de la hauteur, glissable.

```
┌─────────────────────────────────────┐
│           843 commentaires       ✕  │
├─────────────────────────────────────┤
│ ○ @pseudo · 2 h                     │
│   Le commentaire ici                │
│   ♥ 24   Répondre                   │
│                                     │
│   ↳ ○ @autre · 1 h                  │
│       La réponse                    │
├─────────────────────────────────────┤
│ ○ [ Ajouter un commentaire… ]   ➤   │
└─────────────────────────────────────┘
```

- Tri : pertinence par défaut, option « plus récents »
- Réponses imbriquées sur **un seul niveau**
- Appui long sur un commentaire → signaler, copier, supprimer (si auteur)

---

## 3. Écran Découvrir

**Priorité : P0.**

```
┌─────────────────────────────────────┐
│  🔍 Rechercher                      │ 40 dp
├─────────────────────────────────────┤
│  Tendances au Bénin                 │
│  #1 #cotonou      124 K vidéos      │
│  #2 #ahouefa       89 K vidéos      │
│  #3 #zemidjan      67 K vidéos      │
├─────────────────────────────────────┤
│  Près de vous — Littoral            │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │    │ │    │ │    │  grille 3 col │
│  └────┘ └────┘ └────┘               │
├─────────────────────────────────────┤
│  Sons populaires                    │
│  ♫ Titre — Artiste     12 K vidéos  │
└─────────────────────────────────────┘
```

### 3.1 Recherche

| État | Contenu |
|---|---|
| Vide | Recherches récentes, suggestions |
| En saisie | Suggestions en temps réel |
| Résultats | Onglets : Tout, Comptes, Vidéos, Sons, Hashtags |

### 3.2 Fil local

Section géolocalisée par **département** (12 départements du Bénin). Grille de vignettes 3 colonnes, ratio 9:16, compteur de vues en surimpression.

---

## 4. Écran de création

**Priorité : P0.** Trois étapes successives.

### 4.1 Capture

```
┌─────────────────────────────────────┐
│  ✕                        ♫ Sons    │
│                                     │
│                                     │      ⟲ Retourner
│         APERÇU CAMÉRA               │      ⚡ Flash
│                                     │      ⏱ Minuteur
│                                     │      ⏩ Vitesse
│                                     │
│                                     │
│      15 s  │  60 s  │  90 s         │
│                                     │
│         ┌───────────┐               │
│   🖼    │    ●      │      ✓        │
│ Galerie └───────────┘   Suivant     │
└─────────────────────────────────────┘
```

| Contrôle | Comportement |
|---|---|
| Bouton d'enregistrement | Appui maintenu ou appui-relâche selon réglage |
| Durée | 15 / 60 / 90 s — la sélection modifie l'anneau de progression |
| Vitesse | 0,3× / 0,5× / 1× / 2× / 3× |
| Minuteur | Compte à rebours 3 s ou 10 s |
| Galerie | Import vidéo ou photos (diaporama) |

**Enregistrement segmenté :** l'utilisateur peut enregistrer plusieurs séquences, visibles dans l'anneau de progression, avec suppression du dernier segment.

### 4.2 Édition

| Outil | Priorité | Description |
|---|---|---|
| Découpe | P0 | Poignées de début et fin sur la frise |
| Son | P0 | Bibliothèque, réglage du volume original/ajouté |
| Texte | P0 | Saisie, police, couleur, alignement, durée d'apparition |
| Stickers | P1 | Bibliothèque statique |
| Filtres | P1 | Correction colorimétrique simple |
| Sous-titres auto | P2 | Phase 2 |

### 4.3 Publication

```
┌─────────────────────────────────────┐
│  ← Publier                          │
├─────────────────────────────────────┤
│ ┌───┐                               │
│ │▶  │  Décrivez votre vidéo…        │
│ └───┘  #hashtags  @mentions         │
├─────────────────────────────────────┤
│  Qui peut voir       Tout le monde ▸│
│  Autoriser commentaires        [✓]  │
│  Autoriser téléchargement      [✓]  │
├─────────────────────────────────────┤
│  [ Brouillon ]      [ Publier ]     │
└─────────────────────────────────────┘
```

| Champ | Contrainte |
|---|---|
| Légende | 150 caractères max |
| Confidentialité | Tout le monde / Abonnés / Moi uniquement |
| Publication | Immédiate ou programmée (P1) |

---

## 5. Écran Profil

**Priorité : P0.**

```
┌─────────────────────────────────────┐
│  @pseudo                    ⚙ ⋮     │
├─────────────────────────────────────┤
│            ┌──────┐                 │
│            │  ○   │ avatar 96 dp    │
│            └──────┘                 │
│            @pseudo                  │
│                                     │
│   142        1,2 K        8,4 K     │
│ Abonnements Abonnés     J'aime      │
│                                     │
│      [ Modifier le profil ]         │
│                                     │
│   Bio sur deux lignes maximum       │
├─────────────────────────────────────┤
│   ▦ Vidéos  │  🔒 Privées │ ♥ Aimées│
├─────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐               │
│  │    │ │    │ │    │  grille 3 col │
│  └────┘ └────┘ └────┘               │
└─────────────────────────────────────┘
```

### 5.1 Profil d'un autre utilisateur

Remplace « Modifier le profil » par **[ S'abonner ]** et une icône message (P2).

### 5.2 Onglets

| Onglet | Visibilité |
|---|---|
| Vidéos | Public |
| Privées | Propriétaire uniquement |
| Aimées | Selon réglage de confidentialité |

---

## 6. Boîte de réception

**Priorité : P1.**

| Section | Contenu |
|---|---|
| Tout | Flux chronologique de l'activité |
| J'aime | Mentions j'aime reçues |
| Commentaires | Commentaires et réponses |
| Abonnés | Nouveaux abonnés |
| Système | Messages de la plateforme, décisions de modération |

---

## 7. Écrans de compte

### 7.1 Inscription — P0

Parcours en trois étapes, **sans email obligatoire** :

```
1. Numéro de téléphone     2. Code SMS        3. Profil
┌──────────────────┐    ┌──────────────┐   ┌──────────────┐
│ +229 │ 01 XX XX  │    │  □ □ □ □ □ □ │   │ Pseudo       │
│                  │    │              │   │ Date de nais.│
│   [ Continuer ]  │    │ Renvoyer 30s │   │ [ Terminer ] │
└──────────────────┘    └──────────────┘   └──────────────┘
```

| Étape | Contrainte |
|---|---|
| Numéro | Indicatif +229 pré-rempli, validation du format béninois |
| Code | 6 chiffres, saisie automatique depuis le SMS, renvoi après 30 s |
| Profil | Pseudo unique, date de naissance (contrôle d'âge) |

### 7.2 Réglages — P0

| Section | Entrées |
|---|---|
| Compte | Pseudo, téléphone, mot de passe, suppression |
| Confidentialité | Compte privé, qui peut commenter, qui peut télécharger |
| **Données** | **Mode économie (activé par défaut)**, compteur de consommation, qualité en Wi-Fi |
| Notifications | Par type |
| Contenu | Langues préférées, filtres |
| Assistance | Aide, signaler un problème, conditions, confidentialité |

### 7.3 Économie de données — P0

Écran dédié, accessible en deux appuis depuis le fil.

```
┌─────────────────────────────────────┐
│  ← Économie de données              │
├─────────────────────────────────────┤
│  Mode économie              [ ✓ ]   │
│  Limite la qualité en données mob.  │
├─────────────────────────────────────┤
│  Ce mois-ci                         │
│  ████████░░░░  180 Mo               │
│                                     │
│  Données mobiles      142 Mo        │
│  Wi-Fi                 38 Mo        │
├─────────────────────────────────────┤
│  Qualité en données mobiles   360p ▸│
│  Qualité en Wi-Fi             720p ▸│
│  Précharger en Wi-Fi seulement [✓]  │
└─────────────────────────────────────┘
```

**Ce n'est pas un réglage secondaire.** Avec un mégaoctet à 1,2–3,1 FCFA, la maîtrise de la consommation conditionne la rétention.

---

## 8. Monétisation créateur

**Priorité : P0.** Accessible depuis le profil.

```
┌─────────────────────────────────────┐
│  ← Mes revenus                      │
├─────────────────────────────────────┤
│                                     │
│         12 450 FCFA                 │
│         Solde disponible            │
│                                     │
│      [ Retirer en Mobile Money ]    │
│                                     │
├─────────────────────────────────────┤
│  Ce mois-ci                         │
│  Vues qualifiées        84 200      │
│  Gains                8 100 FCFA    │
├─────────────────────────────────────┤
│  Historique des retraits            │
│  15 sept.  MTN MoMo   5 000 FCFA ✓  │
│  28 août   Moov       7 500 FCFA ✓  │
└─────────────────────────────────────┘
```

### 8.1 Retrait

| Étape | Contenu |
|---|---|
| 1 | Choix de l'opérateur : MTN MoMo / Moov Money / Celtiis Cash |
| 2 | Numéro de téléphone (pré-rempli avec celui du compte) |
| 3 | Montant — **minimum 5 000 FCFA** |
| 4 | Confirmation, récapitulatif des frais |
| 5 | Validation par code SMS |

**Transparence obligatoire :** les frais éventuels sont affichés **avant** confirmation.

---

## 9. États et cas limites

Ces états sont trop souvent oubliés en conception. Ils sont **P0**.

| État | Écran concerné | Traitement |
|---|---|---|
| **Hors ligne** | Fil | Bandeau, vidéos téléchargées accessibles |
| **Connexion lente** | Fil | Bascule automatique en 240p, indicateur discret |
| **Fil vide** | Abonnements | Invitation à découvrir des créateurs |
| **Chargement** | Toutes grilles | Blocs de substitution, pas de rotative |
| **Erreur d'envoi** | Publication | Conservation en brouillon, reprise possible |
| **Contenu supprimé** | Fil, profil | Message explicite avec motif |
| **Compte suspendu** | Connexion | Motif et voie de recours |
| **Premier lancement** | Fil | Amorce par département, sans écran d'accueil bloquant |

---

## 10. Accessibilité

| Exigence | Niveau |
|---|---|
| Contraste texte | AA (4,5:1) minimum |
| Zone de touche | 44 × 44 dp minimum |
| Étiquettes lecteur d'écran | Toutes les icônes d'action |
| Taille de police | Respect du réglage système |
| Sous-titres | P2, mais structure prévue dès la phase 1 |

---

## 11. Récapitulatif des priorités

### À livrer pour le lancement (P0)

Fil et lecture · Sous-onglets · Colonne d'actions · Commentaires · Recherche · Fil local · Capture · Édition simple · Publication · Profil · Inscription SMS · Réglages · Économie de données · Monétisation et retrait MoMo · Tous les états limites

### Souhaitable (P1)

Boîte de réception · Stickers · Filtres colorimétriques · Publication programmée

### Phase 2 (P2)

Messagerie · Sous-titres automatiques · Live · Boutique · Duos · iOS
