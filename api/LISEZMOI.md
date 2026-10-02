# API Tok 229

Service entre l'application et la base Neon. Il garde la chaine de
connexion cote serveur : embarquee dans l'application, elle serait
extractible du paquet installe.

## Mise en route

```sh
cp .env.exemple .env   # puis renseigner DATABASE_URL et JWT_SECRET
npm install
npm run schema         # cree les dix tables, se relance sans risque
npm start              # ecoute sur le port 4000
```

## Variables

| Nom | Role |
| --- | --- |
| `DATABASE_URL` | chaine de connexion Neon, version *pooler* |
| `JWT_SECRET` | secret de signature des jetons de session |
| `PORT` | port d'ecoute en local, 4000 par defaut |

En hebergement sans serveur, prendre la chaine *pooler* : chaque
requete y ouvre une instance, et les connexions directes seraient
vite epuisees.

## Verifier

`GET /sante` repond `{"ok":true}` des que le service tourne. Les
routes qui touchent la base echouent tant que `DATABASE_URL` manque.
