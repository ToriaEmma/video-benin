# Cahier des charges — Plateforme nationale de vidéo courte

**Commanditaire :** Ministère *(à préciser)*
**Version :** 2.0 — 29 septembre 2026
**Nature :** application mobile de vidéo courte, reproduction de l'expérience TikTok, adaptée au Bénin
**Périmètre du prestataire :** conception (UI/UX) et développement

---

## 1. Objet du projet

Le ministère commande une plateforme nationale de vidéo courte reprenant l'expérience d'usage de TikTok. L'objectif de la phase 1 est de livrer une application **fonctionnellement et visuellement équivalente**, immédiatement familière pour les utilisateurs béninois déjà habitués à TikTok. Les adaptations locales et les différenciations interviendront en phase 2.

### 1.1 Parti pris : la familiarité avant l'originalité

Reproduire une interface connue supprime le coût d'apprentissage. Un utilisateur béninois qui ouvre l'application doit savoir s'en servir immédiatement, sans tutoriel. Ce choix est assumé et structure toute la phase 1.

### 1.2 Phasage

| Phase | Contenu | Échéance |
|---|---|---|
| **Phase 1** | Reproduction de l'expérience TikTok, socle technique, mobile money | Mois 1 à 10 |
| **Phase 2** | Adaptations béninoises : langues nationales, commerce local, contenus institutionnels | Mois 11 à 18 |

Le présent document couvre principalement la **phase 1**. La section 11 décrit les orientations de la phase 2, à préciser ultérieurement.

---

## 2. Avertissement juridique — à traiter avant le développement

**Ce point doit être arbitré par le service juridique du ministère avant l'écriture de la première ligne de code.**

### 2.1 Le risque

La reproduction fidèle d'une interface applicative expose à trois types de risques :

| Risque | Nature | Gravité |
|---|---|---|
| **Droit d'auteur** | L'agencement original d'une interface peut être protégé | Élevée |
| **Marques** | Logo, nom, symboles (la note de musique) sont déposés | Certaine si repris |
| **Brevets de design** | ByteDance détient des dépôts sur certains agencements | Moyenne, variable |

### 2.2 Ce qui est reproductible sans risque

Les **principes fonctionnels** ne sont pas protégeables : le défilement vertical, le plein écran, la colonne d'actions latérale, la lecture automatique en boucle sont des conventions d'usage largement répandues (Instagram Reels, YouTube Shorts, Snapchat Spotlight les emploient toutes).

### 2.3 Ce qui doit impérativement différer

| Élément | Obligation |
|---|---|
| Nom et logo | **Création originale obligatoire** |
| Palette de couleurs | Teintes propres — ne pas reprendre le cyan/magenta de TikTok |
| Icônes | Jeu d'icônes original ou sous licence libre |
| Typographie | Police propre ou libre de droits |
| Sons de marque | Création originale |
| Textes d'interface | Rédaction propre |

### 2.4 Recommandation

Livrer une application dont **la structure, les parcours et les gestes sont identiques** à TikTok — ce qui garantit la familiarité recherchée — mais dont **l'habillage est original**. L'utilisateur retrouve ses repères sans que le ministère s'expose.

Cette recommandation est technique. **La décision finale appartient au ministère**, après avis juridique. Le reste du document est rédigé sous cette hypothèse ; si le ministère choisit une copie visuelle intégrale, seule la section 4.2 (design system) est à reprendre.

---

## 3. Contexte béninois

### 3.1 Le marché

| Indicateur | Valeur | Date |
|---|---|---|
| Population | ~14 millions | 2026 |
| Abonnés mobiles uniques | 10,33 M (78,1 %) | déc. 2025 |
| Abonnés internet mobile | 8,59 M (64,9 %) | déc. 2025 |
| Part de la 4G | 58 % | 2025 |
| Couverture internet mobile | 94 % du territoire | 2025 |
| Comptes mobile money actifs | ~9 millions | 2026 |
| Croissance des données consommées | +47 % en un an | 2025 |

