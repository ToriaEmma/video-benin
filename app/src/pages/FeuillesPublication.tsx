// ============================================================
// Les feuilles de l'ecran de publication.
//
// Jumelles de mobile/src/ecrans/FeuillesPublication.tsx : memes entrees,
// meme ordre, memes libelles. Elles partagent la coquille
// components/Feuille.tsx et son echelle de tailles.
// ============================================================

import Feuille from '../components/Feuille'
import Interrupteur from '../components/Interrupteur'
import {
  LiveEvents, PubMonde, Amies, Cadenas, ChevronDroit,
  PubCommentaire, PubReutilisation, PubDivulgation, PubDroitsSon,
  PubRechercheVisuelle, PubHauteQualite, PubTelecharger, PubFiligrane,
  PubLangue, PubOeilBarre, PubIA, PubLieu,
  LogoWhatsApp, LogoFacebook, LogoSMS,
} from '../components/Icones'
import {
  APPLICATIONS, DEPARTEMENTS,
  type Application, type Audience, type Departement, type Options,
} from '../lib/publication'
import './feuilles-publication.css'

// Les logos accompagnent les cles d'APPLICATIONS, qui vivent dans lib.
const LOGOS: Record<Application, { nom: string; Logo: (p: { taille?: number }) => React.ReactElement }> = {
  whatsapp: { nom: 'WhatsApp', Logo: LogoWhatsApp },
  facebook: { nom: 'Facebook', Logo: LogoFacebook },
  sms: { nom: 'SMS', Logo: LogoSMS },
}

type Icone = (p: { taille?: number }) => React.ReactElement

// --- Ligne a interrupteur, avec une explication facultative dessous ---
const LigneBascule = ({ Icone: I, titre, detail, valeur, onChange }: {
  Icone: Icone
  titre: string
  detail?: React.ReactNode
  valeur: boolean
  onChange: (v: boolean) => void
}) => (
  <div className="fle-ligne">
    <I taille={21} />
    <span className="fle-ligne-corps">
      <span className="fle-ligne-titre">{titre}</span>
      {detail != null && <span className="fle-ligne-detail">{detail}</span>}
    </span>
    <Interrupteur actif={valeur} onChange={onChange} libelle={titre} />
  </div>
)

// --- Ligne qui mene ailleurs : chevron a droite ---
const LigneChevron = ({ Icone: I, titre, detail, valeurDroite }: {
  Icone: Icone
  titre: string
  detail?: string
  valeurDroite?: string
}) => (
  <button type="button" className="fle-ligne">
    <I taille={21} />
    <span className="fle-ligne-corps">
      <span className="fle-ligne-titre">{titre}</span>
      {detail != null && <span className="fle-ligne-detail">{detail}</span>}
    </span>
    {valeurDroite != null && <span className="fle-valeur">{valeurDroite}</span>}
    <ChevronDroit taille={16} />
  </button>
)

// ============================================================
// « Ajouter un lien »
// ============================================================
export function FeuilleLien({ visible, onFermer }: {
  visible: boolean; onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Ajouter un lien" onFermer={onFermer}
      croixCerclee={false}>
      <button type="button" className="fpu-lien">
        <LiveEvents taille={33} />
        <span className="fle-ligne-corps">
          <b>LIVE Events</b>
          <span className="fle-ligne-detail">Publie un lien vers ton LIVE</span>
        </span>
      </button>
    </Feuille>
  )
}

// ============================================================
// « Qui peut voir cette publication »
// ============================================================
export function FeuilleAudience({ visible, audience, onChoisir, onFermer }: {
  visible: boolean
  audience: Audience
  onChoisir: (a: Audience) => void
  onFermer: () => void
}) {
  // Un rond rouge plein marque le choix courant, un rond vide les autres.
  const rond = (valeur: Audience) => (
    <span className={valeur === audience ? 'fle-rond fle-rond-choisi' : 'fle-rond'} />
  )

  return (
    <Feuille visible={visible} titre="Qui peut voir cette publication"
      onFermer={onFermer}>
      <div className="fpu-haut" />

      <button type="button" className="fle-ligne" aria-pressed={audience === 'tous'}
        onClick={() => onChoisir('tous')}>
        <PubMonde taille={21} />
        <span className="fle-ligne-corps"><span className="fle-ligne-titre">Tout le monde</span></span>
        {rond('tous')}
      </button>

      <button type="button" className="fle-ligne" aria-pressed={audience === 'amis'}
        onClick={() => onChoisir('amis')}>
        <Amies taille={21} />
        <span className="fle-ligne-corps">
          <span className="fle-ligne-titre">Ami(e)s</span>
          <span className="fle-ligne-detail fpu-amis-detail">
            Followers que tu suis en retour · 38 ami(e)s
            <ChevronDroit taille={13} />
          </span>
        </span>
        {rond('amis')}
      </button>

      <button type="button" className="fle-ligne" aria-pressed={audience === 'moi'}
        onClick={() => onChoisir('moi')}>
        <Cadenas taille={21} />
        <span className="fle-ligne-corps"><span className="fle-ligne-titre">Toi uniquement</span></span>
        {rond('moi')}
      </button>
    </Feuille>
  )
}

