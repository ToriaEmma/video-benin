// ============================================================
// Onglet « Amis » : fil video plein ecran sombre, surmonte d'une
// rangee de recits.
//
// Deux etats, commandes par le defilement du fil :
//   - deploye (en haut du fil) : les bulles de recits en grand, la
//     video dessous avec des coins hauts arrondis ;
//   - replie (des que ca defile) : les bulles se tassent en une grappe
//     de petits avatars en haut a gauche, la video passe plein cadre
//     derriere l'entete.
//
// La mecanique de lecture et les interactions sont celles de Fil.tsx :
// un lecteur par carte, seule la carte visible lit, et le fil vient de
// GET /videos/suivis.
// ============================================================

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { apiInteractions, apiVideos, type VideoApi } from '../lib/api'
import { abreger, etatDemo } from '../lib/demo'
import type { Story } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { partager as partagerNatif } from '../lib/natif'
import Commentaires from '../components/Commentaires'
import BandeStories from '../components/BandeStories'
import Suggestions from '../components/Suggestions'
import {
  Loupe, ChevronDroit, AvionEnvoi, ListeLecture, PlusStory,
  EtincelleEtiquette, MarquePage, SonNote,
} from '../components/Icones'
import './amis.css'

// Position de lecture affichee pendant le glissement, en « m:ss ».
const horloge = (secondes: number) => {
  const s = Number.isFinite(secondes) ? Math.max(0, Math.floor(secondes)) : 0
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Au-dela de cette distance horizontale, le geste ouvre le profil de
// l'auteur. La comparaison avec l'ecart vertical se fait a part : le fil
// defile a la verticale, un glissement oblique ne doit pas le detourner.
const SEUIL_LATERAL = 55

// Habillage de demonstration des cartes : effet, son et liste de lecture
// n'existent pas encore dans les donnees, on les derive de la video pour
// que chaque carte garde les siens d'un rendu a l'autre.
const EFFETS = [
  { nom: 'Lumière douce', couleur: '#ff8a3d' },
  { nom: 'Vintage 229', couleur: '#8d6cff' },
  { nom: 'Néon Cotonou', couleur: '#1ec0f0' },
  { nom: 'Grain argentique', couleur: '#c43cc0' },
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

function Carte({ video, actif, replie, nbCom, onCommenter, onVisiter, onErreur, suivi, onSuivi }: {
  video: VideoApi
  actif: boolean
  // Replie : la video occupe tout le cadre. Deploye, elle recule sous la
  // rangee de recits et ses coins hauts s'arrondissent.
  replie: boolean
  // Nombre de commentaires tenu par l'ecran : la feuille vit au-dessus
  // du fil, c'est donc elle qui en fait varier le compte.
  nbCom: number
  onCommenter: (v: VideoApi) => void
  onVisiter: (pseudo: string) => void
  // Un j'aime ou un favori refuse remonte a l'ecran, qui l'affiche en
  // bandeau : la carte continue de se lire.
  onErreur: (message: string) => void
  // Abonnement a l'auteur, tenu par l'ecran : la meme personne pouvant
  // publier plusieurs videos du fil, la pastille doit disparaitre sur
  // toutes ses cartes des qu'on s'abonne depuis l'une d'elles.
  suivi: boolean
  onSuivi: (pseudo: string, suivi: boolean) => void
}) {
  const { profil } = useAuth()
  const ref = useRef<HTMLVideoElement>(null)
  // Les compteurs arrivent deja dans la video : aucune requete de plus a
  // l'affichage d'une carte.
  const [aime, setAime] = useState(video.aime)
  const [nbAime, setNbAime] = useState(video.nbAime)
  const [favori, setFavori] = useState(video.favori)
  const [developpe, setDeveloppe] = useState(false)
  const [pause, setPause] = useState(true)
  const [progression, setProgression] = useState(0)
  // Deplacement en cours sur la barre : la position chiffree ne s'affiche
  // que pendant ce temps, elle encombrerait la video le reste du temps.
  const [glisse, setGlisse] = useState(false)
  // Duree totale, relevee par la video : la lire sur l'element pendant le
  // rendu est interdit, et le minuteur en a besoin pour s'afficher.
  const [duree, setDuree] = useState(0)
  // Seconde visee, relevee pendant le glissement : `currentTime` de
  // l'element ne declenche pas de rendu, il faut donc la garder ici.
  const [visee, setVisee] = useState(0)
  // Abscisse et ordonnee du doigt au debut du geste, pour reconnaitre un
  // glissement franchement horizontal.
  const depart = useRef<{ x: number; y: number } | null>(null)

  // Seule la carte visible lit : lire les autres en fond consommerait des
  // donnees pour rien, ce qui est le premier critere produit du projet.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (actif) el.play().catch(() => undefined)
    else { el.pause(); el.currentTime = 0 }
  }, [actif])

  // La vue part quand la carte devient celle qu'on regarde, et non a chaque
  // rendu. L'echec est silencieux : rater un comptage ne doit pas
  // interrompre le visionnage.
  useEffect(() => {
    if (!actif) return
    apiVideos.vue(video.id).catch(() => { /* Compteur de vues indisponible. */ })
  }, [actif, video.id])

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

  const pseudo = video.pseudo
  const sienne = !!profil && profil.pseudo === pseudo

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

  // Abonnement depuis le fil, sur le meme modele que le j'aime :
  // affiche d'abord, confirme ensuite, defait si le serveur refuse.
  const suivre = () => {
    onSuivi(pseudo, true)
    apiInteractions.suivre(pseudo)
      .then(r => onSuivi(pseudo, r.suivi))
      .catch((e: Error) => { onSuivi(pseudo, false); onErreur(e.message) })
  }

  const partager = async () => {
    const resultat = await partagerNatif(
      `@${pseudo}`,
      video.legende || 'Regarde cette vidéo sur TockTick',
      `${window.location.origin}/?v=${video.id}`,
    )
    if (resultat === 'copie') onErreur('Lien copié')
  }

  // Glissement vers la droite : le profil de l'auteur. Le fil defilant a
  // la verticale, le geste n'est retenu que s'il est franchement
  // horizontal, sans quoi il volerait le defilement d'une video a l'autre.
  const auDebutLateral = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
  }
  const aLaFinLaterale = (e: React.PointerEvent) => {
    const d = depart.current
    depart.current = null
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (dx > SEUIL_LATERAL && Math.abs(dx) > Math.abs(dy) * 2) onVisiter(pseudo)
  }

  return (
    <div className="ami-carte"
      onPointerDown={auDebutLateral}
      onPointerUp={aLaFinLaterale}
      onPointerCancel={() => { depart.current = null }}>
      <div className={`ami-cadre${replie ? '' : ' ami-cadre-recule'}`}>
        <video
          ref={ref}
          src={video.url}
          loop
          playsInline
          preload={actif ? 'auto' : 'none'}
          onPlay={() => setPause(false)}
          onPause={() => setPause(true)}
          onLoadedMetadata={e => {
            const d = e.currentTarget.duration
            setDuree(Number.isFinite(d) ? d : 0)
          }}
          onTimeUpdate={e => {
            // Pendant un glissement la barre appartient au doigt : la
            // relever depuis la video la ferait sauter en arriere.
            if (glisse) return
            const v = e.currentTarget
            setProgression(v.duration ? v.currentTime / v.duration * 100 : 0)
          }}
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
          <span className="ami-avatar-boite">
            <button className="ami-avatar" onClick={() => onVisiter(pseudo)}
              aria-label={`Profil de ${pseudo}`}>
              {pseudo.charAt(0).toUpperCase()}
            </button>
            {/* Le « + » occupe la place de la pastille d'envoi tant qu'on
                ne suit pas l'auteur, et lui rend ensuite. Il ne parait
                jamais sur ses propres videos. */}
            {sienne || suivi ? (
              <span className="ami-pastille-envoi"><AvionEnvoi taille={13} /></span>
            ) : (
              <button className="ami-pastille-suivre" onClick={suivre}
                aria-label={`S'abonner à ${pseudo}`}>
                <PlusStory taille={12} />
              </button>
            )}
          </span>

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
            <span>{abreger(nbCom)}</span>
          </button>

          <button className={`ami-action${favori ? ' ami-favori' : ''}`}
            aria-label={favori ? 'Retirer des favoris' : 'Enregistrer en favori'}
            aria-pressed={favori} onClick={basculerFavori}>
            <MarquePage taille={30} plein={favori} />
            <span>{favori ? 'Enregistré' : 'Favoris'}</span>
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

        {/* Barre de lecture : le curseur occupe toute la largeur et une
            hauteur confortable au pouce, le trait visible restant fin. Un
            simple appui ailleurs sur la barre y saute directement. */}
        <input
          className={`ami-progression${glisse ? ' ami-glisse' : ''}`}
          style={{ '--progression': `${progression}%` } as CSSProperties}
          type="range" aria-label="Position de lecture"
          min="0" max="100" step="0.1" value={progression}
          onPointerDown={() => setGlisse(true)}
          onPointerUp={() => setGlisse(false)}
          onPointerCancel={() => setGlisse(false)}
          onKeyDown={() => setGlisse(true)}
          onKeyUp={() => setGlisse(false)}
          onBlur={() => setGlisse(false)}
          onChange={e => {
            const v = ref.current
            const part = Number(e.target.value)
            setProgression(part)
            if (v && Number.isFinite(v.duration)) {
              const seconde = part / 100 * v.duration
              v.currentTime = seconde
              setVisee(seconde)
            }
          }}
        />

        {/* Position atteinte, montree seulement pendant le deplacement. */}
        {glisse && (
          <span className="ami-minuteur">{horloge(visee)} / {horloge(duree)}</span>
        )}

        {/* Barre pleine largeur de la liste de lecture, juste au-dessus de
            la barre de navigation. */}
        <button className="ami-barre-liste">
          <ListeLecture taille={17} />
          <span>Liste de lecture · {habillage.liste}</span>
          <span className="ami-chevron-droit"><ChevronDroit taille={18} /></span>
        </button>
      </div>
    </div>
  )
}

