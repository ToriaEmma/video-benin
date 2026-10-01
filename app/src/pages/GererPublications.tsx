import { useState } from 'react'
import { Chevron, ChevronDroit, Croix } from '../components/Icones'
import { etatDemo, type VideoDemo } from '../lib/demo'
import './gerer.css'

type Ecran = 'menu' | 'corbeille' | 'visibilite' | 'commentaires' | 'reutilisation'

const T = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Icone({ nom, taille = 24 }: { nom: string; taille?: number }) {
  return <svg {...T} width={taille} height={taille}>
    {nom === 'corbeille' && <><path d="M3.8 6.4h16.4"/><path d="M9.2 6.4V4.2A1.2 1.2 0 0 1 10.4 3h3.2a1.2 1.2 0 0 1 1.2 1.2v2.2"/><path d="M5.8 6.4 6.9 20a1.8 1.8 0 0 0 1.8 1.6h6.6a1.8 1.8 0 0 0 1.8-1.6l1.1-13.6"/><path d="M10.2 10.4v6.8M13.8 10.4v6.8"/></>}
    {nom === 'oeil' && <><path d="M12 5.2c5 0 9 4.3 9 6.8s-4 6.8-9 6.8-9-4.3-9-6.8 4-6.8 9-6.8Z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2.8" fill="#fff" stroke="none"/></>}
    {nom === 'bulle' && <><path d="M21 11.3c0 4-4 7.3-9 7.3-1 0-1.9-.1-2.8-.4L4 20.4l1.4-3.5C4 15.3 3 13.4 3 11.3 3 7.3 7 4 12 4s9 3.3 9 7.3Z" fill="currentColor" stroke="none"/><circle cx="8.4" cy="11.2" r="1.1" fill="#fff" stroke="none"/><circle cx="12" cy="11.2" r="1.1" fill="#fff" stroke="none"/><circle cx="15.6" cy="11.2" r="1.1" fill="#fff" stroke="none"/></>}
    {nom === 'reutilisation' && <><rect x="3" y="4.5" width="12.5" height="15" rx="2" fill="currentColor" stroke="none"/><path d="M7.6 9.4v5.2l4-2.6-4-2.6Z" fill="#fff" stroke="none"/><path d="M18 6.5v11M20.8 8v8"/></>}
    {nom === 'camera-vide' && <><rect x="2.5" y="6" width="13.5" height="12" rx="2.5"/><path d="m16 11 5.5-3.2v8.4L16 13v-2Z"/></>}
    {nom === 'info' && <><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/></>}
    {nom === 'reglages' && <><path d="m10.2 2.6-.6 2.1-1.9.8-2.1-.6-1.8 2.8 1.4 1.7-.2 2.1-1.9 1 .9 3.2 2.3.3 1.3 1.6.1 2.3 3.2.9 1.4-1.8 2 .3 1.8 1.4 2.8-1.8-.6-2.3.9-1.8 1.8-.9v-3.3l-2.1-.6-.9-1.8.7-2.1-2.8-1.8-1.8 1.4-2-.2-1-1.9Z"/><circle cx="12" cy="12" r="4.6"/></>}
    {nom === 'muet' && <><path d="M3 10.2v3.6a1 1 0 0 0 1 1h2.2L11 18.6V5.4L6.2 9.2H4a1 1 0 0 0-1 1Z" fill="currentColor" stroke="none"/><path d="m15 9.5 5 5m0-5-5 5"/></>}
    {nom === 'copies' && <><rect x="7" y="3.5" width="13.5" height="13.5" rx="2.5"/><path d="M11.6 8.2v4.2l3.4-2.1-3.4-2.1Z" fill="currentColor" stroke="none"/><path d="M4 7v11.5a2 2 0 0 0 2 2h11"/></>}
  </svg>
}

/* ---------- Barre commune ---------- */
function Barre({ titre, onRetour, action }: {
  titre: string; onRetour: () => void; action?: React.ReactNode
}) {
  return <header className="ger-barre">
    <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
    <h1>{titre}</h1>
    <span className="ger-action">{action}</span>
  </header>
}

/* ---------- Vignette d'une publication ---------- */
function Vignette({ v }: { v: VideoDemo }) {
  return <div className="ger-vignette">
    <video src={v.url} preload="metadata" muted playsInline />
  </div>
}

