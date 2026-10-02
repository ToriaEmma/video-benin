// ============================================================
// Jeu d'icones original, en SVG inline.
//
// Les emojis ont ete ecartes : leur rendu depend de la police systeme, ils
// varient entre Android et iOS, et ils ne suivent pas la couleur du texte.
// Ces traces heritent de currentColor et restent nets a toute taille.
//
// Dessins originaux : voir section 2 du cahier des charges sur le risque
// juridique lie a la reproduction des elements de marque de TikTok.
// ============================================================

type Props = {
  taille?: number
  plein?: boolean
  className?: string
}

const base = (taille: number) => ({
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/* ---------- Navigation ---------- */

export const Amis = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><circle cx="9" cy="7" r="3.5"/><path d="M1 20v-2c0-3.2 3.6-5 8-5s8 1.8 8 5v2c-5 1-11 1-16 0ZM17 4a3 3 0 1 1 0 6m2 3c3 0 4 2 4 4v3h-3"/></svg>
)

export const Messages = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><path d="M6 3h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-6l-6 4v-4a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><path d="M8 10h8M8 14h5"/></svg>
)

export const Accueil = ({ taille = 24, plein = false }: Props) => (
  <svg {...base(taille)} fill={plein ? 'currentColor' : 'none'}>
    <path d="m3 10 7.7-7a2 2 0 0 1 2.6 0l7.7 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" />
    <path d="M10 21v-7h4v7" />
  </svg>
)

export const Loupe = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
)

export const Plus = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Personne = ({ taille = 24, plein = false }: Props) => (
  <svg {...base(taille)} fill={plein ? 'currentColor' : 'none'}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5v1H4v-1Z" />
  </svg>
)

/* ---------- Actions sur une video ---------- */

export const Coeur = ({ taille = 24, plein = false }: Props) => (
  <svg {...base(taille)} fill={plein ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.1C1.5 7.9 3.4 4.5 6.9 4.5c2.1 0 3.9 1.2 5.1 3 1.2-1.8 3-3 5.1-3 3.5 0 5.4 3.4 4.1 6.9C19.5 15.9 12 20.5 12 20.5Z" />
  </svg>
)

export const Bulle = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M21 11.5c0 4.1-4 7.5-9 7.5-1 0-2-.1-2.9-.4L4 20.5l1.4-3.6C4 15.4 3 13.6 3 11.5 3 7.4 7 4 12 4s9 3.4 9 7.5Z" />
  </svg>
)

export const Partage = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 15V3" />
    <path d="m8 7 4-4 4 4" />
  </svg>
)

/* ---------- Barre de profil ---------- */

// Chevron pointant a DROITE, pour les lignes de liste qui mènent a un
// sous-ecran. Chevron (a gauche) reste celui du bouton Retour.
export const ChevronDroit = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.2}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)

export const Chevron = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.2}>
    <path d="m15 5-7 7 7 7" />
  </svg>
)

export const Cloche = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M5 17.5c1.5-2 1.7-4 1.7-8 0-4 2.1-6.5 5.3-6.5s5.3 2.5 5.3 6.5c0 4 .2 6 1.7 8H5Z" />
    <path d="M10 21h4" />
  </svg>
)

export const Fleche = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M14 3v5C6 8 3 12.5 2.5 19c3-4 6.5-5 11.5-5v6l8-8.5L14 3Z" />
  </svg>
)

export const Crayon = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="m3 21 2-7L16.5 2.5a1.5 1.5 0 0 1 2 0l3 3a1.5 1.5 0 0 1 0 2L10 19l-7 2Z" />
    <path d="m14 5 5 5" />
  </svg>
)

export const Menu = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M3 5h18M3 12h18M3 19h18" />
  </svg>
)

export const AjoutPersonne = ({ taille = 24, plein = false }: Props) => (
  <svg {...base(taille)}>
    {plein ? <>
      <circle cx="15" cy="7" r="4" fill="currentColor" stroke="none" />
      <path d="M7 21v-2c0-4 3.5-6 8-6s7 2 7 6v2H7Z" fill="currentColor" stroke="none" />
      <path d="M4 9v7M.5 12.5h7" />
    </> : <>
      <circle cx="9" cy="6" r="4" />
      <path d="M1.5 21c0-5 2.5-8 7.5-8 2 0 3.4.4 4.5 1.2M19 12v9M14.5 16.5h9" />
    </>}
  </svg>
)

/* ---------- Onglets de profil ---------- */

export const Grille = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2} strokeLinecap="butt">
    <path d="M3 2v8m0 4v8M9 2v8m0 4v8M15 2v8m0 4v8" />
    <path d="m18 10 3 4 3-4Z" fill="currentColor" stroke="none" />
  </svg>
)

export const Cadenas = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="5" y="10" width="14" height="12" rx="1.5" />
    <path d="M8 10V6a4 4 0 0 1 8 0v4" />
  </svg>
)

export const Repartage = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M6 3v13a4 4 0 0 0 4 4h3M2 7l4-4 4 4M18 21V8a4 4 0 0 0-4-4h-3m3 13 4 4 4-4" />
  </svg>
)

