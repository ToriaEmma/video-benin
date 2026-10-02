import { useEffect, useState, type FormEvent } from 'react'
import { apiInteractions, apiVideos, type VideoApi } from '../lib/api'
import { Lecture, Loupe, Chevron } from '../components/Icones'

type Compte = { id: string; pseudo: string; bio: string }
type VideoResultat = VideoApi

export default function Decouvrir({ onVisiter }: { onVisiter: (p: string) => void }) {
  const [terme, setTerme] = useState('')
  const [comptes, setComptes] = useState<Compte[]>([])
  const [videos, setVideos] = useState<VideoResultat[]>([])
  const [recherche, setRecherche] = useState(false)
  const [populaires, setPopulaires] = useState<VideoResultat[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [reprise, setReprise] = useState(0)

  // L'API n'expose pas de classement : le fil public est trie par vues
  // ici meme, ce qui suffit au volume d'une page.
  useEffect(() => {
    let valable = true
    setChargement(true)
    setErreur('')
    apiVideos.liste({ limite: 50 })
      .then(v => {
        if (valable) setPopulaires([...v].sort((a, b) => b.vues - a.vues))
      })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [reprise])

  // Faute de route de recherche, les legendes sont filtrees sur le fil
  // deja charge, et le pseudo est cherche a l'exact : /profils/:pseudo ne
  // repond pas aux fragments.
  const chercher = async (e: FormEvent) => {
    e.preventDefault()
    const q = terme.trim()
    if (!q) return
    setRecherche(true)
    setErreur('')

    const q2 = q.toLowerCase()
    setVideos(populaires.filter(v => v.legende.toLowerCase().includes(q2)))

    try {
      const p = await apiInteractions.profil(q)
      setComptes([{ id: p.id, pseudo: p.pseudo, bio: p.bio ?? '' }])
    } catch {
      // Aucun compte ne porte exactement ce pseudo : la section reste vide.
      setComptes([])
    }
  }

  const reinitialiser = () => {
    setTerme('')
    setRecherche(false)
    setComptes([])
    setVideos([])
  }

  return (
    <div className="page">
      <form className="recherche" onSubmit={chercher}>
        <input
          placeholder="Rechercher un compte, une vidéo…"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
        />
        <button type="submit" aria-label="Rechercher"
          style={{ color: 'var(--accent)', padding: '0 10px', minHeight: 44 }}>
          <Loupe taille={22} />
        </button>
      </form>

      {recherche ? (
        <>
          <button
            className="lien"
            style={{ marginTop: 0, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={reinitialiser}
          >
            <Chevron taille={16} /> Retour aux tendances
          </button>

          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Comptes</h2>
          {comptes.length === 0 ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>
              Aucun compte à ce pseudo. La recherche de comptes demande le
              pseudo exact.
            </p>
          ) : (
            comptes.map((c) => (
              <div className="resultat" key={c.id} onClick={() => onVisiter(c.pseudo)} style={{ cursor: 'pointer' }}>
                <div className="avatar">{c.pseudo.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>@{c.pseudo}</div>
                  {c.bio && (
                    <div style={{ fontSize: 13, color: 'var(--texte-attenue)' }}>{c.bio}</div>
                  )}
                </div>
              </div>
            ))
          )}

          <h2 style={{ fontSize: 15, margin: '24px 0 10px' }}>Vidéos</h2>
          {videos.length === 0 ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>Aucune vidéo trouvée</p>
          ) : (
            <div className="grille">
              {videos.map((v) => (
                <div className="case" key={v.id}>
                  <video src={v.url} preload="metadata" muted playsInline />
                  <span className="vues"><Lecture taille={11} /> {v.vues}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Vidéos populaires</h2>
          {chargement ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>Chargement…</p>
          ) : erreur ? (
            <div style={{ display: 'grid', justifyItems: 'start', gap: 12 }}>
              <p role="alert" style={{ color: 'var(--texte-attenue)', fontSize: 14, margin: 0 }}>
                {erreur}
              </p>
              <button className="lien" onClick={() => setReprise(n => n + 1)}>
                Réessayer
              </button>
            </div>
          ) : populaires.length === 0 ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>
              Aucune vidéo pour le moment
            </p>
          ) : (
            <div className="grille">
              {populaires.map((v) => (
                <div className="case" key={v.id}>
                  <video src={v.url} preload="metadata" muted playsInline />
                  <span className="vues"><Lecture taille={11} /> {v.vues}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
