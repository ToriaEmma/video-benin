// ============================================================
// Contenu des sections encore informatives des parametres, dans
// l'ordre de l'ecran. Ce sont des donnees : elles vivent a part des
// composants pour que le rechargement a chaud de ces derniers reste
// possible.
// ============================================================

import { type Reglages } from '../lib/demo'

type Bascule = { nom: string; detail?: string; cle: keyof Reglages }

export type SectionInfo = {
  titre: string
  paragraphe: string
  groupe?: string
  bascules?: Bascule[]
  note?: string
}

// Contenu des sections encore informatives, dans l'ordre de l'ecran
// des parametres.
export const SECTIONS_INFO: Record<string, SectionInfo> = {
  "Temps d'écran et bien-être": {
    titre: "Temps d'écran et bien-être",
    paragraphe: 'Cette section réunira le temps passé chaque jour dans '
      + "l'application, une limite quotidienne à se fixer soi-même, et des "
      + 'pauses proposées au bout d’un long moment de visionnage. Le '
      + 'relevé du temps d’écran demande une mesure côté application '
      + 'qui n’est pas encore en place : rien n’est donc affiché '
      + 'plutôt qu’un chiffre inventé.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Rappels de pause',
        detail: 'Un rappel après un long moment de visionnage',
        cle: 'rappelPause' },
    ],
  },
  'Connexion Famille': {
    titre: 'Connexion Famille',
    paragraphe: 'La Connexion Famille permettra de relier ce compte à celui '
      + 'd’un parent, qui pourra alors fixer une limite de temps, '
      + 'restreindre le contenu affiché et choisir qui peut envoyer des '
      + 'messages. Le lien entre deux comptes se fera par un code à '
      + 'scanner. Aucune fonction de contrôle n’est active pour '
      + 'l’instant.',
  },
  Musique: {
    titre: 'Musique',
    paragraphe: 'Tu pourras ici relier un service de musique pour retrouver '
      + 'les sons entendus dans les vidéos, et garder une liste de ceux que '
      + 'tu as enregistrés. Les sons utilisés dans tes montages restent '
      + 'accessibles depuis l’écran de montage.',
  },
  'Boîte de réception et messagerie': {
    titre: 'Boîte de réception et messagerie',
    paragraphe: 'Cette section réglera qui peut t’envoyer un message, '
      + 'où arrivent les demandes des comptes que tu ne suis pas, et si les '
      + 'accusés de lecture sont envoyés. La boîte de réception, elle, est '
      + 'déjà utilisable depuis l’onglet « Messages ».',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Notifications de messages', cle: 'notifMessages' },
    ],
  },
  'Centre des activités': {
    titre: 'Centre des activités',
    paragraphe: 'Le centre des activités regroupera, en une seule liste, '
      + 'les j’aime, les commentaires, les mentions et les nouveaux '
      + 'abonnés. En attendant, ces activités arrivent dans l’onglet '
      + '« Messages », via le compte « Activité et nouveaux abonnés ».',
  },
  'Contrôle du public': {
    titre: 'Contrôle du public',
    paragraphe: 'Cette section servira à filtrer les commentaires sur des '
      + 'mots-clés, à mettre en sourdine des comptes, et à choisir qui peut '
      + 'commenter tes publications. Le réglage par publication existe déjà '
      + 'dans « Gérer les publications ».',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Filtrer les commentaires offensants',
        detail: 'Les commentaires signalés comme offensants sont masqués',
        cle: 'filtreCommentaires' },
    ],
  },
  Publicités: {
    titre: 'Publicités',
    paragraphe: 'Tu pourras consulter ici les thèmes utilisés pour choisir '
      + 'les publicités qui te sont montrées, et refuser qu’elles '
      + 'soient personnalisées. TockTick ne diffuse pas encore de '
      + 'publicité : ce réglage est pris d’avance.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Publicités personnalisées', cle: 'pubPersonnalisees' },
    ],
  },
  Lecture: {
    titre: 'Lecture',
    paragraphe: 'Les réglages de lecture décident si une vidéo démarre '
      + 'seule, si elle repart au début à la fin, et si le son est actif '
      + 'dès l’ouverture du fil. La vitesse de lecture et le saut des '
      + 'génériques viendront ensuite.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Lecture automatique', cle: 'lectureAuto' },
      { nom: 'Lire en boucle', cle: 'boucle' },
      { nom: 'Son au démarrage', cle: 'sonDemarrage' },
    ],
  },
  Accessibilité: {
    titre: 'Accessibilité',
    paragraphe: 'Cette section réunira les sous-titres automatiques, la '
      + 'réduction des animations et un contraste renforcé. Les sous-titres '
      + 'demandent une transcription côté serveur, qui n’est pas '
      + 'encore branchée.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Réduire les animations', cle: 'animationsReduites' },
      { nom: 'Sous-titres automatiques',
        detail: 'Dès que la transcription sera disponible',
        cle: 'sousTitresAuto' },
    ],
  },
  'Contacts et localisation': {
    titre: 'Contacts et localisation',
    paragraphe: 'La synchronisation des contacts sert à retrouver les '
      + 'personnes que tu connais déjà ; la localisation sert à proposer des '
      + 'vidéos tournées dans ton département. Aucune de ces deux '
      + 'autorisations n’est demandée pour l’instant : les activer '
      + 'ici enregistre ton accord, la demande du navigateur viendra avec '
      + 'la fonction.',
    groupe: 'Autorisations',
    bascules: [
      { nom: 'Synchroniser les contacts', cle: 'syncContacts' },
      { nom: 'Utiliser ma localisation', cle: 'localisation' },
    ],
  },
  'Vidéos hors ligne': {
    titre: 'Vidéos hors ligne',
    paragraphe: 'Les vidéos enregistrées pour une lecture sans réseau '
      + 'apparaîtront ici, avec le poids qu’elles occupent. Le '
      + 'téléchargement d’une vidéo depuis le fil n’est pas encore '
      + 'disponible, la liste est donc vide pour tout le monde.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Télécharger seulement en Wi-Fi', cle: 'telechargementWifi' },
    ],
  },
  "Centre d'aide": {
    titre: "Centre d'aide",
    paragraphe: 'Le centre d’aide rassemblera les réponses aux '
      + 'questions courantes : récupérer un compte, signaler une vidéo, '
      + 'comprendre pourquoi une publication a été retirée. En attendant, '
      + 'écris-nous à aide@tok229.bj.',
  },
  'Centre de confidentialité': {
    titre: 'Centre de confidentialité',
    paragraphe: 'Le centre de confidentialité expliquera, en français '
      + 'simple, quelles données sont enregistrées, pourquoi, et comment en '
      + 'demander une copie ou la suppression. Pour mémoire, cette version '
      + 'de démonstration garde tes données dans ton navigateur seulement.',
  },
  'Conditions et politiques': {
    titre: 'Conditions et politiques',
    paragraphe: 'Les conditions d’utilisation, les règles de la '
      + 'communauté et la politique de confidentialité seront publiées ici. '
      + 'Elles sont en cours de rédaction : aucun texte n’est affiché '
      + 'plutôt qu’un texte provisoire qui n’engagerait personne.',
  },
}
