import { useEffect, useRef, useState } from 'react'
import { Chevron, ChevronDroit } from '../components/Icones'
import GererPublications from './GererPublications'
import PreferencesContenu from './PreferencesContenu'
import Live from './Live'
import Interrupteur from '../components/Interrupteur'
import { reglages, enregistrerReglages } from '../lib/demo'
import {
  Notifications, Compte, Securite, Langues, Affichage, LibererEspace,
  EconomiseurDonnees, SectionInformative, PartagerProfil,
} from './ParametresDetail'
import { SECTIONS_INFO } from './sections-info'
import './parametres.css'

/* ------------------------------------------------------------------
   Icones de la page, en SVG : un emoji changerait de dessin selon le
   systeme et ne suivrait pas la couleur du texte.
   ------------------------------------------------------------------ */
const T = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Icone({ nom }: { nom: string }) {
  return <svg {...T}>
    {/* Activite */}
    {nom === 'publications' && <><rect x="2.5" y="5" width="13" height="11" rx="2"/><path d="m7.5 8.2 3.8 2.3-3.8 2.3V8.2Z" fill="currentColor" stroke="none"/><path d="M18 7v10.5a2 2 0 0 1-2 2H6"/><path d="M20.5 9v8.5a3.5 3.5 0 0 1-3.5 3.5H8"/></>}
    {nom === 'contenu' && <><rect x="2.5" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M15 10.8 20 8v8l-5-2.8v-2.4Z"/></>}
    {nom === 'live' && <><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="m8.5 3.5 3.5 4 3.5-4"/><path d="M10.5 11.4v5.2l4.2-2.6-4.2-2.6Z" fill="currentColor" stroke="none"/></>}
    {nom === 'cloche' && <><path d="M12 3a5.8 5.8 0 0 1 5.8 5.8c0 4.6.9 6.3 2.2 7.7H4c1.3-1.4 2.2-3.1 2.2-7.7A5.8 5.8 0 0 1 12 3Z"/><path d="M9.8 19.5a2.4 2.4 0 0 0 4.4 0"/></>}
    {nom === 'sablier' && <><path d="M6.5 2.5h11M6.5 21.5h11"/><path d="M8 2.5v3.2c0 2.1 4 3.6 4 6.3 0-2.7 4-4.2 4-6.3V2.5"/><path d="M8 21.5v-3.2c0-2.1 4-3.6 4-6.3 0 2.7 4 4.2 4 6.3v3.2"/><path d="M9.5 18.5c.7-1.2 2.5-1.9 2.5-3.2 0 1.3 1.8 2 2.5 3.2h-5Z" fill="currentColor" stroke="none"/></>}
    {nom === 'famille' && <><path d="M3.5 10.2 12 3.2l8.5 7v9.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-9.3Z"/><path d="M12 16.3c-1.7-1.3-2.8-2.1-2.8-3.2A1.4 1.4 0 0 1 12 12.3a1.4 1.4 0 0 1 2.8.8c0 1.1-1.1 1.9-2.8 3.2Z" fill="currentColor" stroke="none"/></>}
    {/* Compte */}
    {nom === 'compte' && <><circle cx="12" cy="7.5" r="3.8" fill="currentColor" stroke="none"/><path d="M4.5 21c0-4.1 3.4-6.6 7.5-6.6s7.5 2.5 7.5 6.6" fill="currentColor" stroke="none"/></>}
    {nom === 'bouclier' && <><path d="M12 2.6 4.5 5.8v6.4c0 4.7 3.2 8 7.5 9.2 4.3-1.2 7.5-4.5 7.5-9.2V5.8L12 2.6Z" fill="currentColor" stroke="none"/></>}
    {nom === 'partage' && <><path d="M13.5 3.2v4.4C6.5 8 3.2 12 2.6 18.8c2.8-3.7 6.2-4.7 10.9-4.7v4.4l8-7.6-8-7.7Z" fill="currentColor" stroke="none"/></>}
    {/* Visibilite */}
    {nom === 'cadenas' && <><rect x="4.8" y="10" width="14.4" height="11.2" rx="2.5" fill="currentColor" stroke="none"/><path d="M8.2 10V6.8a3.8 3.8 0 0 1 7.6 0V10"/></>}
    {/* Preferences */}
    {nom === 'musique' && <><path d="M9.5 17.5V5.2l10-2.2v12"/><circle cx="6.8" cy="17.8" r="2.8" fill="currentColor" stroke="none"/><circle cx="16.8" cy="15.6" r="2.8" fill="currentColor" stroke="none"/></>}
    {nom === 'messagerie' && <><circle cx="8.5" cy="6.8" r="3.4" fill="currentColor" stroke="none"/><path d="M2 19.5c0-3.9 2.8-6.3 6.5-6.3 1.3 0 2.4.3 3.4.8" fill="currentColor" stroke="none"/><path d="M14.5 14.5h7m0 0-2-2m2 2-2 2M21.5 19.5h-7m0 0 2-2m-2 2 2 2"/></>}
    {nom === 'horloge' && <><circle cx="12" cy="12" r="9.2"/><path d="M12 6.4V12l3.9 2.4"/></>}
    {nom === 'public' && <><circle cx="9" cy="7.8" r="3.4" fill="currentColor" stroke="none"/><circle cx="17.2" cy="8.8" r="2.6" fill="currentColor" stroke="none"/><path d="M2.5 19.8c0-3.8 2.8-6.2 6.5-6.2s6.5 2.4 6.5 6.2" fill="currentColor" stroke="none"/><path d="M17 13.6c2.7 0 4.5 1.8 4.5 4.6" fill="currentColor" stroke="none"/></>}
    {nom === 'pub' && <><path d="M3 9.8v4.4a1 1 0 0 0 1 1h2.4L12 19.6V4.4L6.4 8.8H4a1 1 0 0 0-1 1Z" fill="currentColor" stroke="none"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.8 7.8 0 0 1 0 10.8"/></>}
    {nom === 'lecture' && <><rect x="2.6" y="4.6" width="18.8" height="14.8" rx="3"/><path d="M10 9.2v5.6l4.6-2.8L10 9.2Z" fill="currentColor" stroke="none"/></>}
    {nom === 'langues' && <><rect x="2.8" y="2.8" width="18.4" height="18.4" rx="4"/><path d="m8.2 16.4 3.8-8.8 3.8 8.8M9.6 13.4h4.8"/></>}
    {nom === 'affichage' && <><path d="M20.8 14.2A8.8 8.8 0 0 1 9.8 3.2a9 9 0 1 0 11 11Z" fill="currentColor" stroke="none"/></>}
    {nom === 'accessibilite' && <><circle cx="12" cy="12" r="9.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7.2" r="1.4" fill="#fff" stroke="none"/><path d="M8 10.2h8M12 10.2v4.2m0 0-1.9 3.6m1.9-3.6 1.9 3.6" stroke="#fff" strokeWidth="1.6"/></>}
    {nom === 'localisation' && <><circle cx="8.6" cy="7" r="3.4" fill="currentColor" stroke="none"/><path d="M2 19.6c0-3.8 2.7-6.2 6.6-6.2h.6" fill="currentColor" stroke="none"/><path d="M17.8 21.4s3.6-3.6 3.6-6.2a3.6 3.6 0 1 0-7.2 0c0 2.6 3.6 6.2 3.6 6.2Z" fill="currentColor" stroke="none"/><circle cx="17.8" cy="15" r="1.2" fill="#fff" stroke="none"/></>}
    {/* Cache et donnees */}
    {nom === 'horsligne' && <><path d="M6.4 18.6a4.9 4.9 0 0 1-1.9-9.4 5.9 5.9 0 0 1 11.2-1.8 4.9 4.9 0 0 1 4.6 5.6" fill="currentColor" stroke="none"/><circle cx="12" cy="15.6" r="5.4" fill="currentColor" stroke="none"/><path d="M12 13v5m0 0-2-2m2 2 2-2" stroke="#fff" strokeWidth="1.6"/></>}
    {nom === 'corbeille' && <><path d="M3.8 6.4h16.4"/><path d="M9.2 6.4V4.2A1.2 1.2 0 0 1 10.4 3h3.2a1.2 1.2 0 0 1 1.2 1.2v2.2"/><path d="M5.8 6.4 6.9 20a1.8 1.8 0 0 0 1.8 1.6h6.6a1.8 1.8 0 0 0 1.8-1.6l1.1-13.6"/><path d="M10.2 10.4v6.8M13.8 10.4v6.8"/></>}
    {nom === 'economie' && <><path d="M12 2.4C7.8 7.2 4.8 9.8 4.8 13.8a7.2 7.2 0 0 0 14.4 0c0-4-3-6.6-7.2-11.4Z" fill="currentColor" stroke="none"/><path d="M8 14.4h2.2l1.6-2.6 1.8 4.4 1.4-1.8h1.2" stroke="#fff" strokeWidth="1.6"/></>}
    {/* Assistance */}
    {nom === 'aide' && <><path d="M4.2 13.4v-1.2a7.8 7.8 0 0 1 15.6 0v1.2"/><rect x="2.4" y="12.8" width="4.2" height="6.4" rx="2.1" fill="currentColor" stroke="none"/><rect x="17.4" y="12.8" width="4.2" height="6.4" rx="2.1" fill="currentColor" stroke="none"/><path d="M19.8 19.2v.4a2.6 2.6 0 0 1-2.6 2.6h-3.4"/></>}
    {nom === 'confidentialite' && <><rect x="4.4" y="10" width="15.2" height="11.4" rx="2.6" fill="currentColor" stroke="none"/><path d="M8 10V6.8a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15.4" r="1.5" fill="#fff" stroke="none"/><path d="M12 16.4v2" stroke="#fff" strokeWidth="1.6"/></>}
    {nom === 'info' && <><circle cx="12" cy="12" r="9.2" fill="currentColor" stroke="none"/><path d="M12 10.8v6" stroke="#fff" strokeWidth="1.8"/><circle cx="12" cy="7.6" r="1.2" fill="#fff" stroke="none"/></>}
    {/* Connexion */}
    {nom === 'changer' && <><circle cx="12" cy="12" r="9.2" fill="currentColor" stroke="none"/><path d="M8.4 10.2h7.2m0 0-2.2-2.2m2.2 2.2-2.2 2.2M15.6 13.8H8.4m0 0 2.2-2.2m-2.2 2.2 2.2 2.2" stroke="#fff" strokeWidth="1.5"/></>}
    {nom === 'deconnexion' && <><circle cx="12" cy="12" r="9.2" fill="currentColor" stroke="none"/><path d="M13.8 8.2h-3.6v7.6h3.6" stroke="#fff" strokeWidth="1.6"/><path d="M10.4 12h6.4m0 0-2.2-2.2m2.2 2.2-2.2 2.2" stroke="#fff" strokeWidth="1.6"/></>}
  </svg>
}

/* ------------------------------------------------------------------
   Structure de la page, reprise des captures de reference.
   ------------------------------------------------------------------ */
type Ligne = { nom: string; icone: string; pastille?: boolean; bascule?: boolean }

const SECTIONS: { titre: string; lignes: Ligne[] }[] = [
  { titre: 'Activité', lignes: [
    { nom: 'Gérer les publications', icone: 'publications' },
    { nom: 'Préférences de contenu', icone: 'contenu' },
    { nom: 'LIVE', icone: 'live' },
    { nom: 'Notifications', icone: 'cloche' },
    { nom: "Temps d'écran et bien-être", icone: 'sablier', pastille: true },
    { nom: 'Connexion Famille', icone: 'famille' },
  ] },
  { titre: 'Compte', lignes: [
    { nom: 'Compte', icone: 'compte' },
    { nom: 'Sécurité et autorisations', icone: 'bouclier' },
    { nom: 'Partager le profil', icone: 'partage' },
  ] },
  { titre: 'Visibilité', lignes: [
    { nom: 'Compte privé', icone: 'cadenas', bascule: true },
  ] },
  { titre: 'Préférences', lignes: [
    { nom: 'Musique', icone: 'musique' },
    { nom: 'Boîte de réception et messagerie', icone: 'messagerie' },
    { nom: 'Centre des activités', icone: 'horloge' },
    { nom: 'Contrôle du public', icone: 'public' },
    { nom: 'Publicités', icone: 'pub' },
    { nom: 'Lecture', icone: 'lecture', pastille: true },
    { nom: 'Langues', icone: 'langues' },
    { nom: 'Affichage', icone: 'affichage' },
    { nom: 'Accessibilité', icone: 'accessibilite', pastille: true },
    { nom: 'Contacts et localisation', icone: 'localisation' },
  ] },
  { titre: 'Cache et données mobiles', lignes: [
    { nom: 'Vidéos hors ligne', icone: 'horsligne' },
    { nom: "Libérer de l'espace", icone: 'corbeille' },
    { nom: 'Économiseur de données', icone: 'economie' },
  ] },
  { titre: 'Assistance et informations', lignes: [
    { nom: "Centre d'aide", icone: 'aide' },
    { nom: 'Centre de confidentialité', icone: 'confidentialite' },
    { nom: 'Conditions et politiques', icone: 'info' },
  ] },
]

const CLE_ACCUEIL = 'parametres-reutilisation-vu'

export default function Parametres({
  onRetour, onDeconnecter, pseudo,
}: { onRetour: () => void; onDeconnecter: () => void; pseudo: string }) {
  // Le panneau de reutilisation n'apparait qu'a la toute premiere visite,
  // comme sur la reference. Le choix est conserve d'une session a l'autre.
  const [accueil, setAccueil] = useState(() => {
    try { return !localStorage.getItem(CLE_ACCUEIL) } catch { return true }
  })
  const [choix, setChoix] = useState<'oui' | 'non' | null>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [compact, setCompact] = useState(false)
  const [prive, setPrive] = useState(reglages.comptePrive)
  const corps = useRef<HTMLDivElement>(null)

  // Le grand titre se replie dans la barre des qu'on defile, comme sur les
  // captures 2 et 4 de la reference.
  useEffect(() => {
    const el = corps.current
    if (!el) return
    const suivre = () => setCompact(el.scrollTop > 40)
    el.addEventListener('scroll', suivre, { passive: true })
    return () => el.removeEventListener('scroll', suivre)
  }, [])

  const fermerAccueil = () => {
    try { localStorage.setItem(CLE_ACCUEIL, '1') } catch { /* stockage indisponible */ }
    setAccueil(false)
  }

  if (selection === 'LIVE') return <Live onRetour={() => setSelection(null)} />

  if (selection === 'Gérer les publications') {
    return <GererPublications onRetour={() => setSelection(null)} />
  }

  if (selection === 'Préférences de contenu') {
    return <PreferencesContenu onRetour={() => setSelection(null)} />
  }

  // Sous-ecrans qui agissent vraiment.
  const fermer = () => setSelection(null)
  if (selection === 'Notifications') return <Notifications onRetour={fermer} />
  if (selection === 'Compte') return <Compte onRetour={fermer} />
  if (selection === 'Sécurité et autorisations') return <Securite onRetour={fermer} />
  if (selection === 'Langues') return <Langues onRetour={fermer} />
  if (selection === 'Affichage') return <Affichage onRetour={fermer} />
  if (selection === "Libérer de l'espace") return <LibererEspace onRetour={fermer} />
  if (selection === 'Économiseur de données')
    return <EconomiseurDonnees onRetour={fermer} />
  if (selection === 'Partager le profil')
    return <PartagerProfil pseudo={pseudo} onRetour={fermer} />

  // Sections encore informatives : titre, explication, et les
  // interrupteurs qui existent deja.
  const info = selection ? SECTIONS_INFO[selection] : undefined
  if (info) return <SectionInformative info={info} onRetour={fermer} />

  if (selection) {
    return <div className="param-page">
      <header className="param-barre">
        <button aria-label="Retour" onClick={fermer}><Chevron taille={24} /></button>
        <h1>{selection}</h1>
        <span />
      </header>
      {/* Dernier filet : toutes les sections listees ont leur ecran ou
          leur fiche. Celle-ci n'en a pas, le dire vaut mieux que de
          promettre une date. */}
      <p className="param-indisponible" role="status">
        Cette section n’a pas encore de réglage à proposer.
      </p>
    </div>
  }

  return <div className="param-page">
    <header className={`param-barre${compact ? ' compacte' : ''}`}>
      <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
      <h1>Paramètres et confidentialité</h1>
      <span />
    </header>

    <div className="param-corps" ref={corps}>
      <h2 className="param-grand-titre">Paramètres et<br />confidentialité</h2>

      {SECTIONS.map(section => <section className="param-section" key={section.titre}>
        <h3>{section.titre}</h3>
        <div className="param-carte">
          {section.lignes.map(ligne => ligne.bascule ? <div key={ligne.nom}>
            <div className="param-ligne">
              <Icone nom={ligne.icone} />
              <span className="param-nom">{ligne.nom}</span>
              <Interrupteur actif={reglages.comptePrive} libelle={ligne.nom}
                onChange={v => {
                  reglages.comptePrive = v
                  enregistrerReglages()
                  setPrive(v)
                }} />
            </div>
            {prive && <p className="param-explication">
              Lorsque ton compte est privé, seules les personnes que tu
              approuves peuvent voir tes vidéos, tes j'aime et tes
              abonnements. Les demandes d'abonnement arrivent dans
              « Messages ». Ton pseudo et ta photo restent visibles de tous.
            </p>}
          </div> : <button
            className="param-ligne"
            key={ligne.nom}
            onClick={() => setSelection(ligne.nom)}
          >
            <Icone nom={ligne.icone} />
            <span className="param-nom">{ligne.nom}</span>
            {ligne.pastille && <i className="param-pastille" aria-label="Nouveauté" />}
            <ChevronDroit taille={17} />
          </button>)}
        </div>
      </section>)}

      <section className="param-section">
        <h3>Connexion</h3>
        <div className="param-carte">
          <button className="param-ligne">
            <Icone nom="changer" />
            <span className="param-nom">Changer de compte</span>
            <span className="param-avatar">{pseudo.charAt(0).toUpperCase()}</span>
            <ChevronDroit taille={17} />
          </button>
          <button className="param-ligne" onClick={onDeconnecter}>
            <Icone nom="deconnexion" />
            <span className="param-nom">Se déconnecter</span>
            <ChevronDroit taille={17} />
          </button>
        </div>
      </section>

      <p className="param-version">v1.0.0 (démonstration)</p>
    </div>

    {accueil && <div className="param-voile">
      <div className="param-feuille" role="dialog" aria-label="Paramètre de réutilisation du contenu">
        <h2>Paramètre de réutilisation du contenu</h2>
        <p>
          Les paramètres d'autorisation permettant de choisir qui peut réaliser
          des Duos ou des Collages avec ta publication, créer des stickers avec
          celle-ci et l'ajouter, ainsi que tes commentaires, en Story sont
          maintenant regroupés sous un même paramètre de réutilisation du
          contenu. Ce paramètre est actuellement défini sur <b>Tout le monde</b>.
        </p>
        <p>
          Les paramètres sont différents pour 1 de tes publications. Pour ces
          publications, tu peux autoriser les utilisateurs à réutiliser ton
          contenu ou non.
        </p>
        <h4>Autoriser la réutilisation de ces<br />1 publications</h4>
        <div className="param-choix">
          <label>
            <span>Oui</span>
            <input type="radio" name="reutilisation" checked={choix === 'oui'}
              onChange={() => setChoix('oui')} />
          </label>
          <label>
            <span>Non</span>
            <input type="radio" name="reutilisation" checked={choix === 'non'}
              onChange={() => setChoix('non')} />
          </label>
        </div>
        <button className="param-confirmer" disabled={!choix} onClick={fermerAccueil}>
          Confirmer
        </button>
      </div>
    </div>}
  </div>
}