/* ---------- Divers ---------- */

export const Camera = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="2.5" y="6.5" width="13" height="11" rx="2" />
    <path d="m15.5 11 6-3.5v9l-6-3.5" />
  </svg>
)

export const Studio = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="9" cy="6" r="4" fill="currentColor" stroke="none" />
    <path d="M1 21v-3c0-4 3-6 8-6 2 0 4 .5 5 1.5L11 21H1Z" fill="currentColor" stroke="none" />
    <path d="m18 10 1.8 4.2L24 16l-4.2 1.8L18 22l-1.8-4.2L12 16l4.2-1.8L18 10Z" fill="currentColor" stroke="none" />
  </svg>
)

export const Film = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 12h18M3 8h4M3 16h4M17 8h4M17 16h4" />
  </svg>
)

export const Croix = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
)

export const Lecture = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} fill="currentColor" stroke="none">
    <path d="M7 4.5v15l12-7.5-12-7.5Z" />
  </svg>
)

/* ---------- Ecran de tournage ---------- */

// Note de musique du bouton « Ajouter un son » : plus haute que large.
export const SonNote = ({ taille = 18 }: Props) => (
  <svg {...base(taille)} height={taille * 22 / 18}>
    <path d="M10 17V3l8 3v5l-8-3" />
    <ellipse cx="7" cy="18" rx="3" ry="4" fill="currentColor" stroke="none" />
  </svg>
)

export const Retourner = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <path d="M4 8a9 9 0 0 1 17 3M20 16A9 9 0 0 1 3 13" />
    <path d="m17 9 4 4 3-5M7 15l-4-4-3 5" fill="currentColor" stroke="none" />
  </svg>
)

export const Galerie = ({ taille = 20 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m3 17 6-6 12 7" />
    <circle cx="16" cy="8" r="2" />
  </svg>
)

export const OutilFlash = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><path d="m13 2-8 12h6l-1 8 9-13h-6Z" /><path d="m3 3 18 18" /></svg>
)

export const OutilMinuteur = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><path d="M12 3a9 9 0 1 1-8 5M12 7v6l-4-3" /></svg>
)

export const OutilDisposition = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18m0-9h9" /></svg>
)

export const OutilRetouche = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><circle cx="12" cy="8" r="4" /><path d="M4 22c0-11 16-11 16 0M21 2v6m-3-3h6" /></svg>
)

export const OutilFiltres = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><circle cx="12" cy="7" r="5" /><circle cx="7" cy="16" r="5" /><circle cx="17" cy="16" r="5" /></svg>
)

// Cadran « 1x » : le chiffre est inscrit dans le trace.
export const OutilVitesse = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="9.5" /><path d="M12 12 8.5 8.5" />
    <text x="12" y="19" fontSize="6.5" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">1x</text>
  </svg>
)

export const OutilPlus = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><path d="m4 8 8 8 8-8" /></svg>
)

export const EffetEnregistrer = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><path d="M6 3h8a2 2 0 0 1 2 2v16l-6-4-6 4V5a2 2 0 0 1 2-2Z" /><path d="M18 3v6m-3-3h6" /></svg>
)

export const EffetDeplier = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg>
)

export const CocheValider = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.4}><path d="m4 13 6 6L20 5" /></svg>
)

export const SupprimerClip = ({ taille = 22 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.2}><path d="m8 8 8 8M16 8l-8 8" /></svg>
)

export const Corbeille = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v6M14 10v6" /></svg>
)

export const Brouillon = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}><rect x="3" y="5" width="18" height="15" rx="2.5" /><path d="M8 12h8" /></svg>
)

/* ---------- Ecran de montage ---------- */

export const MontageReglages = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <path d="M12 2.2 13.5 4l2.3-.8.7 2.3 2.4.2-.2 2.4 2 1.3-1.3 2 1.3 2-2 1.3.2 2.4-2.4.2-.7 2.3-2.3-.8L12 21.8 10.5 20l-2.3.8-.7-2.3-2.4-.2.2-2.4-2-1.3 1.3-2-1.3-2 2-1.3-.2-2.4 2.4-.2.7-2.3 2.3.8Z" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
)

export const MontagePartage = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} fill="currentColor" strokeWidth={1.6}>
    <path d="M2 19c1-7 6-10 11-10.2V4l9 8-9 8v-4.8C8.5 15 4.5 16.2 2 19Z" />
  </svg>
)

export const MontageDuree = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><rect x="5" y="7" width="14" height="10" rx="2.5" /><path d="M2.5 10v4M21.5 10v4" /></svg>
)

export const MontageClips = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="5" width="13" height="14" rx="2.5" />
    <path d="m8 9.5 4 2.5-4 2.5Z" fill="currentColor" stroke="none" /><path d="M19 8v8" />
  </svg>
)

export const MontageTexte = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} fill="currentColor" stroke="none">
    <text x="12" y="19" fontSize="19" fontWeight="700" textAnchor="middle" fill="currentColor">Aa</text>
  </svg>
)

export const MontageSticker = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="9" cy="10" r="1.4" fill="currentColor" /><circle cx="15" cy="10" r="1.4" fill="currentColor" />
    <path d="M9 15c1.5 1.5 4.5 1.5 6 0" />
  </svg>
)

