import { useState } from 'react'
import { Chevron, ChevronDroit } from '../components/Icones'
import './preferences.css'

type Ecran = 'menu' | 'motscles' | 'stem' | 'restreint' | 'sujets' | 'actualiser' | 'sourdine'

const T = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Icone({ nom, taille = 24 }: { nom: string; taille?: number }) {
  return <svg {...T} width={taille} height={taille}>
    {nom === 'fiole' && <><path d="M9.5 3v6.2L5 18.6A2 2 0 0 0 6.8 21.5h10.4a2 2 0 0 0 1.8-2.9L14.5 9.2V3"/><path d="M8.2 3h7.6M7.4 14.5h9.2"/></>}
    {nom === 'curseurs' && <><path d="M3 7.5h4M11 7.5h10M3 16.5h10M17 16.5h4"/><circle cx="9" cy="7.5" r="2.2"/><circle cx="15" cy="16.5" r="2.2"/></>}
    {nom === 'entonnoir' && <><path d="M3.5 4.5h17l-6.6 7.8v7.2l-3.8-2.4v-4.8L3.5 4.5Z"/></>}
    {nom === 'cadenas' && <><rect x="5" y="10.5" width="14" height="10.5" rx="2" fill="currentColor" stroke="none"/><path d="M8.2 10.5V7a3.8 3.8 0 0 1 7.6 0v3.5"/><circle cx="12" cy="15.5" r="1.3" fill="#fff" stroke="none"/></>}
    {nom === 'info' && <><circle cx="12" cy="12" r="8.8"/><path d="M12 11.2v5.4"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/></>}
    {nom === 'silhouette' && <><circle cx="12" cy="8" r="4.6"/><path d="M4.5 21.5c0-4.4 3.4-7 7.5-7s7.5 2.6 7.5 7"/></>}
  </svg>
}

/* ---------- Illustrations des ecrans d'activation ---------- */
function Ampoule() {
  return <svg width="112" height="112" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M48 12c-11 0-19.5 8.4-19.5 19 0 7 3.6 11.4 6.4 14.9 1.9 2.3 3.1 3.8 3.1 5.6v2.5h20v-2.5c0-1.8 1.2-3.3 3.1-5.6 2.8-3.5 6.4-7.9 6.4-14.9 0-10.6-8.5-19-19.5-19Z" fill="#6de4da"/>
    <path d="M42 54c0-3-6-6-6-13a12 12 0 0 1 24 0c0 7-6 10-6 13" stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M42 60h12M43 66h10M45 71h6" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
    <path d="M69 26l7-4M72 38h8M68 50l7 4" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
}

function Parapluie() {
  return <svg width="86" height="86" viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <path d="M6 38c0-16 13.4-28 30-28s30 12 30 28c0 0-6-6-12-6s-9 6-9 6-3-6-9-6-9 6-9 6-3-6-9-6-12 6-12 6Z" fill="#111"/>
    <path d="M36 38v20a6 6 0 0 1-12 0" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </svg>
}

function Presse() {
  return <svg width="124" height="124" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <rect x="34" y="20" width="52" height="72" rx="4" stroke="#c8c8cc" strokeWidth="3.2"/>
    <rect x="50" y="14" width="20" height="10" rx="3" fill="#dcdce0"/>
    <path d="M46 44h28M46 56h28M46 68h18" stroke="#c8c8cc" strokeWidth="3.2" strokeLinecap="round"/>
    <path d="M34 78v14h14" stroke="#c8c8cc" strokeWidth="3.2" strokeLinejoin="round"/>
    <path d="m22 34 7 5M20 46h8" stroke="#c8c8cc" strokeWidth="3.2" strokeLinecap="round"/>
    <path d="m94 74 3.4 7.6L105 85l-7.6 3.4L94 96l-3.4-7.6L83 85l7.6-3.4L94 74Z" fill="#dcdce0"/>
  </svg>
}

const SUJETS = [
  'Animaux', 'Arts créatifs', 'Contenu généré par IA', 'Danse', 'Humour',
  'Lifestyle', 'Mode et beauté', 'Musique', 'Sport', 'Voyage',
]

