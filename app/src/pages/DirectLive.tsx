// ============================================================
// Pseudo-categorie « LIVE » du fil, atteinte par le clap en haut a
// gauche. Elle se tient en deux etats :
//
//  - « Découvrir » : la feuille sombre qui liste les comptes en direct
//    et montre un apercu du direct en cours dans un panneau arrondi ;
//  - le direct en plein ecran, obtenu en depliant ce panneau par sa
//    poignee ou par un balayage vers le haut.
//
// Les deux etats partagent le meme element video, deplace d'un
// conteneur a l'autre : deplier le panneau ne relance donc pas la
// diffusion depuis le debut.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import {
  etatDemo, abreger, livesDemo, messagesLiveDemo, messagesLiveSuite,
  type MessageLive,
} from '../lib/demo'
import { useAuth } from '../lib/auth'
import {
  CalendrierEtoile, CameraLive, Croix, ChevronBas, ChevronHaut,
  Couronne, CoeurPlein, InvitesLive, CadeauLive, Emoji, PartageLive,
} from '../components/Icones'
import './direct.css'

// Nombre de messages gardes a l'ecran : au-dela, les plus anciens
// sortent par le haut, comme dans un tchat de direct.
const MESSAGES_VISIBLES = 6
// Cadence d'arrivee des nouveaux messages.
const CADENCE = 3200
// Duree de la montee d'un coeur, accordee a la transition CSS.
const VOL_COEUR = 2600

// Diffusion regardee : le premier compte en direct de la liste.
const DIFFUSION = livesDemo[0]

// Avatar : une initiale dans un rond gris, faute de portrait.
function Avatar({ pseudo, taille, bordure = false }: {
  pseudo: string; taille: number; bordure?: boolean
}) {
  return (
    <span className={`dir-avatar${bordure ? ' dir-avatar-bordure' : ''}`}
      style={{ width: taille, height: taille, fontSize: taille * 0.42 }}>
      {pseudo.charAt(0).toUpperCase()}
    </span>
  )
}

