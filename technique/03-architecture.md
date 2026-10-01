# Architecture technique

**Projet :** Plateforme nationale de vidéo courte
**Version :** 1.0 — 29 septembre 2026
**Destinataires :** architectes, développeurs, responsable infrastructure

---

## 1. Principe directeur

Toute décision technique de ce projet est arbitrée par une contrainte : **le coût des données pour l'utilisateur final**.

Avec un mégaoctet à 1,2–3,1 FCFA et un premier forfait mensuel à 15 100 FCFA, une application qui consomme sans mesure est désinstallée en une semaine. La bande passante est également le premier poste de coût de la plateforme.

**Règle :** à chaque choix, l'option la plus économe en octets l'emporte, sauf dégradation manifeste de l'expérience.

---

## 2. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                  Application Android                    │
│                      (Kotlin)                           │
│   Lecteur ExoPlayer · Cache local · File d'envoi        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Passerelle API                       │
│        Authentification · Limitation de débit           │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┘
   ▼          ▼          ▼          ▼          ▼
┌──────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Auth │  │Contenus│ │Recomm. │ │Paiement│ │Modération│
└──┬───┘  └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
   │          │          │          │           │
   ▼          ▼          ▼          ▼           ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL  │  Redis  │  Stockage objet  │  File Kafka │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  CDN régional   │
                │ Afrique Ouest   │
                └─────────────────┘
```

---

## 3. Application Android

### 3.1 Choix : Kotlin natif

| Option | Verdict | Motif |
|---|---|---|
| **Kotlin natif** | **Retenu** | Contrôle fin de la mémoire et du décodage vidéo ; indispensable sur 2 Go de RAM |
| Flutter | Écarté | Surcoût mémoire, intégration vidéo moins fine |
| React Native | Écarté | Performances insuffisantes pour un fil vidéo continu |

### 3.2 Budget de performance — contraintes de recette

| Métrique | Plafond | Mesure |
|---|---|---|
| Taille de l'APK | **30 Mo** | Bundle Android, hors ressources dynamiques |
| Démarrage à froid | **3 s** | Android 8, 2 Go RAM, appareil de référence |
| Mémoire en fil | **180 Mo** | Pic observé sur 10 min de défilement |
| Images perdues | **< 1 %** | Défilement continu |
| Consommation | **≤ 25 Mo** | Session de 10 min en mode économie |

Un appareil de référence doit être défini dès le cadrage — proposition : **Tecno Spark ou Infinix Hot**, gammes dominantes au Bénin.

### 3.3 Lecture vidéo

**ExoPlayer** (Media3) avec configuration dédiée :

| Paramètre | Valeur | Raison |
|---|---|---|
| Préchargement | **1 vidéo suivante** | Compromis fluidité/données |
| Tampon minimum | 2 s | Démarrage rapide |
| Tampon maximum | 8 s | Évite de télécharger une vidéo abandonnée |
| Sélection de piste | Adaptative, plafonnée par le mode économie | Respect du réglage utilisateur |
| Réutilisation | Pool de 3 instances | Évite les créations répétées |

**Comportement de défilement rapide :** si l'utilisateur enchaîne plus de 3 vidéos en moins de 2 s, le préchargement est suspendu — inutile de télécharger ce qui ne sera pas regardé.

### 3.4 Cache local

| Type | Volume | Politique |
|---|---|---|
| Vidéos | 200 Mo | Éviction LRU |
| Vignettes | 50 Mo | LRU |
| Téléchargements | Illimité | Suppression manuelle |

---

## 4. Chaîne vidéo

### 4.1 Envoi

```
Appareil                      Serveur
   │                             │
   ├─ Compression locale ────────┤  720p max, H.264, ≈ 2 Mo/min
   ├─ Demande d'URL signée ─────►│
   │◄─ URL directe ──────────────┤
   ├─ Envoi par blocs ──────────►│  Reprise possible
   │                             ├─ Vérification (durée, format, taille)
   │                             ├─ Mise en file de transcodage
   │◄─ Accusé + identifiant ─────┤
