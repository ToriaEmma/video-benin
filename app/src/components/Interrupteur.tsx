import './interrupteur.css'

// Interrupteur des pages de reglages : piste cyan une fois active, grise au
// repos, avec la pastille blanche qui glisse d'un bord a l'autre.
export default function Interrupteur({ actif, onChange, libelle }: {
  actif: boolean
  onChange: (v: boolean) => void
  // Repris en aria-label : la piste n'a aucun texte visible.
  libelle?: string
}) {
  return (
    <button type="button" role="switch" aria-checked={actif} aria-label={libelle}
      className={`itr-piste${actif ? ' itr-actif' : ''}`}
      onClick={() => onChange(!actif)}>
      <span className="itr-pastille" />
    </button>
  )
}
