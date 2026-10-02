// ============================================================
// Ecran de tournage : outils, durees, carrousel de filtres et
// prises enchainees avant de passer au montage.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import {
  Croix, Camera as IconeCamera, SonNote, Retourner, Galerie,
  EffetEnregistrer, EffetDeplier, CocheValider, SupprimerClip,
  Corbeille, Brouillon, Chevron,
  OutilFlash, OutilMinuteur, OutilDisposition, OutilRetouche, OutilFiltres,
  OutilVitesse, OutilPlus,
} from '../components/Icones'
import ChoixSon from './ChoixSon'
import type { Son } from '../lib/sons'
import './cam.css'

// Memes voiles que l'ecran de montage : une teinte posee sur l'apercu,
// avec son mode de fusion.
const FILTRES = [
  { nom: 'Original', voile: 'transparent', melange: 'normal' },
  { nom: 'Chaud', voile: 'rgba(255,146,60,.26)', melange: 'overlay' },
  { nom: 'Froid', voile: 'rgba(58,134,255,.26)', melange: 'overlay' },
  { nom: 'Éclat', voile: 'rgba(255,255,255,.22)', melange: 'soft-light' },
  { nom: 'Vintage', voile: 'rgba(188,152,106,.34)', melange: 'multiply' },
  { nom: 'Noir & blanc', voile: 'rgba(128,128,128,.62)', melange: 'saturation' },
] as const

const DUREES = ['10 min', '60 s', '15 s', 'PHOTO', 'TEXTE']
const OUTILS = [
  { nom: 'Flash', Icone: OutilFlash },
  { nom: 'Minuteur', Icone: OutilMinuteur },
  { nom: 'Disposition', Icone: OutilDisposition },
  { nom: 'Retouche', Icone: OutilRetouche },
  { nom: 'Filtres', Icone: OutilFiltres },
  { nom: 'Vitesse', Icone: OutilVitesse },
  { nom: "Plus d'outils", Icone: OutilPlus },
]

// Un seul clip enregistre : son objet blob et l'avancement a sa fin.
type Clip = { url: string; fin: number }

