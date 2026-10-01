# Monétisation créateur et intégration Mobile Money

**Projet :** Plateforme nationale de vidéo courte
**Version :** 1.0 — 29 septembre 2026
**Destinataires :** équipe produit, développeurs back-end, direction financière

---

## 1. Pourquoi ce volet est décisif

Le Creator Fund de TikTok **n'est pas disponible au Bénin**. Un créateur béninois peut accumuler des millions de vues sans percevoir un franc de la plateforme.

C'est le seul levier qui justifie qu'un créateur publie ici plutôt que sur TikTok. Aucune fonctionnalité, aucun filtre, aucune amélioration de design ne pèse autant qu'un premier retrait de 5 000 FCFA reçu sur son téléphone.

**Conséquence :** la monétisation n'est pas une fonctionnalité de phase 2. Elle doit fonctionner le jour du lancement.

---

## 2. La vue qualifiée

### 2.1 Définition

Une vue est **qualifiée** — donc rémunérée — si elle satisfait **toutes** les conditions suivantes :

| Condition | Seuil | Raison |
|---|---|---|
| Durée visionnée | ≥ 50 % de la vidéo, ou ≥ 10 s si la vidéo dépasse 20 s | Écarte les défilements rapides |
| Compte spectateur | Créé depuis > 48 h, vérifié par SMS | Freine les fermes à comptes |
| Unicité | 1 vue qualifiée par spectateur et par vidéo, par période de 24 h | Empêche le revisionnage en boucle |
| Origine | Trafic non signalé comme frauduleux | Protection du budget |

### 2.2 Ce qui ne compte pas

- Les vues du créateur sur ses propres vidéos
- Les vues provenant d'un même appareil sur plusieurs comptes
- Les vues pendant une période de contestation de contenu
- Les vues sur contenu ultérieurement retiré pour violation

---

## 3. Barème de rémunération

### 3.1 Principe : une enveloppe partagée

Le modèle **par mille vues à taux fixe** est écarté : il expose à une dérive budgétaire incontrôlable en cas de croissance rapide.

Le modèle retenu est une **enveloppe mensuelle fermée, répartie au prorata**.

```
Gain du créateur = (Ses vues qualifiées / Total des vues qualifiées) × Enveloppe du mois
```

**Avantages :** budget maîtrisé par construction, aucune dépense imprévue, ajustable mensuellement.

**Inconvénient :** le revenu par vue varie d'un mois à l'autre. Il doit être communiqué avec transparence.

### 3.2 Enveloppe indicative

| Phase | Enveloppe mensuelle | Hypothèse d'usage |
|---|---|---|
| Lancement (mois 1-3) | 3 000 000 FCFA | 20 M de vues qualifiées |
| Croissance (mois 4-12) | 8 000 000 FCFA | 80 M de vues qualifiées |
| Régime (an 2) | 20 000 000 FCFA | 250 M de vues qualifiées |

**Revenu implicite pour 1 000 vues qualifiées :**

| Phase | Estimation |
|---|---|
| Lancement | ≈ 150 FCFA |
| Croissance | ≈ 100 FCFA |
| Régime | ≈ 80 FCFA |

À titre de repère, TikTok rémunère entre 20 et 40 FCFA pour 1 000 vues dans les pays éligibles. **L'offre proposée est donc nettement supérieure**, ce qui est cohérent avec un objectif d'amorçage.

### 3.3 Bonus qualitatifs

Une fraction de l'enveloppe (15 %) est réservée à des bonus, pour orienter la production sans fausser le barème principal.

| Bonus | Montant | Condition |
|---|---|---|
| Contenu en langue nationale | +25 % sur les vues concernées | Langue déclarée et vérifiée par échantillon |
| Contenu éducatif ou de service | Forfait 10 000 FCFA | Validation par un comité éditorial |
| Créateur émergent | +50 % le premier mois | Compte de moins de 30 jours |

### 3.4 Éligibilité du créateur

| Critère | Seuil |
|---|---|
| Âge | 18 ans révolus |
| Compte | Vérifié par SMS, actif depuis > 30 jours |
| Abonnés | ≥ 500 |
| Vues qualifiées cumulées | ≥ 10 000 sur 30 jours glissants |
| Conformité | Aucune sanction de modération active |

---

## 4. Le retrait

### 4.1 Paramètres

| Paramètre | Valeur | Justification |
|---|---|---|
| **Seuil minimum** | 5 000 FCFA | ≈ 8 € — atteignable par un créateur débutant |
| Plafond par opération | 200 000 FCFA | Limites mobile money et contrôle des risques |
| Fréquence | 1 retrait par semaine | Maîtrise des coûts de transaction |
| Délai de versement | 24 à 72 h ouvrées | Traitement par lots |
| Frais à la charge du créateur | **Aucun** | Argument commercial décisif |

