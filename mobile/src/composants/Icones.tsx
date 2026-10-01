// ============================================================
// Icones — GENERE depuis app/src/components/Icones.tsx
//
// Ne pas modifier a la main : relancer la conversion pour rester
// strictement identique a la version web. Les traces, tailles et
// epaisseurs sont ceux du web, a la lettre.
// ============================================================

import React from 'react'
import Svg, { Path, Circle, Rect, Line, Polyline, Ellipse, G, Text as SvgText } from 'react-native-svg'

type P = { taille?: number; couleur?: string; plein?: boolean }

const base = (taille: number, couleur: string) => ({
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: couleur,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const Amis = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}><Circle cx="9" cy="7" r="3.5"/><Path d="M1 20v-2c0-3.2 3.6-5 8-5s8 1.8 8 5v2c-5 1-11 1-16 0ZM17 4a3 3 0 1 1 0 6m2 3c3 0 4 2 4 4v3h-3"/></Svg>
)

export const Messages = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}><Path d="M6 3h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-6l-6 4v-4a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><Path d="M8 10h8M8 14h5"/></Svg>
)

export const Accueil = ({ taille = 24, couleur = '#fff', plein = false }: P) => (
  <Svg {...base(taille, couleur)} fill={plein ? couleur : 'none'}>
    <Path d="m3 10 7.7-7a2 2 0 0 1 2.6 0l7.7 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" />
    <Path d="M10 21v-7h4v7" />
  </Svg>
)

export const Loupe = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.6-3.6" />
  </Svg>
)

export const Plus = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2.4}>
    <Path d="M12 5v14M5 12h14" />
  </Svg>
)

export const Personne = ({ taille = 24, couleur = '#fff', plein = false }: P) => (
  <Svg {...base(taille, couleur)} fill={plein ? couleur : 'none'}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5v1H4v-1Z" />
  </Svg>
)

export const Coeur = ({ taille = 24, couleur = '#fff', plein = false }: P) => (
  <Svg {...base(taille, couleur)} fill={plein ? couleur : 'none'}>
    <Path d="M12 20.5s-7.5-4.6-9.2-9.1C1.5 7.9 3.4 4.5 6.9 4.5c2.1 0 3.9 1.2 5.1 3 1.2-1.8 3-3 5.1-3 3.5 0 5.4 3.4 4.1 6.9C19.5 15.9 12 20.5 12 20.5Z" />
  </Svg>
)

export const Bulle = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M21 11.5c0 4.1-4 7.5-9 7.5-1 0-2-.1-2.9-.4L4 20.5l1.4-3.6C4 15.4 3 13.6 3 11.5 3 7.4 7 4 12 4s9 3.4 9 7.5Z" />
  </Svg>
)

export const Partage = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <Path d="M12 15V3" />
    <Path d="m8 7 4-4 4 4" />
  </Svg>
)

export const ChevronDroit = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2.2}>
    <Path d="m9 5 7 7-7 7" />
  </Svg>
)

export const Chevron = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2.2}>
    <Path d="m15 5-7 7 7 7" />
  </Svg>
)

export const Cloche = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M5 17.5c1.5-2 1.7-4 1.7-8 0-4 2.1-6.5 5.3-6.5s5.3 2.5 5.3 6.5c0 4 .2 6 1.7 8H5Z" />
    <Path d="M10 21h4" />
  </Svg>
)

export const Fleche = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M14 3v5C6 8 3 12.5 2.5 19c3-4 6.5-5 11.5-5v6l8-8.5L14 3Z" />
  </Svg>
)

export const Crayon = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="m3 21 2-7L16.5 2.5a1.5 1.5 0 0 1 2 0l3 3a1.5 1.5 0 0 1 0 2L10 19l-7 2Z" />
    <Path d="m14 5 5 5" />
  </Svg>
)

export const Menu = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2}>
    <Path d="M3 5h18M3 12h18M3 19h18" />
  </Svg>
)

export const AjoutPersonne = ({ taille = 24, couleur = '#fff', plein = false }: P) => (
  <Svg {...base(taille, couleur)}>
    {plein ? <>
      <Circle cx="15" cy="7" r="4" fill={couleur} stroke="none" />
      <Path d="M7 21v-2c0-4 3.5-6 8-6s7 2 7 6v2H7Z" fill={couleur} stroke="none" />
      <Path d="M4 9v7M.5 12.5h7" />
    </> : <>
      <Circle cx="9" cy="6" r="4" />
      <Path d="M1.5 21c0-5 2.5-8 7.5-8 2 0 3.4.4 4.5 1.2M19 12v9M14.5 16.5h9" />
    </>}
  </Svg>
)

export const Grille = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2} strokeLinecap="butt">
    <Path d="M3 2v8m0 4v8M9 2v8m0 4v8M15 2v8m0 4v8" />
    <Path d="m18 10 3 4 3-4Z" fill={couleur} stroke="none" />
  </Svg>
)

export const Cadenas = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Rect x="5" y="10" width="14" height="12" rx="1.5" />
    <Path d="M8 10V6a4 4 0 0 1 8 0v4" />
  </Svg>
)

export const Repartage = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M6 3v13a4 4 0 0 0 4 4h3M2 7l4-4 4 4M18 21V8a4 4 0 0 0-4-4h-3m3 13 4 4 4-4" />
  </Svg>
)

export const Camera = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Rect x="2.5" y="6.5" width="13" height="11" rx="2" />
    <Path d="m15.5 11 6-3.5v9l-6-3.5" />
  </Svg>
)

