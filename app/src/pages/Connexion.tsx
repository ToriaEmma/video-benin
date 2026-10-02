import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { Menu, Personne, ChevronDroit } from '../components/Icones'
import './connexion.css'

// Comptes deja utilises sur ce navigateur. La liste s'ecrit a chaque
// connexion reussie : tant qu'on ne s'est jamais connecte, elle est vide
// et l'ecran demande directement les identifiants.
const CLE_CONNUS = 'tok229-comptes-connus-v1'

type CompteConnu = { pseudo: string; telephone: string }

function lireConnus(): CompteConnu[] {
  try {
    const brut = localStorage.getItem(CLE_CONNUS)
    return brut ? JSON.parse(brut) : []
  } catch { return [] }
}

function retenirCompte(pseudo: string, telephone: string) {
  try {
    const liste = lireConnus().filter(c => c.pseudo !== pseudo)
    localStorage.setItem(CLE_CONNUS,
      JSON.stringify([{ pseudo, telephone }, ...liste].slice(0, 5)))
  } catch { /* Stockage refuse : la liste restera vide. */ }
}

// « +229 •• •• •• 42 » : seuls les deux derniers chiffres restent lisibles.
const masquer = (telephone: string) => {
  const chiffres = telephone.replace(/\D/g, '')
  return chiffres.length < 4 ? telephone : `+229 •• •• •• ${chiffres.slice(-2)}`
}

const TEINTES = ['#6f5bd4', '#ff2856', '#16cce0', '#e8820c', '#1aa260']
const teinte = (pseudo: string) => {
  let somme = 0
  for (let i = 0; i < pseudo.length; i++) somme += pseudo.charCodeAt(i)
  return TEINTES[somme % TEINTES.length]
}

// Enveloppe commune aux deux feuilles : voile, croix et pied.
function Feuille({ onFermer, children, pied }: {
  onFermer: () => void
  children: React.ReactNode
  pied: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = ref.current!
    node.showModal()
    return () => node.close()
  }, [])

  return (
    <dialog ref={ref} className="cnx-dialog" onCancel={onFermer}>
      <button className="cnx-voile" aria-label="Fermer" onClick={onFermer} />
      <section className="cnx-feuille">
        <header className="cnx-entete">
          <button aria-label="Aide">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="9.4" />
              <path d="M9.4 9.2a2.7 2.7 0 1 1 3.6 2.6v1.8" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button aria-label="Fermer" onClick={onFermer}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="cnx-corps">{children}</div>
        <footer className="cnx-pied">{pied}</footer>
      </section>
    </dialog>
  )
}