### 3.2 Les quatre contraintes structurantes

Ces contraintes conditionnent toutes les décisions techniques, y compris dans une logique de reproduction.

#### Le coût des données

Les forfaits illimités à 5 000 et 10 000 FCFA ont été supprimés. Le premier forfait mensuel démarre désormais à **15 100 FCFA**, et le mégaoctet revient entre **1,2 et 3,1 FCFA**.

**Conséquences obligatoires :**
- Mode économie de données **actif par défaut**
- Cible de **≤ 2 Mo par minute** de vidéo en qualité standard
- Préchargement limité à **une vidéo**
- Compteur de consommation visible dans l'application

#### Le parc d'appareils

Android d'entrée de gamme majoritaire, RAM et stockage limités.

**Conséquences obligatoires :**
- **Android en priorité absolue**, iOS en phase 2
- APK **< 30 Mo**
- Fluidité garantie sur **Android 8+ avec 2 Go de RAM**
- Pas d'effets 3D ni de traitement vidéo lourd sur l'appareil en phase 1

#### Le cadre légal

Protection des données régie par le **Code du numérique (loi n° 2017-20 du 20 avril 2018)**, modifié par la **loi n° 2020-35 du 6 janvier 2021**, sous contrôle de l'**APDP**.

**Obligations :**
- Déclaration préalable du traitement auprès de l'APDP
- Consentement libre, explicite et éclairé
- Transparence sur les finalités, limitation de la conservation
- Droits d'accès, de rectification et de suppression
- Politique de confidentialité en français, en langage clair

La **HAAC** ayant annoncé une régulation des créateurs de contenu, le projet doit prévoir modération démontrable et identification des créateurs monétisés.

**Portée particulière pour un projet d'État :** une plateforme publique est tenue à une exemplarité renforcée en matière de protection des données et de neutralité des contenus.

#### Le paiement

| Opérateur | Parts de marché | Comptes actifs |
|---|---|---|
| MTN MoMo | ~45 % (55 % des transactions) | ~5 M |
| Moov Money | ~35 % | ~4 M |
| Celtiis Cash | Reste | — |

**Les trois opérateurs doivent être intégrés.** L'interopérabilité progresse (jusqu'à trois portefeuilles par numéro) mais reste imparfaite.

---

## 4. Spécifications de conception

### 4.1 Écrans à reproduire

L'application reprend la structure de navigation de TikTok : **cinq onglets en barre inférieure**.

| Onglet | Contenu | Priorité |
|---|---|---|
| **Accueil** | Fil vertical plein écran, sous-onglets « Pour toi » / « Abonnements » | P0 |
| **Découvrir** | Recherche, tendances, hashtags, sons | P0 |
| **Créer** (bouton central) | Capture et publication | P0 |
| **Boîte de réception** | Notifications, activité | P1 |
| **Profil** | Compte, vidéos publiées, statistiques | P0 |

#### Écran d'accueil — spécification détaillée

```
┌─────────────────────────────┐
│   Abonnements │ Pour toi    │  ← sous-onglets en haut
│                             │
│                             │
│                             │  ┌───┐
│      VIDÉO PLEIN ÉCRAN      │  │ ○ │ avatar + s'abonner
│      (lecture auto,         │  ├───┤
│       boucle infinie)       │  │ ♥ │ j'aime + compteur
│                             │  ├───┤
│                             │  │ 💬│ commentaires
│                             │  ├───┤
│  @pseudo                    │  │ ↗ │ partager
│  Légende de la vidéo        │  ├───┤
│  ♪ Nom du son               │  │ ♫ │ disque rotatif
└─────────────────────────────┘
```

**Gestes obligatoires :**
- Balayage vertical vers le haut → vidéo suivante
- Balayage vertical vers le bas → vidéo précédente
- Appui simple → pause / reprise
- Double appui → j'aime avec animation
- Appui long → menu contextuel (signaler, enregistrer, ne plus recommander)
- Balayage latéral → profil du créateur