export const Studio = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Circle cx="9" cy="6" r="4" fill={couleur} stroke="none" />
    <Path d="M1 21v-3c0-4 3-6 8-6 2 0 4 .5 5 1.5L11 21H1Z" fill={couleur} stroke="none" />
    <Path d="m18 10 1.8 4.2L24 16l-4.2 1.8L18 22l-1.8-4.2L12 16l4.2-1.8L18 10Z" fill={couleur} stroke="none" />
  </Svg>
)

export const Film = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Rect x="3" y="4" width="18" height="16" rx="2" />
    <Path d="M7 4v16M17 4v16M3 12h18M3 8h4M3 16h4M17 8h4M17 16h4" />
  </Svg>
)

export const Croix = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} strokeWidth={2}>
    <Path d="M6 6 18 18M18 6 6 18" />
  </Svg>
)

export const Lecture = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)} fill={couleur} stroke="none">
    <Path d="M7 4.5v15l12-7.5-12-7.5Z" />
  </Svg>
)

/* ---------- Icones propres au fil (inline dans app/src/pages/Fil.tsx) ---------- */

// Clap LIVE : le mot est dessine dans le SVG, comme dans la version web.
export const LiveEntete = ({ taille = 27, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 28 28" fill="none"
    stroke={couleur} strokeWidth={1.8}>
    <Path d="m9 2 5 5 5-5M3 12V8h22v4M3 23v3h22v-3" />
    <SvgText x="14" y="20" textAnchor="middle" fill={couleur} stroke="none"
      fontSize="10" fontWeight="700">LIVE</SvgText>
  </Svg>
)

// Favori : drapeau plein, jaune #ffd15b quand il est actif.
export const Favori = ({ taille = 27, couleur = '#fff', plein = false }: P) => (
  <Svg width={taille} height={taille * 32 / 27} viewBox="0 0 24 28"
    fill={plein ? '#ffd15b' : couleur}>
    <Path d="M5 2h14a2 2 0 0 1 2 2v22l-9-6-9 6V4a2 2 0 0 1 2-2Z" />
  </Svg>
)

export const LoupeEntete = ({ taille = 25, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.6-3.6" />
  </Svg>
)


/* ---------- Icones inline du fil (app/src/pages/Fil.tsx) ----------
   Pleines, viewBox 0 0 32 32 : elles different de celles du fichier
   d'icones, qui sont en contour. ---------------------------------- */

export const CoeurFil = ({ taille = 34, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 32 32" fill={couleur}>
    <Path d="M16 29C12 26 2 19 2 10.7 2 5.5 5.3 2 9.7 2c2.8 0 5 1.5 6.3 3.8C17.3 3.5 19.5 2 22.3 2 26.7 2 30 5.5 30 10.7 30 19 20 26 16 29Z" />
  </Svg>
)

export const BulleFil = ({ taille = 34, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 32 32" fill={couleur}>
    <Path fillRule="evenodd" clipRule="evenodd"
      d="M16 2C7.7 2 1 7.7 1 14.7c0 6.6 5.7 12 13 12.7V32l7.1-5.4C27 24.8 31 20.1 31 14.7 31 7.7 24.3 2 16 2ZM7 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
  </Svg>
)

export const PartageFil = ({ taille = 34, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 32 32" fill={couleur}>
    <Path d="M19 2a1 1 0 0 1 1.7-.7l11 11a2 2 0 0 1 0 2.8l-11 11A1 1 0 0 1 19 25.4V19C10 18 5 21 1.8 25.5c-.7 1-1.8.5-1.7-.6C.8 14 7.1 8.5 19 8V2Z" />
  </Svg>
)

export const NoteDisque = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8}>
    <Path d="M9 17V5l11-2v12M9 8l11-2" />
    <Ellipse cx="6" cy="18" rx="3" ry="2" fill={couleur} />
    <Ellipse cx="17" cy="16" rx="3" ry="2" fill={couleur} />
  </Svg>
)

// Grand bouton de lecture affiche au centre d'une video en pause.
// viewBox non carre (60x66), comme le `.fil-play` de la version web.
export const LecturePleine = ({ taille = 60, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille * 66 / 60} viewBox="0 0 60 66" fill={couleur}>
    <Path d="M8 4Q3 1 3 8v50q0 7 5 4l46-26q6-3 0-6Z" />
  </Svg>
)

export const Triangle = ({ taille = 15, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille * 12 / 16} viewBox="0 0 16 12" fill={couleur}>
    <Path d="M2 3h12L8 10z" />
  </Svg>
)

export const FavoriContour = ({ taille = 22, couleur = '#fff' }: P) => (
  <Svg {...base(taille, couleur)}>
    <Path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" />
  </Svg>
)

// ============================================================
// Ecran de creation video — SVG inline de
// app/src/components/CreationCamera.tsx. Le CSS web impose
// `width:26;height:26;fill:none;stroke:currentColor;stroke-width:1.8`
// a tous ces traces.
// ============================================================

const baseCamera = (taille: number, couleur: string) => ({
  width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
  stroke: couleur, strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

// Note de musique du bouton « Ajouter un son » (18x22 en web).
export const SonNote = ({ taille = 18, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille * 22 / 18} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 17V3l8 3v5l-8-3" />
    <Ellipse cx="7" cy="18" rx="3" ry="4" fill={couleur} stroke="none" />
  </Svg>
)

// Fleches circulaires : changer de camera.
export const Retourner = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Path d="M4 8a9 9 0 0 1 17 3M20 16A9 9 0 0 1 3 13" />
    <Path d="m17 9 4 4 3-5M7 15l-4-4-3 5" fill={couleur} stroke="none" />
  </Svg>
)

// Les 6 outils de la colonne de droite, dans l'ordre du web.
export const OutilFlash = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Path d="m13 2-8 12h6l-1 8 9-13h-6Z" />
    <Path d="m3 3 18 18" />
  </Svg>
)

export const OutilMinuteur = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Path d="M12 3a9 9 0 1 1-8 5M12 7v6l-4-3" />
  </Svg>
)

export const OutilDisposition = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Path d="M12 3v18m0-9h9" />
  </Svg>
)

export const OutilRetouche = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 22c0-11 16-11 16 0M21 2v6m-3-3h6" />
  </Svg>
)

