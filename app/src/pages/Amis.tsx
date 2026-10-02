// ============================================================
// Onglet « Amis » : fil video plein ecran sombre, surmonte d'une
// rangee de stories.
//
// Deux etats, commandes par le defilement du fil :
//   - deploye (en haut du fil) : les bulles de stories en grand, la
//     video dessous avec des coins hauts arrondis ;
//   - replie (des que ca defile) : les bulles se tassent en une grappe
//     de petits avatars en haut a gauche, la video passe plein cadre
//     derriere l'entete.
//
// La mecanique de lecture est celle de Fil.tsx : un lecteur par carte,
// seule la carte visible lit.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { etatDemo, abreger, type VideoDemo, type Story } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { partager as partagerNatif } from '../lib/natif'
import Commentaires from '../components/Commentaires'
import BandeStories from '../components/BandeStories'
import Decouvrir from './Decouvrir'
import {
  Loupe, Chevron, AvionEnvoi, ListeLecture, PlusStory, EtincelleEtiquette,
  MarquePage, SonNote,
} from '../components/Icones'
import './amis.css'

// Habillage de demonstration des cartes : effet, son et liste de lecture
// n'existent pas encore dans les donnees, on les derive de la video pour
// que chaque carte garde les siens d'un rendu a l'autre.
const EFFETS = [
  { nom: 'Lumière douce', couleur: '#ff8a3d' },
  { nom: 'Vintage 229', couleur: '#8d6cff' },
  { nom: 'Néon Cotonou', couleur: '#1ec0f0' },
  { nom: 'Grain argentique', couleur: '#49c96d' },
  { nom: 'Coucher chaud', couleur: '#ff4d7e' },
]
const SONS = [
  { titre: 'Agbadja remix', artiste: 'DJ Zem' },
  { titre: 'Amiwo Groove', artiste: 'Mama Cuisine' },
  { titre: 'Dantokpa Beat', artiste: 'Vie Cotonou' },
  { titre: 'Zem Challenge', artiste: 'Rire 229' },
  { titre: 'Fils de Parakou', artiste: 'Culture BJ' },
]
const LISTES = [
  'Cotonou by night', 'Cuisine du pays', 'Marchés du Bénin',
  'Éclats de rire', 'Savoir-faire',
]

// Index stable deduit de l'identifiant : la meme video garde le meme
// habillage sans qu'il faille le stocker.
const empreinte = (id: string) => {
  let n = 0
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 997
  return n
}

