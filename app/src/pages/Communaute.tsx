// ============================================================
// Onglet « Communauté » du fil : mosaique a deux colonnes sur fond
// blanc.
//
// La mosaique est faite de deux colonnes posees cote a cote dans un
// seul defilement, et non d'une grille CSS a deux colonnes : celle-ci
// alignerait les cartes rangee par rangee, et le decalage qui fait
// toute la mosaique disparaitrait.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  etatDemo, abreger, communauteDemo, type EntreeCommunaute,
} from '../lib/demo'
import { Diaporama, LectureVignette, CoeurPetit } from '../components/Icones'
import './communaute.css'

// Hauteur de la vignette d'une entree. Le rapport vient des donnees, mais
// une entree qui n'en porterait pas retombe sur une valeur tiree de son
// identifiant : deux colonnes de vignettes identiques ne decaleraient pas.
function rapportDe(entree: EntreeCommunaute) {
  if (entree.rapport) return entree.rapport
  let somme = 0
  for (let i = 0; i < entree.id.length; i++) somme += entree.id.charCodeAt(i)
  return 1 + (somme % 50) / 100
}

function Carte({ entree, onOuvrir }: {
  entree: EntreeCommunaute
  onOuvrir: (videoId: string) => void
}) {
  const video = etatDemo.videos.find(v => v.id === entree.videoId)
  const diaporama = (entree.nbPhotos ?? 0) > 1
  const ref = useRef<HTMLVideoElement>(null)

  // La vignette est la premiere trame de la video : le lecteur reste en
  // pause, seul le poster implicite est montre.
  useEffect(() => {
    const el = ref.current
    if (el) el.pause()
  }, [])

  return (
    <button className="com-carte" onClick={() => onOuvrir(entree.videoId)}>
      <span className="com-vignette"
        style={{ aspectRatio: `1 / ${rapportDe(entree)}` }}>
        {video
          ? <video ref={ref} src={video.url} muted playsInline preload="metadata" />
          : <span className="com-vignette-vide" />}

        {/* Pastille du coin : pile de carres pour un diaporama, triangle
            de lecture pour une video. */}
        <span className="com-pastille">
          {diaporama ? <Diaporama taille={14} /> : <LectureVignette taille={13} />}
          {diaporama && <b>{entree.nbPhotos}</b>}
        </span>
      </span>

      <span className="com-corps">
        <span className="com-legende">{entree.legende}</span>
        <span className="com-auteur">
          <i className="com-avatar">{entree.pseudo.charAt(0).toUpperCase()}</i>
          <span className="com-pseudo">{entree.pseudo}</span>
          <span className="com-aime">
            <CoeurPetit taille={13} />
            {abreger(entree.nbAime)}
          </span>
        </span>
      </span>
    </button>
  )
}

export default function Communaute({ onOuvrir }: {
  // Appelee avec l'identifiant de la video touchee : le fil bascule sur
  // « Pour toi » et s'y ouvre.
  onOuvrir: (videoId: string) => void
}) {
  // La largeur de colonne sert a equilibrer les deux piles : on la mesure
  // une fois, les rapports des entrees ne changeant pas ensuite.
  const page = useRef<HTMLDivElement>(null)
  const [largeur, setLargeur] = useState(180)

  useEffect(() => {
    const el = page.current
    if (!el) return
    const mesurer = () => setLargeur(Math.max(80, (el.clientWidth - 6) / 2))
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [])

  // Repartition en deux colonnes : chaque entree rejoint la colonne la
  // plus courte, ce qui garde les deux colonnes de hauteurs voisines
  // tout en les decalant l'une par rapport a l'autre.
  const colonnes = useMemo(() => {
    const gauche: EntreeCommunaute[] = []
    const droite: EntreeCommunaute[] = []
    let hGauche = 0
    let hDroite = 0
    for (const entree of communauteDemo) {
      // Vignette plus corps de carte : approximation suffisante pour
      // equilibrer les colonnes.
      const h = largeur * rapportDe(entree) + 78
      if (hGauche <= hDroite) { gauche.push(entree); hGauche += h }
      else { droite.push(entree); hDroite += h }
    }
    return { gauche, droite }
  }, [largeur])

  return (
    <div className="com-page" ref={page}>
      <div className="com-colonne">
        {colonnes.gauche.map(e => (
          <Carte key={e.id} entree={e} onOuvrir={onOuvrir} />
        ))}
      </div>
      <div className="com-colonne">
        {colonnes.droite.map(e => (
          <Carte key={e.id} entree={e} onOuvrir={onOuvrir} />
        ))}
      </div>
    </div>
  )
}