export const OutilFiltres = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Circle cx="12" cy="7" r="5" />
    <Circle cx="7" cy="16" r="5" />
    <Circle cx="17" cy="16" r="5" />
  </Svg>
)

export const OutilPlus = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Path d="m4 8 8 8 8-8" />
  </Svg>
)

// Vignette « importer depuis la galerie » (20x20 dans son cadre blanc).
export const Galerie = ({ taille = 20, couleur = '#fff' }: P) => (
  <Svg {...baseCamera(taille, couleur)}>
    <Rect x="3" y="3" width="18" height="18" rx="3" />
    <Path d="m3 17 6-6 12 7" />
    <Circle cx="16" cy="8" r="2" />
  </Svg>
)

// Cadran « 1x » de l'outil Vitesse. Le chiffre est inscrit dans le trace,
// comme le fait le web pour l'icone LIVE.
export const OutilVitesse = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M12 12 8.5 8.5" />
    <SvgText x="12" y="19" fontSize="6.5" fontWeight="700" fill={couleur}
      stroke="none" textAnchor="middle">1x</SvgText>
  </Svg>
)

// Marque-page « + » du mode Effets.
export const EffetEnregistrer = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 3h8a2 2 0 0 1 2 2v16l-6-4-6 4V5a2 2 0 0 1 2-2Z" />
    <Path d="M18 3v6m-3-3h6" />
  </Svg>
)

// Fleches d'agrandissement du mode Effets.
export const EffetDeplier = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
  </Svg>
)

// Coche de validation du montage (bouton rouge a droite du declencheur).
export const CocheValider = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m4 13 6 6L20 5" />
  </Svg>
)

// « Supprimer le dernier clip » : croix dans une etiquette.
export const SupprimerClip = ({ taille = 22, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2.2} strokeLinecap="round">
    <Path d="m8 8 8 8M16 8l-8 8" />
  </Svg>
)

// Menu « quitter le montage » : corbeille, brouillon, envoi.
export const Corbeille = ({ taille = 24, couleur = '#ed2753' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />
  </Svg>
)

export const Brouillon = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="15" rx="2.5" />
    <Path d="M8 12h8" />
  </Svg>
)

// ============================================================
// Ecran de montage (apres validation des prises)
// ============================================================

const baseMontage = (taille: number, couleur: string) => ({
  width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
  stroke: couleur, strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

// Roue dentee a douze dents, comme la maquette.
export const MontageReglages = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Path d="M12 2.2 13.5 4l2.3-.8.7 2.3 2.4.2-.2 2.4 2 1.3-1.3 2 1.3 2-2 1.3.2 2.4-2.4.2-.7 2.3-2.3-.8L12 21.8 10.5 20l-2.3.8-.7-2.3-2.4-.2.2-2.4-2-1.3 1.3-2-1.3-2 2-1.3-.2-2.4 2.4-.2.7-2.3 2.3.8Z" />
    <Circle cx="12" cy="12" r="3.4" />
  </Svg>
)

// Fleche de partage pleine, pointe vers la droite.
export const MontagePartage = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur}
    stroke={couleur} strokeWidth={1.6} strokeLinejoin="round">
    <Path d="M2 19c1-7 6-10 11-10.2V4l9 8-9 8v-4.8C8.5 15 4.5 16.2 2 19Z" />
  </Svg>
)

// Cadre de rotation / format de la video.
export const MontageDuree = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Rect x="5" y="7" width="14" height="10" rx="2.5" />
    <Path d="M2.5 10v4M21.5 10v4" />
  </Svg>
)

// Carte video empilee (gestion des clips).
export const MontageClips = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Rect x="3" y="5" width="13" height="14" rx="2.5" />
    <Path d="m8 9.5 4 2.5-4 2.5Z" fill={couleur} stroke="none" />
    <Path d="M19 8v8" />
  </Svg>
)

export const MontageTexte = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur} stroke="none">
    <SvgText x="12" y="19" fontSize="19" fontWeight="700" textAnchor="middle"
      fill={couleur}>Aa</SvgText>
  </Svg>
)

export const MontageSticker = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Rect x="3" y="3" width="18" height="18" rx="4" />
    <Circle cx="9" cy="10" r="1.4" fill={couleur} />
    <Circle cx="15" cy="10" r="1.4" fill={couleur} />
    <Path d="M9 15c1.5 1.5 4.5 1.5 6 0" />
  </Svg>
)

export const MontageEffets = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
    <Path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z" />
  </Svg>
)

export const MontageVoix = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg {...baseMontage(taille, couleur)}>
    <Path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
    <Path d="M5.5 11a6.5 6.5 0 0 0 11.3 4.4" />
    <Path d="M19 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"
      fill={couleur} stroke="none" />
  </Svg>
)

// ============================================================
// Ecran de publication
// ============================================================

export const PubLien = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="3" />
    <Path d="M12 8v8m-4-4h8" />
  </Svg>
)