#### Écran de création

| Étape | Éléments |
|---|---|
| **Capture** | Bouton d'enregistrement, minuteur (15 s / 60 s / 90 s), retournement caméra, flash, vitesse, compte à rebours |
| **Édition** | Découpe, ajout de son, texte à l'écran, stickers, sous-titres |
| **Publication** | Légende, hashtags, confidentialité, autorisation commentaires, publication ou brouillon |

### 4.2 Design system

**Sous l'hypothèse de la section 2.4** (structure identique, habillage original) :

| Élément | Spécification |
|---|---|
| **Palette** | À créer. Contrainte : lisibilité en plein soleil, contraste AA minimum sur fond vidéo |
| **Typographie** | Sans-serif libre de droits, lisible à 12 px sur écran d'entrée de gamme |
| **Icônes** | Jeu original ou licence libre, style linéaire, 24 × 24 px |
| **Mode** | Interface sombre par défaut (économie de batterie sur écrans OLED, confort sur vidéo) |
| **Espacements** | Grille de 4 px |
| **Zone de touche** | 44 × 44 px minimum |

**Livrables de conception :**
- Maquettes de tous les écrans (Figma), versions claire et sombre
- Design system documenté : composants, états, variantes
- Prototype interactif des parcours principaux
- Spécifications d'animation (durées, courbes)

---

## 5. Spécifications fonctionnelles

### 5.1 Phase 1 — périmètre à livrer

#### Compte et identité
- Inscription par **numéro de téléphone + code SMS** (email facultatif)
- Profil : pseudo, photo, bio, lien
- Gestion multi-comptes et déconnexion rapide (appareils partagés)
- Comptes vérifiés (institutions, médias)

#### Consultation
- Fil vertical plein écran, lecture automatique en boucle
- Onglets « Pour toi » et « Abonnements »
- Actions : j'aime, commenter, partager, enregistrer, signaler, télécharger
- Partage externe (WhatsApp en priorité — usage dominant au Bénin)
- Mode économie de données visible et actif par défaut

#### Création
- Capture **15 à 90 secondes**
- Import depuis la galerie
- Découpe, vitesse, minuteur, compte à rebours
- Bibliothèque de sons avec **fonds musicaux béninois sous licence**
- Texte à l'écran, stickers, sous-titres automatiques (phase 2)
- Brouillons, programmation

#### Découverte
- Recherche par mot-clé, hashtag, créateur, son
- Tendances
- **Fil local** géolocalisé par département

#### Interactions sociales
- Abonnements et abonnés
- Commentaires, réponses, mentions j'aime sur commentaires
- Partage vers WhatsApp, Facebook, lien direct

#### Modération
- Signalement par les utilisateurs, avec motifs
- Interface de modération humaine (back-office)
- Filtrage automatique des contenus manifestement interdits
- **Modérateurs recrutés localement**, parlant les langues nationales
- Journal d'audit des décisions (exigence pour un projet d'État)

#### Monétisation créateur
- Cagnotte alimentée par les vues qualifiées (≥ 50 % de la vidéo vue)
- **Retrait en mobile money dès 5 000 FCFA** (MTN, Moov, Celtiis)
- Tableau de bord des revenus
- Barème public et stable

#### Administration
- Tableau de bord ministériel : statistiques d'usage, contenus signalés, créateurs actifs
- Outils de diffusion de messages institutionnels
- Export de données pour rapports

### 5.2 Phase 2 — orientations

- Langues nationales : marquage à la publication, quota dans le fil, interface traduite
- Live streaming avec cadeaux en mobile money
- Boutique intégrée pour le commerce local
- Messagerie privée
- Application iOS
- Duos et réactions
- Contenus éducatifs et institutionnels mis en avant

### 5.3 Hors périmètre

- Filtres de réalité augmentée complexes
- Vidéos longues (> 3 minutes)
- Création depuis le web (consultation web seulement)

---