export const MontageEffets = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
    <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z" />
  </svg>
)

export const MontageVoix = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}>
    <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M5.5 11a6.5 6.5 0 0 0 11.3 4.4" />
    <path d="M19 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" fill="currentColor" stroke="none" />
  </svg>
)

export const MontageFiltres = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><circle cx="12" cy="8" r="4.6" /><circle cx="8" cy="15.5" r="4.6" /><circle cx="16" cy="15.5" r="4.6" /></svg>
)

export const MontageSousTitres = ({ taille = 26 }: Props) => (
  <svg {...base(taille)}><rect x="2.5" y="5.5" width="19" height="13" rx="3" /><path d="M6 11h5M14 11h4M6 15h3M12 15h6" /></svg>
)

export const Vitesse = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <circle cx="12" cy="12" r="9.2" /><path d="m12 12 4.4-4.4" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <path d="M12 2.8v1.6M21.2 12h-1.6M12 21.2v-1.6M2.8 12h1.6" />
  </svg>
)

// Visage souriant echancre : « Insérer un emoji ».
export const Emoji = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M21.5 12A9.5 9.5 0 1 0 12 21.5L21.5 12Z" />
    <path d="M12 21.5v-4a5.5 5.5 0 0 1 5.5-5.5h4" />
    <ellipse cx="8" cy="8.5" rx="1.2" ry="1.7" fill="currentColor" stroke="none" />
    <ellipse cx="15" cy="8.5" rx="1.2" ry="1.7" fill="currentColor" stroke="none" />
  </svg>
)

/* ---------- Barre d'outils du texte libre ---------- */

export const TexteCadre = ({ taille = 30 }: Props) => (
  <svg {...base(taille)}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8.5 16 12 7.5 15.5 16M9.8 13.4h4.4" /></svg>
)

export const TexteAlignement = ({ taille = 30 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}><path d="M3 6h18M6 11h12M3 16h18M7 21h10" /></svg>
)

/* ---------- Feuille « Ajouter un son » ---------- */

export const Egaliseur = ({ taille = 16 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <rect x="3" y="9" width="3.6" height="11" rx="1.4" />
    <rect x="10.2" y="4" width="3.6" height="16" rx="1.4" />
    <rect x="17.4" y="11.5" width="3.6" height="8.5" rx="1.4" />
  </svg>
)

export const Ciseaux = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.6 15.4M8.6 8.6 20 20" />
  </svg>
)

export const MarquePage = ({ taille = 24, plein = false }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9} fill={plein ? 'currentColor' : 'none'}>
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1Z" />
  </svg>
)

/* ---------- Onglet « Amis » ---------- */

// Avion en papier plein : la pastille rose sous l'avatar du rail d'actions.
export const AvionEnvoi = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} stroke="none">
    <path d="M21.4 3.2 2.9 10.6c-.9.4-.8 1.6.1 1.8l4.8 1.3 1.3 4.9c.2.9 1.4 1 1.8.1l7.4-18.5c.3-.7-.4-1.3-1-1Z" fill="currentColor" />
    <path d="M8.6 14.2 20.3 4.4" stroke="#ff2856" strokeWidth={1.4} strokeLinecap="round" />
  </svg>
)

// Trois lignes suivies d'une note : la barre « Liste de lecture ».
export const ListeLecture = ({ taille = 18 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M3 6h12M3 11h12M3 16h7" /><path d="M20 7v8" />
    <ellipse cx="17.6" cy="16.4" rx="2.4" ry="2.1" fill="currentColor" stroke="none" />
  </svg>
)

// Pastille « + » du bouton « Créer » de la rangee de stories.
export const PlusStory = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
)

export const EtincelleEtiquette = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} stroke="none">
    <path d="M10 2.5 11.9 8 17.5 10 11.9 12 10 17.5 8.1 12 2.5 10 8.1 8Z" fill="currentColor" />
    <path d="M18 14.5 18.9 17.1 21.5 18 18.9 18.9 18 21.5 17.1 18.9 14.5 18 17.1 17.1Z" fill="currentColor" />
  </svg>
)

/* ---------- Mosaique « Communauté » ---------- */

// Pile de carres : la publication est un diaporama.
export const Diaporama = ({ taille = 15 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <rect x="8" y="3" width="13" height="13" rx="2.4" />
    <path d="M16 20.5H5.5A2.5 2.5 0 0 1 3 18V7.5" />
  </svg>
)

export const LectureVignette = ({ taille = 15 }: Props) => (
  <svg {...base(taille)} stroke="none"><path d="M7 3.5 20 12 7 20.5Z" fill="currentColor" /></svg>
)

export const CoeurPetit = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M12 20.5 4.3 13a4.9 4.9 0 0 1 7.7-6 4.9 4.9 0 0 1 7.7 6Z" />
  </svg>
)

/* ---------- Pseudo-categorie « LIVE » ---------- */

