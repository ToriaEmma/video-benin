// ============================================================
// Ecran de montage : filtres, calques de texte et de stickers,
// vitesse, effet vocal et sous-titres, avant la publication.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import {
  Chevron, Croix, SonNote, Corbeille, Brouillon, CocheValider,
  MontageReglages, MontagePartage, MontageDuree, MontageClips,
  MontageTexte, MontageSticker, MontageEffets, MontageVoix,
  MontageFiltres, MontageSousTitres, OutilPlus, Vitesse, Emoji,
} from '../components/Icones'
import ChoixSon from './ChoixSon'
import { apiBrouillons, televerser, fichierDepuisUrl } from '../lib/api'
import type { Son } from '../lib/sons'
import './mont.css'

// Colonne de droite : chaque entree ouvre un reglage de montage.
const OUTILS = [
  { nom: 'Paramètres', Icone: MontageReglages },
  { nom: 'Partager', Icone: MontagePartage },
  { nom: 'Modifier', Icone: MontageDuree, groupe: 2 },
  { nom: 'Modèles', Icone: MontageClips },
  { nom: 'Texte', Icone: MontageTexte },
  { nom: 'Stickers', Icone: MontageSticker },
  { nom: 'Effets', Icone: MontageEffets },
  { nom: 'Filtres', Icone: MontageFiltres },
  { nom: 'Vitesse', Icone: Vitesse },
  { nom: 'Effet vocal', Icone: MontageVoix },
  { nom: 'Sous-titres', Icone: MontageSousTitres },
]

// Memes voiles que l'ecran de tournage : un calque teinte pose sur
// l'apercu, avec un mode de fusion.
const FILTRES = [
  { nom: 'Original', voile: 'transparent', melange: 'normal' },
  { nom: 'Chaud', voile: 'rgba(255,146,60,.26)', melange: 'overlay' },
  { nom: 'Froid', voile: 'rgba(58,134,255,.26)', melange: 'overlay' },
  { nom: 'Éclat', voile: 'rgba(255,255,255,.22)', melange: 'soft-light' },
  { nom: 'Vintage', voile: 'rgba(188,152,106,.34)', melange: 'multiply' },
  { nom: 'Noir & blanc', voile: 'rgba(128,128,128,.62)', melange: 'saturation' },
] as const

// Palette reprise de l'editeur de couverture.
const COULEURS = [
  '#ffffff', '#111111', '#e8485c', '#ef8d3c', '#eece4a', '#ff2856',
  '#c43cc0', '#45b4d8', '#3f7ff0', '#2b3fae',
]

const STICKERS = [
  '😀', '😂', '🥰', '😎', '🤩', '😭', '🔥', '💯',
  '👏', '🙌', '💪', '🙏', '❤️', '✨', '🎉', '🎵',
  '⚽', '🏆', '🌴', '🌞', '🍲', '🥤', '🚕', '🏍️',
  '📍', '💃', '🕺', '🪘', '🇧🇯', '👑', '😮', '🤔',
]

// Chaque vitesse de lecture est reellement posee sur le lecteur.
const VITESSES = [0.5, 1, 1.5, 2]

// Les effets vocaux jouent sur le debit et la hauteur de la piste. Ceux
// qui demandent un vrai traitement du signal sont signales « apercu »
// plutot que de ne rien faire en silence.
const EFFETS_VOCAUX = [
  { nom: 'Normal', debit: 1, hauteur: true },
  { nom: 'Grave', debit: 0.78, hauteur: false },
  { nom: 'Aigu', debit: 1.35, hauteur: false },
  { nom: 'Robot', debit: 1, hauteur: true, apercu: true },
  { nom: 'Écho', debit: 1, hauteur: true, apercu: true },
]

// Un texte ou un sticker pose sur l'apercu, deplacable au doigt. La position
// est un decalage en pixels depuis le centre du viseur.
type Calque = {
  id: string
  genre: 'texte' | 'sticker'
  contenu: string
  // Index dans COULEURS ; sans objet pour un sticker.
  couleur: number
  x: number
  y: number
}

// Identifiants des calques : un compteur plutot que l'horloge, que la regle
// de purete interdit de lire pendant le rendu.
const compteur = { n: 0, suivant() { this.n += 1; return this.n } }