```

**La compression locale est obligatoire.** Envoyer une vidéo brute de 50 Mo depuis un forfait limité est inacceptable. L'application compresse avant l'envoi.

**Envoi par blocs de 1 Mo** avec reprise : sur une connexion instable, un envoi interrompu à 80 % ne repart pas de zéro.

### 4.2 Transcodage

| Profil | Résolution | Débit | Usage |
|---|---|---|---|
| Très bas | 240p | 120 kbps | Connexion dégradée |
| **Standard** | **360p** | **250 kbps** | **Défaut en données mobiles** |
| Moyen | 480p | 500 kbps | Bonne 4G |
| Haut | 720p | 1 200 kbps | Wi-Fi |

**Codec :** H.264 baseline — décodage matériel garanti sur tout Android 8+. AV1 écarté en phase 1 (décodage logiciel trop coûteux sur appareils d'entrée de gamme).

**Format de diffusion :** HLS avec segments de 2 s, permettant la bascule de qualité en cours de lecture.

**Vignette :** extraite à 1 s, en WebP, ≈ 15 Ko.

### 4.3 Coût de la bande passante — estimation

| Scénario | Calcul | Volume mensuel |
|---|---|---|
| 10 000 utilisateurs actifs/jour | 10 min/jour à 2,5 Mo/min | 7,5 To |
| 50 000 utilisateurs actifs/jour | idem | 37,5 To |

**Ce poste est le premier centre de coût.** Il justifie à lui seul le plafonnement à 360p par défaut : passer tout le trafic en 720p multiplierait la facture par 4,8.

---

## 5. Diffusion et hébergement

### 5.1 Latence

Un CDN européen ajoute **150 à 250 ms** de latence depuis le Bénin. Sur un fil vidéo, cela se traduit par un délai de démarrage perceptible à chaque vidéo.

**Exigence : point de présence en Afrique de l'Ouest.** Options à évaluer : Cloudflare (PoP à Lagos et Accra), AWS CloudFront (Lagos), ou opérateur régional.

### 5.2 Répartition hébergement / souveraineté

Pour un projet d'État, la localisation des données est un critère politique autant que technique.

| Donnée | Localisation | Motif |
|---|---|---|
| **Comptes, identités** | **Bénin** | Souveraineté, Code du numérique |
| **Transactions financières** | **Bénin** | Obligations comptables et BCEAO |
| **Journaux de modération** | **Bénin** | Redevabilité publique |
| Fichiers vidéo | CDN régional | Performance ; ce sont des contenus publics |
| Vignettes, sons | CDN régional | Idem |

Cette répartition concilie souveraineté sur les données sensibles et performance sur les contenus publics.

---

## 6. Moteur de recommandation

### 6.1 Pipeline en six étapes

Reproduction de l'architecture de référence :

```
1. Candidats      → 500 à 1 000 vidéos présélectionnées
2. Sécurité       → retrait des contenus interdits ou signalés
3. Scoring        → prédiction du comportement, classement
4. Diversification→ pas deux vidéos trop proches à la suite
5. Mix            → assemblage, insertion des contenus sponsorisés
6. Ajustement     → réordonnancement sur l'appareil
```

### 6.2 Étape 1 — sélection des candidats

| Source | Part | Contenu |
|---|---|---|
| Département de l'utilisateur | 30 % | Contenus géolocalisés |
| Affinités passées | 30 % | Hashtags, sons, créateurs consommés |
| Abonnements | 15 % | Créateurs suivis |
| Exploration | 15 % | Contenus récents peu diffusés |
| Tendances nationales | 10 % | Popularité globale |

### 6.3 Étape 3 — scoring

Signaux et pondérations indicatives, à calibrer sur données réelles :

| Signal | Poids |
|---|---|
| Taux de complétion prédit | 0,40 |
| Probabilité d'interaction | 0,25 |
| Affinité créateur | 0,15 |
| Fraîcheur | 0,10 |
| Proximité géographique | 0,10 |

**Normalisation par la durée :** une vidéo de 20 s vue entièrement obtient le même score de complétion qu'une de 60 s vue entièrement. Sans cette correction, l'algorithme favoriserait les vidéos courtes — donc les formats les moins coûteux en données mais aussi les moins substantiels.

### 6.4 Étape 4 — diversification

| Règle | Contrainte |
|---|---|
| Même créateur | Pas plus d'une vidéo sur 8 |
| Même son | Pas plus d'une vidéo sur 5 |
| Même hashtag principal | Pas plus de deux sur 10 |
| Contenu sponsorisé | 1 sur 10 maximum, identifié |

### 6.5 Diffusion par vagues

```
Publication → 200 vues → 2 000 → 20 000 → national
```

Le passage d'un palier au suivant dépend du taux de complétion et du taux d'interaction observés sur le palier précédent. Ce mécanisme est **essentiel** : il permet à un compte sans audience d'émerger, ce qui est la principale raison de publier sur la plateforme.

### 6.6 Mise en œuvre progressive

| Étape | Approche | Échéance |
|---|---|---|
| Lancement | Règles explicites, pondérations fixes | Phase 1 |
| Mois 3-6 | Calibrage sur données réelles | Phase 1 |
| Phase 2 | Modèle appris (gradient boosting) | Phase 2 |

**Ne pas construire un modèle d'apprentissage avant d'avoir des données.** Un système à règles bien calibré suffit largement au lancement et reste explicable — argument non négligeable pour un projet public.

---

## 7. Base de données

### 7.1 Modèle principal

```
utilisateurs ──┬── videos ──┬── vues
               │            ├── likes
               │            ├── commentaires
               │            └── signalements
               ├── abonnements
               ├── soldes ── transactions
               └── appareils