export const CalendrierEtoile = ({ taille = 23 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="5" width="18" height="17" rx="2" /><path d="M7 2v6M17 2v6" />
    <path d="m12 9 1.55 3.14 3.47.51-2.51 2.44.59 3.45L12 16.91l-3.1 1.63.59-3.45-2.51-2.44 3.47-.51Z" />
  </svg>
)

// Camera video pleine : la pastille rouge de « Passer en LIVE ».
export const CameraLive = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <rect x="2" y="6.5" width="13" height="11" rx="2.6" />
    <path d="M16.5 11.2 22 8v8l-5.5-3.2Z" />
  </svg>
)

export const Couronne = ({ taille = 14 }: Props) => (
  <svg {...base(taille)} stroke="none"><path d="M3 7.5l4 4 5-7 5 7 4-4-2 11H5Z" fill="currentColor" /></svg>
)

// Deux silhouettes dans un cadre : inviter des participants au LIVE.
export const InvitesLive = ({ taille = 25 }: Props) => (
  <svg {...base(taille)}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.6" />
    <circle cx="9" cy="10.4" r="2.1" /><path d="M5.6 16.4a3.6 3.6 0 0 1 6.8 0" />
    <path d="M15 9.5h4M15 13h3" />
  </svg>
)

export const CadeauLive = ({ taille = 25 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="9" width="18" height="12" rx="2" /><path d="M2 9h20M12 9v12" />
    <path d="M12 9S9.5 3 7 4.4 9.6 9 12 9Zm0 0s2.5-6 5-4.6S14.4 9 12 9Z" />
  </svg>
)

export const ChevronBas = ({ taille = 18 }: Props) => (
  <svg {...base(taille)}><path d="m6 9.5 6 6 6-6" /></svg>
)

export const ChevronHaut = ({ taille = 18 }: Props) => (
  <svg {...base(taille)}><path d="m6 14.5 6-6 6 6" /></svg>
)

export const CoeurPlein = ({ taille = 20 }: Props) => (
  <svg {...base(taille)} stroke="none">
    <path d="M12 21 3.6 12.6a5.4 5.4 0 0 1 8.4-6.6 5.4 5.4 0 0 1 8.4 6.6Z" fill="currentColor" />
  </svg>
)

/* ---------- Analyse video ---------- */

// Silhouette avec une etoile : le bouton « Studio créateur ».
export const StudioPastille = ({ taille = 18 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <circle cx="9.4" cy="7" r="3.8" />
    <path d="M2.4 20.4v-2.2c0-3.2 3.2-5 7-5 1.2 0 2.4.2 3.4.6l-1 6.6H2.4Z" />
    <path d="m18 11.4 1.5 3.3 3.3 1.5-3.3 1.5L18 21l-1.5-3.3-3.3-1.5 3.3-1.5L18 11.4Z" />
  </svg>
)

/* ---------- Boite de reception ---------- */

// Silhouette avec un plus : creer un groupe, en tete de la boite.
export const NouveauGroupe = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <circle cx="10" cy="7.4" r="3.4" />
    <path d="M3.4 20.2v-.8c0-3 2.9-4.8 6.6-4.8 1 0 2 .1 2.9.4" />
    <path d="M17.6 14.6v5.6m-2.8-2.8h5.6" />
  </svg>
)

// Avion en papier du bouton d'envoi, dans le champ de saisie.
export const EnvoiMessage = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3.4 11.3 20 4.2a.6.6 0 0 1 .8.8l-7.1 16.6a.6.6 0 0 1-1.1 0l-2.5-6.4-6.4-2.5a.6.6 0 0 1 0-1.1Z" />
    <path d="m10.6 15.2 10.1-11" />
  </svg>
)

// Eclair de la pastille « Activité et nouveaux abonnés ».
export const Eclair = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <path d="M13.6 2.2 5.4 13.1h5.3l-1.3 8.7 8.4-11.1h-5.4Z" />
  </svg>
)

// Bulle de dialogue pleine : pastille des demandes de messages.
export const BulleDemande = ({ taille = 26 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <path d="M12 3.4c-5 0-9 3.3-9 7.4 0 2.2 1.1 4.1 2.9 5.5l-1 3.9 4.2-2.1c.9.2 1.9.3 2.9.3 5 0 9-3.3 9-7.6S17 3.4 12 3.4Z" />
  </svg>
)

// Flamme des conversations entretenues jour apres jour.
export const Flamme = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <path d="M12 2.4C8.4 7 5.4 9.6 5.4 13.6a6.6 6.6 0 0 0 13.2 0c0-4-3-6.6-6.6-11.2Z" />
  </svg>
)

/* ---------- Notifications systeme ---------- */

// Roue dentee : ouvre « Paramètres des notifications ».
export const Engrenage = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.4h0l.5 2.3a7.6 7.6 0 0 1 2.3 1l2-1.3 1.8 1.8-1.3 2a7.6 7.6 0 0 1 1 2.3l2.3.5v2.4l-2.3.5a7.6 7.6 0 0 1-1 2.3l1.3 2-1.8 1.8-2-1.3a7.6 7.6 0 0 1-2.3 1l-.5 2.3H9.6l-.5-2.3a7.6 7.6 0 0 1-2.3-1l-2 1.3-1.8-1.8 1.3-2a7.6 7.6 0 0 1-1-2.3l-2.3-.5v-2.4l2.3-.5a7.6 7.6 0 0 1 1-2.3l-1.3-2L5 4.4l2 1.3a7.6 7.6 0 0 1 2.3-1l.5-2.3Z" />
  </svg>
)

