import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase, MODE_DEMO } from '../lib/supabase'
import { etatDemo } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { Croix } from './Icones'
import './commentaires.css'

type Commentaire = {
  id: string
  texte: string
  cree_le: string
  profils: { pseudo: string } | null
}

const depuis = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  return `${Math.floor(s / 86400)} j`
}

export default function Commentaires({
  videoId,
  onFermer,
  onAjout,
}: {
  videoId: string
  onFermer: () => void
  onAjout: () => void
}) {
  const { session, profil } = useAuth()
  const [liste, setListe] = useState<Commentaire[]>([])
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const saisie = useRef<HTMLInputElement>(null)
  const [ancien, setAncien] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const fermer = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', fermer)
    return () => document.removeEventListener('keydown', fermer)
  }, [onFermer])

  useEffect(() => {
    if (MODE_DEMO) {
      setListe(
        etatDemo.commentaires
          .filter((c) => c.video_id === videoId)
          .sort((a, b) => b.cree_le.localeCompare(a.cree_le)) as unknown as Commentaire[],
      )
      return
    }
    supabase
      .from('commentaires')
      .select('id, texte, cree_le, profils(pseudo)')
      .eq('video_id', videoId)
      .order('cree_le', { ascending: false })
      .then(({ data }) => setListe((data ?? []) as unknown as Commentaire[]))
  }, [videoId])

  const publier = async (e: FormEvent) => {
    e.preventDefault()
    if (!session || !texte.trim()) return
    setEnvoi(true)

    if (MODE_DEMO) {
      const nouveau = {
        id: `c${Date.now()}`,
        video_id: videoId,
        texte: texte.trim(),
        cree_le: new Date().toISOString(),
        profils: { pseudo: profil?.pseudo ?? 'moi' },
      }
      etatDemo.commentaires.unshift(nouveau)
      setListe((l) => [nouveau as unknown as Commentaire, ...l])
      setTexte('')
      onAjout()
      setEnvoi(false)
      return
    }

    const { data, error } = await supabase
      .from('commentaires')
      .insert({ video_id: videoId, auteur_id: session.user.id, texte: texte.trim() })
      .select('id, texte, cree_le')
      .single()

    if (!error && data) {
      setListe((l) => [
        { ...(data as Commentaire), profils: { pseudo: profil?.pseudo ?? 'moi' } },
        ...l,
      ])
      setTexte('')
      onAjout()
    }
    if (error) setMessage('Impossible d’envoyer le commentaire. Réessaie.')
    setEnvoi(false)
  }

  return (
    <div className="feuille commentaires-feuille" onClick={onFermer}>
      <section className="feuille-panneau" aria-label="Commentaires" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-entete">
          <span>{liste.length} commentaire{liste.length > 1 ? 's' : ''} <button type="button" aria-label={ancien ? 'Afficher les plus récents' : 'Afficher les plus anciens'} onClick={() => setAncien(!ancien)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10m-7 6h4"/></svg></button></span>
          <button onClick={onFermer} aria-label="Fermer"><Croix taille={20} /></button>
        </div>

        <div className="feuille-corps">
          {liste.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--texte-attenue)' }}>
              Aucun commentaire. Soyez le premier.
            </div>
          )}
          {(ancien ? [...liste].reverse() : liste).map((c) => (
            <div className="commentaire" key={c.id}>
              <div className="avatar">
                {(c.profils?.pseudo ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="corps">
                <div className="auteur">
                  {c.profils?.pseudo ?? 'inconnu'}
                </div>
                <div className="texte">{c.texte}</div>
                <div className="commentaire-meta"><span>{depuis(c.cree_le)}</span><button type="button" onClick={() => {setTexte(`@${c.profils?.pseudo ?? 'inconnu'} `);saisie.current?.focus()}}>Répondre</button></div>
              </div>
            </div>
          ))}
        </div>

        {session ? (
          <form className="feuille-pied" onSubmit={publier}>
            <span className="commentaire-moi">{profil?.avatar_url ? <img src={profil.avatar_url} alt=""/> : profil?.pseudo.charAt(0).toUpperCase()}</span>
            <div className="commentaire-saisie">
            <input
              ref={saisie}
              aria-label="Ajouter un commentaire"
              placeholder="Ajouter un commentaire…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={300}
            />
            {texte.trim() ? <button type="submit" aria-label="Envoyer" disabled={envoi}><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 7-7 7 7M12 5v16"/></svg></button> : <><button type="button" aria-label="Ajouter une image" onClick={() => setMessage('Les images dans les commentaires seront disponibles prochainement.')}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="3" width="19" height="18" rx=".6"/><circle cx="16" cy="8" r="2" fill="currentColor" stroke="none"/><path d="m3 17 5-5 13 7"/></svg></button><button type="button" aria-label="Insérer un emoji" onClick={() => {setTexte(t => t+'😊');saisie.current?.focus()}}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.5 12A9.5 9.5 0 1 0 12 21.5L21.5 12Z"/><path d="M12 21.5v-4a5.5 5.5 0 0 1 5.5-5.5h4"/><ellipse cx="8" cy="8.5" rx="1.2" ry="1.7" fill="currentColor" stroke="none"/><ellipse cx="15" cy="8.5" rx="1.2" ry="1.7" fill="currentColor" stroke="none"/></svg></button><button type="button" className="commentaire-mention" aria-label="Mentionner" onClick={() => {setTexte('@');saisie.current?.focus()}}><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 7v8c0 3 6 2 6-3C22 5 18 2 12 2S2 6 2 12s4 10 10 10h6"/><ellipse cx="12" cy="12" rx="4" ry="5"/></svg></button></>}
            </div>
          </form>
        ) : (
          <div className="feuille-pied" style={{ color: 'var(--texte-attenue)', fontSize: 14 }}>
            Connectez-vous pour commenter
          </div>
        )}
        {message && <p className="commentaires-message" role="status">{message}</p>}
      </section>
    </div>
  )
}
