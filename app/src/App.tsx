import { useEffect, useState } from 'react'
import { FournisseurAuth, useAuth } from './lib/auth'
import { preparerInterface, masquerEcranDemarrage } from './lib/natif'
import Connexion from './pages/Connexion'
import Fil from './pages/Fil'
import Publier from './pages/Publier'
import Camera from './pages/Camera'
import Montage from './pages/Montage'
import Profil from './pages/Profil'
import Decouvrir from './pages/Decouvrir'
import { Accueil, Amis, Messages, Plus, Personne } from './components/Icones'

type Onglet = 'fil' | 'decouvrir' | 'publier' | 'profil' | 'messages'

function Application() {
  const { session, chargement } = useAuth()
  const [onglet, setOnglet] = useState<Onglet>('fil')
  // Remonter cette cle force le fil a se reconstruire apres une publication,
  // pour que la nouvelle video apparaisse sans rechargement de la page.
  const [cleFil, setCleFil] = useState(0)

  // Barre d'etat et ecran de demarrage : sans effet hors application installee.
  useEffect(() => {
    preparerInterface()
    masquerEcranDemarrage()
  }, [])
  // Video filmee ou importee a la camera, passee au montage puis a la
  // publication. Null = on est encore sur l'ecran de tournage.
  const [videoChoisie, setVideoChoisie] = useState<string | null>(null)
  // Vrai tant qu'on est sur l'ecran de montage, avant la publication.
  const [montage, setMontage] = useState(false)
  // Pseudo du profil consulte. Null = on est sur son propre profil.
  const [profilVisite, setProfilVisite] = useState<string | null>(null)

  const visiter = (pseudo: string) => {
    setProfilVisite(pseudo)
    setOnglet('profil')
  }

  if (chargement) return <div className="chargement">Chargement…</div>
  if (!session) return <div className="app"><div className="contenu"><Connexion /></div></div>

  return (
    <div className="app">
      <div className="contenu">
        {onglet === 'fil' && <Fil key={cleFil} onVisiter={visiter} onRechercher={() => setOnglet('decouvrir')} />}
        {onglet === 'decouvrir' && <Decouvrir onVisiter={visiter} />}
        {onglet === 'messages' && <section className="page page-messages"><h1>Messages</h1><div><Messages taille={48}/><h2>Aucun message pour le moment</h2><p>La messagerie sera disponible prochainement.</p></div></section>}
        {onglet === 'publier' && (
          videoChoisie
            ? montage
              ? <Montage
                  url={videoChoisie}
                  pseudo={session.user.email?.split('@')[0] ?? 'vous'}
                  onRetour={() => { setMontage(false); setVideoChoisie(null) }}
                  onSuivant={() => setMontage(false)}
                />
              : <Publier
                  urlInitiale={videoChoisie}
                  onFermer={() => setVideoChoisie(null)}
                  onPublie={() => {
                    setVideoChoisie(null)
                    setCleFil((n) => n + 1)
                    setOnglet('fil')
                  }}
                />
            : <Camera
                onFermer={() => setOnglet('fil')}
                onChoisir={(url) => { setVideoChoisie(url); setMontage(true) }}
              />
        )}
        {onglet === 'profil' && (
          <Profil
            pseudoVisite={profilVisite ?? undefined}
            onRetour={() => {
              setProfilVisite(null)
              setOnglet('fil')
            }}
          />
        )}
      </div>

      <nav className="nav" aria-label="Navigation principale">
        <button className={onglet === 'fil' ? 'actif' : ''} onClick={() => setOnglet('fil')}>
          <Accueil taille={26} plein={onglet === 'fil'} />
          <span>Accueil</span>
        </button>

        <button className={onglet === 'decouvrir' ? 'actif' : ''} onClick={() => setOnglet('decouvrir')}>
          <Amis taille={26} />
          <span>Amis</span>
        </button>

        <button className="nav-creer" aria-label="Créer une publication" onClick={() => { setVideoChoisie(null); setMontage(false); setOnglet('publier') }}>
          <span className="pastille"><Plus taille={24} /></span>
        </button>

        <button className={onglet === 'messages' ? 'actif' : ''} onClick={() => setOnglet('messages')}><Messages taille={26}/><span>Messages</span></button>

        <button
          className={onglet === 'profil' ? 'actif' : ''}
          onClick={() => {
            setProfilVisite(null)
            setOnglet('profil')
          }}
        >
          <Personne taille={26} plein={onglet === 'profil'} />
          <span>Profil</span>
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <FournisseurAuth>
      <Application />
    </FournisseurAuth>
  )
}