function Interrupteur({ titre, actif, onChange }: {
  titre: string
  actif: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button className={`mont-switch ${actif ? 'actif' : ''}`} role="switch"
      aria-label={titre} aria-checked={actif} onClick={() => onChange(!actif)}>
      <span />
    </button>
  )
}

// Feuille qui remonte du bas, posee sur l'apercu assombri.
function Feuille({ titre, onFermer, children }: {
  titre: string
  onFermer: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mont-feuille-fond">
      <button className="mont-feuille-voile" aria-label="Fermer" onClick={onFermer} />
      <section className="mont-feuille" aria-label={titre}>
        <header><h2>{titre}</h2><button aria-label="Fermer" onClick={onFermer}><Croix taille={17} /></button></header>
        <div className="mont-feuille-corps">{children}</div>
      </section>
    </div>
  )
}

// Un calque isole : il se deplace au pointeur, et s'ouvre a l'appui simple.
function CalquePose({ calque, onDeplacer, onOuvrir }: {
  calque: Calque
  onDeplacer: (x: number, y: number) => void
  onOuvrir: () => void
}) {
  // Position du pointeur a la prise, et vrai des que le calque a bouge : un
  // simple appui doit encore ouvrir la saisie.
  const prise = useRef<{ x: number; y: number } | null>(null)
  const deplace = useRef(false)

  return (
    <div className={`mont-calque ${calque.genre === 'sticker' ? 'sticker' : ''}`}
      style={{ transform: `translate(${calque.x}px, ${calque.y}px)`, color: COULEURS[calque.couleur] }}
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId)
        prise.current = { x: e.clientX - calque.x, y: e.clientY - calque.y }
        deplace.current = false
      }}
      onPointerMove={e => {
        if (!prise.current) return
        const x = e.clientX - prise.current.x
        const y = e.clientY - prise.current.y
        if (Math.abs(x - calque.x) > 3 || Math.abs(y - calque.y) > 3) deplace.current = true
        onDeplacer(x, y)
      }}
      onPointerUp={() => {
        prise.current = null
        if (!deplace.current) onOuvrir()
      }}>
      {calque.contenu}
    </div>
  )
}

