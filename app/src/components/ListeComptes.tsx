// ============================================================
// Panneau des abonnes ou des abonnements d'un profil, ouvert depuis
// les compteurs « Suivis » et « Followers ».
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { apiInteractions, type CompteApi } from '../lib/api'
import LigneCompte from './LigneCompte'

export type SensListe = 'abonnes' | 'abonnements'

export default function ListeComptes({ pseudo, sens, onFermer, onVisiter }: {
  pseudo: string
  sens: SensListe
  onFermer: () => void
  onVisiter?: (pseudo: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [comptes, setComptes] = useState<CompteApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null
    const element = dialog.current!
    element.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      precedent?.focus()
    }
  }, [])

  useEffect(() => {
    let valable = true
    const demande = sens === 'abonnes'
      ? apiInteractions.abonnes(pseudo, { limite: 50 })
      : apiInteractions.abonnements(pseudo, { limite: 50 })
    demande
      .then(c => { if (valable) setComptes(c) })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [pseudo, sens])

  const titre = sens === 'abonnes' ? 'Followers' : 'Suivis'
  const vide = sens === 'abonnes'
    ? 'Personne ne suit encore ce compte.'
    : 'Ce compte ne suit encore personne.'

  return (
    <dialog ref={dialog} className="comptes-dialog" aria-labelledby="liste-comptes-titre" onCancel={onFermer}>
      <button className="comptes-voile" aria-label="Fermer" onClick={onFermer} />
      <section className="comptes-panneau">
        <header>
          <h2 id="liste-comptes-titre">{titre}</h2>
          <button className="comptes-fermer" aria-label="Fermer" onClick={onFermer}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {chargement ? (
          <p className="comptes-liste-etat">Chargement…</p>
        ) : erreur ? (
          <p className="comptes-liste-etat" role="alert">{erreur}</p>
        ) : comptes.length === 0 ? (
          <p className="comptes-liste-etat">{vide}</p>
        ) : (
          comptes.map(c => (
            <LigneCompte key={c.id} compte={c} onVisiter={p => { onFermer(); onVisiter?.(p) }} />
          ))
        )}
      </section>
    </dialog>
  )
}