Les frais d'opérateur sont supportés par la plateforme et intégrés au budget.

### 4.2 Parcours de retrait

```
1. Solde          2. Opérateur       3. Montant        4. Confirmation
┌────────────┐   ┌────────────┐    ┌────────────┐   ┌────────────┐
│ 12 450 FCFA│   │ ○ MTN MoMo │    │   [10 000] │   │ 10 000 FCFA│
│            │   │ ○ Moov     │    │ Min 5 000  │   │ vers MTN   │
│ [Retirer]  │   │ ○ Celtiis  │    │ Max 12 450 │   │ 01 XX XX XX│
└────────────┘   └────────────┘    └────────────┘   │ Frais : 0  │
                                                     │[ Valider ] │
                                                     └────────────┘
                                                            │
                                                     5. Code SMS
                                                     ┌────────────┐
                                                     │ □ □ □ □ □ □│
                                                     └────────────┘
```

**Règle de transparence :** le montant exact que le créateur recevra est affiché **avant** validation. Aucun frais découvert après coup.

---

## 5. Intégration Mobile Money

### 5.1 Le marché

| Opérateur | Parts de marché | Comptes actifs | Part des transactions |
|---|---|---|---|
| **MTN MoMo** | ~45 % | ~5 M | ~55 % |
| **Moov Money** | ~35 % | ~4 M | — |
| **Celtiis Cash** | Reste | — | — |

Total : **~9 millions de comptes actifs** pour 14 millions d'habitants.

**Les trois opérateurs doivent être intégrés dès le lancement.** Omettre Moov exclurait un tiers des créateurs, notamment en zone rurale où sa pénétration est forte.

### 5.2 Choix d'architecture : agrégateur ou intégration directe

| Critère | Agrégateur | Intégration directe |
|---|---|---|
| Délai de mise en œuvre | 2-4 semaines | 3-6 mois par opérateur |
| Interlocuteur | Unique | Trois conventions distinctes |
| Commission | 1,5 à 3 % | Négociable, plus faible à volume |
| Contrôle | Limité | Total |
| Dépendance | Un tiers critique | Aucune |

**Recommandation :** démarrer avec un **agrégateur** (délai et simplicité), puis basculer en intégration directe à partir d'un volume significatif — au-delà de 50 M FCFA reversés par an, l'économie de commission justifie l'investissement.

Agrégateurs opérant au Bénin à consulter : PayDunya, KkiaPay, FedaPay, Semoa.

### 5.3 Flux technique

```
Créateur                Plateforme              Agrégateur         Opérateur
   │                        │                       │                  │
   ├─ Demande retrait ─────►│                       │                  │
   │                        ├─ Vérifie solde        │                  │
   │                        ├─ Vérifie éligibilité  │                  │
   │◄─ Code SMS ────────────┤                       │                  │
   ├─ Saisit le code ──────►│                       │                  │
   │                        ├─ Bloque le montant    │                  │
   │                        ├─ POST /disbursement ─►│                  │
   │                        │                       ├─ Transfert ─────►│
   │                        │◄─ Accusé (async) ─────┤                  │
   │                        ├─ Débite le solde      │                  │
   │◄─ Notification ────────┤                       │                  │
   │                        │◄─ Webhook confirmation ┤                 │
   │                        ├─ Clôture l'opération  │                  │
```

### 5.4 Gestion des échecs

Les API mobile money béninoises connaissent des indisponibilités. Le système doit les absorber sans perte.

| Cas | Traitement |
|---|---|
| Timeout de l'agrégateur | Nouvelle tentative à 1 min, 5 min, 15 min |
| Échec après 3 tentatives | Montant recrédité, créateur notifié, opération journalisée |
| Webhook non reçu sous 1 h | Interrogation active du statut |
| Numéro invalide | Rejet immédiat avant blocage du montant |
| Opérateur indisponible | File d'attente, traitement différé, information du créateur |
| Double soumission | Clé d'idempotence obligatoire sur chaque opération |

**Règle absolue :** aucun débit de solde sans confirmation du versement. En cas de doute, le montant reste au créateur.

### 5.5 Exigences de sécurité

- **Idempotence** sur toutes les opérations de versement
- **Journal d'audit** inaltérable : qui, quand, combien, vers quel numéro
- **Double validation** humaine au-delà de 100 000 FCFA
- **Plafond quotidien** global, avec alerte au dépassement
- **Rapprochement quotidien** entre les soldes internes et les relevés opérateurs
- Détection d'anomalies : pics de vues, comptes liés, retraits en rafale

---

## 6. Prévention de la fraude

### 6.1 Schémas de fraude anticipés