export const TroisPoints = ({ taille = 18 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
)

export const Epingle = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M8.4 2.8h7.2l-1.1 5.4 3.4 3.3v1.9H6.1v-1.9l3.4-3.3Z"
      fill="currentColor" stroke="none" />
    <path d="M12 13.4v7.8" />
  </svg>
)

// Cloche barree : la ligne « Mettre en sourdine » des reglages.
export const ClocheBarree = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M8.4 4.9A5.6 5.6 0 0 1 17.6 9v3.4l1.6 3.1H8.2" />
    <path d="M6.4 9v3.4L4.8 15.5h6.6" />
    <path d="M10.2 18.4a2 2 0 0 0 3.6 0" />
    <path d="m3.6 3.4 16.8 17.2" />
  </svg>
)

// Megaphone : canal « Assistance publicités ».
export const CanalPublicite = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3.4 10.2v3.6a1.4 1.4 0 0 0 1.4 1.4h2.4l6.8 4V4.8l-6.8 4H4.8a1.4 1.4 0 0 0-1.4 1.4Z" />
    <path d="M7.2 15.2v4.4h2.6l-.4-4.4" />
    <path d="M17.4 9.4a4.2 4.2 0 0 1 0 5.2M19.8 7a7.4 7.4 0 0 1 0 10" />
  </svg>
)

// Fusee : canal « Assistant promotion ».
export const CanalPromotion = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M11 15.4 8.6 13a11.4 11.4 0 0 1 3.2-6.6C14 4.2 17.4 3 20.4 3.2c.3 3-.9 6.4-3.2 8.6a11.4 11.4 0 0 1-6.2 3.6Z" />
    <circle cx="15.2" cy="8.8" r="1.7" />
    <path d="M8.6 13H5.4l1.4-3.2h3.2M11 15.4v3.2l3.2-1.4v-3.2" />
    <path d="M6.6 17.4 4.2 19.8" />
  </svg>
)

// Etal de marche : canal « Creator Marketplace ».
export const CanalMarketplace = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3.2 7.4h17.6l-1.4 3.2H4.6Z" />
    <path d="M5 10.6v8.2a1.4 1.4 0 0 0 1.4 1.4h11.2a1.4 1.4 0 0 0 1.4-1.4v-8.2" />
    <path d="M9.4 7.4 10.4 3.6h3.2l1 3.8" />
    <path d="M9.8 14.6h4.4" />
  </svg>
)

// Antenne de diffusion : canal « LIVE ».
export const CanalLive = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" />
    <path d="M5 5a9.8 9.8 0 0 0 0 14M19 19a9.8 9.8 0 0 0 0-14" />
  </svg>
)

// Pile d'episodes : canal « Mini-série ».
export const CanalMiniSerie = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="2.8" y="7" width="13.4" height="13.2" rx="2.4" />
    <path d="M6.4 4.4h10a3.4 3.4 0 0 1 3.4 3.4v9" />
    <path d="m8.4 11.4 4.2 2.4-4.2 2.4Z" />
  </svg>
)

// Pastille generique de l'application : le logo de la marque n'est
// pas reproduit, seulement un cadre et un triangle de lecture.
export const CanalApplication = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
    <path d="m9.8 8.6 6 3.4-6 3.4Z" />
  </svg>
)

/* ---------- Feuille « Envoyer à » ---------- */

export const FeuilleCroix = ({ taille = 22 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.2}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
)

export const Maillon = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
    <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.5-1.5" />
  </svg>
)

export const Telecharger = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M12 3.2v11.6m-4.3-4.3L12 14.8l4.3-4.3" />
    <path d="M4.4 16.6v2.2a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2v-2.2" />
  </svg>
)

export const Statistiques = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <path d="m7.3 14.8 3.1-3.4 2.3 2.2 4-4.3" />
    <path d="M13.6 9.3h3.1v3.1" />
  </svg>
)

export const Diffuser = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M3.2 8.4V6.2a2.2 2.2 0 0 1 2.2-2.2h13.2a2.2 2.2 0 0 1 2.2 2.2v11.6a2.2 2.2 0 0 1-2.2 2.2h-6.2" />
    <path d="M3.2 12.6a7.4 7.4 0 0 1 7.4 7.4" />
    <path d="M3.2 16.6a3.4 3.4 0 0 1 3.4 3.4" />
    <circle cx="3.6" cy="20" r="1.3" fill="currentColor" stroke="none" />
  </svg>
)

export const Groupe = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <circle cx="8.5" cy="8" r="3.2" />
    <circle cx="16.5" cy="9" r="2.6" />
    <path d="M2.5 19.5c0-3.4 2.6-5.5 6-5.5s6 2.1 6 5.5" />
    <path d="M16.2 14c2.6 0 4.3 1.8 4.3 4.4" />
  </svg>
)

