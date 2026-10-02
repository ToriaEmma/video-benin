import { useEffect, useState, type FormEvent } from 'react'
import { apiRecherche, apiVideos, type CompteApi, type VideoApi } from '../lib/api'
import { Lecture, Loupe, Chevron } from '../components/Icones'
import LigneCompte from '../components/LigneCompte'

export default function Decouvrir({ onVisiter }: { onVisiter: (p: string) => void }) {
  const [terme, setTerme] = useState('')
  const [comptes, setComptes] = useState<CompteApi[]>([])
  const [videos, setVideos] = useState<VideoApi[]>([])
  const [recherche, setRecherche] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [populaires, setPopulaires] = useState<VideoApi[]>([])
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

  // Comptes et videos arrivent d'un seul appel : le serveur compare le
  // fragment au pseudo, au nom et aux legendes.
  const chercher = async (e: FormEvent) => {
    e.preventDefault()
    const q = terme.trim()
    if (!q) return
    setRecherche(true)
    setEnCours(true)
    setErreur('')
    try {
      const r = await apiRecherche.tout(q)
      setComptes(r.comptes)
      setVideos(r.videos)
    } catch (err) {
      setComptes([])
      setVideos([])
      setErreur(err instanceof Error ? err.message : 'Recherche impossible')
    } finally {
      setEnCours(false)
    }
  }

  const reinitialiser = () => {
    setTerme('')
    setRecherche(false)
    setComptes([])
    setVideos([])
    setErreur('')
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

          {erreur && (
            <p role="alert" style={{ color: 'var(--texte-attenue)', fontSize: 13 }}>
              {erreur}
            </p>
          )}

          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Comptes</h2>
          {enCours ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 13 }}>Recherche…</p>
          ) : comptes.length === 0 ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 13 }}>
              Aucun compte ne correspond
            </p>
          ) : (
            comptes.map((c) => (
              <LigneCompte key={c.id} compte={c} onVisiter={onVisiter} />
            ))
          )}

          <h2 style={{ fontSize: 15, margin: '24px 0 10px' }}>Vidéos</h2>
          {enCours ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 13 }}>Recherche…</p>
          ) : videos.length === 0 ? (
            <p style={{ color: 'var(--texte-attenue)', fontSize: 13 }}>Aucune vidéo trouvée</p>
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