```

### 7.2 Choix de stockage

| Donnée | Système | Motif |
|---|---|---|
| Comptes, vidéos, relations | PostgreSQL | Relationnel, transactions ACID |
| Compteurs (vues, likes) | Redis + persistance périodique | Écriture très fréquente |
| Sessions | Redis | Volatil |
| Événements (vues, interactions) | Kafka → entrepôt | Volume élevé, traitement différé |
| Recherche | PostgreSQL full-text puis moteur dédié | Suffisant au lancement |

### 7.3 Volumétrie projetée à 18 mois

| Table | Lignes | Croissance |
|---|---|---|
| utilisateurs | 500 000 | — |
| videos | 5 000 000 | 15 000/jour |
| vues | 2 000 000 000 | 6 M/jour |
| likes | 200 000 000 | — |

La table des vues impose un **partitionnement mensuel** et une agrégation quotidienne, avec purge du détail après 90 jours.

---

## 8. Sécurité

### 8.1 Exigences

| Domaine | Mesure |
|---|---|
| Transport | TLS 1.3 obligatoire, HSTS |
| Stockage | Chiffrement au repos des données personnelles |
| Authentification | Jeton court (15 min) + jeton de rafraîchissement |
| Comptes administrateurs | Double facteur obligatoire |
| API | Limitation de débit par compte et par IP |
| Envois | Analyse antivirale, vérification du type réel |
| Journalisation | Audit inaltérable des actions de modération et de paiement |

### 8.2 Avant mise en production

- **Test d'intrusion** par un tiers indépendant
- Revue de code de sécurité sur les modules paiement et authentification
- Plan de reprise d'activité documenté et testé
- Procédure de notification de violation de données (obligation APDP)

---

## 9. Modération — outillage

### 9.1 Chaîne de traitement

```
Publication
    │
    ├─ Analyse automatique ──► Rejet immédiat si score > seuil
    │                          (nudité, violence explicite)
    ├─ Publication
    │
    └─ Signalement utilisateur ──► File de modération humaine
                                        │
                                   ┌────┴────┐
                                Retrait   Maintien
                                   │
                              Notification + recours