export const PubMonde = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M2.5 12h19M12 2.5c2.5 3 2.5 16 0 19M12 2.5c-2.5 3-2.5 16 0 19" />
  </Svg>
)

export const PubOptions = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" />
  </Svg>
)

export const PubPublier = ({ taille = 22, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M12 16V8m-3.5 3.5L12 8l3.5 3.5" />
  </Svg>
)

// Trois cercles entrelaces : filtres du montage (meme trace que OutilFiltres).
export const MontageFiltres = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="4.6" />
    <Circle cx="8" cy="15.5" r="4.6" />
    <Circle cx="16" cy="15.5" r="4.6" />
  </Svg>
)

// Cadre a deux lignes de texte : sous-titres.
export const MontageSousTitres = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2.5" y="5.5" width="19" height="13" rx="3" />
    <Path d="M6 11h5M14 11h4M6 15h3M12 15h6" />
  </Svg>
)

// Barre d'outils du texte libre : cadre « A » et alignement.
export const TexteCadre = ({ taille = 30, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="4" />
    <Path d="M8.5 16 12 7.5 15.5 16M9.8 13.4h4.4" />
  </Svg>
)

export const TexteAlignement = ({ taille = 30, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round">
    <Path d="M3 6h18M6 11h12M3 16h18M7 21h10" />
  </Svg>
)

// ------------------------------------------------------------
// Feuilles de la page de publication : « Ajouter un lien »,
// « Qui peut voir cette publication » et « Plus d'options ».
// ------------------------------------------------------------

export const FeuilleCroix = ({ taille = 22, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2.2} strokeLinecap="round">
    <Path d="M6 6 18 18M18 6 6 18" />
  </Svg>
)

// Billetterie des LIVE Events : un cadre avec une etoile au centre.
export const LiveEvents = ({ taille = 24, couleur = '#ff2856' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Rect x="2" y="2" width="20" height="20" rx="6" fill={couleur} />
    <Path d="m12 6.4 1.76 3.57 3.94.57-2.85 2.78.67 3.92L12 15.4l-3.52 1.85.67-3.92L6.3 10.54l3.94-.57Z"
      fill="#fff" />
  </Svg>
)

// Deux silhouettes et une double fleche : le cercle « Ami(e)s ».
export const Amies = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9" cy="7" r="3.4" />
    <Path d="M3 20v-1.2c0-2.8 2.7-4.3 6-4.3h.6" />
    <Path d="M14 16.2h6.5l-2-2M20.5 20H14l2-2" />
  </Svg>
)

export const PubCommentaire = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z" />
  </Svg>
)

// Cadre avec un triangle de lecture : reutilisation du contenu.
export const PubReutilisation = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4.5" width="18" height="15" rx="3" />
    <Path d="M15 4.5v15" />
    <Path d="m8.2 9.8 3.4 2.2-3.4 2.2Z" fill={couleur} />
    <Path d="M18 9.6v4.8m-2.4-2.4h4.8" />
  </Svg>
)

// Divulgation de contenu et publicites : un panneau avec une etoile.
export const PubIA = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 3.5 12.6 8 17 9.6 12.6 11.2 11 15.6 9.4 11.2 5 9.6 9.4 8Z" />
    <Path d="M17.5 14.5 18.3 16.7 20.5 17.5 18.3 18.3 17.5 20.5 16.7 18.3 14.5 17.5 16.7 16.7Z" />
  </Svg>
)

export const PubDivulgation = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 7.5h18v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5Z" />
    <Path d="M6 7.5V5.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
    <Path d="m12 10.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3Z"
      fill={couleur} stroke="none" />
  </Svg>
)

// Note de musique avec une loupe : verification des droits d'auteur du son.
export const PubDroitsSon = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 15.5V4.8l7-1.3v8.2" />
    <Circle cx="5.8" cy="16" r="2.3" />
    <Circle cx="16" cy="16.6" r="3.1" />
    <Path d="m18.3 18.9 2.2 2.2" />
  </Svg>
)

// Cadre a coins ouverts avec une cible : la recherche visuelle.
export const PubRechercheVisuelle = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 8.5V5.5a2.5 2.5 0 0 1 2.5-2.5h3M15.5 3h3A2.5 2.5 0 0 1 21 5.5v3M21 15.5v3a2.5 2.5 0 0 1-2.5 2.5h-3M8.5 21h-3A2.5 2.5 0 0 1 3 18.5v-3" />
    <Circle cx="12" cy="12" r="3.2" />
  </Svg>
)

// Cadre avec une etincelle : importations de haute qualite.
export const PubHauteQualite = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="16" rx="3" />
    <Path d="m8 9.5 4 2.5-4 2.5Z" fill={couleur} />
    <Path d="M18 3.5 18.7 5.8 21 6.5 18.7 7.2 18 9.5 17.3 7.2 15 6.5 17.3 5.8Z"
      fill={couleur} stroke="none" />
  </Svg>
)

// Fleche descendante dans un bac : enregistrer sur l'appareil.
export const PubTelecharger = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="4" />
    <Path d="M12 7v8m-3.2-3.2L12 15l3.2-3.2M8 17.5h8" />
  </Svg>
)

// Note de musique encadree : le filigrane appose sur les publications.
export const PubFiligrane = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="5" />
    <Path d="M11.2 15.4V7.6l4 1" />
    <Circle cx="9.4" cy="15.6" r="1.9" />
  </Svg>
)

// Lettre « A » encadree : la langue de la video.
export const PubLangue = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="4" />
    <Path d="M8.5 16 12 7.5 15.5 16M9.8 13.4h4.4" />
  </Svg>
)

