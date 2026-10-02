import { useEffect, useState } from 'react'
import { FournisseurAuth, useAuth } from './lib/auth'
import { preparerInterface, masquerEcranDemarrage } from './lib/natif'
import Connexion from './pages/Connexion'
import Fil from './pages/Fil'
import Publier from './pages/Publier'
import Camera from './pages/Camera'
import Montage from './pages/Montage'
import Profil from './pages/Profil'
import Brouillons from './pages/Brouillons'
import Decouvrir from './pages/Decouvrir'
import AmisEcran from './pages/Amis'
import Messages from './pages/Messages'
import { Accueil, Amis, Messages as IconeMessages, Plus, Personne } from './components/Icones'
import type { Son } from './lib/sons'

type Onglet = 'fil' | 'decouvrir' | 'publier' | 'profil' | 'messages'

function Application() {
  const { session, profil, chargement } = useAuth()
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
  // Son retenu au viseur ou au montage, qui accompagne cette video
  // jusqu'a la publication : le fichier video ne le porte pas.
  const [sonChoisi, setSonChoisi] = useState<Son | null>(null)
  // Vrai tant qu'on est sur l'ecran de montage, avant la publication.
  const [montage, setMontage] = useState(false)
  // Pseudo du profil consulte. Null = on est sur son propre profil.
  const [profilVisite, setProfilVisite] = useState<string | null>(null)
  // Message a montrer en arrivant sur le profil, apres un enregistrement.
  const [messageProfil, setMessageProfil] = useState<string | undefined>()
  // Vrai quand la liste des brouillons recouvre le profil.
  const [brouillons, setBrouillons] = useState(false)
  // La recherche recouvre l'onglet « Amis », ouverte par sa loupe ou par
  // celle du fil : c'est ainsi que mobile enchaine les deux ecrans.
  const [recherche, setRecherche] = useState(false)

  const ouvrirRecherche = () => { setRecherche(true); setOnglet('decouvrir') }

  const visiter = (pseudo: string) => {
    setProfilVisite(pseudo)
    setOnglet('profil')
  }

  if (chargement) return <div className="chargement">Chargement…</div>
  if (!session) return <div className="app"><div className="contenu"><Connexion /></div></div>

  return (
    <div className="app">
      <div className="contenu">
        {onglet === 'fil' && <Fil key={cleFil} onVisiter={visiter} onRechercher={ouvrirRecherche} />}
        {onglet === 'decouvrir' && (
          recherche
            ? <Decouvrir onVisiter={(p) => { setRecherche(false); visiter(p) }} />
            : <AmisEcran onVisiter={visiter} onRechercher={() => setRecherche(true)} />
        )}
        {onglet === 'messages' && <Messages />}
        {onglet === 'publier' && (
          videoChoisie
            ? montage
              ? <Montage
                  url={videoChoisie}
                  pseudo={profil?.pseudo ?? 'vous'}
                  sonInitial={sonChoisi}
                  onRetour={() => {
                    setMontage(false); setVideoChoisie(null); setSonChoisi(null)
                  }}
                  onSuivant={(son) => { setSonChoisi(son ?? null); setMontage(false) }}
                />
              : <Publier
                  urlInitiale={videoChoisie}
                  sonInitial={sonChoisi}
                  onAnnuler={() => { setVideoChoisie(null); setSonChoisi(null) }}
                  onPublie={() => {
                    setVideoChoisie(null)
                    setSonChoisi(null)
                    setCleFil((n) => n + 1)
                    setOnglet('fil')
                  }}
                  onBrouillon={() => {
                    setVideoChoisie(null); setSonChoisi(null); setProfilVisite(null)
                    setMessageProfil('Brouillon enregistré')
                    setOnglet('profil')
                  }}
                />
            : <Camera
                onFermer={() => setOnglet('fil')}
                onChoisir={(url, son) => {
                  setVideoChoisie(url); setSonChoisi(son ?? null); setMontage(true)
                }}
              />
        )}
        {onglet === 'profil' && (
          brouillons
            ? <Brouillons
                onRetour={() => setBrouillons(false)}
                onPublier={b => {
                  setBrouillons(false); setVideoChoisie(b.url)
                  setSonChoisi(null); setMontage(false); setOnglet('publier')
                }}
              />
            : <Profil
                pseudoVisite={profilVisite ?? undefined}
                messageArrivee={messageProfil}
                onBrouillons={() => setBrouillons(true)}
                onVisiter={visiter}
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

        <button className={onglet === 'decouvrir' ? 'actif' : ''}
          onClick={() => { setRecherche(false); setOnglet('decouvrir') }}>
          <Amis taille={26} />
          <span>Amis</span>
        </button>

        <button className="nav-creer" aria-label="Créer une publication" onClick={() => { setVideoChoisie(null); setSonChoisi(null); setMontage(false); setOnglet('publier') }}>
          <span className="pastille"><Plus taille={24} /></span>
        </button>

        <button className={onglet === 'messages' ? 'actif' : ''} onClick={() => setOnglet('messages')}><IconeMessages taille={26}/><span>Messages</span></button>

        <button
          className={onglet === 'profil' ? 'actif' : ''}
          onClick={() => {
            setProfilVisite(null); setMessageProfil(undefined)
            setBrouillons(false); setOnglet('profil')
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
