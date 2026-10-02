// ============================================================
// Analyse video : les indicateurs d'une de ses publications,
// ouverte depuis « Données analytiques » de la feuille « Envoyer à ».
// ============================================================

import { useState } from 'react'
import {
  Chevron, StudioPastille, Lecture, Coeur, Bulle, Partage, MarquePage,
} from '../components/Icones'
import { abreger, jourEtMois, type VideoDemo } from '../lib/demo'
import './analyse.css'

const ONGLETS = ['Inspiration', "Vue d'ensemble", 'Spectateurs', 'Engagement']

// Duree de demonstration : les sources de test font toutes dix secondes,
// la maquette en montre une bien plus longue. On la derive du nombre de
// vues pour qu'elle reste stable d'une ouverture a l'autre.
const dureeSimulee = (video: VideoDemo) =>
  42 + (video.vues % 100) + (video.vues % 97) / 100

// « 121.77 s » : la duree posee en bas de la vignette.
const dureeLisible = (secondes: number) => `${secondes.toFixed(2)} s`

// « 1 min 23 s » / « 18 s » : les durees de lecture des tuiles.
const dureeLongue = (secondes: number) => {
  const entier = Math.round(secondes)
  if (entier < 60) return `${entier} s`
  const minutes = Math.floor(entier / 60)
  if (minutes < 60) return `${minutes} min ${entier % 60} s`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

// « Publié le 27 sept. 2026, 17:44 ». `publieeLe` vaut « 9-27 » : le mois et
// le jour, sans annee. L'annee en cours complete la date, et l'heure vient
// du nombre de vues pour ne pas changer a chaque rendu.
const datePubliee = (video: VideoDemo) => {
  const [mois, jour] = (video.publieeLe ?? '').split('-').map(Number)
  const maintenant = new Date()
  const d = Number.isFinite(mois) && Number.isFinite(jour)
    ? new Date(maintenant.getFullYear(), mois - 1, jour)
    : maintenant
  const heure = String(8 + (video.vues % 12)).padStart(2, '0')
  const minute = String(video.vues % 60).padStart(2, '0')
  const { jour: j, mois: m } = jourEtMois(d.getTime())
  return `Publié le ${j} ${m} ${d.getFullYear()}, ${heure}:${minute}`
}

// Une des cinq mesures de la rangee sous la vignette.
function Mesure({ Icone, valeur, libelle }: {
  Icone: ({ taille }: { taille?: number }) => React.ReactElement
  valeur: number
  libelle: string
}) {
  return (
    <div className="ana-mesure">
      <Icone taille={20} />
      <b aria-label={libelle}>{abreger(valeur)}</b>
    </div>
  )
}

export default function AnalyseVideo({ video, onRetour }: {
  video: VideoDemo
  onRetour: () => void
}) {
  const [onglet, setOnglet] = useState(1)

  // Les mesures derivees restent figees pour une video donnee : elles
  // viennent de ses vues, de ses j'aime et de sa duree simulee.
  const duree = dureeSimulee(video)
  const partages = Math.round(video.nbAime * 0.14)
  const favoris = Math.round(video.nbAime * 0.21)
  // Un spectateur sur trois environ va au bout de la video.
  const complets = Math.round(video.vues * 0.34)
  const visionnageMoyen = duree * 0.38
  const lectureTotale = video.vues * visionnageMoyen
  const nouveauxAbonnes = Math.round(video.vues * 0.004)

  const tuiles = [
    { libelle: 'Vues de la vidéo', valeur: abreger(video.vues) },
    { libelle: 'Temps de lecture total', valeur: dureeLongue(lectureTotale) },
    { libelle: 'Temps de visionnage moyen', valeur: dureeLongue(visionnageMoyen) },
    // Une video sans vue n'a personne a compter : la part reste a zero.
    {
      libelle: 'A regardé toute la vidéo',
      valeur: `${video.vues > 0 ? Math.round(complets / video.vues * 100) : 0} %`,
    },
    { libelle: 'Nouveaux followers', valeur: abreger(nouveauxAbonnes) },
  ]

  return (
    <div className="ana-page">
      <header className="ana-barre">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <h1>Analyse vidéo</h1>
        <button className="ana-studio">
          <StudioPastille taille={15} />Studio créateur
        </button>
      </header>

      <div className="ana-corps">
        <div className="ana-apercu">
          <video src={video.url} muted playsInline preload="metadata" />
          <span className="ana-duree">{dureeLisible(duree)}</span>
        </div>

        <p className="ana-date">{datePubliee(video)}</p>

        <div className="ana-mesures">
          <Mesure Icone={Lecture} valeur={video.vues} libelle="Vues" />
          <i className="ana-regle" />
          <Mesure Icone={Coeur} valeur={video.nbAime} libelle="J'aime" />
          <i className="ana-regle" />
          <Mesure Icone={Bulle} valeur={video.nbCommentaires ?? 0} libelle="Commentaires" />
          <i className="ana-regle" />
          <Mesure Icone={Partage} valeur={partages} libelle="Partages" />
          <i className="ana-regle" />
          <Mesure Icone={MarquePage} valeur={favoris} libelle="Favoris" />
        </div>

        <div className="ana-onglets">
          {ONGLETS.map((o, i) => (
            <button className={`ana-onglet${i === onglet ? ' ana-actif' : ''}`}
              key={o} onClick={() => setOnglet(i)}>
              <span>{o}</span>
              <i />
            </button>
          ))}
        </div>

        {onglet === 1 ? (
          <section className="ana-carte">
            <h2>Indicateurs clés</h2>
            <p>Mis à jour en temps réel.</p>
            <div className="ana-grille">
              {tuiles.map((t, i) => (
                <div className={`ana-tuile${i === 0 ? ' ana-tuile-avant' : ''}`}
                  key={t.libelle}>
                  <span>{t.libelle}</span>
                  <b>{t.valeur}</b>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="ana-bientot">Bientôt disponible</p>
        )}
      </div>
    </div>
  )
}