| Schéma | Détection | Réponse |
|---|---|---|
| Fermes à comptes | Empreinte d'appareil, adresse IP, cadence de création | Blocage et invalidation des vues |
| Vues automatisées | Régularité des durées, absence d'interaction | Invalidation, suspension du créateur |
| Réseaux d'échange de vues | Analyse du graphe social, réciprocité anormale | Réduction de la pondération |
| Contenu volé | Empreinte numérique des vidéos | Retrait, non-rémunération |
| Comptes multiples | Corrélation appareil et numéro | Fusion ou suspension |

### 6.2 Période de latence

Les gains ne sont **disponibles qu'après 14 jours**. Ce délai permet :
- la détection de fraude a posteriori,
- le traitement des signalements de contenu,
- la vérification des pics d'audience suspects.

Le solde affiche donc deux montants : **disponible** et **en attente**.

---

## 7. Conformité

### 7.1 Obligations fiscales

| Sujet | Traitement |
|---|---|
| Statut des sommes versées | Revenus non salariaux |
| Déclaration | Attestation annuelle fournie au créateur |
| Retenue à la source | **À trancher avec la direction des impôts** |
| Seuil de déclaration | À déterminer selon la réglementation |

**Ce point doit être arbitré avant le lancement.** Un projet d'État ne peut pas verser des revenus sans cadre fiscal établi.

### 7.2 Protection des données

Conformément au **Code du numérique (loi n° 2017-20)** :
- Les données financières sont hébergées **au Bénin**
- Conservation limitée à la durée légale des obligations comptables
- Consentement explicite pour le traitement des données de paiement
- Déclaration du traitement auprès de l'**APDP**

### 7.3 Lutte contre le blanchiment

- Vérification d'identité renforcée au-delà de 500 000 FCFA cumulés par mois
- Signalement des opérations atypiques
- Conservation des justificatifs selon la réglementation BCEAO

---

## 8. Indicateurs de pilotage

| Indicateur | Cible à 6 mois | Cible à 18 mois |
|---|---|---|
| Créateurs éligibles | 500 | 5 000 |
| Créateurs ayant retiré | 200 | 2 000 |
| Montant total reversé | 5 M FCFA | 25 M FCFA |
| Retrait moyen | 8 000 FCFA | 12 000 FCFA |
| Taux d'échec des versements | < 2 % | < 1 % |
| Délai moyen de versement | < 48 h | < 24 h |
| Part des vues invalidées pour fraude | < 5 % | < 3 % |

---

## 9. Plan de mise en œuvre

| Étape | Durée | Contenu |
|---|---|---|
| 1. Arbitrage fiscal | 3 semaines | Cadre fiscal validé avec la direction des impôts |
| 2. Sélection de l'agrégateur | 2 semaines | Appel d'offres, tests des API |
| 3. Moteur de comptage | 4 semaines | Vue qualifiée, agrégation, anti-fraude |
| 4. Intégration paiement | 4 semaines | Versements, webhooks, reprises sur erreur |
| 5. Interfaces | 3 semaines | Tableau de bord créateur, parcours de retrait |
| 6. Back-office | 3 semaines | Validation, rapprochement, audit |
| 7. Recette | 2 semaines | Tests avec 20 créateurs pilotes, montants réels |

**Total : 12 semaines**, à mener en parallèle du développement de l'application.

---

## 10. Points à trancher

Ces décisions relèvent du ministère et conditionnent la mise en œuvre.

1. **Cadre fiscal** — retenue à la source ou déclaration par le créateur ?
2. **Enveloppe mensuelle** — montant et source budgétaire (dotation, recettes publicitaires, mixte) ?
3. **Comité éditorial** — qui valide les bonus « contenu éducatif » ?
4. **Seuil de vérification d'identité renforcée** — 500 000 FCFA est une proposition, à confirmer avec la BCEAO.
5. **Agrégateur ou intégration directe** — la recommandation est l'agrégateur, à valider selon les conventions déjà détenues par l'État.

---

## Sources

- [Paiement mobile Bénin & Togo 2026 : Moov vs MTN MoMo](https://kolonell.com/fr/blog/paiement-mobile-benin-togo-moov-mtn-comparatif-2026)
- [Une seule SIM pour MTN Mobile Money, Moov Money et Celtiis Cash](https://www.24haubenin.info/?Une-seule-SIM-pour-MTN-Mobile-Money-Moov-Money-et-Celtiis-Cash=)
- [Plafonds mobile money au Bénin en 2026](https://kolonell.com/fr/blog/plafonds-limites-mobile-money-transaction-benin-2026)
- [Loi n° 2017-20 portant code du numérique en République du Bénin](https://dataprotection.africa/wp-content/uploads/2022/09/Benin_DPA.pdf)
- [Partenaires PayDunya](https://paydunya.com/partners)
