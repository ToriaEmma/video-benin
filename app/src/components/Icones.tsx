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