// ============================================================
// « Choisir un departement »
// ============================================================
export function FeuilleDepartement({ visible, departement, onChoisir, onFermer }: {
  visible: boolean
  departement: Departement
  onChoisir: (d: Departement) => void
  onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Choisir un département" onFermer={onFermer}>
      <p className="fle-intro">
        Indique le département du Bénin où cette vidéo a été filmée.
      </p>

      <div className="fle-bloc">
        {DEPARTEMENTS.map(d => (
          <button type="button" key={d} className="fle-ligne"
            aria-pressed={d === departement} onClick={() => onChoisir(d)}>
            <PubLieu taille={21} />
            <span className="fle-ligne-corps"><span className="fle-ligne-titre">{d}</span></span>
            <span className={d === departement ? 'fle-rond fle-rond-choisi' : 'fle-rond'} />
          </button>
        ))}
      </div>
    </Feuille>
  )
}

// ============================================================
// « Plus d'options »
// ============================================================
export function FeuilleOptions({ visible, options, onChange, onFermer }: {
  visible: boolean
  options: Options
  onChange: (o: Options) => void
  onFermer: () => void
}) {
  const bascule = (cle: keyof Options) => (v: boolean) =>
    onChange({ ...options, [cle]: v })

  return (
    <Feuille visible={visible} titre="Plus d'options" onFermer={onFermer}>
      <p className="fle-section">Paramètres de confidentialité</p>
      <div className="fle-bloc">
        <LigneBascule Icone={PubCommentaire} titre="Autoriser les commentaires"
          valeur={options.commentaires} onChange={bascule('commentaires')} />
        <LigneBascule Icone={PubReutilisation} titre="Autoriser la réutilisation du contenu"
          detail="Duos, Collages, stickers et ajout en Story"
          valeur={options.reutilisation} onChange={bascule('reutilisation')} />
      </div>

      <p className="fle-section">Paramètres avancés</p>
      <div className="fle-bloc">
        <LigneChevron Icone={PubDivulgation}
          titre="Divulgation de contenu et publicités" />
        <LigneBascule Icone={PubIA} titre="Contenu généré par IA"
          detail={<>
            Ajoute cette étiquette pour indiquer aux spectateurs que ton contenu
            a été généré ou modifié par une IA. <b>En savoir plus</b>
          </>}
          valeur={options.genereIA} onChange={bascule('genereIA')} />
        <LigneBascule Icone={PubDroitsSon}
          titre="Vérification automatique des droits d'auteur du son"
          detail="Les sons de ta vidéo seront vérifiés automatiquement afin d'identifier tout problème relatif aux droits d'auteur. Les résultats te seront communiqués immédiatement."
          valeur={options.droitsSon} onChange={bascule('droitsSon')} />
        <LigneBascule Icone={PubRechercheVisuelle} titre="Autoriser la recherche visuelle"
          detail="Ton contenu sera éligible à la recherche visuelle pour que les autres personnes puissent trouver du contenu ou des produits similaires."
          valeur={options.rechercheVisuelle} onChange={bascule('rechercheVisuelle')} />
        <LigneBascule Icone={PubHauteQualite}
          titre="Autoriser les importations de haute qualité"
          detail="Les vidéos de qualité supérieure peuvent être plus longues à traiter."
          valeur={options.hauteQualite} onChange={bascule('hauteQualite')} />
        <LigneBascule Icone={PubTelecharger} titre="Enregistrer sur l'appareil"
          detail="Ta publication sera enregistrée sur l'appareil, sauf en cas d'infraction aux Règles de la communauté."
          valeur={options.surAppareil} onChange={bascule('surAppareil')} />
        <LigneBascule Icone={PubFiligrane} titre="Enregistrer les publications avec filigrane"
          detail="Cela n'affecte que les photos et les vidéos que tu as publiées."
          valeur={options.filigrane} onChange={bascule('filigrane')} />
        <LigneChevron Icone={PubLangue} titre="Sélectionner la langue de la vidéo"
          detail="Les vidéos dans les langues prises en charge s'accompagneront de légendes générées …"
          valeurDroite="Fr" />
        <LigneBascule Icone={PubOeilBarre} titre="Contrôles du public⑦"
          detail="Cette vidéo n'est accessible qu'aux utilisateur(trice)s de 18 ans et plus."
          valeur={options.publicAdulte} onChange={bascule('publicAdulte')} />
      </div>
    </Feuille>
  )
}

// ============================================================
// « Partager sur »
// ============================================================
export function FeuillePartage({ visible, choisies, onBasculer, onFermer }: {
  visible: boolean
  choisies: Application[]
  onBasculer: (a: Application) => void
  onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Partager sur" onFermer={onFermer}
      croixCerclee={false} fondGris>
      <p className="fle-intro">
        Après la publication, Tok 229 ouvrira l&apos;application que tu
        sélectionnes ci-dessous afin que tu puisses la partager.
      </p>

      <div className="fpu-bloc-blanc">
        {APPLICATIONS.map(cle => {
          const { nom, Logo } = LOGOS[cle]
          return (
          <button type="button" key={cle} className="fpu-partage"
            aria-pressed={choisies.includes(cle)} onClick={() => onBasculer(cle)}>
            <Logo taille={33} />
            <b>{nom}</b>
            <span className={choisies.includes(cle) ? 'fle-rond fle-rond-choisi' : 'fle-rond'} />
          </button>
          )
        })}
      </div>
    </Feuille>
  )
}