// Oeil barre : les controles du public.
export const PubOeilBarre = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9.6 5.4A9.6 9.6 0 0 1 12 5.1c5.5 0 9 5.9 9 5.9a16 16 0 0 1-2.6 3.3" />
    <Path d="M15.5 14.8A4.5 4.5 0 0 1 12 16.9c-5.5 0-9-5.9-9-5.9a16 16 0 0 1 4.2-4.5" />
    <Path d="M10.4 9.4a2.8 2.8 0 0 0 3.3 3.3" />
    <Path d="M4.5 19.5 19.5 4.5" />
  </Svg>
)

// ------------------------------------------------------------
// Logos des applications de « Partager sur ». Ce sont des pastilles
// pleines, chacune a sa couleur de marque, et non des traces au trait.
// ------------------------------------------------------------

export const LogoWhatsApp = ({ taille = 33 }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 48 48">
    <Circle cx="24" cy="24" r="24" fill="#25d366" />
    <Path fill="#fff" d="M33.1 14.8A12.8 12.8 0 0 0 13 30.3l-1.8 6.6 6.8-1.8a12.8 12.8 0 0 0 6.1 1.6h.1a12.8 12.8 0 0 0 8.9-21.9Zm-8.9 19.7a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-4 1 1.1-3.9-.3-.4a10.6 10.6 0 1 1 9 5Z" />
    <Path fill="#fff" d="M30 27.1c-.3-.2-1.8-.9-2.1-1s-.5-.1-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.6 8.6 0 0 1-2.5-1.6 9.6 9.6 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6a2.2 2.2 0 0 0 .3-.5.6.6 0 0 0 0-.6c0-.2-.7-1.7-1-2.3s-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9 18.6 18.6 0 0 0 1.9.7 4.4 4.4 0 0 0 2 .1 3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4Z" />
  </Svg>
)

export const LogoFacebook = ({ taille = 33 }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 48 48">
    <Circle cx="24" cy="24" r="24" fill="#1877f2" />
    <Path fill="#fff" d="M30.9 30.9 32 24h-6.6v-4.5c0-1.9.9-3.7 3.9-3.7H32v-5.9a36.6 36.6 0 0 0-5.3-.5c-5.4 0-9 3.3-9 9.2V24h-6v6.9h6V47a24 24 0 0 0 7.6 0V30.9Z" />
  </Svg>
)

// Bulle de message verte : l'application Messages d'iOS.
export const LogoSMS = ({ taille = 33 }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 48 48">
    <Circle cx="24" cy="24" r="24" fill="#4bd964" />
    <Path fill="#fff" d="M24 11.5c-7.5 0-13.5 4.9-13.5 11s6 11 13.5 11a16 16 0 0 0 3-.3 12 12 0 0 0 5.4 3.2.6.6 0 0 0 .7-.9 8.4 8.4 0 0 1-1.6-3.6c2.4-2 3.9-4.8 3.9-7.9 0-6.1-6-11-13.4-11Z" />
  </Svg>
)

// ------------------------------------------------------------
// Page des brouillons.
// ------------------------------------------------------------

// Deux feuillets superposes : le brouillon contient plusieurs clips.
export const Calques = ({ taille = 20, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Rect x="8" y="3" width="13" height="13" rx="3" fill={couleur} />
    <Rect x="3" y="8" width="13" height="13" rx="3" fill={couleur}
      stroke="#000" strokeWidth={1.4} strokeOpacity={.18} />
  </Svg>
)

// Petite note de musique des etiquettes de son, sur la vignette.
export const NoteEtiquette = ({ taille = 14, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18V5l11-2v13" />
    <Circle cx="6" cy="18" r="3" fill={couleur} />
    <Circle cx="17" cy="16" r="3" fill={couleur} />
  </Svg>
)

// Etincelle des etiquettes d'effet, sur la vignette.
export const EtincelleEtiquette = ({ taille = 14, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M10 2.5 11.9 8 17.5 10 11.9 12 10 17.5 8.1 12 2.5 10 8.1 8Z" fill={couleur} />
    <Path d="M18 14.5 18.9 17.1 21.5 18 18.9 18.9 18 21.5 17.1 18.9 14.5 18 17.1 17.1Z" fill={couleur} />
  </Svg>
)

// ------------------------------------------------------------
// Feuille « Ajouter un son ».
// ------------------------------------------------------------

// Barres d'egaliseur du son en cours de lecture.
export const Egaliseur = ({ taille = 16, couleur = '#ff2856' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Rect x="3" y="9" width="3.6" height="11" rx="1.4" fill={couleur} />
    <Rect x="10.2" y="4" width="3.6" height="16" rx="1.4" fill={couleur} />
    <Rect x="17.4" y="11.5" width="3.6" height="8.5" rx="1.4" fill={couleur} />
  </Svg>
)

// Ciseaux : decouper le son avant de l'utiliser.
export const Ciseaux = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="6" cy="6" r="3" />
    <Circle cx="6" cy="18" r="3" />
    <Path d="M20 4 8.6 15.4M8.6 8.6 20 20" />
  </Svg>
)

// Marque-page : enregistrer un son en favori.
export const MarquePage = ({ taille = 24, couleur = '#111', plein = false }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24"
    fill={plein ? couleur : 'none'}
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1Z" />
  </Svg>
)

// ------------------------------------------------------------
// Feuille « Envoyer à » du lecteur : actions sur sa publication.
// ------------------------------------------------------------

export const TroisPoints = ({ taille = 34, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Circle cx="5" cy="12" r="2" fill={couleur} />
    <Circle cx="12" cy="12" r="2" fill={couleur} />
    <Circle cx="19" cy="12" r="2" fill={couleur} />
  </Svg>
)

export const Maillon = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
    <Path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.5-1.5" />
  </Svg>
)

export const Telecharger = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 3.2v11.6m-4.3-4.3L12 14.8l4.3-4.3" />
    <Path d="M4.4 16.6v2.2a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2v-2.2" />
  </Svg>
)

export const Statistiques = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="4.5" />
    <Path d="m7.3 14.8 3.1-3.4 2.3 2.2 4-4.3" />
    <Path d="M13.6 9.3h3.1v3.1" />
  </Svg>
)

export const Flamme = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M12 2.4C8.4 7 5.4 9.6 5.4 13.6a6.6 6.6 0 0 0 13.2 0c0-4-3-6.6-6.6-11.2Z"
      fill={couleur} />
  </Svg>
)

