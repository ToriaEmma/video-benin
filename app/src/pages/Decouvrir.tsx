import { useEffect, useState, type FormEvent } from 'react'
import { supabase, MODE_DEMO } from '../lib/supabase'
import { etatDemo, comptesDemo } from '../lib/demo'
import { Lecture, Loupe, Chevron } from '../components/Icones'

type Compte = { id: string; pseudo: string; bio: string }
type VideoResultat = { id: string; url: string; legende: string; vues: number }

export default function Decouvrir({ onVisiter }: { onVisiter: (p: string) => void }) {
  const [terme, setTerme] = useState('')
  const [comptes, setComptes] = useState<Compte[]>([])
  const [videos, setVideos] = useState<VideoResultat[]>([])
  const [recherche, setRecherche] = useState(false)
  const [populaires, setPopulaires] = useState<VideoResultat[]>([])

  useEffect(() => {
    if (MODE_DEMO) {
      setPopulaires(
        [...etatDemo.videos].sort((a, b) => b.vues - a.vues) as unknown as VideoResultat[],
      )
      return
    }
    supabase
      .from('videos').select('id, url, legende, vues')
      .order('vues', { ascending: false }).limit(12)
      .then(({ data }) => setPopulaires((data ?? []) as VideoResultat[]))
  }, [])

  const chercher = async (e: FormEvent) => {
    e.preventDefault()
    const q = terme.trim()
    if (!q) return
    setRecherche(true)

    if (MODE_DEMO) {
      const q2 = q.toLowerCase()
      setComptes(comptesDemo.filter((c) => c.pseudo.includes(q2)))
      setVideos(
        etatDemo.videos.filter((v) =>
          v.legende.toLowerCase().includes(q2),
        ) as unknown as VideoResultat[],
      )
      return
    }

    const [{ data: c }, { data: v }] = await Promise.all([
      supabase.from('profils').select('id, pseudo, bio').ilike('pseudo', `%${q}%`).limit(20),
      supabase.from('videos').select('id, url, legende, vues').ilike('legende', `%${q}%`).limit(20),
    ])

    setComptes((c ?? []) as Compte[])
    setVideos((v ?? []) as VideoResultat[])
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
            <p style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>Aucun compte trouvé</p>
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
          {populaires.length === 0 ? (
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
