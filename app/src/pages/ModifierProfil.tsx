import { useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { Chevron, Menu } from '../components/Icones'

export default function ModifierProfil({ onRetour }: { onRetour: () => void }) {
  const { profil, modifierProfil } = useAuth()
  const photo = useRef<HTMLInputElement>(null)
  const bioInput = useRef<HTMLTextAreaElement>(null)
  const [champ, setChamp] = useState<'nom' | 'pseudo' | 'bio' | null>(null)
  const [valeur, setValeur] = useState('')
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)
  if (!profil) return null
  const ouvrir = (cle: 'nom' | 'pseudo' | 'bio') => { setChamp(cle); setValeur(profil[cle] ?? profil.pseudo); setMessage('') }
  const sauver = async () => {
    if (!champ) return
    if (champ === 'pseudo' && !/^[a-zA-Z0-9_.]{3,24}$/.test(valeur.trim())) { setMessage('Utilise 3 à 24 lettres, chiffres, points ou tirets bas.'); return }
    setOccupe(true)
    try { await modifierProfil({ [champ]: valeur.trim() }); setChamp(null); setMessage('') }
    catch { setMessage('Impossible d’enregistrer. Réessaie ou choisis un autre nom d’utilisateur.') }
    finally { setOccupe(false) }
  }
  if (champ) {
    const titre = champ === 'nom' ? 'Nom' : champ === 'pseudo' ? 'Nom d’utilisateur' : 'Bio'
    const limite = champ === 'nom' ? 30 : champ === 'pseudo' ? 24 : 160
    const valide = champ === 'bio' || (champ === 'nom' ? valeur.trim().length > 0 : /^[a-zA-Z0-9_.]{3,24}$/.test(valeur.trim()))
    const change = valeur.trim() !== (profil[champ] ?? profil.pseudo)
    return <div className="modifier-profil edition-champ">
      <header className="edition-actions"><button onClick={() => { setChamp(null); setMessage('') }}>Annuler</button><button disabled={occupe || !change || !valide || valeur.length > limite} onClick={sauver}>{occupe ? 'Enregistrement…' : 'Enregistrer'}</button></header>
      <h1>{titre}</h1>
      <p className="edition-aide">{champ === 'nom' ? 'Ton nom est le surnom affiché sur ton profil. Il peut être différent de ton nom d’utilisateur.' : champ === 'pseudo' ? 'Les noms d’utilisateur ne peuvent contenir que des lettres, des chiffres, des tirets bas et des points.' : 'Tu peux modifier ta biographie à tout moment.'}</p>
      <div className="edition-saisie">{champ === 'bio' ? <textarea ref={bioInput} aria-label={titre} autoFocus value={valeur} maxLength={limite} onChange={e => setValeur(e.target.value)} /> : <><input aria-label={titre} autoFocus value={valeur} maxLength={limite} autoCapitalize={champ === 'pseudo' ? 'none' : 'words'} spellCheck={champ !== 'pseudo'} onChange={e => setValeur(e.target.value)} />{champ === 'pseudo' && <>{valide && <svg aria-label="Format valide" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ff2856" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 6 9-12" /></svg>}<button className="edition-effacer" aria-label="Effacer" onClick={() => setValeur('')}>×</button></>}</>}</div>
      <div className="edition-compteur">{valeur.length}/{limite}</div>
      {message && <p className="modifier-message" role="alert">{message}</p>}
      {champ === 'bio' && <button className="edition-mention" onClick={() => {
        const element = bioInput.current
        const debut = element?.selectionStart ?? valeur.length
        const fin = element?.selectionEnd ?? debut
        if (valeur.length - (fin - debut) >= limite) return
        setValeur(valeur.slice(0, debut) + '@' + valeur.slice(fin))
        requestAnimationFrame(() => { element?.focus(); element?.setSelectionRange(debut + 1, debut + 1) })
      }}>@ Mention</button>}
    </div>
  }
  return <div className="modifier-profil">
    <header className="modifier-entete"><button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button><h1>Modifier le profil</h1></header>
    <>
      <button className="modifier-photo" onClick={() => photo.current?.click()}><span className="modifier-photo-rond">{profil.avatar_url ? <img src={profil.avatar_url} alt="Photo de profil" /> : <span>{profil.pseudo.charAt(0).toUpperCase()}</span>}<svg width="38" height="38" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path fillRule="evenodd" d="M8 4 6 6H4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-2l-2-2H8Zm4 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /></svg></span><span>Changer de photo</span></button>
      <input ref={photo} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async e => {
        const fichier = e.target.files?.[0]; if (!fichier) return
        if (fichier.size > 2_000_000) { setMessage('Choisis une image de moins de 2 Mo.'); return }
        const lecteur = new FileReader()
        lecteur.onload = async () => { try { await modifierProfil({ avatar_url: String(lecteur.result) }); setMessage('Photo enregistrée.') } catch { setMessage('Impossible d’enregistrer la photo.') } }
        lecteur.readAsDataURL(fichier)
      }} />
      <div className="modifier-carte">
        <button className="modifier-ligne" onClick={() => ouvrir('nom')}><span>Nom</span><strong>{profil.nom ?? profil.pseudo}</strong><Chevron taille={18} /></button>
        <button className="modifier-ligne" onClick={() => ouvrir('pseudo')}><span>Nom<br />d’utilisateur</span><strong>{profil.pseudo}</strong><Chevron taille={18} /></button>
      </div>
      <h2>Informations de base</h2>
      <div className="modifier-carte"><button className="modifier-ligne modifier-bio" onClick={() => ouvrir('bio')}><span>Bio</span><strong>{profil.bio || 'Ajouter une bio'}</strong><Chevron taille={18} /></button></div>
      <h2>Modifier l’ordre d’affichage</h2>
      <div className="modifier-carte modifier-studio"><strong>Studio créateur</strong><Menu taille={20} /></div>
    </>
    {message && <p className="modifier-message" role="status">{message}</p>}
  </div>
}