export const Diffuser = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.2 8.4V6.2a2.2 2.2 0 0 1 2.2-2.2h13.2a2.2 2.2 0 0 1 2.2 2.2v11.6a2.2 2.2 0 0 1-2.2 2.2h-6.2" />
    <Path d="M3.2 12.6a7.4 7.4 0 0 1 7.4 7.4" />
    <Path d="M3.2 16.6a3.4 3.4 0 0 1 3.4 3.4" />
    <Circle cx="3.6" cy="20" r="1.3" fill={couleur} stroke="none" />
  </Svg>
)

export const Epingle = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8.4 2.8h7.2l-1.1 5.4 3.4 3.3v1.9H6.1v-1.9l3.4-3.3Z"
      fill={couleur} stroke="none" />
    <Path d="M12 13.4v7.8" />
  </Svg>
)

export const Groupe = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8.5" cy="8" r="3.2" fill={couleur} stroke="none" />
    <Circle cx="16.5" cy="9" r="2.6" fill={couleur} stroke="none" />
    <Path d="M2.5 19.5c0-3.4 2.6-5.5 6-5.5s6 2.1 6 5.5" fill={couleur} stroke="none" />
    <Path d="M16.2 14c2.6 0 4.3 1.8 4.3 4.4" fill={couleur} stroke="none" />
  </Svg>
)

export const Duo = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M11 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 1 0-17Z" fill={couleur} />
    <Circle cx="16" cy="12" r="8.5" fill={couleur} opacity={.45} />
  </Svg>
)

export const Collage = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v14a1.5 1.5 0 0 0 1.5 1.5h3.5" />
    <Path d="M15.5 3.5H19a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-3.5" />
    <Path d="M12 2.5v19" strokeDasharray="2.5 2.5" />
  </Svg>
)

export const StickerPlus = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 6A2.4 2.4 0 0 1 6 3.6h12A2.4 2.4 0 0 1 20.4 6v7.8L13.8 20.4H6A2.4 2.4 0 0 1 3.6 18Z" />
    <Path d="M20.4 13.8h-4.2a2.4 2.4 0 0 0-2.4 2.4v4.2" />
    <Path d="M8.6 8.4v4.4m-2.2-2.2h4.4" />
  </Svg>
)

export const Vitesse = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9.2" />
    <Path d="m12 12 4.4-4.4" />
    <Circle cx="12" cy="12" r="1.5" fill={couleur} stroke="none" />
    <Path d="M12 2.8v1.6M21.2 12h-1.6M12 21.2v-1.6M2.8 12h1.6" />
  </Svg>
)

export const SousTitres = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.5 8.2A1.7 1.7 0 0 1 5.2 6.5h13.6a1.7 1.7 0 0 1 1.7 1.7v7.6a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7Z" />
    <Path d="M9 10.6a2 2 0 1 0 0 2.8M15.5 10.6a2 2 0 1 0 0 2.8" />
  </Svg>
)

export const Crayon2 = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16.5 3.6a2.3 2.3 0 0 1 3.3 3.3L8 18.7l-4.3 1 1-4.3Z" />
  </Svg>
)

export const CadenasPlein = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4.5" y="10" width="15" height="11" rx="2.5" fill={couleur} stroke="none" />
    <Path d="M8 10V6.9a4 4 0 0 1 8 0V10" />
  </Svg>
)

export const PhotoAnimee = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="12" cy="12" r="3.2" fill={couleur} stroke="none" />
    <Circle cx="12" cy="12" r="6.4" strokeDasharray="1.5 3" />
    <Circle cx="12" cy="12" r="9.6" strokeDasharray="1.5 3.5" />
  </Svg>
)

export const EtiquetteGif = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinejoin="round">
    <Rect x="2.5" y="5.5" width="19" height="13" rx="3" />
    <SvgText x="12" y="15.4" fontSize="7.6" fontWeight="700" fill={couleur}
      stroke="none" textAnchor="middle">GIF</SvgText>
  </Svg>
)

export const Portefeuille = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <Path d="m9 9.4 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3L5.7 12l2.3-.3Z"
      fill={couleur} stroke="none" />
  </Svg>
)

export const MotsCles = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m4 17 4.5-11L13 17M5.7 13.6h5.6" />
    <Circle cx="17.5" cy="15.5" r="3.2" />
    <Path d="m19.9 17.9 2 2" />
  </Svg>
)

export const AjoutStory = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="12" cy="12" r="9.2" strokeDasharray="2.6 2.6" />
    <Path d="M12 8.4v7.2M8.4 12h7.2" />
  </Svg>
)