export default function Camera({ onFermer, onChoisir }: {
  onFermer: () => void
  onChoisir: (url: string) => void
}) {
  const apercu = useRef<HTMLVideoElement>(null)
  const flux = useRef<MediaStream | null>(null)
  const enregistreur = useRef<MediaRecorder | null>(null)
  const importer = useRef<HTMLInputElement>(null)
  // Horloge de la prise : elle n'est lue qu'au rythme du rendu, mais le
  // minuteur doit pouvoir la relire sans attendre le prochain etat.
  const duree = useRef(0)
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null)

  const [pret, setPret] = useState(false)
  const [frontale, setFrontale] = useState(true)
  const [mode, setMode] = useState('15 s')
  const [filtre, setFiltre] = useState(0)
  const [choixSon, setChoixSon] = useState(false)
  const [son, setSon] = useState<Son | null>(null)
  const [message, setMessage] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  // Prises deja capturees : chaque appui ajoute un segment, la coche valide
  // l'ensemble. L'horloge continue d'une prise a l'autre.
  const [clips, setClips] = useState<Clip[]>([])
  const [ecoule, setEcoule] = useState(0)
  const [outilsDeplies, setOutilsDeplies] = useState(false)
  // Mode « Effets » : s'active des qu'un filtre autre qu'Original est choisi.
  const [modeEffets, setModeEffets] = useState(false)
  const [menuSortie, setMenuSortie] = useState(false)
  // Vignette extraite de l'apercu, posee dans le cadre « galerie ».
  const [vignette, setVignette] = useState('')

  // Duree maximale selon le mode choisi, qui borne aussi l'arc de progression.
  const dureeMax = mode === '60 s' ? 60 : 15

  // Sans getUserMedia, la camera est hors d'atteinte : le constat se lit au
  // rendu plutot que depuis l'effet, qui n'a rien a synchroniser.
  const sansCamera = !navigator.mediaDevices?.getUserMedia
  const avertir = (texte: string) => setMessage(texte)
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2200)
    return () => clearTimeout(t)
  }, [message])

  // Flux de la camera, repris a chaque changement d'objectif.
  useEffect(() => {
    if (sansCamera) return
    let annule = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: frontale ? 'user' : 'environment' }, audio: true })
      .then(async stream => {
        if (annule) { stream.getTracks().forEach(t => t.stop()); return }
        flux.current = stream
        if (apercu.current) {
          apercu.current.srcObject = stream
          await apercu.current.play().catch(() => undefined)
        }
        if (!annule) setPret(true)
      })
      .catch(() => {
        if (!annule) setMessage('Autorise la caméra et le microphone dans ton navigateur, puis rouvre cet écran.')
      })
    return () => {
      annule = true
      // Le flux precedent est coupe : l'apercu n'est plus pret avant que le
      // nouvel objectif ait repondu.
      setPret(false)
      const rec = enregistreur.current
      if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop() }
      flux.current?.getTracks().forEach(t => t.stop())
      flux.current = null
    }
  }, [frontale, sansCamera])

  // L'horloge ne tourne que pendant une prise.
  useEffect(() => {
    if (!enregistrement) return
    minuterie.current = setInterval(() => {
      duree.current = +(duree.current + 0.1).toFixed(1)
      setEcoule(duree.current)
    }, 100)
    return () => {
      if (minuterie.current) clearInterval(minuterie.current)
      minuterie.current = null
    }
  }, [enregistrement])

  const outil = (nom: string) => {
    if (nom === 'Filtres' || nom === 'Effets') {
      setFiltre(v => (v + 1) % FILTRES.length)
      setModeEffets(true)
      setMessage('')
      return
    }
    // Outils de capture et de montage : ni l'API Tok 229 ni la camera du
    // navigateur ne les portent.
    avertir(`${nom} : non pris en charge par la caméra du navigateur.`)
  }

  const filmer = () => {
    const rec = enregistreur.current
    if (enregistrement) { rec?.stop(); return }
    if (!flux.current || !pret) return
    if (typeof MediaRecorder === 'undefined') {
      avertir('Ce navigateur ne permet pas l’enregistrement intégré. Tu peux importer une vidéo.')
      return
    }
    try {
      const type = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find(t => MediaRecorder.isTypeSupported(t))
      const nouveau = new MediaRecorder(flux.current, type ? { mimeType: type } : undefined)
      enregistreur.current = nouveau
      const morceaux: Blob[] = []
      nouveau.ondataavailable = e => { if (e.data.size) morceaux.push(e.data) }
      nouveau.onstop = () => {
        setEnregistrement(false)
        const blob = new Blob(morceaux, { type: nouveau.mimeType || type || 'video/webm' })
        if (blob.size) {
          setClips(l => [...l, { url: URL.createObjectURL(blob), fin: duree.current }])
        }
      }
      nouveau.onerror = () => {
        avertir('L’enregistrement a échoué. Réessaie.')
        setEnregistrement(false)
      }
      nouveau.start(250)
      setEnregistrement(true)
      setMessage('')
    } catch {
      avertir('Impossible de démarrer l’enregistrement sur ce navigateur.')
    }
  }

  // La prise s'arrete d'elle-meme quand l'arc est complet.
  useEffect(() => {
    if (!enregistrement || ecoule < dureeMax) return
    const rec = enregistreur.current
    if (rec?.state === 'recording') rec.stop()
  }, [enregistrement, ecoule, dureeMax])

  // `⊗` : retire la derniere prise, apres confirmation comme sur mobile.
  const supprimerDernier = () => {
    if (!window.confirm('Supprimer le dernier clip ?')) return
    const reste = clips.slice(0, -1)
    const dernier = clips[clips.length - 1]
    if (dernier) URL.revokeObjectURL(dernier.url)
    setClips(reste)
    // L'horloge revient a la fin du clip precedent.
    const fin = reste.length ? reste[reste.length - 1].fin : 0
    duree.current = fin
    setEcoule(fin)
  }

  // La coche valide le montage et passe a l'ecran suivant.
  const valider = () => {
    const dernier = clips[clips.length - 1]
    if (dernier) onChoisir(dernier.url)
  }

  const reinitialiser = () => {
    clips.forEach(c => URL.revokeObjectURL(c.url))
    setClips([])
    duree.current = 0
    setEcoule(0)
  }

  // Glissement du carrousel : un filtre tous les 60 px, comme sur mobile.
  const depart = useRef<number | null>(null)
  const franchi = useRef(0)
  const glisserDebut = (x: number) => { depart.current = x; franchi.current = 0 }
  const glisserSuite = (x: number) => {
    if (depart.current === null) return
    const crans = Math.trunc((depart.current - x) / 60)
    if (crans === franchi.current) return
    const pas = crans - franchi.current
    franchi.current = crans
    setFiltre(v => (v + pas + FILTRES.length * 10) % FILTRES.length)
  }
  const glisserFin = () => { depart.current = null }

  const voile = FILTRES[filtre]
  const enMontage = enregistrement || clips.length > 0
  // Camera refusee ou indisponible : la page se replie sur l'import, seule
  // voie restante pour apporter une video.
  const avis = sansCamera
    ? 'La caméra intégrée nécessite une adresse sécurisée (HTTPS). Tu peux importer une vidéo.'
    : message
  const refus = !pret && !!avis && clips.length === 0
  // Avancement de l'arc rouge et position des coupes deja posees.
  const part = Math.min(ecoule / dureeMax, 1)

  if (refus) return (
    <div className="cam-page">
      <button className="cam-refus-fermer" aria-label="Fermer" onClick={onFermer}>
        <Croix taille={26} />
      </button>
      <div className="cam-refus">
        <IconeCamera taille={56} />
        <h1>Autorisez la caméra</h1>
        <p>{avis}</p>
        <button className="cam-refus-action" onClick={() => importer.current?.click()}>
          Choisir une vidéo
        </button>
      </div>
      <input hidden ref={importer} type="file" accept="video/*" onChange={e => {
        const f = e.target.files?.[0]
        if (f) onChoisir(URL.createObjectURL(f))
      }} />
    </div>
  )

  return (
    <div className="cam-page">
      <div className="cam-viseur">
        <video ref={apercu} className={`cam-video ${frontale ? 'miroir' : ''}`}
          autoPlay muted playsInline
          onLoadedData={() => {
            // Vignette carree extraite une fois le flux affiche : elle sert
            // d'illustration au cadre « galerie », faute de pellicule.
            const v = apercu.current
            if (!v?.videoWidth) return
            const c = document.createElement('canvas')
            c.width = 120; c.height = 120
            const ctx = c.getContext('2d')
            const cote = Math.min(v.videoWidth, v.videoHeight)
            ctx?.drawImage(v, (v.videoWidth - cote) / 2, (v.videoHeight - cote) / 2,
              cote, cote, 0, 0, 120, 120)
            setVignette(c.toDataURL('image/jpeg', 0.7))
          }} />
        {voile.voile !== 'transparent' && (
          <div className="cam-voile" style={{ background: voile.voile, mixBlendMode: voile.melange }} />
        )}

        {/* Barre du haut : fermer, ajouter un son, retourner */}
        {!enregistrement && (
          <header className="cam-haut">
            <button aria-label={clips.length ? 'Quitter le montage' : 'Fermer'}
              onClick={() => (clips.length ? setMenuSortie(true) : onFermer())}>
              {clips.length ? <Chevron taille={26} /> : <Croix taille={26} />}
            </button>
            <button className="cam-son" onClick={() => setChoixSon(true)}>
              <SonNote taille={18} />
              <span>{son ? son.titre : 'Ajouter un son'}</span>
            </button>
            <button aria-label="Changer de caméra" disabled={enregistrement}
              onClick={() => setFrontale(f => !f)}>
              <Retourner taille={26} />
            </button>
          </header>
        )}

        {menuSortie && <>
          <button className="cam-menu-voile" aria-label="Fermer le menu"
            onClick={() => setMenuSortie(false)} />
          <div className="cam-menu">
            <button onClick={() => { setMenuSortie(false); reinitialiser(); onFermer() }}>
              <Corbeille taille={20} /><span className="cam-menu-rouge">Supprimer</span>
            </button>
            <button onClick={() => {
              setMenuSortie(false)
              avertir('Brouillon enregistré.')
              onFermer()
            }}>
              <Brouillon taille={20} /><span>Enregistrer le brouillon</span>
            </button>
            <button onClick={() => { setMenuSortie(false); outil('Envoyer à des amis') }}>
              <span className="cam-menu-avatar" /><span>Envoyer à des amis</span>
            </button>
          </div>
        </>}

        {/* Outils, colonne de droite */}
        {!enregistrement && (
          <div className={`cam-outils ${outilsDeplies ? 'deplies' : ''}`}>
            {OUTILS.filter(o => o.nom !== 'Vitesse' || outilsDeplies)
              .map(({ nom, Icone }, i, liste) => {
                // Le chevron final deplie la colonne : les libelles se posent
                // alors a gauche de chaque icone et la fleche se retourne.
                if (i === liste.length - 1) return (
                  <button key={nom} className="cam-outil" aria-label="Plus d’outils"
                    aria-expanded={outilsDeplies} onClick={() => setOutilsDeplies(v => !v)}>
                    <Icone taille={26} />
                  </button>
                )
                return (
                  <button key={nom} className="cam-outil-ligne" aria-label={nom}
                    onClick={() => outil(nom)}>
                    {outilsDeplies && !modeEffets && i > 0 && <span className="cam-outil-nom">{nom}</span>}
                    <span className="cam-outil"><Icone taille={26} /></span>
                  </button>
                )
              })}
          </div>
        )}

        {avis && <p className="cam-message" role="status">{avis}</p>}

        {/* Bas : durees ou chronometre, puis le carrousel */}
        <div className="cam-bas">
          {enMontage ? (
            <p className="cam-chrono">
              {String(Math.floor(ecoule / 60)).padStart(2, '0')}
              :{String(Math.floor(ecoule % 60)).padStart(2, '0')}
            </p>
          ) : (
            <div className="cam-durees">
              {DUREES.map(d => (
                <button key={d} className={mode === d ? 'actif' : ''} onClick={() => {
                  if (d === '10 min' || d === 'PHOTO' || d === 'TEXTE') {
                    avertir('Ce format n’est pas encore disponible. Tu peux importer une vidéo de 90 secondes maximum.')
                    return
                  }
                  setMode(d)
                }}>{d}</button>
              ))}
            </div>
          )}

          <div className="cam-carrousel" aria-label="Effets caméra"
            onTouchStart={e => glisserDebut(e.touches[0].clientX)}
            onTouchMove={e => glisserSuite(e.touches[0].clientX)}
            onTouchEnd={glisserFin}
            onPointerDown={e => { if (e.pointerType !== 'touch') glisserDebut(e.clientX) }}
            onPointerMove={e => { if (e.pointerType !== 'touch' && e.buttons === 1) glisserSuite(e.clientX) }}
            onPointerUp={glisserFin} onPointerLeave={glisserFin}>
            {[-2, -1, 0, 1, 2].map(decalage => {
              const i = (filtre + decalage + FILTRES.length) % FILTRES.length
              if (decalage === 0) {
                // Pendant la prise : carre rouge (= arreter), entoure de l'arc
                // de progression. En pause : disque plein (= reprendre), l'arc
                // gardant l'avancement acquis.
                if (enMontage) return (
                  <button key="filmer" className="cam-disque"
                    aria-label={enregistrement ? 'Arrêter l’enregistrement' : 'Reprendre l’enregistrement'}
                    onClick={filmer}>
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,.92)" />
                      <circle cx="50" cy="50" r="47" fill="none" stroke="#ff2856" strokeWidth="6"
                        strokeLinecap="round" transform="rotate(-90 50 50)"
                        strokeDasharray={2 * Math.PI * 47}
                        strokeDashoffset={2 * Math.PI * 47 * (1 - part)} />
                      {/* Traits blancs marquant la fin de chaque prise, pour
                          situer les coupes sur l'anneau. */}
                      {clips.map(c => c.fin / dureeMax).filter(p => p > 0 && p < 1).map((p, n) => {
                        const angle = (p * 360 - 90) * Math.PI / 180
                        return <line key={n} stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
                          x1={50 + Math.cos(angle) * 43} y1={50 + Math.sin(angle) * 43}
                          x2={50 + Math.cos(angle) * 51} y2={50 + Math.sin(angle) * 51} />
                      })}
                    </svg>
                    <span className={enregistrement ? 'cam-carre' : 'cam-rond'} />
                  </button>
                )
                return (
                  <button key="filmer" className="cam-filmer" disabled={!pret}
                    aria-label={`Filmer avec le filtre ${FILTRES[i].nom}`} onClick={filmer}>
                    {vignette && modeEffets
                      ? <img src={vignette} alt="" style={{ background: voile.voile }} />
                      : <span />}
                  </button>
                )
              }
              if (enMontage) return null
              return (
                <button key={decalage} className="cam-vignette"
                  aria-label={`Aperçu ${FILTRES[i].nom}`}
                  onClick={() => { setFiltre(i); setModeEffets(true) }}>
                  {vignette && <img src={vignette} alt="" style={{ background: FILTRES[i].voile }} />}
                </button>
              )
            })}

            {clips.length > 0 && !enregistrement && (
              <button className="cam-filtre-pause" aria-label="Changer de filtre"
                onClick={() => { setFiltre(f => (f + 1) % FILTRES.length); setModeEffets(true) }} />
            )}

            {clips.length > 0 && (
              <div className="cam-montage">
                {!enregistrement && (
                  <button className="cam-montage-supprimer" aria-label="Supprimer le dernier clip"
                    onClick={supprimerDernier}>
                    <SupprimerClip taille={22} />
                  </button>
                )}
                <button className="cam-montage-valider" aria-label="Valider les prises" onClick={valider}>
                  <CocheValider taille={26} />
                </button>
              </div>
            )}
          </div>

          {!enMontage && <p className="cam-filtre-nom">{voile.nom}</p>}
        </div>
      </div>

      {/* Pied : hors du viseur, sur le fond noir */}
      <footer className="cam-pied">
        {!enMontage && <>
          <button className="cam-galerie" aria-label="Importer depuis la galerie"
            onClick={() => importer.current?.click()}>
            {vignette ? <img src={vignette} alt="" /> : <Galerie taille={20} />}
          </button>

          {modeEffets ? <>
            {/* Barre « Effets » : elle remplace LIVE / PUBLIER / CRÉER tant
                qu'un filtre est applique. */}
            <div className="cam-barre-effets">
              <button aria-label="Enregistrer l’effet" onClick={() => outil('Enregistrer l’effet')}>
                <EffetEnregistrer taille={24} />
              </button>
              <b>Effets</b>
              <button aria-label="Agrandir" onClick={() => outil('Agrandir')}>
                <EffetDeplier taille={22} />
              </button>
            </div>
            <button className="cam-effets-fermer" aria-label="Quitter les effets"
              onClick={() => { setModeEffets(false); setFiltre(0) }}>
              <Croix taille={22} />
            </button>
          </> : <>
            <button onClick={() => outil('Diffusion LIVE')}>LIVE</button>
            <b className="cam-mode-actif">PUBLIER</b>
            <button onClick={() => outil('Créer')}>CRÉER</button>
          </>}
        </>}
      </footer>

      <input hidden ref={importer} type="file" accept="video/*" onChange={e => {
        const f = e.target.files?.[0]
        if (f) onChoisir(URL.createObjectURL(f))
      }} />

      <ChoixSon visible={choixSon} onFermer={() => setChoixSon(false)} onChoisir={setSon} />
    </div>
  )
}
