// Jeu de couleurs partage avec la version web : ce sont les variables
// `:root` de app/src/index.css, reprises a l'identique pour que les deux
// plateformes affichent rigoureusement les memes teintes.
export const couleurs = {
  fond: '#000000',
  surface: '#161616',
  surfaceHaute: '#232323',
  texte: '#ffffff',
  texteAttenue: 'rgba(255,255,255,.62)',
  bordure: 'rgba(255,255,255,.12)',

  // Accent unique de l'application : le rose, deja porte par les boutons
  // d'action et les compteurs. Le jaune reste pour les etats chauds.
  accent: '#ff2856',
  accentChaud: '#fcd116',
  danger: '#e8334a',
} as const

// Les ecrans clairs (profil, parametres, messages) renversent le theme :
// la version web le fait en redefinissant les memes variables sur
// `.page-profil`, on reprend donc ses valeurs ici.
export const couleursClaires = {
  fond: '#ffffff',
  surface: '#f5f5f5',
  surfaceHaute: '#f2f2f2',
  texte: '#111111',
  texteAttenue: '#888888',
  bordure: '#e8e8e8',
  rose: '#ff2856',
} as const

// ------------------------------------------------------------
// Echelle de tailles des feuilles de publication.
//
// Les feuilles (« Ajouter un lien », « Qui peut voir cette publication »,
// « Plus d'options », « Partager sur ») partagent une meme grille : sans
// elle, chaque feuille derive et les textes finissent par ne plus
// s'accorder d'un ecran a l'autre. Les valeurs sont mesurees sur les
// captures de reference, ramenees en points pour un ecran de 393 pt.
//
// Toute nouvelle feuille se cale sur ces constantes, jamais sur des
// nombres ecrits a la main.
// ------------------------------------------------------------
export const feuille = {
  // Tailles de texte
  titre: 16.5,        // le titre centre en haut de la feuille
  intro: 12.5,        // le paragraphe d'explication sous le titre
  entree: 15,         // le libelle d'une ligne (nom d'app, « Tout le monde »)
  description: 11.5,  // le detail gris sous un libelle
  section: 13,        // « Paramètres de confidentialité »
  valeur: 13,         // la valeur grise a droite d'une ligne (« Fr »)

  // Icones
  icone: 21,          // l'icone au debut d'une ligne
  pastille: 33,       // la vignette ronde ou carree d'une application
  chevron: 16,        // le chevron de fin de ligne
  rond: 22,           // le bouton rond de choix, a droite

  // Espacements
  marge: 16,          // la marge laterale d'une feuille
  interligne: 14,     // l'ecart entre l'icone et le texte
  hauteurLigne: 13,   // le retrait vertical d'une ligne
} as const