// Avion en papier sur pastille bleue : Telegram.
export const LogoTelegram = ({ taille = 33 }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 48 48">
    <Circle cx="24" cy="24" r="24" fill="#2aabee" />
    <Path fill="#fff" d="M35.6 14.2 31.3 34.5c-.3 1.4-1.2 1.8-2.4 1.1l-6.6-4.9-3.2 3.1c-.4.4-.7.6-1.3.6l.5-6.8 12.3-11.1c.5-.5-.1-.7-.8-.3l-15.2 9.6-6.5-2c-1.4-.5-1.5-1.4.3-2.1l25.4-9.8c1.2-.4 2.2.3 1.8 2.3Z" />
  </Svg>
)

// Epingle de carte : le departement choisi sur la page de publication.
export const PubLieu = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 21.3s7-6.5 7-11.3a7 7 0 1 0-14 0c0 4.8 7 11.3 7 11.3Z" />
    <Circle cx="12" cy="10" r="2.6" />
  </Svg>
)

// Trois filets degressifs : le bouton de tri de l'entete des commentaires.
export const Tri = ({ taille = 16, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round">
    <Path d="M3 6h18M7 12h10m-7 6h4" />
  </Svg>
)

// Fleche vers le haut : l'envoi d'un commentaire.
export const Envoyer = ({ taille = 23, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 12 7-7 7 7M12 5v16" />
  </Svg>
)

// Photo avec son soleil : « Ajouter une image » sous un commentaire.
export const ImageCommentaire = ({ taille = 25, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2.1} strokeLinejoin="round">
    <Rect x="2.5" y="3" width="19" height="18" rx="0.6" />
    <Circle cx="16" cy="8" r="2" fill={couleur} stroke="none" />
    <Path d="m3 17 5-5 13 7" />
  </Svg>
)

// Visage souriant echancre : « Insérer un emoji ».
export const Emoji = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.5 12A9.5 9.5 0 1 0 12 21.5L21.5 12Z" />
    <Path d="M12 21.5v-4a5.5 5.5 0 0 1 5.5-5.5h4" />
    <Ellipse cx="8" cy="8.5" rx="1.2" ry="1.7" fill={couleur} stroke="none" />
    <Ellipse cx="15" cy="8.5" rx="1.2" ry="1.7" fill={couleur} stroke="none" />
  </Svg>
)

// Arobase : « Mentionner » quelqu'un dans un commentaire.
export const Mention = ({ taille = 27, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 7v8c0 3 6 2 6-3C22 5 18 2 12 2S2 6 2 12s4 10 10 10h6" />
    <Ellipse cx="12" cy="12" rx="4" ry="5" />
  </Svg>
)

// Avion en papier du bouton d'envoi, dans le champ de saisie d'une
// conversation.
export const EnvoiMessage = ({ taille = 24, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.4 11.3 20 4.2a.6.6 0 0 1 .8.8l-7.1 16.6a.6.6 0 0 1-1.1 0l-2.5-6.4-6.4-2.5a.6.6 0 0 1 0-1.1Z" />
    <Path d="m10.6 15.2 10.1-11" />
  </Svg>
)

// Crayon sur une feuille : ouvre une nouvelle conversation depuis la boite
// de reception.
export const NouveauMessage = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5" />
    <Path d="M18.4 2.9a1.9 1.9 0 0 1 2.7 2.7l-8.2 8.2-3.4.7.7-3.4Z" />
  </Svg>
)

// ------------------------------------------------------------
// Boite de reception.
// ------------------------------------------------------------

// Silhouette avec un plus : creer un groupe, en tete de la boite.
export const NouveauGroupe = ({ taille = 26, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="10" cy="7.4" r="3.4" />
    <Path d="M3.4 20.2v-.8c0-3 2.9-4.8 6.6-4.8 1 0 2 .1 2.9.4" />
    <Path d="M17.6 14.6v5.6m-2.8-2.8h5.6" />
  </Svg>
)

// Eclair de la pastille « Activite et nouveaux abonnes ».
export const Eclair = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M13.6 2.2 5.4 13.1h5.3l-1.3 8.7 8.4-11.1h-5.4Z" fill={couleur} />
  </Svg>
)

// Bulle de dialogue pleine : pastille des demandes de messages.
export const BulleDemande = ({ taille = 26, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M12 3.4c-5 0-9 3.3-9 7.4 0 2.2 1.1 4.1 2.9 5.5l-1 3.9 4.2-2.1c.9.2 1.9.3 2.9.3 5 0 9-3.3 9-7.6S17 3.4 12 3.4Z"
      fill={couleur} />
    <Path d="M8.2 9.4h7.6M8.2 12.6h5" stroke="#3b4472" strokeWidth={1.7}
      strokeLinecap="round" />
  </Svg>
)

// Appareil photo du bout de ligne, quand la conversation attend une photo.
export const AppareilPhoto = ({ taille = 24, couleur = '#8e8e93' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 8.4a2 2 0 0 1 2-2h2.3l1.2-2h7l1.2 2H19a2 2 0 0 1 2 2v9.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <Circle cx="12" cy="12.6" r="3.4" />
  </Svg>
)

// ------------------------------------------------------------
// Onglet « Amis ».
// ------------------------------------------------------------

// Avion en papier plein : la pastille rose sous l'avatar du rail
// d'actions, qui propose d'envoyer la video a un ami.
export const AvionEnvoi = ({ taille = 14, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Path d="M21.4 3.2 2.9 10.6c-.9.4-.8 1.6.1 1.8l4.8 1.3 1.3 4.9c.2.9 1.4 1 1.8.1l7.4-18.5c.3-.7-.4-1.3-1-1Z"
      fill={couleur} />
    <Path d="M8.6 14.2 20.3 4.4" stroke="#ff2856" strokeWidth={1.4}
      strokeLinecap="round" />
  </Svg>
)

// Trois lignes suivies d'une note : la barre « Liste de lecture ».
export const ListeLecture = ({ taille = 18, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.9} strokeLinecap="round">
    <Path d="M3 6h12M3 11h12M3 16h7" />
    <Path d="M20 7v8" />
    <Ellipse cx="17.6" cy="16.4" rx="2.4" ry="2.1" fill={couleur} stroke="none" />
  </Svg>
)

// Pastille « + » du bouton « Creer » de la rangee de stories.
export const PlusStory = ({ taille = 14, couleur = '#fff' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={3} strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
)

// ------------------------------------------------------------
// Notifications systeme et analyse video.
// ------------------------------------------------------------

// Roue dentee : ouvre « Paramètres des notifications » depuis l'en-tete.
export const Engrenage = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3.2" />
    <Path d="M12 2.4h0l.5 2.3a7.6 7.6 0 0 1 2.3 1l2-1.3 1.8 1.8-1.3 2a7.6 7.6 0 0 1 1 2.3l2.3.5v2.4l-2.3.5a7.6 7.6 0 0 1-1 2.3l1.3 2-1.8 1.8-2-1.3a7.6 7.6 0 0 1-2.3 1l-.5 2.3H9.6l-.5-2.3a7.6 7.6 0 0 1-2.3-1l-2 1.3-1.8-1.8 1.3-2a7.6 7.6 0 0 1-1-2.3l-2.3-.5v-2.4l2.3-.5a7.6 7.6 0 0 1 1-2.3l-1.3-2L5 4.4l2 1.3a7.6 7.6 0 0 1 2.3-1l.5-2.3Z" />
  </Svg>
)

// Cloche barree : la ligne « Mettre en sourdine » des reglages.
export const ClocheBarree = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8.4 4.9A5.6 5.6 0 0 1 17.6 9v3.4l1.6 3.1H8.2" />
    <Path d="M6.4 9v3.4L4.8 15.5h6.6" />
    <Path d="M10.2 18.4a2 2 0 0 0 3.6 0" />
    <Path d="m3.6 3.4 16.8 17.2" />
  </Svg>
)

// Megaphone : canal « Assistance publicités ».
export const CanalPublicite = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.4 10.2v3.6a1.4 1.4 0 0 0 1.4 1.4h2.4l6.8 4V4.8l-6.8 4H4.8a1.4 1.4 0 0 0-1.4 1.4Z" />
    <Path d="M7.2 15.2v4.4h2.6l-.4-4.4" />
    <Path d="M17.4 9.4a4.2 4.2 0 0 1 0 5.2M19.8 7a7.4 7.4 0 0 1 0 10" />
  </Svg>
)

// Fusee : canal « Assistant promotion ».
export const CanalPromotion = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 15.4 8.6 13a11.4 11.4 0 0 1 3.2-6.6C14 4.2 17.4 3 20.4 3.2c.3 3-.9 6.4-3.2 8.6a11.4 11.4 0 0 1-6.2 3.6Z" />
    <Circle cx="15.2" cy="8.8" r="1.7" />
    <Path d="M8.6 13H5.4l1.4-3.2h3.2M11 15.4v3.2l3.2-1.4v-3.2" />
    <Path d="M6.6 17.4 4.2 19.8" />
  </Svg>
)

// Poignee de main stylisee : canal « Creator Marketplace ».
export const CanalMarketplace = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.2 7.4h17.6l-1.4 3.2H4.6Z" />
    <Path d="M5 10.6v8.2a1.4 1.4 0 0 0 1.4 1.4h11.2a1.4 1.4 0 0 0 1.4-1.4v-8.2" />
    <Path d="M9.4 7.4 10.4 3.6h3.2l1 3.8" />
    <Path d="M9.8 14.6h4.4" />
  </Svg>
)

// Antenne de diffusion : canal « LIVE » des reglages.
export const CanalLive = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="2.4" />
    <Path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" />
    <Path d="M5 5a9.8 9.8 0 0 0 0 14M19 19a9.8 9.8 0 0 0 0-14" />
  </Svg>
)

