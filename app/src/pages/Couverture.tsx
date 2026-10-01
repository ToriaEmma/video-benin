// ============================================================
// Choix de la couverture : bande d'images extraites de la video,
// styles de titre, et mode saisie libre.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { TexteCadre, TexteAlignement } from '../components/Icones'
import './couv.css'

// Styles de titre proposes sous la bande de vignettes.
const STYLES = ['Aucun', 'Standard', 'Vector', 'Glitch', 'Tint', 'Emboss']

// Mode saisie libre : polices et couleurs proposees sous le texte.
const POLICES = ['Classic', 'Elegance', 'Neon', 'Retro']
const COULEURS = [
  '#ffffff', '#111111', '#e8485c', '#ef8d3c', '#eece4a', '#72c45f',
  '#3fbfa2', '#45b4d8', '#3f7ff0', '#2b3fae',
]

// Nombre d'images extraites pour la bande de selection.
const NB_VIGNETTES = 7

const Oeil = ({ taille = 20 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
)

const Interdit = ({ taille = 30 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="m6 18 12-12" />
  </svg>
)

export default function Couverture({ url, onAnnuler, onEnregistrer }: {
  url: string
  onAnnuler: () => void
  // Index de l'image retenue dans la bande.
  onEnregistrer: (index: number) => void
}) {
  const [vignettes, setVignettes] = useState<string[]>([])
  const [choisie, setChoisie] = useState(0)
  // Couverture prise dans les fichiers, qui prime sur les images extraites.
  const [importee, setImportee] = useState<string | null>(null)
  const importer = useRef<HTMLInputElement>(null)

  const [style, setStyle] = useState(1)
  const [titre, setTitre] = useState('')
  // Saisie libre : ouverte en appuyant sur l'image.
  const [saisieLibre, setSaisieLibre] = useState(false)
  const [police, setPolice] = useState(0)
  const [couleur, setCouleur] = useState(0)
  const [aligne, setAligne] = useState<'center' | 'left' | 'right'>('center')
  const [erreur, setErreur] = useState('')

  // Images extraites a intervalles reguliers : ce sont les positions parmi
  // lesquelles choisir la couverture. Faute d'API d'extraction sur le web,
  // on avance la lecture d'une video cachee et on recopie chaque arret.
  useEffect(() => {
    let annule = false
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.crossOrigin = 'anonymous'
    const images: string[] = []

    const extraire = () => {
      const duree = video.duration || 1
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 140
      canvas.height = Math.round(140 * (video.videoHeight / video.videoWidth || 1.5))

      const saisir = () => {
        if (annule) return
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        images.push(canvas.toDataURL('image/jpeg', 0.7))
        setVignettes([...images])
        if (images.length >= NB_VIGNETTES) return
        video.currentTime = (duree * images.length) / NB_VIGNETTES
      }

      video.addEventListener('seeked', saisir)
      video.currentTime = 0
      // Une video deja a l'instant 0 ne declenche pas « seeked » : on prend
      // la premiere image tout de suite.
      saisir()
    }

    video.addEventListener('loadeddata', extraire, { once: true })
    video.addEventListener('error', () => {
      if (!annule) setErreur('Les images de la vidéo n’ont pas pu être extraites dans ce navigateur.')
    }, { once: true })
    video.load()
    return () => { annule = true; video.removeAttribute('src'); video.load() }
  }, [url])

  const image = importee ?? vignettes[choisie]

  if (saisieLibre) return (
    <div className="couv-saisie">
      <header><button onClick={() => setSaisieLibre(false)}>Terminé</button></header>

      <div className="couv-saisie-cadre">
        {image && <img src={image} alt="" />}
        <textarea className="couv-saisie-texte" value={titre} autoFocus
          aria-label="Titre de la couverture" onChange={e => setTitre(e.target.value)}
          style={{
            color: COULEURS[couleur], textAlign: aligne,
            fontStyle: POLICES[police] === 'Elegance' ? 'italic' : 'normal',
          }} />
      </div>

      {/* Barre d'outils : cadre, alignement, puis les polices */}
      <div className="couv-barre-texte">
        <button aria-label="Encadrer le texte"><TexteCadre taille={30} /></button>
        <button aria-label="Changer l’alignement" onClick={() => setAligne(a =>
          a === 'center' ? 'left' : a === 'left' ? 'right' : 'center')}>
          <TexteAlignement taille={30} />
        </button>
        <span className="couv-barre-trait" />
        <div className="couv-polices">
          {POLICES.map((nom, i) => (
            <button key={nom} className={`couv-police ${nom.toLowerCase()} ${i === police ? 'actif' : ''}`}
              onClick={() => setPolice(i)}>{nom}</button>
          ))}
        </div>
      </div>

      {/* Palette de couleurs */}
      <div className="couv-palette">
        {COULEURS.map((c, i) => (
          <button key={c} className={`couv-pastille ${i === couleur ? 'actif' : ''}`}
            style={{ background: c }} aria-label={`Couleur ${i + 1}`}
            aria-pressed={i === couleur} onClick={() => setCouleur(i)} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="couv-page">
      <header className="couv-entete">
        <button onClick={onAnnuler}>Annuler</button>
        <button onClick={() => onEnregistrer(choisie)}>Enregistrer</button>
      </header>

      <div className="couv-cadre">
        {image && <img src={image} alt="" />}
        {/* Sans cartouche, l'appui sur l'image ouvre la saisie libre. */}
        <button className="couv-cadre-zone" aria-label="Saisir un titre libre"
          onClick={() => setSaisieLibre(true)} />

        {/* Cartouche de titre : il apparait des qu'un style autre
            qu'« Aucun » est selectionne, et se saisit au clavier. */}
        {style > 0 && (
          <div className={`couv-titre-zone style-${STYLES[style].toLowerCase()}`}>
            <div className="couv-titre-fond">
              <textarea value={titre} onChange={e => setTitre(e.target.value)}
                placeholder="Saisis du texte" aria-label="Titre de la couverture" />
            </div>
          </div>
        )}
      </div>

      {erreur && <p className="couv-erreur" role="alert">{erreur}</p>}

      <p className="couv-apercu"><Oeil taille={20} /><span>Aperçu</span></p>

      {/* Bande de selection : les images de la video, puis « Importer » */}
      <div className="couv-bande-ligne">
        <div className="couv-bande">
          {vignettes.map((v, i) => (
            <button key={i} className={`couv-bande-image ${i === choisie ? 'actif' : ''}`}
              aria-label={`Image ${i + 1}`} onClick={() => { setChoisie(i); setImportee(null) }}>
              <img src={v} alt="" />
            </button>
          ))}
        </div>
        <button className="couv-importer" onClick={() => importer.current?.click()}>
          <b>+</b><span>Importer</span>
        </button>
      </div>

      {/* Styles de titre */}
      <div className="couv-styles">
        {STYLES.map((nom, i) => (
          <button key={nom} className={`couv-style ${i === style ? 'actif' : ''}`}
            onClick={() => setStyle(i)}>
            <span className="couv-style-carre">
              {nom === 'Aucun' && <Interdit taille={30} />}
              {nom === 'Standard' && <b className="couv-style-aa">Aa</b>}
              {nom === 'Vector' && <span className="couv-badge-vector">Tok 229</span>}
              {nom === 'Glitch' && <span className="couv-badge-glitch"><i /><em>Tok 229</em></span>}
              {nom === 'Tint' && <span className="couv-badge-tint"><i /><em>Tok 229</em></span>}
              {nom === 'Emboss' && <span className="couv-badge-emboss">Tok 229</span>}
            </span>
            <small>{nom}</small>
          </button>
        ))}
      </div>

      <input hidden ref={importer} type="file" accept="image/*" onChange={e => {
        const f = e.target.files?.[0]
        if (f) setImportee(URL.createObjectURL(f))
      }} />
    </div>
  )
}