// Grappe repliee : son propre avatar, puis trois autres qui se chevauchent
// a moitie. Elle remplace la rangee deployee, elle ne la double pas.
function Grappe({ pseudo, stories }: { pseudo: string; stories: Story[] }) {
  return (
    <div className="ami-grappe">
      <span className="ami-grappe-moi">
        <span className="ami-petit-avatar">{pseudo.charAt(0).toUpperCase()}</span>
        <span className="ami-petite-pastille"><PlusStory taille={9} /></span>
      </span>

      {stories.slice(0, 3).map((st, i) => (
        <span key={st.id} className={i > 0 ? 'ami-chevauche' : undefined}>
          <span className={`ami-petit-anneau${st.vue ? ' ami-vu' : ''}`}>
            <span className="ami-petit-avatar">{st.pseudo.charAt(0).toUpperCase()}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

function Carte({ video, actif, replie, onCommenter, onVisiter }: {
  video: VideoDemo
  actif: boolean
  // Replie : la video occupe tout le cadre. Deploye, elle recule sous la
  // rangee de stories et ses coins hauts s'arrondissent.
  replie: boolean
  onCommenter: (v: VideoDemo) => void
  onVisiter: (pseudo: string) => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [aime, setAime] = useState(video.aime)
  const [nbAime, setNbAime] = useState(video.nbAime)
  const [favori, setFavori] = useState(false)
  const [developpe, setDeveloppe] = useState(false)
  const [pause, setPause] = useState(true)

  // Seule la carte visible lit : lire les autres en fond consommerait des
  // donnees pour rien, ce qui est le premier critere produit du projet.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (actif) el.play().catch(() => undefined)
    else { el.pause(); el.currentTime = 0 }
  }, [actif])

  const [habillage] = useState(() => {
    const n = empreinte(video.id)
    return {
      effet: EFFETS[n % EFFETS.length],
      son: SONS[n % SONS.length],
      liste: LISTES[n % LISTES.length],
      // Anciennete affichee a cote du pseudo.
      minutes: 7 + (n % 54),
    }
  })

  const pseudo = video.profils?.pseudo ?? 'inconnu'

  const basculerAime = () => {
    const d = etatDemo.videos.find((v) => v.id === video.id)
    if (d) { d.aime = !aime; d.nbAime += aime ? -1 : 1 }
    setAime(!aime)
    setNbAime((n) => n + (aime ? -1 : 1))
  }

  const partager = async () => {
    const resultat = await partagerNatif(
      `@${pseudo}`,
      video.legende || 'Regarde cette vidéo sur Tok 229',
      `${window.location.origin}/?v=${video.id}`,
    )
    if (resultat === 'copie') alert('Lien copié')
  }

  return (
    <div className="ami-carte">
      <div className={`ami-cadre${replie ? '' : ' ami-cadre-recule'}`}>
        <video
          ref={ref}
          src={video.url}
          loop
          playsInline
          preload={actif ? 'auto' : 'none'}
          onPlay={() => setPause(false)}
          onPause={() => setPause(true)}
          onClick={(e) => {
            const el = e.currentTarget
            if (el.paused) el.play().catch(() => undefined)
            else el.pause()
          }}
        />

        {pause && actif && (
          <button className="ami-lecture" aria-label="Lire la vidéo"
            onClick={() => ref.current?.play().catch(() => undefined)}>
            <svg width="60" height="66" viewBox="0 0 60 66" aria-hidden="true">
              <path d="M8 4Q3 1 3 8v50q0 7 5 4l46-26q6-3 0-6Z" fill="#fffa" />
            </svg>
          </button>
        )}

        {/* Rail d'actions, de haut en bas : avatar et sa pastille d'envoi,
            j'aime, commentaires, favori, partage, disque. */}
        <div className="ami-actions">
          <button className="ami-avatar-boite" onClick={() => onVisiter(pseudo)}
            aria-label={`Profil de ${pseudo}`}>
            <span className="ami-avatar">{pseudo.charAt(0).toUpperCase()}</span>
            <span className="ami-pastille-envoi"><AvionEnvoi taille={13} /></span>
          </button>

          <button className={`ami-action${aime ? ' ami-aime' : ''}`} onClick={basculerAime}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M16 29C12 26 2 19 2 10.7 2 5.5 5.3 2 9.7 2c2.8 0 5 1.5 6.3 3.8C17.3 3.5 19.5 2 22.3 2 26.7 2 30 5.5 30 10.7 30 19 20 26 16 29Z" />
            </svg>
            <span>{abreger(nbAime)}</span>
          </button>

          <button className="ami-action" onClick={() => onCommenter(video)}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16 2C7.7 2 1 7.7 1 14.7c0 6.6 5.7 12 13 12.7V32l7.1-5.4C27 24.8 31 20.1 31 14.7 31 7.7 24.3 2 16 2ZM7 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <span>{abreger(video.nbCommentaires ?? 0)}</span>
          </button>

          <button className={`ami-action${favori ? ' ami-favori' : ''}`}
            aria-pressed={favori} onClick={() => setFavori(!favori)}>
            <MarquePage taille={30} plein={favori} />
            <span>{abreger(video.vues % 900)}</span>
          </button>

          <button className="ami-action" onClick={partager}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M19 2a1 1 0 0 1 1.7-.7l11 11a2 2 0 0 1 0 2.8l-11 11A1 1 0 0 1 19 25.4V19C10 18 5 21 1.8 25.5c-.7 1-1.8.5-1.7-.6C.8 14 7.1 8.5 19 8V2Z" />
            </svg>
            <span>Partager</span>
          </button>

          <span className={`ami-disque${actif && !pause ? ' ami-tourne' : ''}`}
            role="img" aria-label={`Son de ${pseudo}`}>
            <SonNote taille={22} />
          </span>
        </div>

        {/* Bloc du bas a gauche : effet, auteur, legende, son. */}
        <div className="ami-infos">
          <span className="ami-effet">
            <span className="ami-effet-badge" style={{ background: habillage.effet.couleur }}>
              <EtincelleEtiquette taille={11} />
            </span>
            <span className="ami-effet-texte">Effet · {habillage.effet.nom}</span>
          </span>

          <p className="ami-ligne-auteur">
            <button className="ami-pseudo" onClick={() => onVisiter(pseudo)}>{pseudo}</button>
            <span className="ami-anciennete"> · Il y a {habillage.minutes} min</span>
          </p>

          {video.legende && (
            <button className={`ami-legende${developpe ? ' ami-developpee' : ''}`}
              aria-expanded={developpe} onClick={() => setDeveloppe(!developpe)}>
              {video.legende}
            </button>
          )}

          <span className="ami-ligne-son">
            <SonNote taille={14} />
            <span className="ami-son-texte">
              Contient : {habillage.son.titre} - {habillage.son.artiste}
            </span>
          </span>
        </div>

        {/* Barre pleine largeur de la liste de lecture, juste au-dessus de
            la barre de navigation. */}
        <button className="ami-barre-liste">
          <ListeLecture taille={17} />
          <span>Liste de lecture · {habillage.liste}</span>
          <Chevron taille={18} className="ami-chevron-droit" />
        </button>
      </div>
    </div>
  )
}

export default function Amis({ onVisiter }: { onVisiter: (pseudo: string) => void }) {
  const { profil } = useAuth()
  const pseudo = profil?.pseudo ?? 'moi'
  const videos = etatDemo.videos
  const stories = etatDemo.stories

  const [index, setIndex] = useState(0)
  const [videoCom, setVideoCom] = useState<VideoDemo | null>(null)
  // Vrai des que le fil a quitte le haut : la rangee de stories se tasse.
  const [replie, setReplie] = useState(false)
  // La recherche recouvre l'ecran, ouverte par la loupe de l'entete.
  const [recherche, setRecherche] = useState(false)
  const filRef = useRef<HTMLDivElement>(null)
  // Ordonnee du doigt au debut du geste, pour reconnaitre un glissement
  // vers le haut tant que le fil est encore fige.
  const depart = useRef<number | null>(null)

  // Determine la carte visible d'apres la position de defilement : le
  // scroll-snap garantit qu'une carte occupe la hauteur du conteneur.
  const auDefilement = () => {
    const el = filRef.current
    if (!el) return
    if (el.scrollTop <= 0) setReplie(false)
    const i = Math.round(el.scrollTop / el.clientHeight)
    if (i !== index) setIndex(i)
  }

  // Premier palier : le fil est fige tant que la rangee est deployee, le
  // geste sert alors a rendre l'ecran entier a la premiere video, pas a
  // changer de video. Le geste suivant reprend son cours normal.
  const auDebut = (e: React.PointerEvent) => { depart.current = e.clientY }
  const auDeplacement = (e: React.PointerEvent) => {
    if (depart.current === null) return
    if (e.clientY - depart.current < -6) { setReplie(true); depart.current = null }
  }
  const aLaFin = () => { depart.current = null }

  if (recherche) return <Decouvrir onVisiter={(p) => { setRecherche(false); onVisiter(p) }} />

  return (
    <div className="ami-page">
      <div
        className={`ami-fil${replie ? '' : ' ami-fige'}`}
        ref={filRef}
        onScroll={auDefilement}
        onPointerDown={replie ? undefined : auDebut}
        onPointerMove={replie ? undefined : auDeplacement}
        onPointerUp={replie ? undefined : aLaFin}
        onPointerCancel={replie ? undefined : aLaFin}
      >
        {videos.map((v, i) => (
          <Carte key={v.id} video={v} actif={i === index} replie={replie}
            onCommenter={setVideoCom} onVisiter={onVisiter} />
        ))}
      </div>

      {/* Entete : titre centre et loupe. Posee au-dessus de tout, elle
          recoit un voile sombre une fois la video passee dessous. */}
      <header className={`ami-entete${replie ? ' ami-voilee' : ''}`}>
        <h1>Amis</h1>
        <button className="ami-loupe" aria-label="Rechercher"
          onClick={() => setRecherche(true)}>
          <Loupe taille={24} />
        </button>
      </header>

      {replie
        ? <div className="ami-grappe-boite"><Grappe pseudo={pseudo} stories={stories} /></div>
        : <div className="ami-rangee"><BandeStories pseudo={pseudo} stories={stories} onOuvrir={onVisiter} /></div>}

      {videoCom && (
        <Commentaires videoId={videoCom.id} onFermer={() => setVideoCom(null)} onAjout={() => undefined} />
      )}
    </div>
  )
}
