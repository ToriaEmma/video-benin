import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { apiInteractions, apiVideos, type VideoApi } from '../lib/api'
import { type VideoDemo } from '../lib/demo'
import { useAuth } from '../lib/auth'
import Commentaires from '../components/Commentaires'
import EnvoyerA from '../components/EnvoyerA'
import Communaute from './Communaute'
import DirectLive from './DirectLive'
import AnalyseVideo from './AnalyseVideo'
import { Film } from '../components/Icones'
import { Loupe } from '../components/Icones'
import './fil.css'

export type Video = VideoApi

const abreger = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)} K`
  : String(n)

function Carte({ video, actif, onVisiter, onErreur }: {
  video: Video
  actif: boolean
  onVisiter: (p: string) => void
  // Un j'aime ou un favori refuse remonte a l'ecran, qui l'affiche en
  // bandeau : la carte continue de se lire.
  onErreur: (message: string) => void
}) {
  const { profil } = useAuth()
  const ref = useRef<HTMLVideoElement>(null)
  // Les compteurs arrivent deja dans la video : aucune requete de plus a
  // l'affichage d'une carte.
  const [aime, setAime] = useState(video.aime)
  const [nbAime, setNbAime] = useState(video.nbAime)
  const [nbCom, setNbCom] = useState(video.nbCommentaires)
  const [favori, setFavori] = useState(video.favori)
  const [ouvrirCom, setOuvrirCom] = useState(false)
  const [envoyer, setEnvoyer] = useState(false)
  const [pause, setPause] = useState(true)
  const [progression, setProgression] = useState(0)
  const [developpe, setDeveloppe] = useState(false)
  const [analyse, setAnalyse] = useState(false)

  // La lecture ne demarre que sur la carte visible : lire les autres en fond
  // consommerait des donnees pour rien, ce qui est le premier critere produit
  // du projet (cout du megaoctet au Benin).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (actif) {
      el.play().catch(() => undefined)
    } else {
      el.pause()
      el.currentTime = 0
    }
  }, [actif])

  // La vue part quand la carte devient celle qu'on regarde, et non a chaque
  // rendu. L'echec est silencieux : rater un comptage ne doit pas
  // interrompre le visionnage.
  useEffect(() => {
    if (!actif) return
    apiVideos.vue(video.id).catch(() => { /* Compteur de vues indisponible. */ })
  }, [actif, video.id])

  // Le serveur renvoie le decompte reel : on l'affiche d'abord de maniere
  // optimiste, puis on se recale dessus, et on revient en arriere si la
  // requete echoue.
  const basculerAime = () => {
    const vise = !aime
    setAime(vise)
    setNbAime(n => n + (vise ? 1 : -1))
    const envoi = vise
      ? apiInteractions.aimer(video.id)
      : apiInteractions.retirerJaime(video.id)
    envoi
      .then(r => { setAime(r.aime); setNbAime(r.nbAime) })
      .catch((e: Error) => {
        setAime(!vise)
        setNbAime(n => n + (vise ? -1 : 1))
        onErreur(e.message)
      })
  }

  const basculerFavori = () => {
    const vise = !favori
    setFavori(vise)
    const envoi = vise
      ? apiInteractions.mettreEnFavori(video.id)
      : apiInteractions.retirerFavori(video.id)
    envoi
      .then(r => setFavori(r.favori))
      .catch((e: Error) => { setFavori(!vise); onErreur(e.message) })
  }

  const pseudo = video.pseudo

  // L'analyse attend la forme de demonstration : la video de l'API la
  // remplit, `publieeLe` passant de l'ISO au « mois-jour » qu'elle lit.
  if (analyse) {
    const date = new Date(video.publieeLe)
    const sujet: VideoDemo = {
      id: video.id,
      url: video.url,
      legende: video.legende,
      vues: video.vues,
      auteur_id: video.auteurId,
      profils: { pseudo },
      aime,
      nbAime,
      nbCommentaires: nbCom,
      departement: video.departement ?? '',
      visibilite: video.visibilite,
      commentairesAutorises: video.commentairesAutorises,
      reutilisationAutorisee: video.reutilisationAutorisee,
      publieeLe: `${date.getMonth() + 1}-${date.getDate()}`,
    }
    return <AnalyseVideo video={sujet} onRetour={() => setAnalyse(false)} />
  }

  return (
    <div className="video-carte">
      <video
        ref={ref}
        src={video.url}
        loop
        playsInline
        muted={false}
        preload={actif ? 'auto' : 'none'}
        onPlay={() => setPause(false)}
        onPause={() => setPause(true)}
        onTimeUpdate={e => { const v = e.currentTarget; setProgression(v.duration ? v.currentTime / v.duration * 100 : 0) }}
        onClick={(e) => {
          const el = e.currentTarget
          if (el.paused) el.play().catch(() => undefined)
          else el.pause()
        }}
      />
      {pause && <button className="fil-play" aria-label="Lire la vidéo" onClick={() => ref.current?.play().catch(() => undefined)}><svg width="60" height="66" viewBox="0 0 60 66" aria-hidden="true"><path d="M8 4Q3 1 3 8v50q0 7 5 4l46-26q6-3 0-6Z" fill="white"/></svg></button>}

      <div className="actions">
        <button className="avatar" onClick={() => onVisiter(pseudo)} aria-label={`Profil de ${pseudo}`}>
          {pseudo.charAt(0).toUpperCase()}
        </button>

        <button className={`action${aime ? ' aime' : ''}`} onClick={basculerAime}>
          <span className="glyphe"><svg width="34" height="34" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 29C12 26 2 19 2 10.7 2 5.5 5.3 2 9.7 2c2.8 0 5 1.5 6.3 3.8C17.3 3.5 19.5 2 22.3 2 26.7 2 30 5.5 30 10.7 30 19 20 26 16 29Z"/></svg></span>
          <span>{abreger(nbAime)}</span>
        </button>

        <button className="action" onClick={() => setOuvrirCom(true)}>
          <span className="glyphe"><svg width="34" height="34" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16 2C7.7 2 1 7.7 1 14.7c0 6.6 5.7 12 13 12.7V32l7.1-5.4C27 24.8 31 20.1 31 14.7 31 7.7 24.3 2 16 2ZM7 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg></span>
          <span>{abreger(nbCom)}</span>
        </button>

        <button className="action" onClick={() => setEnvoyer(true)}>
          <span className="glyphe"><svg width="34" height="34" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M19 2a1 1 0 0 1 1.7-.7l11 11a2 2 0 0 1 0 2.8l-11 11A1 1 0 0 1 19 25.4V19C10 18 5 21 1.8 25.5c-.7 1-1.8.5-1.7-.6C.8 14 7.1 8.5 19 8V2Z"/></svg></span>
          <span>Partager</span>
        </button>
        <button className="action fil-favori" aria-label={favori ? 'Retirer des favoris' : 'Enregistrer en favori'} aria-pressed={favori} onClick={basculerFavori}><svg width="27" height="32" viewBox="0 0 24 28" fill={favori ? '#ffd15b' : 'white'} aria-hidden="true"><path d="M5 2h14a2 2 0 0 1 2 2v22l-9-6-9 6V4a2 2 0 0 1 2-2Z"/></svg><span>{favori ? 'Enregistré' : 'Favoris'}</span></button>
        <span className={`fil-disque${actif && !pause ? ' tourne' : ''}`} role="img" aria-label={`Son de ${pseudo}`}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2" fill="currentColor"/><ellipse cx="17" cy="16" rx="3" ry="2" fill="currentColor"/></svg></span>
      </div>

      <div className="infos">
        <button className="pseudo" onClick={() => onVisiter(pseudo)}>@{pseudo}</button>
        {video.legende && <button className={`legende ${developpe ? 'developpee' : ''}`} onClick={() => setDeveloppe(!developpe)} aria-expanded={developpe}>{video.legende}{!developpe && <span>… plus</span>}</button>}
      </div>
      <input className="fil-progression" style={{'--progression': `${progression}%`} as CSSProperties} type="range" aria-label="Position de lecture" min="0" max="100" step="0.1" value={progression} onChange={e => {const v = ref.current;if(v && Number.isFinite(v.duration)) {v.currentTime = Number(e.target.value)/100*v.duration;setProgression(Number(e.target.value))}}}/>

      {ouvrirCom && (
        <Commentaires
          videoId={video.id}
          onFermer={() => setOuvrirCom(false)}
          onVariation={(n) => setNbCom((c) => Math.max(0, c + n))}
        />
      )}

      {/* La feuille change de rangees selon que la publication est la
          notre ou celle d'un autre compte. */}
      {envoyer && (
        <EnvoyerA
          legende={video.legende || `@${pseudo}`}
          sienne={!!profil && profil.pseudo === pseudo}
          auteur={pseudo}
          onFermer={() => setEnvoyer(false)}
          onAnalytiques={() => setAnalyse(true)}
        />
      )}
    </div>
  )
}

export default function Fil({ onVisiter, onRechercher }: { onVisiter: (p: string) => void; onRechercher: () => void }) {
  const [categorie, setCategorie] = useState('Pour toi')
  const [videos, setVideos] = useState<Video[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Erreur d'une interaction, distincte de celle du chargement : elle
  // s'affiche en bandeau sans vider le fil.
  const [erreurAction, setErreurAction] = useState('')
  const [indexActif, setIndexActif] = useState(0)
  const filRef = useRef<HTMLDivElement>(null)

  // « Suivis » et « Pour toi » lisent deux routes distinctes : le
  // chargement se relance donc au changement d'onglet.
  const suivis = categorie === 'Suivis'

  // Compteur de rechargement : l'incrementer relance l'effet, ce qui evite
  // de dupliquer la requete entre le montage et le bouton de reprise.
  const [reprise, setReprise] = useState(0)
  const charger = useCallback(() => setReprise(n => n + 1), [])

  useEffect(() => {
    // Seuls les deux onglets de fil interrogent l'API : Communaute et
    // le LIVE portent leurs propres contenus.
    if (!suivis && categorie !== 'Pour toi') return
    let valable = true
    setChargement(true)
    setErreur('')
    const demande = suivis ? apiVideos.suivis() : apiVideos.liste()
    demande
      .then(v => { if (valable) { setVideos(v); setIndexActif(0) } })
      .catch((e: Error) => { if (valable) { setErreur(e.message); setVideos([]) } })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [categorie, suivis, reprise])

  // Carte de la mosaique « Communauté » : le fil bascule sur « Pour toi » et
  // s'ouvre sur la video touchee. Le defilement attend le rendu du fil, qui
  // n'est monte qu'apres le changement de categorie.
  const ouvrirDepuisMosaique = (videoId: string) => {
    const i = videos.findIndex(v => v.id === videoId)
    setCategorie('Pour toi')
    if (i < 0) return
    setIndexActif(i)
    requestAnimationFrame(() => {
      const el = filRef.current
      if (el) el.scrollTo({ top: i * el.clientHeight })
    })
  }

  // Determine la carte visible d'apres la position de defilement plutot que par
  // un IntersectionObserver : le scroll-snap garantit qu'une carte occupe
  // toujours exactement la hauteur du conteneur.
  const auDefilement = () => {
    const el = filRef.current
    if (!el) return
    const i = Math.round(el.scrollTop / el.clientHeight)
    if (i !== indexActif) setIndexActif(i)
  }

  // Le LIVE porte sa propre entete et sa croix de sortie : il prend tout
  // l'ecran, la barre des categories ne se superpose pas.
  if (categorie === 'LIVE')
    return <DirectLive onFermer={() => setCategorie('Pour toi')} />

  // Un fil vide et un fil en panne se ressemblent a l'ecran : le message du
  // serveur distingue les deux, et le bouton permet de retenter sans
  // quitter l'onglet.
  const corps = chargement ? (
    <div className="fil-attente"><p>Chargement…</p></div>
  ) : erreur ? (
    <div className="fil-attente">
      <p role="alert">{erreur}</p>
      <button className="fil-reessayer" onClick={charger}>Réessayer</button>
    </div>
  ) : videos.length === 0 ? (
    <div className="vide">
      <span className="glyphe"><Film taille={46} /></span>
      <b>{suivis ? 'Aucune vidéo de tes abonnements' : 'Aucune vidéo pour le moment'}</b>
      <span>{suivis
        ? 'Abonne-toi à des comptes pour remplir ce fil'
        : 'Soyez le premier à publier'}</span>
    </div>
  ) : (
    <div className="fil" ref={filRef} onScroll={auDefilement}>
      {videos.map((v, i) => (
        <Carte key={v.id} video={v} actif={i === indexActif}
          onVisiter={onVisiter} onErreur={setErreurAction} />
      ))}
    </div>
  )

  return (
    <div className="fil-ecran"><header className="fil-entete"><button aria-label="Vidéos LIVE" onClick={() => setCategorie('LIVE')}><svg width="27" height="27" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 2 5 5 5-5M3 12V8h22v4M3 23v3h22v-3"/><text x="14" y="20" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10" fontWeight="700">LIVE</text></svg></button><div>{['Communauté','Suivis','Pour toi'].map(c => <button key={c} className={categorie===c?'actif':''} onClick={() => setCategorie(c)}>{c}</button>)}</div><button aria-label="Rechercher" onClick={onRechercher}><Loupe taille={25}/></button></header>
    {categorie === 'Communauté' ? <Communaute onOuvrir={ouvrirDepuisMosaique} /> : corps}

    {/* Un j'aime ou un favori refuse par le serveur se signale ici : la
        video continue de se lire, seul le bandeau apparait. */}
    {erreurAction && (
      <button className="fil-bandeau" onClick={() => setErreurAction('')}>
        {erreurAction}
      </button>
    )}</div>
  )
}
