// ============================================================
// Sous-ecrans de « Paramètres et confidentialité ».
//
// Chaque section de l'ecran des parametres ouvre un composant d'ici.
// Les ecrans qui agissent vraiment (notifications, compte, securite,
// langues, affichage, espace, economie de donnees) sont separes de
// ceux qui restent informatifs : ces derniers passent par
// `SectionInformative`, qui annonce honnetement ce que la section
// couvrira sans inventer de donnees.
//
// Tous les reglages vivent dans `reglages` et sont ecrits par
// `enregistrerReglages()` : ils survivent donc a un rechargement.
// ============================================================

import { useState } from 'react'
import {
  Chevron, ChevronDroit, CocheChoix, Personne, Telephone, Cle, Appareil,
  Maillon, Partage,
} from '../components/Icones'
import Interrupteur from '../components/Interrupteur'
import { useAuth } from '../lib/auth'
import {
  etatDemo, reglages, enregistrerReglages, poidsLisible, type Reglages,
} from '../lib/demo'
import { type SectionInfo } from './sections-info'
import './detail.css'

// ------------------------------------------------------------
// Briques communes
// ------------------------------------------------------------

// Barre de titre, identique a celle de PreferencesContenu : les deux
// ecrans se suivent dans la navigation, leur entete ne doit pas sauter.
function Barre({ titre, sousTitre, onRetour }: {
  titre?: string; sousTitre?: string; onRetour: () => void
}) {
  return (
    <header className="det-barre">
      <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
      <div className="det-barre-titre">
        {!!titre && <h1>{titre}</h1>}
        {!!sousTitre && <span>{sousTitre}</span>}
      </div>
      <span />
    </header>
  )
}

// Libelle gris au-dessus d'une carte blanche.
const Groupe = ({ titre, children }: {
  titre?: string; children: React.ReactNode
}) => (
  <section className="det-groupe">
    {!!titre && <h2>{titre}</h2>}
    <div className="det-carte">{children}</div>
  </section>
)

// Ligne a interrupteur. `cle` designe le reglage a basculer : la ligne
// lit et ecrit directement `reglages`, et le compteur passe par
// `onChange` pour forcer un nouveau rendu.
function LigneBascule({ nom, detail, cle, onChange }: {
  nom: string
  detail?: string
  cle: keyof Reglages
  onChange: () => void
}) {
  const actif = reglages[cle] === true
  return (
    <div className="det-ligne">
      <div className="det-ligne-texte">
        <span className="det-nom">{nom}</span>
        {!!detail && <span className="det-detail">{detail}</span>}
      </div>
      <Interrupteur actif={actif} libelle={nom} onChange={v => {
        (reglages as Record<string, unknown>)[cle] = v
        enregistrerReglages()
        onChange()
      }} />
    </div>
  )
}

// Ligne de navigation : libelle, valeur grise facultative, chevron.
const LigneNav = ({ nom, valeur, onClick }: {
  nom: string; valeur?: string; onClick: () => void
}) => (
  <button className="det-ligne" onClick={onClick}>
    <span className="det-nom">{nom}</span>
    {!!valeur && <span className="det-valeur">{valeur}</span>}
    <ChevronDroit taille={17} />
  </button>
)

// Ligne a choix unique : coche rose a droite du libelle retenu.
const LigneChoix = ({ nom, note, choisi, onClick }: {
  nom: string; note?: string; choisi: boolean; onClick: () => void
}) => (
  <button className="det-ligne" aria-pressed={choisi} onClick={onClick}>
    <span className="det-nom">{nom}</span>
    {!!note && <span className="det-valeur">{note}</span>}
    {choisi && <i className="det-coche"><CocheChoix taille={20} /></i>}
  </button>
)

// Note grise de bas d'ecran : c'est la qu'on dit ce que le reglage ne
// fait pas encore, plutot que de laisser croire le contraire.
const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="det-note">{children}</p>
)

