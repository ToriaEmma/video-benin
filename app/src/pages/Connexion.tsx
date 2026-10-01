import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'

export default function Connexion({ onSucces }: { onSucces?: () => void } = {}) {
  const { connecter, inscrire } = useAuth()
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')

    const chiffres = telephone.replace(/\D/g, '')
    if (chiffres.length < 8) return setErreur('Numéro de téléphone incomplet')
    if (motDePasse.length < 6) return setErreur('Le mot de passe doit faire au moins 6 caractères')
    if (mode === 'inscription' && pseudo.trim().length < 3)
      return setErreur('Le pseudo doit faire au moins 3 caractères')

    setOccupe(true)
    try {
      if (mode === 'connexion') await connecter(chiffres, motDePasse)
      else await inscrire(chiffres, motDePasse, pseudo.trim().toLowerCase())
      onSucces?.()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="page">
      <h1 className="titre">{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</h1>
      <p className="sous-titre">
        {mode === 'connexion'
          ? 'Entrez votre numéro pour continuer'
          : 'Rejoignez la plateforme et publiez vos vidéos'}
      </p>

      {erreur && <div className="erreur">{erreur}</div>}

      <form onSubmit={envoyer}>
        <div className="champ">
          <label htmlFor="tel">Numéro de téléphone</label>
          <input
            id="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01 XX XX XX XX"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        </div>

        {mode === 'inscription' && (
          <div className="champ">
            <label htmlFor="pseudo">Pseudo</label>
            <input
              id="pseudo"
              type="text"
              autoCapitalize="none"
              placeholder="votre_pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
            />
          </div>
        )}

        <div className="champ">
          <label htmlFor="mdp">Mot de passe</label>
          <input
            id="mdp"
            type="password"
            autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
            placeholder="6 caractères minimum"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        <button className="bouton" type="submit" disabled={occupe}>
          {occupe ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <button
        className="lien"
        onClick={() => {
          setMode(mode === 'connexion' ? 'inscription' : 'connexion')
          setErreur('')
        }}
      >
        {mode === 'connexion' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  )
}
