// ============================================================
// Grille des brouillons, et son mode selection.
// ============================================================

import { useEffect, useState } from 'react'
import { Chevron, NoteEtiquette } from '../components/Icones'
import { poidsLisible, jourEtMois } from '../lib/demo'
import { apiBrouillons, type BrouillonApi } from '../lib/api'
import './brouillons.css'

// Tri local : l'API renvoie les brouillons du plus recent au plus ancien,
// le reclassement par poids se fait donc ici. Les effets et les modeles ne
// sont pas enregistres, ils ne peuvent pas servir de filtre.
const TRIS = [
  { cle: 'date', libelle: 'Trier par : date' },
  { cle: 'taille', libelle: 'Trier par : taille du fichier' },
] as const

// Une case de la grille : l'apercu du brouillon, sa date, et selon le mode
// soit son poids, soit le rond de selection.
function Case({ item, selection, choisi, onPresser }: {
  item: BrouillonApi
  selection: boolean
  choisi: boolean
  onPresser: () => void
}) {
  const { jour, mois } = jourEtMois(item.date)

  return (
    <button className="brl-case" onClick={onPresser}
      aria-pressed={selection ? choisi : undefined}
      aria-label={item.legende || `Brouillon du ${jour} ${mois}`}>
      <video src={item.url} muted playsInline preload="metadata" />

      {/* Hors selection, la date occupe le coin haut gauche. */}
      {!selection && (
        <span className="brl-date">
          <b>{jour}</b>
          <i>{mois}</i>
        </span>
      )}

      {/* En selection, un rond vide ou plein prend le coin haut droit. */}
      {selection && (
        <span className={choisi ? 'brl-rond brl-rond-choisi' : 'brl-rond'}>
          {choisi && '✓'}
        </span>
      )}

      {/* L'API ne retient ni le nombre de clips ni le son choisi : la pile
          de calques et l'etiquette ne s'affichent donc plus. La legende
          prend leur place quand le brouillon en porte une. */}
      {selection
        ? <span className="brl-poids">{poidsLisible(item.octets)}</span>
        : !!item.legende && (
          <span className="brl-etiquette">
            <NoteEtiquette taille={12} />
            <span>{item.legende}</span>
          </span>
        )}
    </button>
  )
}

export default function Brouillons({ onRetour, onPublier }: {
  onRetour: () => void
  // Reprend un brouillon pour le publier.
  onPublier: (b: BrouillonApi) => void
}) {
  const [selection, setSelection] = useState(false)
  const [choisis, setChoisis] = useState<string[]>([])
  const [confirmation, setConfirmation] = useState(false)
  const [brouillons, setBrouillons] = useState<BrouillonApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Incremente par le bouton de reprise : relance le chargement de la grille.
  const [reprise, setReprise] = useState(0)

  useEffect(() => {
    let valable = true
    setChargement(true)
    setErreur('')
    apiBrouillons.liste()
      .then(b => { if (valable) setBrouillons(b) })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [reprise])

  const [tri, setTri] = useState<'date' | 'taille'>('date')

  const poidsTotal = brouillons.reduce((t, b) => t + b.octets, 0)

  const rangees = tri === 'taille'
    ? [...brouillons].sort((a, b) => b.octets - a.octets)
    : brouillons

  const quitterSelection = () => {
    setSelection(false); setChoisis([]); setConfirmation(false)
  }

  const basculer = (id: string) => setChoisis(l =>
    l.includes(id) ? l.filter(x => x !== id) : [...l, id])

  const toutSelectionner = () => setChoisis(
    choisis.length === brouillons.length ? [] : brouillons.map(b => b.id))

  // Chaque brouillon se retire par sa propre requete : l'API n'offre pas
  // de suppression groupee. Un echec laisse la grille se recharger pour
  // refleter ce qui a reellement ete retire.
  const supprimer = async () => {
    const vises = choisis
    quitterSelection()
    const resultats = await Promise.allSettled(
      vises.map(id => apiBrouillons.supprimer(id)))
    const echec = resultats.find(r => r.status === 'rejected')
    if (echec && echec.status === 'rejected') {
      setErreur(echec.reason instanceof Error
        ? echec.reason.message : 'Suppression impossible')
    }
    setReprise(n => n + 1)
  }

  // « Publier » reprend le premier brouillon retenu : l'ecran de
  // publication ne traite qu'une video a la fois.
  const publier = () => {
    const premier = brouillons.find(b => choisis.includes(b.id))
    if (premier) onPublier(premier)
  }

  return (
    <section className="brl-page">
      {/* La barre du haut change selon le mode. */}
      <header className="brl-barre">
        {selection ? <>
          <button onClick={toutSelectionner}>
            {choisis.length === brouillons.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button onClick={quitterSelection}>Annuler</button>
        </> : <>
          <button className="brl-retour" aria-label="Retour" onClick={onRetour}>
            <Chevron taille={24} />
          </button>
          <button onClick={() => setSelection(true)}>Sélectionner</button>
        </>}
      </header>

      <h1 className="brl-titre">
        {brouillons.length} brouillon{brouillons.length > 1 ? 's' : ''}
        {' · '}{poidsLisible(poidsTotal)}
      </h1>

      <div className="brl-filtres">
        {TRIS.map(t => (
          <button key={t.cle} className={tri === t.cle ? 'brl-tri-actif' : ''}
            aria-pressed={tri === t.cle} onClick={() => setTri(t.cle)}>
            {t.libelle}
          </button>
        ))}
      </div>

      <div className="brl-grille">
        {chargement
          ? <p className="brl-vide">Chargement…</p>
          : erreur
            ? <div className="brl-echec">
                <p role="alert">{erreur}</p>
                <button onClick={() => setReprise(n => n + 1)}>Réessayer</button>
              </div>
            : brouillons.length === 0
              ? <p className="brl-vide">Aucun brouillon</p>
              : rangees.map(b => (
                <Case key={b.id} item={b} selection={selection}
                  choisi={choisis.includes(b.id)}
                  onPresser={() => selection ? basculer(b.id) : onPublier(b)} />
              ))}
      </div>

      {/* En selection, les deux actions occupent le pied de page. */}
      {selection && (
        <footer className="brl-pied">
          {confirmation ? <>
            <span className="brl-confirme">
              Supprimer {choisis.length} brouillon{choisis.length > 1 ? 's' : ''} ?
            </span>
            <button className="brl-annuler" onClick={() => setConfirmation(false)}>
              Annuler
            </button>
            <button className="brl-publier" onClick={supprimer}>
              Supprimer
            </button>
          </> : <>
            <button className="brl-supprimer" disabled={choisis.length === 0}
              onClick={() => setConfirmation(true)}>Supprimer</button>
            <button className="brl-publier" disabled={choisis.length === 0}
              onClick={publier}>Publier</button>
          </>}
        </footer>
      )}
    </section>
  )
}