```

### 9.2 Back-office

| Fonction | Priorité |
|---|---|
| File de signalements, triée par gravité | P0 |
| Lecture du contenu avec contexte | P0 |
| Actions : retirer, avertir, suspendre, ignorer | P0 |
| Motif obligatoire pour chaque décision | P0 |
| Historique par créateur | P0 |
| Statistiques de modération | P1 |
| Traitement par lot | P1 |

### 9.3 Exigence de redevabilité

Pour un projet d'État, chaque décision de modération doit être **justifiée, journalisée et contestable**. Le journal d'audit est inaltérable et conservé selon la durée légale.

---

## 10. Observabilité

| Type | Outil | Usage |
|---|---|---|
| Métriques | Prometheus + Grafana | Santé du système |
| Journaux | Centralisation | Investigation |
| Traces | OpenTelemetry | Latence des requêtes |
| Erreurs applicatives | Sentry ou équivalent | Plantages Android |

**Tableaux de bord prioritaires :** consommation de bande passante, taux d'échec des paiements, latence du fil, taux de plantage par modèle d'appareil.

---

## 11. Environnements et livraison

| Environnement | Usage |
|---|---|
| Développement | Local, données factices |
| Recette | Réplique, données anonymisées |
| Production | Bénin + CDN régional |

**Chaîne d'intégration :** tests automatisés, analyse statique, construction de l'APK, déploiement progressif (5 % → 25 % → 100 %).

---

## 12. Plan de charge

| Lot | Durée | Équipe |
|---|---|---|
| Socle : API, auth, stockage | 8 sem. | 2 back-end |
| Chaîne vidéo : envoi, transcodage, CDN | 6 sem. | 1 back-end, 1 infra |
| Application : fil et lecture | 8 sem. | 2 Android |
| Application : création | 6 sem. | 2 Android |
| Recommandation | 6 sem. | 1 back-end, 1 données |
| Paiement | 4 sem. | 1 back-end |
| Modération et back-office | 4 sem. | 1 full-stack |
| Sécurité et recette | 4 sem. | Toute l'équipe |

**Équipe cible :** 3 back-end, 2 Android, 1 infrastructure, 1 données, 1 full-stack, 1 designer, 1 chef de produit — **10 personnes**.

---

## 13. Décisions à prendre

| Sujet | Options | Recommandation |
|---|---|---|
| Hébergement souverain | Data center béninois / régional | **Béninois pour les données sensibles** |
| CDN | Cloudflare / CloudFront / régional | À arbitrer sur devis, PoP Afrique de l'Ouest impératif |
| Agrégateur de paiement | PayDunya / KkiaPay / FedaPay / Semoa | Appel d'offres |
| Appareil de référence | — | Tecno Spark ou Infinix Hot, à confirmer |
| Langue du back-end | Node.js / Go | Go si l'équipe le maîtrise (coût serveur moindre) |

---

## Sources

- [Internet mobile au Bénin : fin des forfaits illimités](https://beninwebtv.com/internet-mobile-au-benin-colere-apres-la-fin-des-forfaits-illimites-a-5-000-et-10-000-fcfa/)
- [Connectivité mobile au Bénin : 10,6 millions d'utilisateurs actifs](https://lamarinabj.com/index.php/2025/12/17/connectivite-mobile-au-benin-106-millions-dutilisateurs-actifs-recenses-au-troisieme-trimestre-2025/)
- [Loi n° 2017-20 portant code du numérique en République du Bénin](https://dataprotection.africa/wp-content/uploads/2022/09/Benin_DPA.pdf)
- [Algorithme TikTok 2026 : signaux et fonctionnement](https://swello.com/fr/blog/algorithme-tiktok/)