export default function Connexion({ onSucces }: { onSucces?: () => void } = {}) {
  const { connecter, inscrire } = useAuth()
  const [feuille, setFeuille] = useState<'comptes' | 'inscription' | null>(null)
  const [connus] = useState<CompteConnu[]>(lireConnus)

  // Compte retenu dans la liste : son mot de passe est alors demande.
  const [choisi, setChoisi] = useState<string | null>(null)
  const [etape, setEtape] = useState<'telephone' | 'compte'>('telephone')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const chiffres = telephone.replace(/\D/g, '')

  const entrer = async () => {
    setErreur('')
    if (chiffres.length < 8) return setErreur('Numéro de téléphone incomplet')
    if (motDePasse.length < 6)
      return setErreur('Le mot de passe doit faire au moins 6 caractères')
    setOccupe(true)
    try {
      await connecter(chiffres, motDePasse)
      retenirCompte(choisi ?? chiffres, chiffres)
      onSucces?.()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally { setOccupe(false) }
  }

  const creer = async () => {
    setErreur('')
    if (pseudo.trim().length < 3)
      return setErreur('Le pseudo doit faire au moins 3 caractères')
    if (motDePasse.length < 6)
      return setErreur('Le mot de passe doit faire au moins 6 caractères')
    setOccupe(true)
    try {
      const nom = pseudo.trim().toLowerCase()
      await inscrire(chiffres, motDePasse, nom)
      retenirCompte(nom, chiffres)
      onSucces?.()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally { setOccupe(false) }
  }

  const ouvrir = (laquelle: 'comptes' | 'inscription') => {
    setFeuille(laquelle); setErreur(''); setEtape('telephone'); setChoisi(null)
  }

  // Sans compte connu, saluer un retour n'aurait pas de sens.
  const saisieDirecte = choisi !== null || connus.length === 0

  return (
    <div className="cnx-page">
      <header className="cnx-barre">
        <h1>Profil</h1>
        <button className="cnx-menu" aria-label="Menu"><Menu taille={26} /></button>
      </header>

      <div className="cnx-centre">
        <span className="cnx-silhouette"><Personne taille={92} /></span>
        <p className="cnx-invite">Connecte-toi à un compte existant</p>
        <button className="cnx-bouton" onClick={() => ouvrir('comptes')}>
          Connexion
        </button>
      </div>

      {feuille === 'comptes' && (
        <Feuille onFermer={() => setFeuille(null)} pied={<>
          <span>Tu n’as pas de compte ? </span>
          <button onClick={() => ouvrir('inscription')}>Inscription</button>
        </>}>
          <h2 className="cnx-titre">
            {connus.length === 0 ? 'Connexion'
              : choisi ? 'Entre ton mot de passe'
              : 'Ravis de te revoir'}
          </h2>

          {saisieDirecte ? <>
            <div className="cnx-champ">
              <input type="tel" placeholder="Numéro de téléphone" value={telephone}
                onChange={e => setTelephone(e.target.value)} />
            </div>
            <div className="cnx-champ">
              <input type="password" placeholder="Mot de passe" value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)} />
            </div>
            <button className="cnx-principal" onClick={entrer} disabled={occupe}>
              {occupe ? 'Connexion…' : 'Connexion'}
            </button>
            {connus.length > 0 && (
              <button className="cnx-retour" onClick={() => setChoisi(null)}>
                Choisir un autre compte
              </button>
            )}
          </> : <>
            {connus.map(c => (
              <button className="cnx-compte" key={c.pseudo}
                onClick={() => { setChoisi(c.pseudo); setTelephone(c.telephone) }}>
                <span className="cnx-avatar" style={{ background: teinte(c.pseudo) }}>
                  {c.pseudo.charAt(0).toUpperCase()}
                </span>
                <span className="cnx-compte-corps">
                  <span className="cnx-pseudo">{c.pseudo}</span>
                  <span className="cnx-identifiant">{masquer(c.telephone)}</span>
                </span>
                <ChevronDroit taille={20} />
              </button>
            ))}
            <button className="cnx-compte" onClick={() => ouvrir('inscription')}>
              <span className="cnx-ajout">+</span>
              <span className="cnx-compte-corps">
                <span className="cnx-pseudo">Ajouter un autre compte</span>
              </span>
            </button>
            <button className="cnx-gerer">Gérer les comptes</button>
          </>}

          {!!erreur && <p className="cnx-erreur">{erreur}</p>}
        </Feuille>
      )}

      {feuille === 'inscription' && (
        <Feuille onFermer={() => setFeuille(null)} pied={<>
          <span>Tu as déjà un compte ? </span>
          <button onClick={() => ouvrir('comptes')}>Se connecter</button>
        </>}>
          <h2 className="cnx-titre">
            {etape === 'telephone' ? 'Inscription à TockTick' : 'Choisis ton pseudo'}
          </h2>

          {etape === 'telephone' ? <>
            <div className="cnx-champ">
              <span className="cnx-indicatif">BJ +229</span>
              <i className="cnx-trait" />
              <input type="tel" placeholder="Numéro de téléphone" value={telephone}
                onChange={e => setTelephone(e.target.value)} />
            </div>
            <button className="cnx-principal" disabled={chiffres.length < 8}
              onClick={() => { setErreur(''); setEtape('compte') }}>
              Continuer
            </button>

            <div className="cnx-separateur"><i /><span>ou</span><i /></div>

            <button className="cnx-autre">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 6.4A1.4 1.4 0 0 1 4.4 5h15.2A1.4 1.4 0 0 1 21 6.4v11.2a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 17.6Z" />
                <path d="m4.4 7 7.6 5.4L19.6 7" fill="none" stroke="#fff"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Continuer avec un e-mail
            </button>
          </> : <>
            <div className="cnx-champ">
              <input placeholder="Pseudo" value={pseudo} autoCapitalize="none"
                onChange={e => setPseudo(e.target.value)} />
            </div>
            <div className="cnx-champ">
              <input type="password" placeholder="Mot de passe" value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)} />
            </div>
            <button className="cnx-principal" onClick={creer} disabled={occupe}>
              {occupe ? 'Création…' : 'Créer le compte'}
            </button>
            <button className="cnx-retour" onClick={() => setEtape('telephone')}>
              Modifier le numéro
            </button>
          </>}

          {!!erreur && <p className="cnx-erreur">{erreur}</p>}

          <p className="cnx-mentions">
            En continuant avec un compte situé au Bénin, tu acceptes nos
            conditions d’utilisation et reconnais avoir lu notre politique de
            confidentialité.
          </p>
        </Feuille>
      )}
    </div>
  )
}
