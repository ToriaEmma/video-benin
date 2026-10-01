// ============================================================
// Icones de la page Parametres — portage de la fonction `Icone`
// de app/src/pages/Parametres.tsx. Les traces sont repris a la
// lettre : seules les balises changent (svg -> Svg, etc.) et
// `currentColor` devient la couleur passee en parametre.
// ============================================================

import React from 'react'
import Svg, { Path, Circle, Rect } from 'react-native-svg'

export default function IconeParametre({ nom, taille = 24, couleur = '#111' }: {
  nom: string; taille?: number; couleur?: string
}) {
  const t = {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: couleur, strokeWidth: 1.7,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  const p = couleur  // raccourci pour les remplissages pleins

  return (
    <Svg {...t}>
      {/* Activite */}
      {nom === 'publications' && <>
        <Rect x="2.5" y="5" width="13" height="11" rx="2" />
        <Path d="m7.5 8.2 3.8 2.3-3.8 2.3V8.2Z" fill={p} stroke="none" />
        <Path d="M18 7v10.5a2 2 0 0 1-2 2H6" />
        <Path d="M20.5 9v8.5a3.5 3.5 0 0 1-3.5 3.5H8" />
      </>}
      {nom === 'contenu' && <>
        <Rect x="2.5" y="6.5" width="12.5" height="11" rx="2.5" />
        <Path d="M15 10.8 20 8v8l-5-2.8v-2.4Z" />
      </>}
      {nom === 'live' && <>
        <Rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
        <Path d="m8.5 3.5 3.5 4 3.5-4" />
        <Path d="M10.5 11.4v5.2l4.2-2.6-4.2-2.6Z" fill={p} stroke="none" />
      </>}
      {nom === 'cloche' && <>
        <Path d="M12 3a5.8 5.8 0 0 1 5.8 5.8c0 4.6.9 6.3 2.2 7.7H4c1.3-1.4 2.2-3.1 2.2-7.7A5.8 5.8 0 0 1 12 3Z" />
        <Path d="M9.8 19.5a2.4 2.4 0 0 0 4.4 0" />
      </>}
      {nom === 'sablier' && <>
        <Path d="M6.5 2.5h11M6.5 21.5h11" />
        <Path d="M8 2.5v3.2c0 2.1 4 3.6 4 6.3 0-2.7 4-4.2 4-6.3V2.5" />
        <Path d="M8 21.5v-3.2c0-2.1 4-3.6 4-6.3 0 2.7 4 4.2 4 6.3v3.2" />
        <Path d="M9.5 18.5c.7-1.2 2.5-1.9 2.5-3.2 0 1.3 1.8 2 2.5 3.2h-5Z" fill={p} stroke="none" />
      </>}
      {nom === 'famille' && <>
        <Path d="M3.5 10.2 12 3.2l8.5 7v9.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9.3Z" />
        <Path d="M12 16.3c-1.7-1.3-2.8-2.1-2.8-3.2A1.4 1.4 0 0 1 12 12.3a1.4 1.4 0 0 1 2.8.8c0 1.1-1.1 1.9-2.8 3.2Z" fill={p} stroke="none" />
      </>}

      {/* Compte */}
      {nom === 'compte' && <>
        <Circle cx="12" cy="7.5" r="3.8" fill={p} stroke="none" />
        <Path d="M4.5 21c0-4.1 3.4-6.6 7.5-6.6s7.5 2.5 7.5 6.6" fill={p} stroke="none" />
      </>}
      {nom === 'bouclier' && (
        <Path d="M12 2.6 4.5 5.8v6.4c0 4.7 3.2 8 7.5 9.2 4.3-1.2 7.5-4.5 7.5-9.2V5.8L12 2.6Z" fill={p} stroke="none" />
      )}
      {nom === 'partage' && (
        <Path d="M13.5 3.2v4.4C6.5 8 3.2 12 2.6 18.8c2.8-3.7 6.2-4.7 10.9-4.7v4.4l8-7.6-8-7.7Z" fill={p} stroke="none" />
      )}

      {/* Visibilite */}
      {nom === 'cadenas' && <>
        <Rect x="4.8" y="10" width="14.4" height="11.2" rx="2.5" fill={p} stroke="none" />
        <Path d="M8.2 10V6.8a3.8 3.8 0 0 1 7.6 0V10" />
      </>}

      {/* Preferences */}
      {nom === 'musique' && <>
        <Path d="M9.5 17.5V5.2l10-2.2v12" />
        <Circle cx="6.8" cy="17.8" r="2.8" fill={p} stroke="none" />
        <Circle cx="16.8" cy="15.6" r="2.8" fill={p} stroke="none" />
      </>}
      {nom === 'messagerie' && <>
        <Circle cx="8.5" cy="6.8" r="3.4" fill={p} stroke="none" />
        <Path d="M2 19.5c0-3.9 2.8-6.3 6.5-6.3 1.3 0 2.4.3 3.4.8" fill={p} stroke="none" />
        <Path d="M14.5 14.5h7m0 0-2-2m2 2-2 2M21.5 19.5h-7m0 0 2-2m-2 2 2 2" />
      </>}
      {nom === 'horloge' && <>
        <Circle cx="12" cy="12" r="9.2" />
        <Path d="M12 6.4V12l3.9 2.4" />
      </>}
      {nom === 'public' && <>
        <Circle cx="9" cy="7.8" r="3.4" fill={p} stroke="none" />
        <Circle cx="17.2" cy="8.8" r="2.6" fill={p} stroke="none" />
        <Path d="M2.5 19.8c0-3.8 2.8-6.2 6.5-6.2s6.5 2.4 6.5 6.2" fill={p} stroke="none" />
        <Path d="M17 13.6c2.7 0 4.5 1.8 4.5 4.6" fill={p} stroke="none" />
      </>}
      {nom === 'pub' && <>
        <Path d="M3 9.8v4.4a1 1 0 0 0 1 1h2.4L12 19.6V4.4L6.4 8.8H4a1 1 0 0 0-1 1Z" fill={p} stroke="none" />
        <Path d="M15.4 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.8 7.8 0 0 1 0 10.8" />
      </>}
      {nom === 'lecture' && <>
        <Rect x="2.6" y="4.6" width="18.8" height="14.8" rx="3" />
        <Path d="M10 9.2v5.6l4.6-2.8L10 9.2Z" fill={p} stroke="none" />
      </>}
      {nom === 'langues' && <>
        <Rect x="2.8" y="2.8" width="18.4" height="18.4" rx="4" />
        <Path d="m8.2 16.4 3.8-8.8 3.8 8.8M9.6 13.4h4.8" />
      </>}
      {nom === 'affichage' && (
        <Path d="M20.8 14.2A8.8 8.8 0 0 1 9.8 3.2a9 9 0 1 0 11 11Z" fill={p} stroke="none" />
      )}
      {nom === 'accessibilite' && <>
        <Circle cx="12" cy="12" r="9.2" fill={p} stroke="none" />
        <Circle cx="12" cy="7.2" r="1.4" fill="#fff" stroke="none" />
        <Path d="M8 10.2h8M12 10.2v4.2m0 0-1.9 3.6m1.9-3.6 1.9 3.6" stroke="#fff" strokeWidth={1.6} />
      </>}
      {nom === 'localisation' && <>
        <Circle cx="8.6" cy="7" r="3.4" fill={p} stroke="none" />
        <Path d="M2 19.6c0-3.8 2.7-6.2 6.6-6.2h.6" fill={p} stroke="none" />
        <Path d="M17.8 21.4s3.6-3.6 3.6-6.2a3.6 3.6 0 1 0-7.2 0c0 2.6 3.6 6.2 3.6 6.2Z" fill={p} stroke="none" />
        <Circle cx="17.8" cy="15" r="1.2" fill="#fff" stroke="none" />
      </>}

      {/* Cache et donnees */}
      {nom === 'horsligne' && <>
        <Path d="M6.4 18.6a4.9 4.9 0 0 1-1.9-9.4 5.9 5.9 0 0 1 11.2-1.8 4.9 4.9 0 0 1 4.6 5.6" fill={p} stroke="none" />
        <Circle cx="12" cy="15.6" r="5.4" fill={p} stroke="none" />
        <Path d="M12 13v5m0 0-2-2m2 2 2-2" stroke="#fff" strokeWidth={1.6} />
      </>}
      {nom === 'corbeille' && <>
        <Path d="M3.8 6.4h16.4" />
        <Path d="M9.2 6.4V4.2A1.2 1.2 0 0 1 10.4 3h3.2a1.2 1.2 0 0 1 1.2 1.2v2.2" />
        <Path d="M5.8 6.4 6.9 20a1.8 1.8 0 0 0 1.8 1.6h6.6a1.8 1.8 0 0 0 1.8-1.6l1.1-13.6" />
        <Path d="M10.2 10.4v6.8M13.8 10.4v6.8" />
      </>}
      {nom === 'economie' && <>
        <Path d="M12 2.4C7.8 7.2 4.8 9.8 4.8 13.8a7.2 7.2 0 0 0 14.4 0c0-4-3-6.6-7.2-11.4Z" fill={p} stroke="none" />
        <Path d="M8 14.4h2.2l1.6-2.6 1.8 4.4 1.4-1.8h1.2" stroke="#fff" strokeWidth={1.6} />
      </>}

      {/* Assistance */}
      {nom === 'aide' && <>
        <Path d="M4.2 13.4v-1.2a7.8 7.8 0 0 1 15.6 0v1.2" />
        <Rect x="2.4" y="12.8" width="4.2" height="6.4" rx="2.1" fill={p} stroke="none" />
        <Rect x="17.4" y="12.8" width="4.2" height="6.4" rx="2.1" fill={p} stroke="none" />
        <Path d="M19.8 19.2v.4a2.6 2.6 0 0 1-2.6 2.6h-3.4" />
      </>}
      {nom === 'confidentialite' && <>
        <Rect x="4.4" y="10" width="15.2" height="11.4" rx="2.6" fill={p} stroke="none" />
        <Path d="M8 10V6.8a4 4 0 0 1 8 0V10" />
        <Circle cx="12" cy="15.4" r="1.5" fill="#fff" stroke="none" />
        <Path d="M12 16.4v2" stroke="#fff" strokeWidth={1.6} />
      </>}
      {nom === 'info' && <>
        <Circle cx="12" cy="12" r="9.2" fill={p} stroke="none" />
        <Path d="M12 10.8v6" stroke="#fff" strokeWidth={1.8} />
        <Circle cx="12" cy="7.6" r="1.2" fill="#fff" stroke="none" />
      </>}

      {/* Connexion */}
      {nom === 'changer' && <>
        <Circle cx="12" cy="12" r="9.2" fill={p} stroke="none" />
        <Path d="M8.4 10.2h7.2m0 0-2.2-2.2m2.2 2.2-2.2 2.2M15.6 13.8H8.4m0 0 2.2-2.2m-2.2 2.2 2.2 2.2" stroke="#fff" strokeWidth={1.5} />
      </>}
      {nom === 'deconnexion' && <>
        <Circle cx="12" cy="12" r="9.2" fill={p} stroke="none" />
        <Path d="M13.8 8.2h-3.6v7.6h3.6" stroke="#fff" strokeWidth={1.6} />
        <Path d="M10.4 12h6.4m0 0-2.2-2.2m2.2 2.2-2.2 2.2" stroke="#fff" strokeWidth={1.6} />
      </>}
    </Svg>
  )
}