export const Duo = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <path d="M11 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 1 0-17Z" />
    <circle cx="16" cy="12" r="8.5" opacity=".45" />
  </svg>
)

export const Collage = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M8.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v14a1.5 1.5 0 0 0 1.5 1.5h3.5" />
    <path d="M15.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-3.5" />
    <path d="M12 2.5v19" strokeDasharray="2.5 2.5" />
  </svg>
)

export const StickerPlus = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M3.6 6A2.4 2.4 0 0 1 6 3.6h12A2.4 2.4 0 0 1 20.4 6v7.8L13.8 20.4H6A2.4 2.4 0 0 1 3.6 18Z" />
    <path d="M20.4 13.8h-4.2a2.4 2.4 0 0 0-2.4 2.4v4.2" />
    <path d="M8.6 8.4v4.4m-2.2-2.2h4.4" />
  </svg>
)

export const SousTitres = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3.5 8.2A1.7 1.7 0 0 1 5.2 6.5h13.6a1.7 1.7 0 0 1 1.7 1.7v7.6a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7Z" />
    <path d="M9 10.6a2 2 0 1 0 0 2.8M15.5 10.6a2 2 0 1 0 0 2.8" />
  </svg>
)

export const Crayon2 = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M16.5 3.6a2.3 2.3 0 0 1 3.3 3.3L8 18.7l-4.3 1 1-4.3Z" />
  </svg>
)

export const CadenasPlein = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" fill="currentColor" stroke="none" />
    <path d="M8 10V6.9a4 4 0 0 1 8 0V10" />
  </svg>
)

export const PhotoAnimee = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="6.4" strokeDasharray="1.5 3" />
    <circle cx="12" cy="12" r="9.6" strokeDasharray="1.5 3.5" />
  </svg>
)

export const EtiquetteGif = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
    <text x="12" y="15.4" fontSize="7.6" fontWeight="700" fill="currentColor"
      stroke="none" textAnchor="middle">GIF</text>
  </svg>
)

export const Portefeuille = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <path d="m9 9.4 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3L5.7 12l2.3-.3Z"
      fill="currentColor" stroke="none" />
  </svg>
)

export const MotsCles = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <path d="m4 17 4.5-11L13 17M5.7 13.6h5.6" />
    <circle cx="17.5" cy="15.5" r="3.2" />
    <path d="m19.9 17.9 2 2" />
  </svg>
)

export const AjoutStory = ({ taille = 24 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="9.2" strokeDasharray="2.6 2.6" />
    <path d="M12 8.4v7.2M8.4 12h7.2" />
  </svg>
)

// Deux fleches en boucle : republier la video sur son profil.
export const Republier = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.1}>
    <path d="M4 9.2V8a2.6 2.6 0 0 1 2.6-2.6h9.8" />
    <path d="m13.6 2.6 3 2.8-3 2.8" />
    <path d="M20 14.8V16a2.6 2.6 0 0 1-2.6 2.6H7.6" />
    <path d="m10.4 21.4-3-2.8 3-2.8" />
  </svg>
)

// Drapeau : signaler une publication.
export const Drapeau = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M5.4 21V3.6" />
    <path d="M5.4 4.4h12.4l-2.2 4.4 2.2 4.4H5.4Z" fill="currentColor" stroke="none" />
    <path d="M5.4 4.4h12.4l-2.2 4.4 2.2 4.4H5.4Z" />
  </svg>
)

// Megaphone : promouvoir la publication.
export const Megaphone = ({ taille = 24 }: Props) => (
  <svg {...base(taille)} strokeWidth={1.9}>
    <path d="M3.4 9.6v4.8a1.2 1.2 0 0 0 1.2 1.2h2.6L14 19.8V4.2L7.2 8.4H4.6a1.2 1.2 0 0 0-1.2 1.2Z"
      fill="currentColor" stroke="none" />
    <path d="M17.4 8.8a4.6 4.6 0 0 1 0 6.4M19.8 6a8.2 8.2 0 0 1 0 12" />
  </svg>
)