export default function Amis({ onVisiter, onRechercher }: {
  onVisiter: (pseudo: string) => void
  // La loupe de l'entete ouvre l'ecran « Découvrir », comme sur mobile.
  onRechercher: () => void
}) {
  const { profil } = useAuth()
  const pseudo = profil?.pseudo ?? 'moi'
  // DECOR LOCAL : bulles de demonstration ajoutees apres les vrais
  // recits, que BandeStories charge elle-meme depuis /stories.
  const stories = etatDemo.stories

  const [videos, setVideos] = useState<VideoApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Erreur d'une interaction, distincte de celle du chargement : elle
  // s'affiche en bandeau sans vider le fil.
  const [erreurAction, setErreurAction] = useState('')
  // Incremente par « Réessayer » : l'effet de chargement repart, sans
  // dupliquer la requete entre le montage et le bouton de reprise.
  const [reprise, setReprise] = useState(0)
  // Carte visible. Declaree avant le chargement, qui la ramene en tete
  // des qu'un nouveau fil arrive.
  const [index, setIndex] = useState(0)

  // Le retour a l'attente se fait dans « Réessayer » et non ici : l'etat
  // de depart est deja « en chargement », et le poser dans l'effet
  // relancerait un rendu a chaque montage pour rien.
  const reessayer = () => {
    setChargement(true)
    setErreur('')
    setReprise(n => n + 1)
  }

  useEffect(() => {
    let valable = true
    // Fil des abonnements, et non le fil general : l'onglet ne montre que
    // les comptes que le lecteur suit, sans quoi son nom serait trompeur.
    apiVideos.suivis()
      .then(v => { if (valable) { setVideos(v); setIndex(0) } })
      .catch((e: Error) => { if (valable) { setErreur(e.message); setVideos([]) } })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [reprise])

  // Comptes suivis, charges une fois pour tout le fil : la video de l'API
  // ne porte pas la relation d'abonnement, et une requete par carte en
  // ferait autant que de videos. L'onglet ne montrant que des comptes
  // suivis, la pastille y est normalement absente ; elle reparait apres un
  // desabonnement fait ailleurs, le fil n'etant pas recharge pour autant.
  const [abonnes, setAbonnes] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const moi = profil?.pseudo
    if (!moi) return
    let valable = true
    apiInteractions.abonnements(moi, { limite: 200 })
      .then(c => { if (valable) setAbonnes(new Set(c.map(x => x.pseudo))) })
      .catch(() => { /* Liste d'abonnements indisponible. */ })
    return () => { valable = false }
  }, [profil?.pseudo])

  // L'abonnement se note par pseudo et non par video : le meme auteur peut
  // tenir plusieurs cartes du fil, toutes doivent suivre.
  const marquerSuivi = (p: string, suivi: boolean) =>
    setAbonnes(anciens => {
      const prochains = new Set(anciens)
      if (suivi) prochains.add(p)
      else prochains.delete(p)
      return prochains
    })

  const [videoCom, setVideoCom] = useState<VideoApi | null>(null)
  // Ecarts de commentaires par video, depuis l'ouverture de l'onglet : la
  // feuille se ferme, son compteur doit rester juste sans recharger le fil.
  const [ecartsCom, setEcartsCom] = useState<Record<string, number>>({})
  // Vrai des que le fil a quitte le haut : la rangee de recits se tasse.
  const [replie, setReplie] = useState(false)
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

  // Un fil vide et un fil en panne se ressemblent a l'ecran : le message du
  // serveur distingue les deux. Vide sans erreur, la cause est connue : le
  // lecteur ne suit encore personne, et les suggestions l'en sortent.
  const corps = chargement ? (
    <div className="ami-attente"><p>Chargement…</p></div>
  ) : erreur ? (
    <div className="ami-attente">
      <p role="alert">{erreur}</p>
      <button className="ami-reessayer" onClick={reessayer}>Réessayer</button>
    </div>
  ) : videos.length === 0 ? (
    <div className="ami-attente">
      <b>Aucune vidéo de tes abonnements</b>
      <p>Abonne-toi à des comptes pour voir leurs vidéos ici.</p>
      {/* Le fil vide devient actionnable : on suit depuis ici meme. */}
      <Suggestions onVisiter={onVisiter} />
    </div>
  ) : (
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
          nbCom={Math.max(0, v.nbCommentaires + (ecartsCom[v.id] ?? 0))}
          suivi={abonnes.has(v.pseudo)} onSuivi={marquerSuivi}
          onErreur={setErreurAction}
          onCommenter={setVideoCom} onVisiter={onVisiter} />
      ))}
    </div>
  )

  return (
    <div className="ami-page">
      {corps}

      {/* Entete : titre centre et loupe. Posee au-dessus de tout, elle
          recoit un voile sombre une fois la video passee dessous. */}
      <header className={`ami-entete${replie ? ' ami-voilee' : ''}`}>
        <h1>Amis</h1>
        <button className="ami-loupe" aria-label="Rechercher" onClick={onRechercher}>
          <Loupe taille={24} />
        </button>
      </header>

      {replie
        ? <div className="ami-grappe-boite"><Grappe pseudo={pseudo} stories={stories} /></div>
        : <div className="ami-rangee"><BandeStories pseudo={pseudo} stories={stories} onOuvrir={onVisiter} /></div>}

      {/* Un j'aime ou un favori refuse par le serveur se signale ici : la
          video continue de se lire, seul le bandeau apparait. */}
      {erreurAction && (
        <button className="ami-bandeau" onClick={() => setErreurAction('')}>
          {erreurAction}
        </button>
      )}

      {videoCom && (
        <Commentaires videoId={videoCom.id} onFermer={() => setVideoCom(null)}
          onVariation={n => setEcartsCom(e => ({ ...e, [videoCom.id]: (e[videoCom.id] ?? 0) + n }))} />
      )}
    </div>
  )
}
