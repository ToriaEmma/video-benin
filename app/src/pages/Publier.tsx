import { useRef, useState } from 'react'
import { apiBrouillons, apiVideos, type BrouillonApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Camera } from '../components/Icones'
import CreationCamera from '../components/CreationCamera'
import Couverture from './Couverture'
import Brouillons from './Brouillons'

const TAILLE_MAX = 50 * 1024 * 1024 // 50 Mo
const DUREE_MAX = 90 // secondes

const DEPARTEMENTS = [
  'Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Couffo',
  'Donga', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou',
]

export default function Publier({ onPublie, onFermer, urlInitiale }: {
  onPublie: () => void
  onFermer: () => void
  // Video arrivant du montage : elle existe deja en blob, il n'y a donc plus
  // de fichier a choisir et le formulaire s'ouvre directement.
  urlInitiale?: string
}) {
  const { session } = useAuth()
  const champFichier = useRef<HTMLInputElement>(null)
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState(urlInitiale ?? '')
  // Editeur de couverture, ouvert depuis l'apercu.
  const [couverture, setCouverture] = useState(false)
  // Grille des brouillons, atteinte depuis l'ecran de tournage : le profil
  // ne propose pas encore de tuile.
  const [brouillons, setBrouillons] = useState(false)
  const [legende, setLegende] = useState('')
  const [departement, setDepartement] = useState('Littoral')
  const [progression, setProgression] = useState(0)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const choisir = (f: File | null) => {
    setErreur('')
    if (!f) return

    if (!f.type.startsWith('video/')) return setErreur('Choisissez un fichier vidéo')
    if (f.size > TAILLE_MAX)
      return setErreur(`Vidéo trop lourde (${Math.round(f.size / 1024 / 1024)} Mo). Maximum 50 Mo.`)

    // La duree est verifiee sur les metadonnees avant tout envoi : rejeter
    // apres un televersement de 50 Mo gaspillerait le forfait de l'utilisateur.
    const url = URL.createObjectURL(f)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      if (v.duration > DUREE_MAX) {
        setErreur(`Vidéo trop longue (${Math.round(v.duration)} s). Maximum ${DUREE_MAX} s.`)
        URL.revokeObjectURL(url)
        return
      }
      setFichier(f)
      setApercu(url)
    }
    v.onerror = () => {
      setErreur('Fichier vidéo illisible')
      URL.revokeObjectURL(url)
    }
    v.src = url
  }

  const publier = async () => {
    if ((!fichier && !urlInitiale) || !session) return
    setEnvoi(true)
    setErreur('')
    setProgression(30)

    try {
      // L'API n'heberge pas de fichier : elle n'enregistre qu'une adresse.
      // Celle-ci reste donc celle du blob local, lisible dans cet onglet
      // seulement, exactement comme la version mobile qui envoie l'URI de
      // l'appareil. Le televersement attend un service de stockage.
      await apiVideos.creer({
        url: apercu,
        legende: legende.trim(),
        departement,
      })
      setProgression(100)
      setFichier(null)
      setApercu('')
      setLegende('')
      onPublie()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'envoi a échoué")
      setProgression(0)
    } finally {
      setEnvoi(false)
    }
  }

  // Mise de cote : la video rejoint les brouillons du compte, avec son
  // poids quand le fichier est connu.
  const enregistrerBrouillon = async () => {
    if (!apercu || envoi) return
    setEnvoi(true)
    setErreur('')
    try {
      await apiBrouillons.creer(apercu, legende.trim(), fichier?.size ?? 0)
      setFichier(null)
      setApercu('')
      setLegende('')
      setBrouillons(true)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement a échoué")
    } finally {
      setEnvoi(false)
    }
  }

  const reprendre = (b: BrouillonApi) => {
    setApercu(b.url)
    setLegende(b.legende)
    setBrouillons(false)
  }

  if (brouillons) return <Brouillons onRetour={() => setBrouillons(false)}
    onPublier={reprendre} />
  if (couverture) return <Couverture url={apercu}
    onAnnuler={() => setCouverture(false)}
    onEnregistrer={() => setCouverture(false)} />
  // Le nombre de brouillons n'est plus affiche ici : il faudrait une
  // requete pour un simple libelle, la grille le compte elle-meme.
  if (!fichier && !urlInitiale && !apercu) return <><CreationCamera onChoisir={choisir} onFermer={onFermer}/><button className="pub-brouillons" onClick={() => setBrouillons(true)}>Brouillons</button>{erreur && <p role="alert" style={{position:'absolute',bottom:100,left:20,right:20,background:'#111',color:'white',padding:12,zIndex:5}}>{erreur}</p>}</>
  return (
    <div className="page">
      <h1 className="titre">Publier une vidéo</h1>
      <p className="sous-titre">90 secondes maximum, 50 Mo maximum</p>

      {erreur && <div className="erreur">{erreur}</div>}

      <input
        ref={champFichier}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={(e) => choisir(e.target.files?.[0] ?? null)}
      />

      {!apercu ? (
        <div className="depot" onClick={() => champFichier.current?.click()}>
          <span className="glyphe"><Camera taille={42} /></span>
          <b>Choisir ou filmer une vidéo</b>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Appuyez ici pour ouvrir la caméra ou la galerie
          </div>
        </div>
      ) : (
        <>
          <video className="apercu" src={apercu} controls playsInline />
          <button className="bouton secondaire" style={{ marginTop: 10 }}
            onClick={() => setCouverture(true)}>Modifier la couverture</button>
        </>
      )}

      {apercu && (
        <>
          <div className="champ">
            <label htmlFor="legende">Légende</label>
            <textarea
              id="legende"
              rows={3}
              maxLength={150}
              placeholder="Décrivez votre vidéo…"
              value={legende}
              onChange={(e) => setLegende(e.target.value)}
            />
            <div style={{ fontSize: 12, color: 'var(--texte-attenue)', textAlign: 'right' }}>
              {legende.length}/150
            </div>
          </div>

          <div className="champ">
            <label htmlFor="dep">Département</label>
            <select
              id="dep"
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface)', color: 'var(--texte)',
                border: '1px solid var(--bordure)', borderRadius: 10, padding: 14, fontSize: 16,
              }}
            >
              {DEPARTEMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {envoi && (
            <div className="barre-progression">
              <div style={{ width: `${progression}%` }} />
            </div>
          )}

          <button className="bouton" onClick={publier} disabled={envoi}>
            {envoi ? `Envoi… ${progression}%` : 'Publier'}
          </button>

          <button className="bouton secondaire" style={{ marginTop: 10 }}
            disabled={envoi} onClick={enregistrerBrouillon}>
            Enregistrer en brouillon
          </button>

          <button
            className="bouton secondaire"
            style={{ marginTop: 10 }}
            disabled={envoi}
            onClick={() => {
              setFichier(null)
              setApercu('')
              setErreur('')
            }}
          >
            Choisir une autre vidéo
          </button>
        </>
      )}
    </div>
  )
}