// Pastilles de marque : elles gardent leurs couleurs propres et ne
// suivent donc pas currentColor.
export const LogoWhatsApp = ({ taille = 52 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="24" fill="#25d366" />
    <path fill="#fff" d="M33.1 14.8A12.8 12.8 0 0 0 13 30.3l-1.8 6.6 6.8-1.8a12.8 12.8 0 0 0 6.1 1.6h.1a12.8 12.8 0 0 0 8.9-21.9Zm-8.9 19.7a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-4 1 1.1-3.9-.3-.4a10.6 10.6 0 1 1 9 5Z" />
    <path fill="#fff" d="M30 27.1c-.3-.2-1.8-.9-2.1-1s-.5-.1-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.6 8.6 0 0 1-2.5-1.6 9.6 9.6 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6a2.2 2.2 0 0 0 .3-.5.6.6 0 0 0 0-.6c0-.2-.7-1.7-1-2.3s-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9 18.6 18.6 0 0 0 1.9.7 4.4 4.4 0 0 0 2 .1 3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4Z" />
  </svg>
)

export const LogoSMS = ({ taille = 52 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="24" fill="#4bd964" />
    <path fill="#fff" d="M24 11.5c-7.5 0-13.5 4.9-13.5 11s6 11 13.5 11a16 16 0 0 0 3-.3 12 12 0 0 0 5.4 3.2.6.6 0 0 0 .7-.9 8.4 8.4 0 0 1-1.6-3.6c2.4-2 3.9-4.8 3.9-7.9 0-6.1-6-11-13.4-11Z" />
  </svg>
)

export const LogoTelegram = ({ taille = 52 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="24" fill="#2aabee" />
    <path fill="#fff" d="M35.6 14.2 31.3 34.5c-.3 1.4-1.2 1.8-2.4 1.1l-6.6-4.9-3.2 3.1c-.4.4-.7.6-1.3.6l.5-6.8 12.3-11.1c.5-.5-.1-.7-.8-.3l-15.2 9.6-6.5-2c-1.4-.5-1.5-1.4.3-2.1l25.4-9.8c1.2-.4 2.2.3 1.8 2.3Z" />
  </svg>
)

// Glyphe de bulle generique, et non le logo de la marque.
export const AppliEphemere = ({ taille = 52 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="24" fill="#f7e03c" />
    <path fill="#111" d="M24 13.5c-6 0-10.8 4-10.8 8.9 0 2.6 1.3 4.9 3.5 6.5l-1.2 4.7 5-2.5c1.1.3 2.3.4 3.5.4 6 0 10.8-4 10.8-8.9s-4.8-9.1-10.8-9.1Z" />
  </svg>
)

/* ---------- Page des brouillons ---------- */

// Deux feuillets superposes : le brouillon contient plusieurs clips.
export const Calques = ({ taille = 18 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <rect x="8" y="3" width="13" height="13" rx="3" />
    <rect x="3" y="8" width="13" height="13" rx="3" stroke="#000"
      strokeWidth={1.4} strokeOpacity={.18} />
  </svg>
)

// Petite note de musique des etiquettes de son, sur la vignette.
export const NoteEtiquette = ({ taille = 13 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" />
    <circle cx="17" cy="16" r="3" fill="currentColor" />
  </svg>
)

/* ---------- Direct LIVE ---------- */

// Fleche de partage du fil, reprise dans la barre basse du direct :
// l'icone « Partage » (televersement) ne dit pas la meme chose.
export const PartageLive = ({ taille = 23 }: Props) => (
  <svg {...base(taille)} stroke="none" fill="currentColor">
    <path d="M14 2.6a.8.8 0 0 1 1.3-.5l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-8.2 8.2a.8.8 0 0 1-1.3-.5v-4.8c-6.7.7-10.4 2.9-12.8 6.3-.5.7-1.4.4-1.3-.5C.6 10.5 5.3 6.4 14 6v-3.4Z" />
  </svg>
)

/* ---------- Sous-ecrans des parametres ---------- */

// Combine telephonique : la ligne « Numéro de téléphone » du compte.
export const Telephone = ({ taille = 21 }: Props) => (
  <svg {...base(taille)}>
    <path d="M7 3.5h3l1.6 4-2 1.5a10.5 10.5 0 0 0 5.4 5.4l1.5-2 4 1.6v3a1.9 1.9 0 0 1-2.1 1.9A16.4 16.4 0 0 1 5.1 5.6 1.9 1.9 0 0 1 7 3.5Z" />
  </svg>
)

// Cle : la ligne « Mot de passe ».
export const Cle = ({ taille = 21 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="8.4" cy="15.6" r="4.1" />
    <path d="m11.3 12.7 7.4-7.4M16.3 7.7l2.2 2.2M18.7 5.3l2.1 2.1" />
  </svg>
)

// Telephone mobile : la liste des appareils connectes.
export const Appareil = ({ taille = 21 }: Props) => (
  <svg {...base(taille)}>
    <rect x="6.3" y="2.6" width="11.4" height="18.8" rx="2.4" />
    <path d="M10.6 18.4h2.8" />
  </svg>
)

// Coche seule : le choix retenu dans une liste a selection unique.
export const CocheChoix = ({ taille = 20 }: Props) => (
  <svg {...base(taille)} strokeWidth={2.2}><path d="m4.5 12.6 4.8 5L19.5 6.6" /></svg>
)

/* ---------- Ecran de publication et ses feuilles ---------- */

// Ajouter un lien : un carre au signe plus.
export const PubLien = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8m-4-4h8" />
  </svg>
)

// Globe : « Tout le monde peut voir cette publication ».
export const PubMonde = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M2.5 12h19M12 2.5c2.5 3 2.5 16 0 19M12 2.5c-2.5 3-2.5 16 0 19" />
  </svg>
)

// Roue crantee : « Plus d'options ».
export const PubOptions = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
)

// Fleche montante cerclee : le bouton « Publier ».
export const PubPublier = ({ taille = 20 }: Props) => (
  <svg {...base(taille)} strokeWidth={2}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 16V8m-3.5 3.5L12 8l3.5 3.5" />
  </svg>
)

// Epingle de lieu : le departement de tournage.
export const PubLieu = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M12 21.3s7-6.5 7-11.3a7 7 0 1 0-14 0c0 4.8 7 11.3 7 11.3Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
)

// Vignette rouge de « LIVE Events », dans la feuille « Ajouter un lien ».
export const LiveEvents = ({ taille = 33 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="#ff2856" />
    <path d="m12 6.4 1.76 3.57 3.94.57-2.85 2.78.67 3.92L12 15.4l-3.52 1.85.67-3.92L6.3 10.54l3.94-.57Z"
      fill="#fff" />
  </svg>
)

// Silhouette avec deux fleches : l'audience « Ami(e)s ».
export const Amies = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <circle cx="9" cy="7" r="3.4" />
    <path d="M3 20v-1.2c0-2.8 2.7-4.3 6-4.3h.6" />
    <path d="M14 16.2h6.5l-2-2M20.5 20H14l2-2" />
  </svg>
)

// Bulle : « Autoriser les commentaires ».
export const PubCommentaire = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z" />
  </svg>
)

// Cadre scinde : « Autoriser la réutilisation du contenu ».
export const PubReutilisation = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <path d="M15 4.5v15" />
    <path d="m8.2 9.8 3.4 2.2-3.4 2.2Z" fill="currentColor" />
    <path d="M18 9.6v4.8m-2.4-2.4h4.8" />
  </svg>
)

// Deux etincelles : « Contenu généré par IA ».
export const PubIA = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M11 3.5 12.6 8 17 9.6 12.6 11.2 11 15.6 9.4 11.2 5 9.6 9.4 8Z" />
    <path d="M17.5 14.5 18.3 16.7 20.5 17.5 18.3 18.3 17.5 20.5 16.7 18.3 14.5 17.5 16.7 16.7Z" />
  </svg>
)

