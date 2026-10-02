// ============================================================
// Feuille qui remonte du bas de l'ecran, posee sur la page assombrie.
//
// Jumelle de mobile/src/composants/Feuille.tsx : le titre est centre, la
// croix de fermeture a droite, et le voile du dessus referme la feuille.
// ============================================================

import { FeuilleCroix } from './Icones'
import './feuille.css'

export default function Feuille({
  visible, titre, onFermer, croixCerclee = true, fondGris = false, children,
}: {
  visible: boolean
  titre: string
  onFermer: () => void
  // La croix de « Ajouter un lien » est nue, celle des autres feuilles
  // est posee sur une pastille grise.
  croixCerclee?: boolean
  // « Partager sur » pose ses applications sur un fond gris clair.
  fondGris?: boolean
  children: React.ReactNode
}) {
  if (!visible) return null

  return (
    <div className="fle-fond">
      <button className="fle-voile" aria-label="Fermer" onClick={onFermer} />
      <section className={`fle-feuille${fondGris ? ' fle-grise' : ''}`} aria-label={titre}>
        <header className="fle-entete">
          <h2>{titre}</h2>
          <button className={croixCerclee ? 'fle-fermer fle-cercle' : 'fle-fermer'}
            aria-label="Fermer" onClick={onFermer}>
            <FeuilleCroix taille={croixCerclee ? 17 : 21} />
          </button>
        </header>
        <div className="fle-corps">{children}</div>
      </section>
    </div>
  )
}
