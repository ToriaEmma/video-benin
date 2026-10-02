// ============================================================
// Notifications systeme : la liste des cartes de service, puis
// l'ecran de reglages ouvert par la roue dentee.
// ============================================================

import { useState } from 'react'
import Interrupteur from '../components/Interrupteur'
import {
  Chevron, ChevronDroit, Engrenage, TroisPoints, Epingle, ClocheBarree,
  CanalPublicite, CanalPromotion, CanalMarketplace, CanalLive,
  CanalMiniSerie, CanalApplication,
} from '../components/Icones'
import {
  etatDemo, ageCourt, type Notification, type CanalNotification,
} from '../lib/demo'
import './notifications.css'

type Glyphe = ({ taille }: { taille?: number }) => React.ReactElement

// Filtres de la bande horizontale. `canal` a null pour « Tous », qui
// laisse passer toutes les cartes.
const FILTRES: { nom: string; canal: CanalNotification | null }[] = [
  { nom: 'Tous', canal: null },
  { nom: 'LIVE', canal: 'live' },
  { nom: 'TockTick', canal: 'application' },
  { nom: 'Assistant promotion', canal: 'promotion' },
]

// Pastille ronde de chaque carte : une couleur et une icone par canal.
const PASTILLES: Record<CanalNotification, { fond: string; Icone: Glyphe }> = {
  live: { fond: '#ff2856', Icone: CanalLive },
  application: { fond: '#111', Icone: CanalApplication },
  promotion: { fond: '#2a7ab0', Icone: CanalPromotion },
}

// Les six canaux de la seconde carte des reglages.
const CANAUX: { nom: string; Icone: Glyphe }[] = [
  { nom: 'Assistance publicités', Icone: CanalPublicite },
  { nom: 'Assistant promotion', Icone: CanalPromotion },
  { nom: 'Creator Marketplace', Icone: CanalMarketplace },
  { nom: 'LIVE', Icone: CanalLive },
  { nom: 'Mini-série', Icone: CanalMiniSerie },
  { nom: 'TockTick', Icone: CanalApplication },
]

function Carte({ notification }: { notification: Notification }) {
  // Le corps reste tronque a trois lignes jusqu'au premier « Voir plus ».
  const [developpe, setDeveloppe] = useState(false)
  const pastille = PASTILLES[notification.canal]

  return (
    <article className="ntf-carte">
      <header className="ntf-entete">
        <span className="ntf-pastille" style={{ background: pastille.fond }}>
          <pastille.Icone taille={15} />
        </span>
        <span className="ntf-etiquette">{notification.etiquette}</span>
        <button className="ntf-points" aria-label="Plus d’options">
          <TroisPoints taille={18} />
        </button>
      </header>

      <h2 className="ntf-titre">{notification.titre}</h2>

      <div className="ntf-corps">
        <p className={developpe ? '' : 'ntf-tronque'}>
          {notification.corps}
          {'  '}
          <span className="ntf-age">{ageCourt(notification.date)}</span>
        </p>
        {/* La vignette reprend la premiere image de la video, lecteur coupe
            et en pause : c'est une image fixe. */}
        {!!notification.vignette && (
          <span className="ntf-vignette">
            <video src={notification.vignette} muted playsInline preload="metadata" />
          </span>
        )}
      </div>

      <button className="ntf-voir" onClick={() => setDeveloppe(v => !v)}>
        {developpe ? 'Voir moins' : 'Voir plus'}
      </button>
    </article>
  )
}

export function ParametresNotifications({ onRetour }: { onRetour: () => void }) {
  const [epingle, setEpingle] = useState(false)
  const [sourdine, setSourdine] = useState(false)

  return (
    <section className="ntf-page">
      <header className="ntf-barre">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <h1>Paramètres des notifications</h1>
        <span />
      </header>

      <div className="ntf-reglages">
        <div className="ntf-groupe">
          <div className="ntf-ligne">
            <Epingle taille={22} />
            <span>Épingler en haut</span>
            <Interrupteur actif={epingle} onChange={setEpingle}
              libelle="Épingler en haut" />
          </div>
          <div className="ntf-ligne">
            <ClocheBarree taille={22} />
            <span>Mettre en sourdine</span>
            <Interrupteur actif={sourdine} onChange={setSourdine}
              libelle="Mettre en sourdine" />
          </div>
        </div>

        <h2 className="ntf-section">Notifications de canal</h2>

        <div className="ntf-groupe">
          {CANAUX.map(c => (
            <button className="ntf-ligne" key={c.nom}>
              <c.Icone taille={22} />
              <span>{c.nom}</span>
              <ChevronDroit taille={17} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Notifications({ onRetour }: { onRetour: () => void }) {
  const [filtre, setFiltre] = useState(0)
  const [reglages, setReglages] = useState(false)

  if (reglages) {
    return <ParametresNotifications onRetour={() => setReglages(false)} />
  }

  const canal = FILTRES[filtre].canal
  const liste = etatDemo.notifications.filter(n => !canal || n.canal === canal)

  return (
    <section className="ntf-page">
      <header className="ntf-barre">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <h1>Notifications système</h1>
        <button aria-label="Paramètres des notifications"
          onClick={() => setReglages(true)}><Engrenage taille={23} /></button>
      </header>

      <div className="ntf-bande">
        {FILTRES.map((f, i) => (
          <button key={f.nom} aria-pressed={i === filtre}
            className={i === filtre ? 'ntf-puce ntf-puce-active' : 'ntf-puce'}
            onClick={() => setFiltre(i)}>
            {f.nom}
          </button>
        ))}
      </div>

      <div className="ntf-liste">
        {liste.length === 0
          ? <p className="ntf-vide">Aucune notification dans ce canal.</p>
          : liste.map(n => <Carte key={n.id} notification={n} />)}
      </div>
    </section>
  )
}