// Mallette etoilee : « Divulgation de contenu et publicités ».
export const PubDivulgation = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3 7.5h18v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5Z" />
    <path d="M6 7.5V5.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
    <path d="m12 10.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3Z"
      fill="currentColor" stroke="none" />
  </svg>
)

// Note de musique a la loupe : la verification des droits d'auteur du son.
export const PubDroitsSon = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M8 15.5V4.8l7-1.3v8.2" />
    <circle cx="5.8" cy="16" r="2.3" />
    <circle cx="16" cy="16.6" r="3.1" />
    <path d="m18.3 18.9 2.2 2.2" />
  </svg>
)

// Cadre de visee : « Autoriser la recherche visuelle ».
export const PubRechercheVisuelle = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M3 8.5V5.5a2.5 2.5 0 0 1 2.5-2.5h3M15.5 3h3A2.5 2.5 0 0 1 21 5.5v3M21 15.5v3a2.5 2.5 0 0 1-2.5 2.5h-3M8.5 21h-3A2.5 2.5 0 0 1 3 18.5v-3" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
)

// Ecran de lecture etoile : « Autoriser les importations de haute qualité ».
export const PubHauteQualite = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="m8 9.5 4 2.5-4 2.5Z" fill="currentColor" />
    <path d="M18 3.5 18.7 5.8 21 6.5 18.7 7.2 18 9.5 17.3 7.2 15 6.5 17.3 5.8Z"
      fill="currentColor" stroke="none" />
  </svg>
)

// Fleche descendante encadree : « Enregistrer sur l'appareil ».
export const PubTelecharger = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 7v8m-3.2-3.2L12 15l3.2-3.2M8 17.5h8" />
  </svg>
)

// Note dans un cadre : « Enregistrer les publications avec filigrane ».
export const PubFiligrane = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M11.2 15.4V7.6l4 1" />
    <circle cx="9.4" cy="15.6" r="1.9" />
  </svg>
)

// « A » encadre : « Sélectionner la langue de la vidéo ».
export const PubLangue = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8.5 16 12 7.5 15.5 16M9.8 13.4h4.4" />
  </svg>
)

// Oeil barre : « Contrôles du public ».
export const PubOeilBarre = ({ taille = 22 }: Props) => (
  <svg {...base(taille)}>
    <path d="M9.6 5.4A9.6 9.6 0 0 1 12 5.1c5.5 0 9 5.9 9 5.9a16 16 0 0 1-2.6 3.3" />
    <path d="M15.5 14.8A4.5 4.5 0 0 1 12 16.9c-5.5 0-9-5.9-9-5.9a16 16 0 0 1 4.2-4.5" />
    <path d="M10.4 9.4a2.8 2.8 0 0 0 3.3 3.3" />
    <path d="M4.5 19.5 19.5 4.5" />
  </svg>
)

// Pastille de marque, comme LogoWhatsApp : couleurs propres, hors currentColor.
export const LogoFacebook = ({ taille = 33 }: Props) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="24" fill="#1877f2" />
    <path fill="#fff" d="M30.9 30.9 32 24h-6.6v-4.5c0-1.9.9-3.7 3.9-3.7H32v-5.9a36.6 36.6 0 0 0-5.3-.5c-5.4 0-9 3.3-9 9.2V24h-6v6.9h6V47a24 24 0 0 0 7.6 0V30.9Z" />
  </svg>
)