export default function Montage({ url, pseudo, onRetour, onSuivant }: {
  url: string
  pseudo: string
  onRetour: () => void
  onSuivant: () => void
}) {
  const lecteur = useRef<HTMLVideoElement>(null)
  const [menuSortie, setMenuSortie] = useState(false)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  const [message, setMessage] = useState('')
  // Barre ouverte sous l'apercu : filtres, vitesse ou saisie de sous-titre.
  const [barre, setBarre] = useState<'filtres' | 'vitesse' | 'sousTitres' | null>(null)
  // Feuille ouverte : reglages, stickers ou effets vocaux.
  const [feuille, setFeuille] = useState<'reglages' | 'stickers' | 'voix' | null>(null)
  const [choixSon, setChoixSon] = useState(false)
  const [son, setSon] = useState<Son | null>(null)
  // Televersement du brouillon en cours : garde contre un double appui.
  const [envoiBrouillon, setEnvoiBrouillon] = useState(false)

  const [filtre, setFiltre] = useState(0)
  const [vitesse, setVitesse] = useState(1)
  const [effetVocal, setEffetVocal] = useState(0)
  const [boucle, setBoucle] = useState(true)
  const [coupe, setCoupe] = useState(false)

  const [calques, setCalques] = useState<Calque[]>([])
  // Calque en cours d'ecriture : son identifiant, ou null hors saisie.
  const [enEdition, setEnEdition] = useState<string | null>(null)
  const [saisie, setSaisie] = useState('')
  const [couleur, setCouleur] = useState(0)

  const [sousTitre, setSousTitre] = useState('')
  const [sousTitresActifs, setSousTitresActifs] = useState(false)

  const avertir = (texte: string) => setMessage(texte)
  // Le message s'effacant seul, chaque appel remplace le precedent.
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2200)
    return () => clearTimeout(t)
  }, [message])

  useEffect(() => {
    lecteur.current?.play().catch(() => { /* Lecture refusee : l'apercu reste fige. */ })
  }, [url])

  // Vitesse et effet vocal se combinent sur un seul debit, pose sur le lecteur.
  const poserDebit = (v: number, effet: number) => {
    setVitesse(v)
    setEffetVocal(effet)
    const video = lecteur.current
    if (!video) return
    video.preservesPitch = EFFETS_VOCAUX[effet].hauteur
    video.playbackRate = v * EFFETS_VOCAUX[effet].debit
  }

  const ajouterTexte = () => {
    const id = `t${compteur.suivant()}`
    setCalques(l => [...l, { id, genre: 'texte', contenu: '', couleur, x: 0, y: 0 }])
    setSaisie('')
    setEnEdition(id)
  }

  const ouvrirCalque = (c: Calque) => {
    if (c.genre !== 'texte') { avertir('Fais glisser le sticker pour le placer.'); return }
    setSaisie(c.contenu)
    setCouleur(c.couleur)
    setEnEdition(c.id)
  }

  // Fin de saisie : un texte laisse vide est retire plutot que garde invisible.
  const validerTexte = () => {
    const propre = saisie.trim()
    setCalques(l => propre
      ? l.map(c => (c.id === enEdition ? { ...c, contenu: propre, couleur } : c))
      : l.filter(c => c.id !== enEdition))
    setEnEdition(null)
    setSaisie('')
  }

  const ajouterSticker = (emoji: string) => {
    setCalques(l => [...l,
      { id: `s${compteur.suivant()}`, genre: 'sticker', contenu: emoji, couleur: 0, x: 0, y: 0 }])
    setFeuille(null)
    avertir('Sticker ajouté — fais-le glisser.')
  }

  // Menu de sortie : la video rejoint les brouillons du compte. L'ecran des
  // brouillons les lit depuis l'API, le fichier doit donc y etre televerse —
  // le garder en memoire le perdrait a la fermeture de l'onglet.
  const enregistrerBrouillon = async () => {
    if (envoiBrouillon) return
    const legende = calques.filter(c => c.genre === 'texte').map(c => c.contenu).join(' ').trim()
    setEnvoiBrouillon(true)
    setMenuSortie(false)
    avertir('Enregistrement du brouillon…')
    try {
      const fichier = await fichierDepuisUrl(url)
      const distante = await televerser(fichier)
      await apiBrouillons.creer(distante, legende, fichier.size)
      onRetour()
    } catch (e) {
      // Le montage reste ouvert : la prise n'est pas perdue parce que
      // l'enregistrement a echoue.
      avertir(e instanceof Error ? e.message : 'Enregistrement du brouillon impossible.')
    } finally {
      setEnvoiBrouillon(false)
    }
  }

  const outilChoisi = (nom: string) => {
    switch (nom) {
      case 'Paramètres': setFeuille('reglages'); return
      case 'Texte': ajouterTexte(); return
      case 'Stickers': setFeuille('stickers'); return
      case 'Effet vocal': setFeuille('voix'); return
      case 'Filtres': setBarre(b => (b === 'filtres' ? null : 'filtres')); return
      case 'Vitesse': setBarre(b => (b === 'vitesse' ? null : 'vitesse')); return
      case 'Sous-titres': setBarre(b => (b === 'sousTitres' ? null : 'sousTitres')); return
      case 'Effets':
        // Les effets visuels reprennent les voiles des filtres.
        setBarre('filtres')
        avertir('Les effets reprennent les filtres pour le moment.')
        return
      default:
        avertir(`${nom} : pas encore disponible dans cette version.`)
    }
  }

  const voile = FILTRES[filtre]

  return (
    <div className="mont-page">
      <div className="mont-viseur">
        <video ref={lecteur} className="mont-video" src={url} loop={boucle} muted={coupe}
          playsInline autoPlay />

        {/* Teinte du filtre, posee sur l'apercu comme a la camera. */}
        {voile.voile !== 'transparent' && (
          <div className="mont-voile" style={{ background: voile.voile, mixBlendMode: voile.melange }} />
        )}

        {/* Textes et stickers deposes sur la video */}
        <div className="mont-calques">
          {calques.filter(c => c.id !== enEdition && c.contenu).map(c => (
            <CalquePose key={c.id} calque={c} onOuvrir={() => ouvrirCalque(c)}
              onDeplacer={(x, y) => setCalques(l =>
                l.map(a => (a.id === c.id ? { ...a, x, y } : a)))} />
          ))}
        </div>

        {/* Bande de sous-titres, alimentee par la saisie du bas */}
        {sousTitresActifs && !!sousTitre.trim() && (
          <p className="mont-bande-soustitre">{sousTitre.trim()}</p>
        )}

        {/* Barre du haut : retour et son choisi */}
        <header className="mont-haut">
          <button aria-label="Quitter le montage" onClick={() => setMenuSortie(true)}>
            <Chevron taille={28} />
          </button>
          <div className="mont-son">
            <button className="mont-son-corps" onClick={() => setChoixSon(true)}>
              <SonNote taille={16} />
              <span>{son ? son.titre : 'son original'}</span>
            </button>
            <span className="mont-son-trait" />
            {/* La croix retire le son retenu, sans ouvrir la bibliotheque. */}
            <button aria-label="Retirer le son" onClick={() => {
              avertir(son ? 'Son retiré.' : 'Aucun son à retirer.')
              setSon(null)
            }}>
              <Croix taille={16} />
            </button>
          </div>
          <span />
        </header>

        <div className={`mont-outils ${outilsDeplies ? 'deplies' : ''}`}>
          {OUTILS.map(({ nom, Icone, groupe }, i) => (
            <button key={nom} className={`mont-outil-ligne ${groupe === 2 ? 'groupe' : ''}`}
              aria-label={nom} onClick={() => outilChoisi(nom)}>
              {outilsDeplies && i > 1 && <span className="mont-outil-nom">{nom}</span>}
              <span className="mont-outil"><Icone taille={31} /></span>
            </button>
          ))}
          <button className="mont-outil" aria-label="Plus d’outils" aria-expanded={outilsDeplies}
            onClick={() => setOutilsDeplies(v => !v)}>
            <OutilPlus taille={31} />
          </button>
        </div>

        {menuSortie && <>
          <button className="mont-menu-voile" aria-label="Fermer le menu"
            onClick={() => setMenuSortie(false)} />
          <div className="mont-menu">
            <button onClick={() => { setMenuSortie(false); onRetour() }}>
              <Corbeille taille={20} /><span className="mont-menu-rouge">Supprimer</span>
            </button>
            <button disabled={envoiBrouillon} onClick={enregistrerBrouillon}>
              <Brouillon taille={20} /><span>Enregistrer le brouillon</span>
            </button>
            <button onClick={() => {
              setMenuSortie(false)
              avertir('Envoyer à des amis : pas encore disponible.')
            }}>
              <span className="mont-menu-avatar" /><span>Envoyer à des amis</span>
            </button>
          </div>
        </>}

        {/* Saisie d'un texte : elle recouvre l'apercu le temps de l'ecriture. */}
        {enEdition && (
          <div className="mont-saisie">
            <button className="mont-saisie-termine" onClick={validerTexte}>Terminé</button>
            <textarea className="mont-saisie-texte" style={{ color: COULEURS[couleur] }}
              value={saisie} onChange={e => setSaisie(e.target.value)}
              placeholder="Ton texte" autoFocus />
            <div className="mont-palette">
              {COULEURS.map((c, i) => (
                <button key={c} className={`mont-pastille ${i === couleur ? 'actif' : ''}`}
                  style={{ background: c }} aria-label={`Couleur ${i + 1}`}
                  aria-pressed={i === couleur} onClick={() => setCouleur(i)} />
              ))}
            </div>
          </div>
        )}

        {message && <p className="mont-message" role="status">{message}</p>}

        {!barre && !enEdition && (
          <button className="mont-autocut"
            onClick={() => avertir('AutoCut : pas encore disponible dans cette version.')}>
            <MontageEffets taille={17} /><span>AutoCut</span>
          </button>
        )}
      </div>

      {/* Bande de reglage ouverte par un outil, au-dessus du pied */}
      {barre === 'filtres' && (
        <div className="mont-bande">
          <header><b>Filtres</b><button aria-label="Fermer" onClick={() => setBarre(null)}><CocheValider taille={22} /></button></header>
          <div className="mont-bande-liste">
            {FILTRES.map((f, i) => (
              <button key={f.nom} className={`mont-filtre ${i === filtre ? 'actif' : ''}`}
                onClick={() => setFiltre(i)}>
                <span style={f.voile === 'transparent' ? undefined : { background: f.voile }} />
                <small>{f.nom}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {barre === 'vitesse' && (
        <div className="mont-bande">
          <header><b>Vitesse de lecture</b><button aria-label="Fermer" onClick={() => setBarre(null)}><CocheValider taille={22} /></button></header>
          <div className="mont-vitesses">
            {VITESSES.map(v => (
              <button key={v} className={v === vitesse ? 'actif' : ''}
                onClick={() => poserDebit(v, effetVocal)}>{v}×</button>
            ))}
          </div>
        </div>
      )}

      {barre === 'sousTitres' && (
        <div className="mont-bande">
          <header><b>Sous-titres</b><button aria-label="Fermer" onClick={() => setBarre(null)}><CocheValider taille={22} /></button></header>
          <div className="mont-soustitre-ligne">
            <textarea value={sousTitre} onChange={e => setSousTitre(e.target.value)}
              placeholder="Écris le sous-titre" aria-label="Sous-titre" />
            <Interrupteur titre="Afficher les sous-titres" actif={sousTitresActifs}
              onChange={setSousTitresActifs} />
          </div>
        </div>
      )}

      {/* Pied : story a gauche, « Suivant » a droite */}
      <footer className="mont-pied">
        <button className="mont-story"
          onClick={() => avertir('Ta Story : pas encore disponible dans cette version.')}>
          <span className="mont-story-avatar">{pseudo.charAt(0).toUpperCase()}</span>
          <span>Ta Story</span>
        </button>
        <button className="mont-suivant" onClick={onSuivant}>Suivant</button>
      </footer>

      {feuille === 'reglages' && (
        <Feuille titre="Paramètres" onFermer={() => setFeuille(null)}>
          <div className="mont-reglage">
            <div><b>Lecture en boucle</b><p>La vidéo recommence automatiquement.</p></div>
            <Interrupteur titre="Lecture en boucle" actif={boucle} onChange={setBoucle} />
          </div>
          <div className="mont-reglage">
            <div><b>Son coupé</b><p>Coupe la piste originale de la vidéo.</p></div>
            <Interrupteur titre="Son coupé" actif={coupe} onChange={setCoupe} />
          </div>
          <div className="mont-reglage">
            <div><b>Afficher les sous-titres</b><p>Pose la bande de sous-titres sur l’aperçu.</p></div>
            <Interrupteur titre="Afficher les sous-titres" actif={sousTitresActifs}
              onChange={setSousTitresActifs} />
          </div>
        </Feuille>
      )}

      {feuille === 'stickers' && (
        <Feuille titre="Stickers" onFermer={() => setFeuille(null)}>
          <div className="mont-grille">
            {STICKERS.map(e => (
              <button key={e} aria-label={`Ajouter ${e}`} onClick={() => ajouterSticker(e)}>{e}</button>
            ))}
          </div>
        </Feuille>
      )}

      {feuille === 'voix' && (
        <Feuille titre="Effet vocal" onFermer={() => setFeuille(null)}>
          {EFFETS_VOCAUX.map((e, i) => (
            <button key={e.nom} className="mont-voix" onClick={() => {
              poserDebit(vitesse, i)
              if (e.apercu) avertir(`${e.nom} : aperçu, l’effet n’est pas encore rendu.`)
            }}>
              <Emoji taille={21} />
              <span className="mont-voix-corps">
                <b>{e.nom}</b>{e.apercu && <small>aperçu</small>}
              </span>
              {i === effetVocal && <CocheValider taille={20} />}
            </button>
          ))}
        </Feuille>
      )}

      <ChoixSon visible={choixSon} onFermer={() => setChoixSon(false)} onChoisir={x => {
        setSon(x)
        if (x) avertir(`Son « ${x.titre} » ajouté.`)
      }} />
    </div>
  )
}