// Tchat du direct, en bas a gauche.
function Tchat({ messages }: { messages: MessageLive[] }) {
  return (
    <div className="dir-tchat" aria-live="polite">
      {messages.map(m => (
        <div className="dir-message" key={m.id}>
          {m.systeme ? (
            <p className="dir-message-systeme">
              <b>{m.pseudo} </b>{m.texte}
            </p>
          ) : (
            <>
              <Avatar pseudo={m.pseudo} taille={17} />
              <p className="dir-message-texte">
                <b>{m.pseudo} </b>{m.texte}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function DirectLive({ onFermer }: {
  // Croix de l'entete : le fil revient a la categorie precedente.
  onFermer: () => void
}) {
  const { profil } = useAuth()
  const moi = profil?.pseudo ?? 'moi'

  // Plein ecran ou feuille « Découvrir ».
  const [plein, setPlein] = useState(false)
  const [suivi, setSuivi] = useState(false)
  const [messages, setMessages] = useState<MessageLive[]>(
    () => messagesLiveDemo.slice(-MESSAGES_VISIBLES),
  )
  // Coeurs en vol : chaque entree porte son identifiant et son ecart au
  // bord, pour que deux coeurs ne se superposent pas exactement.
  const [coeurs, setCoeurs] = useState<{ id: number; decalage: number }[]>([])
  const [saisie, setSaisie] = useState('')

  // Un seul element video pour les deux etats : on le deplace dans le
  // conteneur de l'etat courant plutot que d'en monter un second, qui
  // repartirait du debut.
  const video = useRef<HTMLVideoElement | null>(null)
  const hote = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!video.current) {
      const el = document.createElement('video')
      el.src = etatDemo.videos[0]?.url ?? ''
      el.loop = true
      el.muted = true
      el.playsInline = true
      el.className = 'dir-video'
      video.current = el
    }
    const el = video.current
    hote.current?.appendChild(el)
    el.play().catch(() => undefined)
    // Quitter le LIVE arrete la diffusion : un element detache continuerait
    // a jouer, et le cout du megaoctet est le premier critere du projet.
    return () => { if (!document.contains(el)) el.pause() }
  }, [plein])

  // Arrivee des messages et des coeurs : la mise a jour se fait dans la
  // fonction du minuteur, jamais dans le corps de l'effet.
  //
  // Les coeurs ne sont semes qu'en plein ecran : ailleurs, rien ne les
  // affiche, donc rien ne signalerait la fin de leur animation et la
  // liste n'arreterait pas de grandir.
  useEffect(() => {
    let rang = 0
    const minuteur = setInterval(() => {
      const modele = messagesLiveSuite[rang % messagesLiveSuite.length]
      rang += 1
      const suite = rang
      setMessages(liste => [
        ...liste, { ...modele, id: `${modele.id}-${suite}` },
      ].slice(-MESSAGES_VISIBLES))
      if (plein) {
        setCoeurs(liste => [
          ...liste, { id: Date.now() + suite, decalage: 10 + (suite % 3) * 16 },
        ])
      }
    }, CADENCE)
    return () => clearInterval(minuteur)
  }, [plein])

  // Les coeurs partis sont retires au bout de leur animation : sans ce
  // menage, la liste grandirait indefiniment.
  useEffect(() => {
    if (coeurs.length === 0) return
    const minuteur = setTimeout(
      () => setCoeurs(liste => liste.slice(1)), VOL_COEUR,
    )
    return () => clearTimeout(minuteur)
  }, [coeurs])

  // Un balayage vers le haut deplie le direct, comme la poignee du
  // panneau. Le pointeur remplace le PanResponder du mobile.
  const depart = useRef(0)
  const auDebut = (e: React.PointerEvent) => { depart.current = e.clientY }
  const aLaFin = (e: React.PointerEvent) => {
    if (depart.current - e.clientY > 40) setPlein(true)
  }

  // ----------------------------------------------------------
  // Etat B : le direct en plein ecran.
  // ----------------------------------------------------------
  if (plein) {
    return (
      <div className="dir-page dir-pleine">
        <span className="dir-hote" ref={hote} />
        <div className="dir-voile-haut" />
        <div className="dir-voile-bas" />

        {/* Premiere rangee : le diffuseur, le nombre de spectateurs et
            les deux boutons de sortie. */}
        <div className="dir-rangee-haute">
          <div className="dir-pille-diffuseur">
            <Avatar pseudo={DIFFUSION.pseudo} taille={30} bordure />
            <span className="dir-diffuseur-textes">
              <b>{DIFFUSION.pseudo}</b>
              <span className="dir-diffuseur-abonnes">
                <CoeurPlein taille={10} />
                {abreger(DIFFUSION.abonnes)}
              </span>
            </span>
            <button className={`dir-suivre${suivi ? ' dir-suivi' : ''}`}
              onClick={() => setSuivi(!suivi)}>
              {suivi ? 'Suivi' : '+ Suivre'}
            </button>
          </div>

          <span className="dir-pille">
            20+ · {abreger(DIFFUSION.spectateurs)}
          </span>

          <button className="dir-rond" aria-label="Réduire le direct"
            onClick={() => { setPlein(false); setCoeurs([]) }}>
            <ChevronBas taille={17} />
          </button>
          <button className="dir-rond" aria-label="Quitter le LIVE"
            onClick={onFermer}>
            <Croix taille={17} />
          </button>
        </div>

        {/* Seconde rangee : le rang de la ligue et le compte de places. */}
        <div className="dir-rangee-rang">
          <span className="dir-pille dir-pille-ligue">Top 80 % de la Ligue C5</span>
          <span className="dir-pille dir-pille-places">
            <Couronne taille={13} />0/4
          </span>
        </div>

        <Tchat messages={messages} />

        {coeurs.map(c => (
          <span className="dir-coeur" key={c.id} style={{ right: c.decalage }}>
            <CoeurPlein taille={22} />
          </span>
        ))}

        {/* Barre du bas : le bouton coloré, la saisie, puis les actions. */}
        <div className="dir-barre-basse">
          <button className="dir-bouton-couleur">229</button>

          <input className="dir-champ" value={saisie}
            onChange={e => setSaisie(e.target.value)}
            aria-label="Message du tchat"
            placeholder="Saisis ton message…" />

          <button className="dir-action" aria-label="Émojis"><Emoji taille={23} /></button>
          <button className="dir-action" aria-label="Inviter des participants"><InvitesLive taille={23} /></button>
          <button className="dir-action" aria-label="Envoyer un cadeau"><CadeauLive taille={23} /></button>
          <button className="dir-action" aria-label="Partager le direct">
            <PartageLive taille={23} /><span>12</span>
          </button>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Etat A : la feuille « Découvrir ».
  // ----------------------------------------------------------
  return (
    <div className="dir-page dir-sombre">
      <header className="dir-entete">
        <button aria-label="LIVE programmés"><CalendrierEtoile taille={22} /></button>
        <h1>Découvrir</h1>
        <button aria-label="Fermer" onClick={onFermer}><Croix taille={22} /></button>
      </header>

      {/* Rangee des ronds : d'abord le compte connecte, qui lance sa
          propre diffusion, puis les comptes deja en direct. */}
      <div className="dir-rangee-ronds">
        <button className="dir-entree">
          <span className="dir-entree-rond">
            <Avatar pseudo={moi} taille={58} />
            <i className="dir-badge-camera"><CameraLive taille={12} /></i>
          </span>
          <span className="dir-entree-libelle">Passer en LIVE</span>
        </button>

        {livesDemo.map(l => (
          <button className="dir-entree" key={l.id} onClick={() => setPlein(true)}>
            <span className="dir-entree-rond">
              <Avatar pseudo={l.pseudo} taille={58} bordure />
              <i className="dir-badge-direct">LIVE</i>
            </span>
            <span className="dir-entree-libelle">{l.pseudo}</span>
          </button>
        ))}
      </div>

      {/* Panneau d'apercu : sa poignee et son chevron deplient le direct
          en plein ecran. */}
      <button className="dir-panneau" onClick={() => setPlein(true)}
        onPointerDown={auDebut} onPointerUp={aLaFin}>
        <span className="dir-poignee" />
        <span className="dir-chevron"><ChevronHaut taille={18} /></span>
        <span className="dir-apercu">
          <span className="dir-hote" ref={hote} />
          <span className="dir-apercu-pille">
            {DIFFUSION.pseudo} · {abreger(DIFFUSION.spectateurs)}
          </span>
        </span>
      </button>
    </div>
  )
}
