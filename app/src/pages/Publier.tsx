import { useRef, useState } from 'react'
import { supabase, MODE_DEMO } from '../lib/supabase'
import { etatDemo } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { Camera } from '../components/Icones'
import CreationCamera from '../components/CreationCamera'
import Couverture from './Couverture'

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
    setProgression(10)

    try {
      if (MODE_DEMO) {
        // En demonstration la video reste locale (blob) : rien n'est televerse,
        // mais elle apparait dans le fil comme une vraie publication.
        setProgression(60)
        const nouvelle = {
          id: `v${Date.now()}`,
          url: apercu,
          legende: legende.trim(),
          vues: 0,
          auteur_id: 'demo',
          profils: { pseudo: 'vous' },
          aime: false,
          nbAime: 0,
          departement,
        }
        etatDemo.videos.unshift(nouvelle)
        etatDemo.mesVideos.unshift(nouvelle)
        setProgression(100)
        setFichier(null)
        setLegende('')
        onPublie()
        return
      }

      // Une video venue du montage n'existe que comme blob : on la relit pour
      // obtenir le corps a televerser et son type reel.
      const corps = fichier ?? await (await fetch(apercu)).blob()
      const extension = fichier?.name.split('.').pop() ?? (corps.type.includes('mp4') ? 'mp4' : 'webm')
      const chemin = `${session.user.id}/${Date.now()}.${extension}`

      const { error: erreurEnvoi } = await supabase.storage
        .from('videos')
        .upload(chemin, corps, { contentType: corps.type })
      if (erreurEnvoi) throw erreurEnvoi

      setProgression(70)

      const { data: pub } = supabase.storage.from('videos').getPublicUrl(chemin)

      const { error: erreurBase } = await supabase.from('videos').insert({
        auteur_id: session.user.id,
        url: pub.publicUrl,
        legende: legende.trim(),
        departement,
      })
      if (erreurBase) throw erreurBase

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

  if (couverture) return <Couverture url={apercu}
    onAnnuler={() => setCouverture(false)}
    onEnregistrer={() => setCouverture(false)} />
  if (!fichier && !urlInitiale) return <><CreationCamera onChoisir={choisir} onFermer={onFermer}/>{erreur && <p role="alert" style={{position:'absolute',bottom:100,left:20,right:20,background:'#111',color:'white',padding:12,zIndex:5}}>{erreur}</p>}</>
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
