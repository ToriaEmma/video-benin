// ============================================================
// Grille des brouillons, et son mode selection.
// ============================================================

import { useState } from 'react'
import {
  Chevron, Calques, NoteEtiquette, EtincelleEtiquette,
} from '../components/Icones'
import {
  etatDemo, poidsLisible, jourEtMois, type BrouillonDemo,
} from '../lib/demo'
import './brouillons.css'

// Filtres proposes sous le titre. Aucun n'est actif pour l'instant : ils
// attendent le tri, les effets et les modeles.
const FILTRES = ['Trier par : taille du fichier', 'Effet utilisé', 'Modèle utilisé']

// Une case de la grille : l'apercu du brouillon, sa date, et selon le mode
// soit son poids, soit le rond de selection.
function Case({ item, selection, choisi, onPresser }: {
  item: BrouillonDemo
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

      {/* Hors selection, la pile de calques signale les brouillons a
          plusieurs clips ; en selection, le poids s'affiche. */}
      {!selection && (item.clips ?? 1) > 1 && (
        <span className="brl-calques"><Calques taille={18} /></span>
      )}

      {selection
        ? <span className="brl-poids">{poidsLisible(item.octets)}</span>
        : !!item.etiquette && (
          <span className="brl-etiquette">
            {item.etiquette.type === 'son'
              ? <NoteEtiquette taille={12} />
              : <EtincelleEtiquette taille={12} />}
            <span>{item.etiquette.nom}</span>
          </span>
        )}
    </button>
  )
}

export default function Brouillons({ onRetour, onPublier }: {
  onRetour: () => void
  // Reprend un brouillon pour le publier.
  onPublier: (b: BrouillonDemo) => void
}) {
  const [selection, setSelection] = useState(false)
  const [choisis, setChoisis] = useState<string[]>([])
  // Force le reaffichage apres une suppression.
  const [, setRevision] = useState(0)
  const [confirmation, setConfirmation] = useState(false)

  const brouillons = etatDemo.brouillons
  const poidsTotal = brouillons.reduce((t, b) => t + b.octets, 0)

  const quitterSelection = () => {
    setSelection(false); setChoisis([]); setConfirmation(false)
  }

  const basculer = (id: string) => setChoisis(l =>
    l.includes(id) ? l.filter(x => x !== id) : [...l, id])

  const toutSelectionner = () => setChoisis(
    choisis.length === brouillons.length ? [] : brouillons.map(b => b.id))

  const supprimer = () => {
    etatDemo.brouillons = etatDemo.brouillons.filter(b => !choisis.includes(b.id))
    quitterSelection(); setRevision(n => n + 1)
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
        {FILTRES.map(f => <button key={f}>{f}</button>)}
      </div>

      <div className="brl-grille">
        {brouillons.length === 0
          ? <p className="brl-vide">Aucun brouillon</p>
          : brouillons.map(b => (
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
