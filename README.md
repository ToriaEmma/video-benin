# Plateforme nationale de vidéo courte — Bénin

Dossier de conception. Commande ministérielle : reproduire l'expérience TikTok, adaptée au marché béninois.

---

## Documents

| Fichier | Contenu | Pour qui |
|---|---|---|
| [cahier-des-charges.md](cahier-des-charges.md) | Cadrage général, contexte, périmètre, planning, risques | Décideurs, chefs de projet |
| [specs/01-ecrans.md](specs/01-ecrans.md) | Chaque écran, geste et état, avec priorités | Designers, développeurs Android |
| [specs/02-monetisation.md](specs/02-monetisation.md) | Barème créateur, retrait Mobile Money, anti-fraude | Produit, back-end, direction financière |
| [technique/03-architecture.md](technique/03-architecture.md) | Stack, chaîne vidéo, recommandation, sécurité | Architectes, développeurs, infra |

---

## Le projet en bref

**Phase 1 (mois 1-10)** — reproduction de l'expérience TikTok : fil vertical, création, recommandation, monétisation en mobile money.

**Phase 2 (mois 11-18)** — améliorations : design propre, langues nationales, commerce local, live, iOS.

---

## Les quatre contraintes qui structurent tout

1. **Le coût des données.** Forfait mensuel minimum à 15 100 FCFA, mégaoctet entre 1,2 et 3,1 FCFA. Cible : ≤ 2 Mo par minute de vidéo, 360p par défaut, mode économie actif d'emblée.

2. **Le parc d'appareils.** Android d'entrée de gamme majoritaire. APK sous 30 Mo, fluidité garantie sur Android 8 avec 2 Go de RAM.

3. **Le cadre légal.** Code du numérique (loi 2017-20), déclaration APDP obligatoire, régulation HAAC annoncée pour les créateurs.

4. **Le paiement.** 9 millions de comptes mobile money pour 14 millions d'habitants. MTN, Moov et Celtiis à intégrer tous les trois.

---

## Trois points à trancher avant de démarrer

### 1. Arbitrage juridique — bloquant

Reproduire fidèlement l'interface de TikTok expose à un risque de contentieux : droit d'auteur sur l'agencement, marques déposées, brevets de design détenus par ByteDance.

**La parade** : garder structure, parcours et gestes identiques — ce qui n'est pas protégeable, Reels et Shorts font de même — avec un nom, un logo, des couleurs et des icônes originaux. L'utilisateur retrouve ses repères, le ministère ne s'expose pas.

Cet arbitrage doit précéder la première ligne de code. Le découvrir après six mois coûterait le projet.

### 2. Cadre fiscal — bloquant pour la monétisation

Retenue à la source ou déclaration par le créateur ? Un projet d'État ne peut pas verser des revenus sans cadre établi avec la direction des impôts.

### 3. Enveloppe budgétaire

Le modèle retenu est une enveloppe mensuelle fermée, répartie au prorata des vues qualifiées. Montant et source (dotation, recettes publicitaires, mixte) à décider.

---

## Ce qui fera le succès ou l'échec

**La monétisation doit fonctionner dès le premier jour.** Le Creator Fund de TikTok n'existe pas au Bénin : un créateur y accumule des millions de vues sans percevoir un franc. Un retrait de 5 000 FCFA reçu sur son téléphone pèse plus lourd que n'importe quelle fonctionnalité.

**L'application doit être légère.** Sur un forfait à 15 100 FCFA, une application gourmande est désinstallée dans la semaine.

**La confiance est déterminante.** Une plateforme publique sera scrutée sur la protection des données et la neutralité de la modération. La gouvernance de ces deux sujets doit être publique avant le lancement.

---

*Version 1.0 — 29 septembre 2026*