## 6. Le fil de recommandation

### 6.1 Architecture de référence

Le pipeline reproduit celui de TikTok, en six étapes :

1. **Recherche de candidats** — sélection des vidéos potentiellement pertinentes
2. **Filtre de sécurité** — retrait des contenus interdits
3. **Scoring** — prédiction des comportements (visionnage complet, like, partage, abandon)
4. **Diversification** — évite deux vidéos trop similaires consécutives
5. **Mix final** — assemblage du fil
6. **Ajustement local** — réordonnancement sur l'appareil selon le comportement immédiat

### 6.2 Signaux de classement, par poids décroissant

| Rang | Signal | Poids |
|---|---|---|
| 1 | Temps de visionnage et taux de complétion | Déterminant |
| 2 | Interactions (like, partage, commentaire, sauvegarde, revisionnage) | Fort |
| 3 | Métadonnées vidéo (son, hashtags, légende, sujet) | Moyen |
| 4 | Contexte (langue, localisation, appareil) | Faible |

### 6.3 Diffusion par vagues

Une vidéo est servie par paliers croissants selon les signaux recueillis :

```
200 vues → 2 000 → 20 000 → national
```

Ce mécanisme permet à un compte sans audience d'émerger. Il est **essentiel à l'attractivité pour les créateurs** et doit être reproduit fidèlement.

### 6.4 Ajustements pour la phase 1

| Règle | Détail |
|---|---|
| **Amorce locale** | Un nouveau compte reçoit d'abord des contenus de son département |
| **Pondération data** | Le score de complétion est normalisé par la durée : une vidéo de 20 s vue entièrement vaut autant qu'une de 60 s vue entièrement |
| **Contenus institutionnels** | Emplacements réservés, clairement identifiés comme tels |

### 6.5 Démarrage à froid

Fil initial d'un nouveau compte :
- 40 % contenus du département
- 30 % contenus nationaux populaires
- 30 % contenus généralistes récents

---

## 7. Architecture technique

### 7.1 Vue d'ensemble

```
Application Android (Kotlin)
        │
        ▼
   API (REST + WebSocket)
        │
   ┌────┴─────┬──────────────┬──────────┬─────────────┐
   ▼          ▼              ▼          ▼             ▼
 Auth      Contenus    Recommandation  Paiements   Back-office
   │          │              │          │          ministériel
   ▼          ▼              ▼          ▼
PostgreSQL  Stockage      Moteur de   MoMo APIs
            objet + CDN   scoring     (MTN/Moov/Celtiis)
```

### 7.2 Choix techniques

| Couche | Technologie | Justification |
|---|---|---|
| Application | **Kotlin natif** | Performances sur appareils d'entrée de gamme supérieures au multiplateforme |
| API | Node.js ou Go | Écosystème, coût d'hébergement |
| Base de données | PostgreSQL | Mature, gratuit, robuste |
| Stockage vidéo | Objet compatible S3 | Coût au volume |
| Diffusion | **CDN avec point de présence en Afrique de l'Ouest** | Un CDN européen ajoute 150–250 ms de latence |
| Transcodage | FFmpeg sur file de traitement | Standard éprouvé |
| Recommandation | Service dédié : scoring par lots + ajustement temps réel | Reproduit le modèle de référence |

### 7.3 Politique vidéo

| Paramètre | Valeur |
|---|---|
| Résolutions générées | 240p, 360p, 480p, 720p |
| Par défaut en données mobiles | **360p** |
| Par défaut en Wi-Fi | 720p |
| Codec | H.264 (compatibilité maximale) |
| Débit cible 360p | ≈ 250 kbps, soit ~2 Mo/minute |
| Préchargement | 1 vidéo maximum |

### 7.4 Hébergement et souveraineté

**Pour un projet d'État, l'hébergement souverain est un critère déterminant**, au-delà de la seule conformité APDP.