export default function GererPublications({ onRetour }: { onRetour: () => void }) {
  const [ecran, setEcran] = useState<Ecran>('menu')
  const [filtre, setFiltre] = useState<'tout' | 'monde' | 'amis' | 'moi'>('tout')
  const [banniere, setBanniere] = useState(true)
  const [choix, setChoix] = useState<string | null>(null)

  const mesVideos = etatDemo.videos

  /* ---------------- Menu ---------------- */
  if (ecran === 'menu') {
    const entrees = [
      { cle: 'corbeille' as const, nom: 'Suppression récente', icone: 'corbeille' },
      { cle: 'visibilite' as const, nom: 'Gérer la visibilité des publications', icone: 'oeil' },
      { cle: 'commentaires' as const, nom: 'Gérer les autorisations de commentaire', icone: 'bulle' },
      { cle: 'reutilisation' as const, nom: "Gérer l'autorisation de réutilisation des publications", icone: 'reutilisation' },
    ]
    return <div className="ger-page">
      <Barre titre="Gérer les publications" onRetour={onRetour}
        action={<button aria-label="Réglages"><Icone nom="reglages" taille={26} /></button>} />
      <div className="ger-corps">
        <div className="ger-carte">
          {entrees.map(e => <button className="ger-ligne" key={e.cle} onClick={() => setEcran(e.cle)}>
            <Icone nom={e.icone} taille={23} />
            <span className="ger-nom">{e.nom}</span>
            <ChevronDroit taille={17} />
          </button>)}
        </div>
      </div>
    </div>
  }

  /* ---------------- Suppression récente ---------------- */
  if (ecran === 'corbeille') {
    return <div className="ger-page">
      <Barre titre="Suppression récente" onRetour={() => setEcran('menu')}
        action={<button aria-label="Informations"><Icone nom="info" taille={20} /></button>} />
      <div className="ger-corps ger-centre">
        {etatDemo.corbeille.length === 0 ? <div className="ger-vide">
          <Icone nom="camera-vide" taille={72} />
          <b>Aucune publication supprimée récemment</b>
          <p>Les publications que tu as supprimées au cours des 30 derniers jours apparaîtront ici.</p>
        </div> : <div className="ger-liste">
          {etatDemo.corbeille.map(v => <div className="ger-item" key={v.id}>
            <Vignette v={v} />
            <div className="ger-texte"><span className="ger-date">{v.publieeLe}</span></div>
          </div>)}
        </div>}
      </div>
    </div>
  }

  /* ---------------- Visibilité ---------------- */
  if (ecran === 'visibilite') {
    const libelle = { monde: 'Tout le monde', amis: 'Ami(e)s', moi: 'Toi uniquement' }
    const liste = filtre === 'tout' ? mesVideos : mesVideos.filter(v => v.visibilite === filtre)
    return <div className="ger-page">
      <Barre titre="Gérer la visibilité des publications" onRetour={() => setEcran('menu')} />
      {banniere && <div className="ger-banniere">
        <p>
          Cette fonctionnalité est en cours de test bêta et ne prend en charge
          que certaines publications. <a href="#" onClick={e => e.preventDefault()}>En savoir plus</a>
        </p>
        <button aria-label="Fermer" onClick={() => setBanniere(false)}><Croix taille={18} /></button>
      </div>}
      <div className="ger-filtres">
        {([['tout','Tout'],['monde','Tout le monde'],['amis','Ami(e)s'],['moi','Toi uniquement']] as const)
          .map(([cle, nom]) => <button
            key={cle}
            className={filtre === cle ? 'actif' : ''}
            onClick={() => setFiltre(cle)}
          >{nom}</button>)}
      </div>
      <div className="ger-corps">
        <div className="ger-liste">
          {liste.map(v => <label className="ger-item" key={v.id}>
            <Vignette v={v} />
            <div className="ger-texte">
              {v.legende && <span className="ger-legende">{v.legende}</span>}
              <span className="ger-meta">
                {libelle[v.visibilite ?? 'monde']} · {v.publieeLe}
              </span>
            </div>
            <input type="radio" name="visibilite"
              checked={choix === v.id} onChange={() => setChoix(v.id)} />
          </label>)}
        </div>
      </div>
    </div>
  }

  /* ---------------- Commentaires ---------------- */
  if (ecran === 'commentaires') {
    return <div className="ger-page">
      <Barre titre="Gérer les autorisations de comm…" onRetour={() => setEcran('menu')} />
      <div className="ger-corps">
        <div className="ger-liste">
          {mesVideos.map(v => <label className="ger-item" key={v.id}>
            <Vignette v={v} />
            <div className="ger-texte">
              {v.legende && <span className="ger-legende">{v.legende}</span>}
              <span className="ger-date">{v.publieeLe}</span>
              <span className="ger-meta ger-avec-icone">
                {v.commentairesAutorises === false
                  ? <><Icone nom="muet" taille={17} /> Commentaires non autorisés</>
                  : <><Icone nom="bulle" taille={17} /> {v.nbCommentaires ?? 0}</>}
              </span>
            </div>
            <input type="radio" name="commentaires"
              checked={choix === v.id} onChange={() => setChoix(v.id)} />
          </label>)}
        </div>
      </div>
    </div>
  }

  /* ---------------- Réutilisation ---------------- */
  return <div className="ger-page">
    <Barre titre="Gérer l'autorisation de réutilisati…" onRetour={() => setEcran('menu')} />
    <div className="ger-corps">
      <div className="ger-liste">
        {mesVideos.map(v => <label className="ger-item" key={v.id}>
          <Vignette v={v} />
          <div className="ger-texte">
            {v.legende && <span className="ger-legende">{v.legende}</span>}
            <span className="ger-meta ger-avec-icone">
              <Icone nom="copies" taille={17} /> 1 publication
              <i className="ger-separateur" /> {v.publieeLe}
            </span>
            {v.reutilisationAutorisee === false && <span className="ger-etiquette">Réutilisation interdite</span>}
          </div>
          <input type="radio" name="reutilisation"
            checked={choix === v.id} onChange={() => setChoix(v.id)} />
        </label>)}
      </div>
    </div>
  </div>
}