// Confirmation destructive : remplace `Alert.alert` du mobile.
function Confirmation({ titre, texte, action, onConfirmer, onAnnuler }: {
  titre: string
  texte: string
  action: string
  onConfirmer: () => void
  onAnnuler: () => void
}) {
  return (
    <div className="det-voile">
      <div className="det-alerte" role="dialog" aria-label={titre}>
        <h2>{titre}</h2>
        <p>{texte}</p>
        <div className="det-alerte-boutons">
          <button onClick={onAnnuler}>Annuler</button>
          <button className="det-rouge" onClick={onConfirmer}>{action}</button>
        </div>
      </div>
    </div>
  )
}

// Compteur de rendu : les reglages vivent hors de React, il faut donc
// un etat local pour redessiner apres chaque bascule.
function useRafraichir() {
  const [, setTour] = useState(0)
  return () => setTour(n => n + 1)
}

// ------------------------------------------------------------
// 1. Notifications
// ------------------------------------------------------------

export function Notifications({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <div className="det-page">
      <Barre titre="Notifications" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Interactions">
          <LigneBascule nom="J'aime" cle="notifJaime" onChange={rafraichir} />
          <LigneBascule nom="Commentaires" cle="notifCommentaires" onChange={rafraichir} />
          <LigneBascule nom="Nouveaux abonnés" cle="notifAbonnes" onChange={rafraichir} />
          <LigneBascule nom="Mentions et identifications" cle="notifMentions"
            onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Contenu">
          <LigneBascule nom="Vidéos suggérées"
            detail="Les vidéos que nous pensons pouvoir te plaire"
            cle="notifSuggestions" onChange={rafraichir} />
          <LigneBascule nom="LIVE"
            detail="Quand un compte que tu suis commence un direct"
            cle="notifLive" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Messagerie">
          <LigneBascule nom="Messages directs" cle="notifMessages" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Application">
          <LigneBascule nom="Rappels d'application"
            detail="Un rappel quand tu n'as rien publié depuis plusieurs jours"
            cle="notifRappels" onChange={rafraichir} />
        </Groupe>

        <Note>
          Ces préférences valent pour les notifications envoyées par TockTick.
          Ton navigateur garde le dernier mot : s’il bloque les notifications
          du site, rien ne t’est envoyé.
        </Note>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 2. Compte
// ------------------------------------------------------------

// « +229 97 12 34 42 » devient « +229 •• •• •• 42 » : seuls le
// prefixe et les deux derniers chiffres restent lisibles.
function telephoneMasque(telephone: string | null | undefined) {
  if (!telephone) return 'Non renseigné'
  const chiffres = telephone.replace(/\D/g, '')
  if (chiffres.length < 4) return '•• •• •• ••'
  const fin = chiffres.slice(-2)
  const prefixe = chiffres.length > 8 ? `+${chiffres.slice(0, chiffres.length - 8)} ` : ''
  return `${prefixe}•• •• •• ${fin}`
}

export function Compte({ onRetour }: { onRetour: () => void }) {
  const { profil, deconnecter } = useAuth()
  const [demande, setDemande] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="det-page">
      <Barre titre="Compte" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Informations du compte">
          <div className="det-ligne">
            <Personne taille={21} />
            <div className="det-ligne-texte">
              <span className="det-nom">Nom d’utilisateur</span>
              {!!profil?.nom && <span className="det-detail">{profil.nom}</span>}
            </div>
            <span className="det-valeur">{profil?.pseudo || '—'}</span>
          </div>
          <div className="det-ligne">
            <Telephone taille={21} />
            <span className="det-nom">Numéro de téléphone</span>
            <span className="det-valeur">{telephoneMasque(profil?.telephone)}</span>
          </div>
          <button className="det-ligne" onClick={() => setMessage(
            'La modification du mot de passe passera par une confirmation '
            + 'envoyée à ton numéro. Cette étape n’est pas encore branchée.',
          )}>
            <Cle taille={21} />
            <span className="det-nom">Mot de passe</span>
            <span className="det-valeur">Modifier</span>
            <ChevronDroit taille={17} />
          </button>
        </Groupe>

        {!!profil?.bio && (
          <Groupe titre="Bio">
            <div className="det-ligne"><span className="det-nom">{profil.bio}</span></div>
          </Groupe>
        )}

        <Groupe>
          <button className="det-ligne" onClick={() => setDemande(true)}>
            <span className="det-nom det-nom-rouge">Supprimer le compte</span>
          </button>
        </Groupe>

        {!!message && <p className="det-annonce" role="status">{message}</p>}

        <Note>
          Le nom d’utilisateur et la bio se modifient depuis
          « Modifier le profil », sur ta page de profil.
        </Note>
      </div>

      {demande && (
        <Confirmation titre="Supprimer le compte" action="Supprimer"
          texte="Ton compte, tes publications et tes brouillons seront effacés.
            Cette action est définitive."
          onAnnuler={() => setDemande(false)}
          onConfirmer={() => {
            deconnecter().catch(() => { /* session deja fermee */ })
          }} />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// 3. Securite et autorisations
// ------------------------------------------------------------

export function Securite({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  const [appareils, setAppareils] = useState(false)

  if (appareils) {
    return (
      <div className="det-page">
        <Barre titre="Appareils connectés" sousTitre="1 appareil"
          onRetour={() => setAppareils(false)} />
        <div className="det-corps">
          <Groupe titre="Cet appareil">
            <div className="det-ligne">
              <Appareil taille={21} />
              <div className="det-ligne-texte">
                <span className="det-nom">Navigateur — session en cours</span>
                <span className="det-detail">Connecté maintenant</span>
              </div>
              <i className="det-pastille-verte" />
            </div>
          </Groupe>
          <Note>
            Aucune autre session n’est ouverte. Pour fermer celle-ci,
            utilise « Se déconnecter » au bas des paramètres.
          </Note>
        </div>
      </div>
    )
  }

  return (
    <div className="det-page">
      <Barre titre="Sécurité et autorisations" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Connexion">
          <LigneBascule nom="Authentification à deux facteurs"
            detail="Un code est demandé en plus du mot de passe"
            cle="doubleFacteur" onChange={rafraichir} />
          <LigneBascule nom="Alertes de connexion"
            detail="Être averti dès qu'un nouvel appareil se connecte"
            cle="alertesConnexion" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Appareils">
          <LigneNav nom="Appareils connectés" valeur="1"
            onClick={() => setAppareils(true)} />
        </Groupe>

        <Note>
          L’authentification à deux facteurs sera appliquée lors du
          branchement du service d’envoi de SMS. Le choix fait ici est
          déjà conservé.
        </Note>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 4. Langues
// ------------------------------------------------------------

const LANGUES: { cle: Reglages['langue']; nom: string; prete: boolean }[] = [
  { cle: 'fr', nom: 'Français', prete: true },
  { cle: 'fon', nom: 'Fon', prete: false },
  { cle: 'yo', nom: 'Yoruba', prete: false },
  { cle: 'en', nom: 'Anglais', prete: false },
]

export function Langues({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <div className="det-page">
      <Barre titre="Langues" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Langue de l'application">
          {LANGUES.map(l => (
            <LigneChoix key={l.cle} nom={l.nom}
              note={l.prete ? undefined : 'Bientôt'}
              choisi={reglages.langue === l.cle}
              onClick={() => {
                reglages.langue = l.cle
                enregistrerReglages()
                rafraichir()
              }} />
          ))}
        </Groupe>
        <Note>
          Seul le français est traduit pour l’instant : choisir une autre
          langue conserve ton choix, mais l’interface reste en français
          jusqu’à ce que la traduction soit disponible.
        </Note>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 5. Affichage
// ------------------------------------------------------------

const THEMES: { cle: Reglages['theme']; nom: string }[] = [
  { cle: 'clair', nom: 'Clair' },
  { cle: 'sombre', nom: 'Sombre' },
  { cle: 'systeme', nom: 'Système' },
]

const TAILLES: { cle: Reglages['tailleTexte']; nom: string }[] = [
  { cle: 'petit', nom: 'Petit' },
  { cle: 'normal', nom: 'Normal' },
  { cle: 'grand', nom: 'Grand' },
]

export function Affichage({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  const [taille, setTaille] = useState(false)

  if (taille) {
    return (
      <div className="det-page">
        <Barre titre="Taille du texte" onRetour={() => setTaille(false)} />
        <div className="det-corps">
          <Groupe>
            {TAILLES.map(t => (
              <LigneChoix key={t.cle} nom={t.nom}
                choisi={reglages.tailleTexte === t.cle}
                onClick={() => {
                  reglages.tailleTexte = t.cle
                  enregistrerReglages()
                  rafraichir()
                }} />
            ))}
          </Groupe>
          <Note>
            L’application est dessinée sur des tailles fixes pour que les
            écrans ne débordent pas : ce choix est conservé mais n’est pas
            encore appliqué aux textes.
          </Note>
        </div>
      </div>
    )
  }

  const nomTheme = THEMES.find(t => t.cle === reglages.theme)?.nom ?? 'Système'
  const nomTaille = TAILLES.find(t => t.cle === reglages.tailleTexte)?.nom ?? 'Normal'

  return (
    <div className="det-page">
      <Barre titre="Affichage" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Thème">
          {THEMES.map(t => (
            <LigneChoix key={t.cle} nom={t.nom}
              choisi={reglages.theme === t.cle}
              onClick={() => {
                reglages.theme = t.cle
                enregistrerReglages()
                rafraichir()
              }} />
          ))}
        </Groupe>

        <Groupe titre="Texte">
          <LigneNav nom="Taille du texte" valeur={nomTaille}
            onClick={() => setTaille(true)} />
        </Groupe>

        <Groupe titre="Mouvement">
          <LigneBascule nom="Réduire les animations"
            detail="Moins de transitions et de défilements animés"
            cle="animationsReduites" onChange={rafraichir} />
        </Groupe>

        <Note>
          Ton choix ({nomTheme}) est conservé, mais le thème n’est pas
          encore appliqué à l’ensemble de l’application : les écrans
          restent dessinés en clair. Le mode sombre viendra d’un seul
          coup, sur tous les écrans à la fois.
        </Note>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 6. Liberer de l'espace
// ------------------------------------------------------------

export function LibererEspace({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  // Le cache de lecture n'est pas mesurable depuis la page : on affiche
  // ce qu'on sait vraiment, c'est-a-dire le poids des brouillons, et on
  // laisse le vidage au navigateur.
  const [cacheVide, setCacheVide] = useState(false)
  const [demande, setDemande] = useState(false)

  const octets = etatDemo.brouillons.reduce((total, b) => total + (b.octets || 0), 0)
  const nb = etatDemo.brouillons.length

  return (
    <div className="det-page">
      <Barre titre="Libérer de l'espace" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Occupé par l'application">
          <div className="det-ligne">
            <div className="det-ligne-texte">
              <span className="det-nom">Brouillons</span>
              <span className="det-detail">
                {nb === 0 ? 'Aucun brouillon'
                  : `${nb} brouillon${nb > 1 ? 's' : ''} enregistré${nb > 1 ? 's' : ''}`}
              </span>
            </div>
            <span className="det-poids">{poidsLisible(octets)}</span>
            <button className={`det-vider${nb === 0 ? ' det-vider-inactif' : ''}`}
              disabled={nb === 0} onClick={() => setDemande(true)}>Vider</button>
          </div>

          <div className="det-ligne">
            <div className="det-ligne-texte">
              <span className="det-nom">Cache</span>
              <span className="det-detail">
                {cacheVide
                  ? 'Vidé : les vidéos seront rechargées'
                  : 'Vidéos et images gardées pour la lecture'}
              </span>
            </div>
            <button className={`det-vider${cacheVide ? ' det-vider-inactif' : ''}`}
              disabled={cacheVide} onClick={() => setCacheVide(true)}>Vider</button>
          </div>
        </Groupe>

        <Note>
          Le poids des brouillons est celui de leurs fichiers vidéo. Le cache
          de lecture est géré par le navigateur : le vider ici demande
          simplement à l’application de recharger les vidéos, sa taille
          exacte ne nous est pas communiquée.
        </Note>
      </div>

      {demande && (
        <Confirmation titre="Vider les brouillons" action="Vider"
          texte={`${nb} brouillon${nb > 1 ? 's' : ''} ${nb > 1 ? 'seront' : 'sera'} supprimé${nb > 1 ? 's' : ''} définitivement.`}
          onAnnuler={() => setDemande(false)}
          onConfirmer={() => {
            etatDemo.brouillons = []
            setDemande(false)
            rafraichir()
          }} />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// 7. Economiseur de donnees
// ------------------------------------------------------------

export function EconomiseurDonnees({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <div className="det-page">
      <Barre titre="Économiseur de données" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe>
          <LigneBascule nom="Économiseur de données" cle="economieDonnees"
            onChange={rafraichir} />
        </Groupe>
        <p className="det-paragraphe">
          Avec l’économiseur de données, les vidéos sont chargées dans une
          qualité plus basse et ne sont plus préchargées à l’avance. Les
          images sont plus légères, et le téléchargement automatique est
          suspendu hors Wi-Fi. C’est utile sur un forfait limité ou
          quand le réseau est lent.
        </p>
        <Groupe titre="Téléchargements">
          <LigneBascule nom="Télécharger seulement en Wi-Fi"
            cle="telechargementWifi" onChange={rafraichir} />
        </Groupe>
        <Note>
          Le réglage est conservé. La baisse de qualité suivra le branchement
          du lecteur sur plusieurs définitions de la même vidéo.
        </Note>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 8. Sections informatives
//
// Un titre, un paragraphe honnete, et des interrupteurs quand la
// section en comporte de vrais. Aucune donnee inventee.
// ------------------------------------------------------------

export function SectionInformative({ info, onRetour }: {
  info: SectionInfo; onRetour: () => void
}) {
  const rafraichir = useRafraichir()
  return (
    <div className="det-page">
      <Barre titre={info.titre} onRetour={onRetour} />
      <div className="det-corps">
        <p className="det-paragraphe">{info.paragraphe}</p>
        {!!info.bascules?.length && (
          <Groupe titre={info.groupe}>
            {info.bascules.map(b => (
              <LigneBascule key={String(b.cle) + b.nom} nom={b.nom}
                detail={b.detail} cle={b.cle} onChange={rafraichir} />
            ))}
          </Groupe>
        )}
        {!!info.note && <Note>{info.note}</Note>}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// 9. Partager le profil
// ------------------------------------------------------------

// Lien public du profil. Le domaine est celui de l'application, meme si
// la page web n'existe pas encore : c'est l'adresse qui sera servie.
const lienProfil = (pseudo: string) => `https://tok229.bj/@${pseudo}`

export function PartagerProfil({ pseudo, onRetour }: {
  pseudo: string; onRetour: () => void
}) {
  const [message, setMessage] = useState('')
  const lien = lienProfil(pseudo)

  // Le partage natif n'existe pas partout sur le web : le presse-papiers
  // sert de repli, et sans lui on le dit franchement.
  const partager = async () => {
    const texte = `Retrouve @${pseudo} sur TockTick\n${lien}`
    if (navigator.share) {
      try { await navigator.share({ text: texte }) } catch { /* partage annule */ }
      return
    }
    await copier(texte)
  }

  const copier = async (texte: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(texte)
        setMessage('Lien copié dans le presse-papiers.')
        return
      } catch { /* presse-papiers refuse : on le signale ci-dessous */ }
    }
    setMessage('Ce navigateur ne permet ni le partage ni la copie.')
  }

  return (
    <div className="det-page">
      <Barre titre="Partager le profil" onRetour={onRetour} />
      <div className="det-corps">
        <Groupe titre="Ton lien public">
          <div className="det-ligne">
            <span className="det-lien">{lien}</span>
          </div>
        </Groupe>

        <Groupe>
          <button className="det-ligne" onClick={() => void partager()}>
            <Partage taille={21} />
            <span className="det-nom">Partager le lien</span>
            <ChevronDroit taille={17} />
          </button>
          <button className="det-ligne" onClick={() => void copier(lien)}>
            <Maillon taille={21} />
            <span className="det-nom">Copier le lien</span>
            <ChevronDroit taille={17} />
          </button>
        </Groupe>

        {!!message && <p className="det-annonce" role="status">{message}</p>}

        <Note>
          La page publique du profil n’est pas encore servie : le lien est
          déjà celui qui sera utilisé, il ne s’ouvre pas pour l’instant.
        </Note>
      </div>
    </div>
  )
}
