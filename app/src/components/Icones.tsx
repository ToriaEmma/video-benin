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