/* ---------- Barre commune ---------- */
function Barre({ titre, sousTitre, onRetour, action }: {
  titre?: string; sousTitre?: string; onRetour: () => void; action?: React.ReactNode
}) {
  return <header className="pref-barre">
    <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
    <div className="pref-titre-groupe">
      {titre && <h1>{titre}</h1>}
      {sousTitre && <span>{sousTitre}</span>}
    </div>
    <span className="pref-action">{action}</span>
  </header>
}

export default function PreferencesContenu({ onRetour }: { onRetour: () => void }) {
  const [ecran, setEcran] = useState<Ecran>('menu')
  const [stem, setStem] = useState(false)
  const [restreint, setRestreint] = useState(false)
  // Trois crans par sujet : moins (0), par defaut (1), plus (2).
  const [sujets, setSujets] = useState<Record<string, number>>(
    Object.fromEntries(SUJETS.map(s => [s, 1])),
  )
  const [motsCles] = useState<string[]>([])

  /* ---------------- Menu ---------------- */
  if (ecran === 'menu') {
    const lignes = [
      { cle: 'motscles' as const, nom: 'Filtrer des mots-clés', valeur: String(motsCles.length) },
      { cle: 'stem' as const, nom: "Fil d'actualité STEM", valeur: stem ? 'Activé' : 'Désactivé' },
      { cle: 'restreint' as const, nom: 'Mode restreint', valeur: restreint ? 'Activé' : 'Désactivé' },
      { cle: 'sujets' as const, nom: 'Gérer les sujets' },
      { cle: 'actualiser' as const, nom: "Actualiser ton fil d'actualité Pour toi" },
      { cle: 'sourdine' as const, nom: 'Comptes mis en sourdine' },
    ]
    return <div className="pref-page">
      <Barre titre="Préférences de contenu" onRetour={onRetour} />
      <div className="pref-corps">
        <div className="pref-carte">
          {lignes.map(l => <button className="pref-ligne" key={l.cle} onClick={() => setEcran(l.cle)}>
            <span className="pref-nom">{l.nom}</span>
            {l.valeur && <span className="pref-valeur">{l.valeur}</span>}
            <ChevronDroit taille={17} />
          </button>)}
        </div>
      </div>
    </div>
  }

  /* ---------------- Filtrer des mots-cles ---------------- */
  if (ecran === 'motscles') {
    return <div className="pref-page">
      <Barre titre="Filtrer des mots-clés"
        sousTitre={`${motsCles.length} mots-clés`}
        onRetour={() => setEcran('menu')} />
      <div className="pref-corps pref-centre">
        <div className="pref-vide">
          <Presse />
          <b>Ajouter un mot-clé</b>
          <p>
            Lorsque tu filtres un mot-clé, tu ne vois pas les publications qui
            contiennent ce mot dans leur titre, leur description ou leurs
            stickers. Certains mots-clés ne peuvent pas être filtrés.
          </p>
        </div>
      </div>
      <div className="pref-pied">
        <button className="pref-bouton">Ajouter un mot-clé</button>
      </div>
    </div>
  }

  /* ---------------- Fil STEM ---------------- */
  if (ecran === 'stem') {
    return <div className="pref-page pref-blanc">
      <Barre onRetour={() => setEcran('menu')} />
      <div className="pref-corps">
        <div className="pref-illustration"><Ampoule /></div>
        <h2 className="pref-grand-titre">Fil d'actualité STEM</h2>
        <div className="pref-avantage">
          <Icone nom="fiole" taille={23} />
          <p>
            Bénéficie d'un fil d'actualité contenant des vidéos sur les sciences,
            la technologie, l'ingénierie et les mathématiques
          </p>
        </div>
        <div className="pref-avantage">
          <Icone nom="curseurs" taille={23} />
          <p>Active et désactive-le à tout moment</p>
        </div>
      </div>
      <div className="pref-pied">
        <button className="pref-bouton" onClick={() => { setStem(!stem); setEcran('menu') }}>
          {stem ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  }

  /* ---------------- Mode restreint ---------------- */
  if (ecran === 'restreint') {
    return <div className="pref-page pref-blanc">
      <Barre onRetour={() => setEcran('menu')} />
      <div className="pref-corps">
        <div className="pref-illustration pref-illustration--serree"><Parapluie /></div>
        <h2 className="pref-titre-etat">
          Mode restreint : <span>{restreint ? 'Activé' : 'Désactivé'}</span>
        </h2>
        <hr className="pref-filet" />
        <div className="pref-avantage">
          <Icone nom="entonnoir" taille={23} />
          <p>
            Limite le contenu non adapté à certains publics. Si tu trouves du
            contenu qui te met mal à l'aise en mode restreint, signale-le pour
            nous aider à nous améliorer.
          </p>
        </div>
        <div className="pref-avantage">
          <Icone nom="cadenas" taille={23} />
          <p>Active et désactive le paramètre à tout moment</p>
        </div>
      </div>
      <div className="pref-pied">
        <button className="pref-bouton" onClick={() => { setRestreint(!restreint); setEcran('menu') }}>
          {restreint ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  }

  /* ---------------- Gerer les sujets ---------------- */
  if (ecran === 'sujets') {
    const etiquette = ['Moins', 'Par défaut', 'Plus']
    return <div className="pref-page pref-blanc">
      <header className="pref-barre pref-barre--texte">
        <button onClick={() => setEcran('menu')}>Retour</button>
        <span />
        <button className="pref-enregistrer" onClick={() => setEcran('menu')}>Enregistrer</button>
      </header>
      <div className="pref-corps">
        <h2 className="pref-grand-titre pref-grand-titre--gauche">Gérer les sujets</h2>
        <p className="pref-intro">
          Personnalise ton fil d'actualité pour voir davantage ou moins de
          contenu que tu aimes. <b>En savoir plus</b>
        </p>
        {SUJETS.map(s => <div className="pref-sujet" key={s}>
          <div className="pref-sujet-entete">
            <span className="pref-sujet-nom">{s} <Icone nom="info" taille={16} /></span>
            <span className="pref-sujet-valeur">{etiquette[sujets[s]]}</span>
          </div>
          <div className="pref-curseur">
            <i className="pref-cran pref-cran--g" />
            <i className="pref-cran pref-cran--d" />
            <input
              type="range" min={0} max={2} step={1}
              value={sujets[s]}
              aria-label={`${s} : ${etiquette[sujets[s]]}`}
              onChange={e => setSujets(v => ({ ...v, [s]: Number(e.target.value) }))}
            />
          </div>
        </div>)}
      </div>
    </div>
  }

  /* ---------------- Actualiser le fil ---------------- */
  if (ecran === 'actualiser') {
    return <div className="pref-page pref-blanc">
      <Barre onRetour={() => setEcran('menu')}
        action={<button aria-label="Informations"><Icone nom="info" taille={22} /></button>} />
      <div className="pref-corps pref-corps--actualiser">
        <div className="pref-pilule">Actualisation de ton fil… <ChevronDroit taille={15} /></div>
        <div className="pref-points"><i className="actif" /><i /><i /></div>
        <h2 className="pref-grand-titre">Actualise ton fil d'actualité</h2>
        <ol className="pref-etapes">
          <li><span>1</span><p>Nous allons temporairement te montrer du contenu populaire que tu ne vois peut-être pas normalement.</p></li>
          <li><span>2</span><p>Plus tu aimes, commentes et partages du contenu, mieux nous pourrons mettre à jour ton fil d'actualité.</p></li>
          <li><span>3</span><p>Une fois actualisé, ton fil d'actualité reflétera tes nouveaux et tes anciens centres d'intérêt.</p></li>
        </ol>
      </div>
      <div className="pref-pied">
        <button className="pref-bouton" onClick={() => setEcran('menu')}>Commencer</button>
        <p className="pref-note">Tu peux arrêter l'actualisation à tout moment</p>
      </div>
    </div>
  }

  /* ---------------- Comptes mis en sourdine ---------------- */
  return <div className="pref-page">
    <Barre titre="Comptes mis en sourdine" onRetour={() => setEcran('menu')} />
    <div className="pref-corps pref-centre">
      <div className="pref-vide">
        <Icone nom="silhouette" taille={72} />
        <b>Aucun compte mis en sourdine</b>
        <p>
          Les comptes que tu auras mis en sourdine apparaîtront ici. Les
          publications importées par les comptes mis en sourdine n'apparaîtront
          pas dans tes fils d'actualité Pour toi, Suivis et Ami(e)s.
        </p>
      </div>
    </div>
  </div>
}
