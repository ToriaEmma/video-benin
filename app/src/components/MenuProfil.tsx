import { useEffect, useRef, useState } from 'react'
import { Chevron, Studio } from './Icones'

const groupes = [
  { titre: 'Ressources', lignes: [{ nom: 'Solde', icone: 'solde' }] },
  { titre: 'Outils personnels', lignes: [
    { nom: 'Centre des activités', icone: 'activite' },
    { nom: 'Vidéos hors ligne', icone: 'telecharger' },
    { nom: 'Ton code QR', icone: 'qr' },
    { nom: 'Ta musique', icone: 'musique' },
  ] },
  { titre: 'Outils de création et professionnels', lignes: [{ nom: 'Studio créateur', icone: 'studio' }] },
  { titre: '', lignes: [{ nom: 'Paramètres et confidentialité', icone: 'parametres' }] },
]

function Icone({ type }: { type: string }) {
  if (type === 'studio') return <Studio taille={23} />
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'solde' && <><path d="M3 7V5l15-3v5"/><rect x="2" y="7" width="20" height="15" rx="2"/><circle cx="17" cy="14" r="1" fill="currentColor"/></>}
    {type === 'activite' && <><circle cx="12" cy="12" r="10"/><path d="M12 5v7l5 3"/></>}
    {type === 'telecharger' && <><path d="M6 20a5 5 0 0 1-2-9 6 6 0 0 1 11-5 5 5 0 0 1 6 6 4 4 0 0 1-2 8Z"/><path d="M12 8v8m-4-4 4 4 4-4"/></>}
    {type === 'qr' && <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 14h2v3h4v4h-3m-4 0v-2m7-6v1"/></>}
    {type === 'musique' && <><path d="M8 18V5l12-3v14M8 8l12-3"/><ellipse cx="5" cy="19" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="17" cy="17" rx="3" ry="2.5" fill="currentColor"/></>}
    {type === 'parametres' && <><path d="m10 2-.7 2.3-2 .9-2.3-.7-2 3 1.5 1.9-.2 2.3L2 13l1 3.5 2.5.3 1.4 1.7.1 2.5 3.5 1 1.5-2 2.2-.3 2 1.5 3-2-.7-2.5 1-2 2-1V10l-2.3-.7-1-2 .8-2.3-3-2-2 1.5-2.2-.2L13 2Z"/><circle cx="12" cy="12" r="5.5"/></>}
  </svg>
}

export default function MenuProfil({ onFermer, onDeconnecter, onSolde, onParametres }: { onFermer: () => void; onDeconnecter: () => void; onSolde: () => void; onParametres: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [selection, setSelection] = useState<string | null>(null)
  useEffect(() => {
    const node = dialog.current
    const previous = document.activeElement as HTMLElement | null
    node?.showModal()
    return () => { node?.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="menu-profil-dialog" aria-label="Menu du profil" onCancel={onFermer}>
    <button className="menu-profil-voile" aria-label="Fermer le menu" onClick={onFermer} />
    <section className="menu-profil-panneau">
      {selection ? <>
        <button className="menu-profil-retour" onClick={() => setSelection(null)}><Chevron taille={22} />Retour</button>
        <h2 className="menu-profil-titre">{selection}</h2>
        {selection === 'Paramètres et confidentialité'
          ? <button className="menu-profil-deconnexion" onClick={onDeconnecter}>Se déconnecter</button>
          : <p className="menu-profil-indisponible" role="status">Cette fonctionnalité sera disponible prochainement.</p>}
      </> : groupes.map((groupe, i) => <div className="menu-profil-groupe" key={i}>
        {groupe.titre && <h2>{groupe.titre}</h2>}
        {groupe.lignes.map(ligne => <button className="menu-profil-ligne" key={ligne.nom} onClick={() => ligne.nom === 'Solde' ? onSolde() : ligne.nom === 'Paramètres et confidentialité' ? onParametres() : setSelection(ligne.nom)}>
          <Icone type={ligne.icone} /><span>{ligne.nom}</span><span className="menu-profil-chevron"><Chevron taille={18} /></span>
        </button>)}
      </div>)}
    </section>
  </dialog>
}
