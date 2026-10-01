import { useEffect, useRef, useState } from 'react'
import Connexion from '../pages/Connexion'
import { Plus } from './Icones'

export default function ComptesProfil({ pseudo, avatar, onFermer }: {
  pseudo: string; avatar?: string | null; onFermer: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [ajouter, setAjouter] = useState(false)
  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null
    const element = dialog.current!
    element.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = overflow; precedent?.focus() }
  }, [])
  return <dialog ref={dialog} className="comptes-dialog" aria-labelledby="comptes-titre" onCancel={onFermer}>
    <button className="comptes-voile" aria-label="Fermer" onClick={onFermer} />
    <section className="comptes-panneau">
      <header><h2 id="comptes-titre">{ajouter ? 'Ajouter un compte' : 'Changer de compte'}</h2>
        <button className="comptes-fermer" aria-label="Fermer" onClick={onFermer}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
      </header>
      {ajouter ? <><button className="comptes-retour" onClick={() => setAjouter(false)}>Retour aux comptes</button><Connexion onSucces={onFermer} /></> : <>
        <button className="comptes-ligne" onClick={onFermer} aria-label={`${pseudo}, compte actif`}>
          <span className="comptes-avatar">{avatar ? <img src={avatar} alt="" /> : pseudo.charAt(0).toUpperCase()}</span>
          <span className="comptes-pseudo">{pseudo}</span>
          <svg className="comptes-coche" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 13 6 7L21 4" /></svg>
        </button>
        <button className="comptes-ligne" onClick={() => setAjouter(true)}><span className="comptes-avatar comptes-ajouter"><Plus taille={30} /></span><span>Ajouter un compte</span></button>
      </>}
    </section>
  </dialog>
}
