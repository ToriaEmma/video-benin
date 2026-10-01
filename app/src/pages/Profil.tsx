import { useEffect, useState } from 'react'
import { supabase, MODE_DEMO } from '../lib/supabase'
import { etatDemo, comptesDemo } from '../lib/demo'
import { useAuth } from '../lib/auth'
import {
  Chevron, Cloche, Fleche, Crayon, Menu, AjoutPersonne,
  Grille, Cadenas, Coeur, Repartage, Studio, Lecture,
  Plus,
} from '../components/Icones'
import './profil.css'
import MenuProfil from '../components/MenuProfil'
import Parametres from './Parametres'
import ComptesProfil from '../components/ComptesProfil'
import ModifierProfil from './ModifierProfil'
import Solde from './Solde'

type VideoProfil = { id: string; url: string; vues: number }

type Props = {
  // Sans pseudoVisite, on affiche le profil du compte connecte. Avec, on
  // affiche celui d'un autre : les deux ecrans different par leur barre
  // superieure, leurs boutons d'action et leurs onglets.
  pseudoVisite?: string
  onRetour?: () => void
}

const abreger = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M`
  : n >= 1_000 ? `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} K`
  : String(n)

export default function Profil({ pseudoVisite, onRetour }: Props) {
  const { profil, deconnecter, session } = useAuth()
  const monProfil = !pseudoVisite || pseudoVisite === profil?.pseudo

  const [videos, setVideos] = useState<VideoProfil[]>([])
  const [nbSuivis, setNbSuivis] = useState(0)
  const [nbAbonnes, setNbAbonnes] = useState(0)
  const [nbAime, setNbAime] = useState(0)
  const [suivi, setSuivi] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [edition, setEdition] = useState(false)
  const [soldeOuvert, setSoldeOuvert] = useState(false)
  const [parametresOuverts, setParametresOuverts] = useState(false)
  const [comptesOuverts, setComptesOuverts] = useState(false)
  const [onglet, setOnglet] = useState<'videos' | 'privees' | 'repartages' | 'favoris' | 'aimees'>('videos')
  useEffect(() => { setOnglet('videos'); setSuivi(false) }, [pseudoVisite])

  const compteVisite = pseudoVisite
    ? comptesDemo.find((c) => c.pseudo === pseudoVisite)
    : null

  const pseudo = monProfil ? profil?.pseudo ?? '' : pseudoVisite ?? ''
  const bio = monProfil
    ? profil?.bio ?? ''
    : compteVisite?.bio ?? ''

  useEffect(() => {
    if (!session) return

    if (MODE_DEMO) {
      if (monProfil) {
        setVideos(etatDemo.mesVideos as unknown as VideoProfil[])
        setNbSuivis(0)
        setNbAbonnes(0)
        setNbAime(etatDemo.mesVideos.reduce((t, v) => t + v.nbAime, 0))
      } else {
        const siennes = etatDemo.videos.filter((v) => v.profils?.pseudo === pseudoVisite)
        setVideos(siennes as unknown as VideoProfil[])
        setNbSuivis(23)
        setNbAbonnes(3418)
        setNbAime(siennes.reduce((t, v) => t + v.nbAime, 0))
      }
      return
    }

    const id = session.user.id

    supabase
      .from('videos').select('id, url, vues')
      .eq('auteur_id', id).order('publiee_le', { ascending: false })
      .then(({ data }) => setVideos((data ?? []) as VideoProfil[]))

    supabase
      .from('abonnements').select('*', { count: 'exact', head: true })
      .eq('createur_id', id)
      .then(({ count }) => setNbAbonnes(count ?? 0))

    supabase
      .from('abonnements').select('*', { count: 'exact', head: true })
      .eq('abonne_id', id)
      .then(({ count }) => setNbSuivis(count ?? 0))

    supabase
      .from('videos').select('id').eq('auteur_id', id)
      .then(async ({ data }) => {
        const ids = (data ?? []).map((v) => v.id)
        if (ids.length === 0) return setNbAime(0)
        const { count } = await supabase
          .from('jaime').select('*', { count: 'exact', head: true }).in('video_id', ids)
        setNbAime(count ?? 0)
      })
  }, [session, monProfil, pseudoVisite])

  const supprimer = async (id: string) => {
    if (!monProfil) return
    if (!confirm('Supprimer cette vidéo ?')) return
    if (MODE_DEMO) {
      etatDemo.videos = etatDemo.videos.filter((v) => v.id !== id)
      etatDemo.mesVideos = etatDemo.mesVideos.filter((v) => v.id !== id)
      setVideos((l) => l.filter((v) => v.id !== id))
      return
    }
    await supabase.from('videos').delete().eq('id', id)
    setVideos((l) => l.filter((v) => v.id !== id))
  }

  const basculerSuivi = () => {
    setSuivi((s) => !s)
    setNbAbonnes((n) => n + (suivi ? -1 : 1))
  }

  if (monProfil && !profil) return <div className="chargement">Chargement…</div>
  if (monProfil && edition) return <ModifierProfil onRetour={() => setEdition(false)} />
  if (monProfil && soldeOuvert) return <Solde onRetour={() => setSoldeOuvert(false)} />
  if (monProfil && parametresOuverts) return <Parametres
    pseudo={pseudo}
    onRetour={() => setParametresOuverts(false)}
    onDeconnecter={deconnecter}
  />

  return (
    <div className={`page page-profil ${monProfil ? 'profil-personnel' : 'profil-visite'}`}>
      {/* Barre superieure : elle differe selon qu'on visite ou qu'on est chez soi */}
      <div className="profil-barre">
        {monProfil ? (
          <>
            <button aria-label="Modifier" onClick={() => setEdition(true)}><Crayon taille={24} /></button>
            <div className="groupe">
              <button aria-label="Ajouter un ami"><AjoutPersonne taille={24} /></button>
              <button aria-label="Menu" aria-haspopup="dialog" aria-expanded={menuOuvert} onClick={() => setMenuOuvert(true)}><Menu taille={24} /></button>
            </div>
          </>
        ) : (
          <>
            <button aria-label="Retour" onClick={onRetour}><Chevron taille={26} /></button>
            <div className="groupe">
              <button aria-label="Notifications"><Cloche taille={24} /></button>
              <button aria-label="Partager"><Fleche taille={24} /></button>
            </div>
          </>
        )}
      </div>

      {menuOuvert && <MenuProfil onFermer={() => setMenuOuvert(false)} onDeconnecter={deconnecter} onSolde={() => { setMenuOuvert(false); setSoldeOuvert(true) }} onParametres={() => { setMenuOuvert(false); setParametresOuverts(true) }} />}
      {monProfil && comptesOuverts && <ComptesProfil pseudo={pseudo} avatar={profil?.avatar_url} onFermer={() => setComptesOuverts(false)} />}

      {/* Identite : nom, pseudo, avatar */}
      <div className="profil-identite">
        <div className="profil-resume">
          <div className="profil-nom">{monProfil ? <button className="profil-choix-compte" aria-label="Changer de compte" aria-haspopup="dialog" aria-expanded={comptesOuverts} onClick={() => setComptesOuverts(true)}><span>{profil?.nom || pseudo}</span><svg width="15" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M2 3h12L8 10z" /></svg></button> : pseudo}</div>
          <div className="profil-pseudo">@{pseudo}</div>
          <div className="profil-stats">
        <div className="bloc"><b>{abreger(nbSuivis)}</b><span>Suivis</span></div>
        <div className="bloc"><b>{abreger(nbAbonnes)}</b><span>Followers</span></div>
        <div className="bloc"><b>{abreger(nbAime)}</b><span>J'aime</span></div>
          </div>
        </div>
        <div className="profil-avatar-zone">
          {monProfil && <span className="profil-note">Dis-nous tout</span>}
          <div className="profil-avatar">
            {monProfil && profil?.avatar_url ? <img src={profil.avatar_url} alt={`Avatar de ${pseudo}`} /> : <span>{pseudo.charAt(0).toUpperCase()}</span>}
          </div>
          {monProfil && <span className="profil-avatar-plus" aria-hidden="true"><Plus taille={21} /></span>}
        </div>
      </div>

      {/* Actions */}
      {!monProfil && (
        <div className="profil-actions">
          <button
            className={`principal${suivi ? ' suivi' : ''}`}
            onClick={basculerSuivi}
          >
            {suivi ? 'Abonné' : 'Suivre'}
          </button>
          <button className="secondaire" disabled title="Disponible prochainement">
            Message
          </button>
          <button className="carre" aria-label="Suggestions"><AjoutPersonne taille={20} plein /></button>
        </div>
      )}

      {/* Bio */}
      {bio && <div className="profil-bio">{bio}</div>}
      {monProfil && <button className="profil-studio" disabled title="Disponible prochainement">
        <Studio taille={18} /> Studio créateur
      </button>}

      {/* Onglets : cinq chez soi, deux chez les autres */}
      <div className="profil-onglets">
        <button
          className={onglet === 'videos' ? 'actif' : ''}
          onClick={() => setOnglet('videos')}
          aria-label="Vidéos"
        >
          <Grille taille={22} />
        </button>
        {monProfil && (
          <>
            <button
              className={onglet === 'privees' ? 'actif' : ''}
              onClick={() => setOnglet('privees')}
              aria-label="Privées"
            >
              <Cadenas taille={22} />
            </button>
            <button
              className={onglet === 'repartages' ? 'actif' : ''}
              onClick={() => setOnglet('repartages')}
              aria-label="Repartages"
            ><Repartage taille={22} /></button>
            <button
              className={onglet === 'favoris' ? 'actif' : ''}
              onClick={() => setOnglet('favoris')}
              aria-label="Favoris"
            ><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" /></svg></button>
            <button
              className={onglet === 'aimees' ? 'actif' : ''}
              onClick={() => setOnglet('aimees')}
              aria-label="Aimées"
            >
              <Coeur taille={22} />
            </button>
          </>
        )}
        {!monProfil && <button className={onglet === 'repartages' ? 'actif' : ''} onClick={() => setOnglet('repartages')} aria-label="Repartages"><Repartage taille={22} /></button>}
      </div>

      {/* Grille */}
      {onglet !== 'videos' ? (
        <div style={{ textAlign: 'center', color: 'var(--texte-attenue)', padding: '40px 20px', fontSize: 14 }}>
          {onglet === 'privees' ? 'Aucune vidéo privée' : onglet === 'repartages' ? 'Aucune vidéo repartagée' : onglet === 'favoris' ? 'Aucune vidéo enregistrée' : 'Aucune vidéo aimée'}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--texte-attenue)', padding: '40px 20px', fontSize: 14 }}>
          {monProfil ? "Vous n'avez pas encore publié de vidéo" : 'Aucune vidéo publiée'}
        </div>
      ) : (
        <div className="grille">
          {videos.map((v) => (
            <div className="case" key={v.id} onClick={() => supprimer(v.id)}>
              <video src={v.url} preload="metadata" muted playsInline />
              <span className="vues"><Lecture taille={11} /> {abreger(v.vues)}</span>
            </div>
          ))}
        </div>
      )}

      {monProfil && videos.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--texte-attenue)', marginTop: 12, textAlign: 'center' }}>
          Appuyez sur une vidéo pour la supprimer
        </p>
      )}
    </div>
  )
}