// Pile d'episodes : canal « Mini-série ».
export const CanalMiniSerie = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2.8" y="7" width="13.4" height="13.2" rx="2.4" />
    <Path d="M6.4 4.4h10a3.4 3.4 0 0 1 3.4 3.4v9" />
    <Path d="m8.4 11.4 4.2 2.4-4.2 2.4Z" />
  </Svg>
)

// Pastille generique de l'application, posee sur les cartes et les
// reglages : le logo de la marque n'est pas reproduit.
export const CanalApplication = ({ taille = 24, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24" fill="none"
    stroke={couleur} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
    <Path d="m9.8 8.6 6 3.4-6 3.4Z" />
  </Svg>
)

// Silhouette avec une etoile : le bouton « Studio créateur » de
// l'en-tete de l'analyse video.
export const StudioPastille = ({ taille = 18, couleur = '#111' }: P) => (
  <Svg width={taille} height={taille} viewBox="0 0 24 24">
    <Circle cx="9.4" cy="7" r="3.8" fill={couleur} />
    <Path d="M2.4 20.4v-2.2c0-3.2 3.2-5 7-5 1.2 0 2.4.2 3.4.6l-1 6.6H2.4Z" fill={couleur} />
    <Path d="m18 11.4 1.5 3.3 3.3 1.5-3.3 1.5L18 21l-1.5-3.3-3.3-1.5 3.3-1.5L18 11.4Z" fill={couleur} />
  </Svg>
)