| Option | Avantages | Inconvénients |
|---|---|---|
| **Data center béninois** | Souveraineté maximale, conformité totale | Coût, capacité et disponibilité à évaluer |
| **Hébergement régional** (Afrique de l'Ouest) | Compromis latence/coût | Souveraineté partielle |
| Hébergement international | Coût faible | **Incompatible avec un projet d'État** |

**Recommandation :** données personnelles et transactions hébergées au Bénin ; contenus vidéo distribués par CDN régional pour la performance.

### 7.5 Sécurité

- Chiffrement en transit (TLS 1.3) et au repos
- Authentification à deux facteurs pour les comptes administrateurs
- Journal d'audit de toutes les actions de modération
- Test d'intrusion avant la mise en production
- Plan de reprise d'activité documenté

---

## 8. Modèle économique

### 8.1 Sources de revenus

| Source | Phase | Description |
|---|---|---|
| **Publicité native** | 1 | Vidéos sponsorisées dans le fil, ciblage régional |
| **Commission sur cadeaux** | 2 | 20–30 % sur les cadeaux virtuels en live |
| **Commission commerce** | 2 | 3–5 % sur les ventes intégrées |
| **Comptes professionnels** | 2 | Statistiques avancées, abonnement |

**Un projet d'État peut également être financé par dotation budgétaire**, la publicité venant en complément. Ce point relève de l'arbitrage du ministère.

### 8.2 Reversement aux créateurs

Point différenciant majeur face à TikTok, dont le Creator Fund n'est pas disponible au Bénin.

- Seuil de retrait **bas** : 5 000 FCFA (≈ 8 €)
- Versement **en mobile money**, sans compte bancaire requis
- Base de calcul : **vues qualifiées** (≥ 50 % de la vidéo visionnée)
- Barème transparent, publié, stable

### 8.3 Postes de coût

- Bande passante CDN — poste le plus lourd, croissant avec l'usage
- Stockage et transcodage
- Équipe de modération
- Commissions des agrégateurs de paiement
- Hébergement souverain

---

## 9. Indicateurs de succès

### 9.1 Phase 1 — à 6 mois après lancement

| Indicateur | Cible |
|---|---|
| Comptes créés | 50 000 |
| Utilisateurs actifs quotidiens | 10 000 |
| Vidéos publiées par jour | 1 000 |
| Données consommées par session de 10 min | ≤ 25 Mo |
| Taille de l'APK | ≤ 30 Mo |
| Temps de démarrage de l'application | < 3 s sur Android 8 / 2 Go RAM |
| Taux de plantage | < 1 % |

### 9.2 Phase 2 — à 18 mois

| Indicateur | Cible |
|---|---|
| Utilisateurs actifs mensuels | 500 000 |
| Créateurs ayant retiré des gains | 2 000 |
| Montant total reversé | 25 M FCFA |
| Délai de traitement d'un signalement | < 4 h |
| Part de contenus en langue nationale | ≥ 25 % |

---

## 10. Planning

| Phase | Durée | Livrables |
|---|---|---|
| **0. Arbitrage juridique** | 2 semaines | Avis du service juridique sur le périmètre de reproduction (§2) |
| **1. Cadrage et conception** | 6 semaines | Maquettes complètes, design system, prototype, déclaration APDP |
| **2. Socle technique** | 8 semaines | API, authentification SMS, stockage, transcodage, CDN |
| **3. Application — consultation** | 8 semaines | Fil, lecture, interactions, profil, recherche |
| **4. Application — création** | 6 semaines | Capture, édition, publication, sons |
| **5. Recommandation** | 6 semaines | Pipeline de scoring, diffusion par vagues |
| **6. Paiement et modération** | 6 semaines | Intégration MoMo, back-office, tableau de bord ministériel |
| **7. Sécurité et recette** | 4 semaines | Test d'intrusion, corrections, documentation |
| **8. Bêta fermée** | 4 semaines | 500 testeurs, Cotonou et Parakou |
| **9. Lancement** | — | Déploiement, campagne de recrutement de créateurs |

**Durée totale estimée : 12 mois** jusqu'au lancement public.

Les phases 3 et 4 peuvent être partiellement parallélisées avec une équipe suffisante.

---

## 11. Risques

| Risque | Gravité | Réponse |
|---|---|---|
| **Contentieux sur la reproduction de l'interface** | **Élevée** | Arbitrage juridique préalable (§2), habillage original |
| **Coût de la bande passante** non soutenable | Élevée | Compression agressive, CDN régional, plafonds de qualité |
| **Effet de réseau** : pas de contenu, donc pas d'utilisateurs | Élevée | Recruter et rémunérer 100 créateurs avant le lancement public |
| **Perception d'une plateforme de surveillance** | Élevée | Transparence sur les données, gouvernance indépendante de la modération |
| **Fiabilité des API mobile money** | Moyenne | Passer par un agrégateur, prévoir un mode dégradé |
| **Régulation HAAC** évolutive | Moyenne | Dialogue anticipé, modération démontrable |
| **Modération insuffisante** | Moyenne | Recrutement local dès la bêta, journal d'audit |

---

## 12. Facteurs de réussite

1. **L'arbitrage juridique doit précéder le développement.** Découvrir un problème de propriété intellectuelle après six mois de travail coûterait le projet entier.

2. **La monétisation en mobile money doit fonctionner dès le lancement.** C'est la seule raison pour laquelle un créateur béninois publierait ici plutôt que sur TikTok, où il ne peut pas être payé.

3. **L'application doit être légère.** Sur un forfait à 15 100 FCFA, une application gourmande est désinstallée dans la semaine. La consommation de données est un critère produit, pas un détail technique.

4. **La confiance est déterminante pour un projet d'État.** Une plateforme publique sera scrutée sur la protection des données et la neutralité de la modération. La gouvernance de ces deux sujets doit être établie et rendue publique avant le lancement.

---

## Sources

- [Connectivité mobile au Bénin : 10,6 millions d'utilisateurs actifs](https://lamarinabj.com/index.php/2025/12/17/connectivite-mobile-au-benin-106-millions-dutilisateurs-actifs-recenses-au-troisieme-trimestre-2025/)
- [Bénin : 94 % de couverture Internet mobile (GSMA)](https://www.agenceecofin.com/actualites/1702-125864-benin-94-de-couverture-internet-mobile-mais-un-usage-reel-qui-peut-progresser-gsma)
- [Télécommunications au Bénin : forte progression des usages](https://lanation.bj/numerique/telecommunications-au-benin-legere-baisse-des-sim-mais-forte-progression-des-usages)
- [Paiement mobile Bénin & Togo 2026 : Moov vs MTN MoMo](https://kolonell.com/fr/blog/paiement-mobile-benin-togo-moov-mtn-comparatif-2026)
- [Une seule SIM pour MTN Mobile Money, Moov Money et Celtiis Cash](https://www.24haubenin.info/?Une-seule-SIM-pour-MTN-Mobile-Money-Moov-Money-et-Celtiis-Cash=)
- [Internet mobile au Bénin : fin des forfaits illimités](https://beninwebtv.com/internet-mobile-au-benin-colere-apres-la-fin-des-forfaits-illimites-a-5-000-et-10-000-fcfa/)
- [Loi n° 2017-20 portant code du numérique en République du Bénin](https://dataprotection.africa/wp-content/uploads/2022/09/Benin_DPA.pdf)
- [Autorité de protection des données personnelles — Lois](https://apdp.bj/lois/)
- [La HAAC annonce une régulation imminente des réseaux sociaux](https://www.les4verites.bj/la-haac-annonce-une-regulation-imminente-des-reseaux-sociaux/)
- [Algorithme TikTok 2026 : signaux et fonctionnement](https://swello.com/fr/blog/algorithme-tiktok/)
- [Algorithme TikTok 2026 : comment fonctionne la For You Page](https://www.creatorschool.fr/blog/algorithme-tiktok-2026)
