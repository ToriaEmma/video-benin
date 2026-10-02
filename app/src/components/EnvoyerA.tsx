// ============================================================
// Feuille « Envoyer à » : destinataires, applications de partage,
// puis les actions sur la publication.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import {
  Loupe, FeuilleCroix, Maillon, Telecharger, Statistiques, Flamme,
  Diffuser, Epingle, Groupe, Duo, Collage, StickerPlus, Vitesse,
  SousTitres, Crayon2, CadenasPlein, PhotoAnimee, EtiquetteGif,
  Portefeuille, MotsCles, AjoutStory, Corbeille,
  LogoWhatsApp, LogoSMS, LogoTelegram,
  Republier, Drapeau, AppliEphemere, Megaphone,
} from './Icones'
import { comptesDemo } from '../lib/demo'
import './envoyer-a.css'

type Glyphe = ({ taille }: { taille?: number }) => React.ReactElement
type Action = { cle: string; nom: string; Icone: Glyphe }
// Une application porte soit un logo de marque entier, soit une icone
// posee sur une pastille coloree.
type Application = { cle: string; nom: string } & (
  { Logo: Glyphe; fond?: undefined; Icone?: undefined }
  | { Logo?: undefined; fond: string; Icone: Glyphe })

// Deuxieme rangee : le lien et les applications externes.
const APPLICATIONS: Application[] = [
  { cle: 'lien', nom: 'Copier le lien', fond: '#3b7df6', Icone: Maillon },
  { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp },
  { cle: 'status', nom: 'Status', Logo: LogoSMS },
  { cle: 'telegram', nom: 'Telegram', Logo: LogoTelegram },
]

// Memes applications, precedees de « Republier » sur la publication
// d'autrui : on relaie le contenu plutot que de le gerer.
const APPLICATIONS_AUTRUI: Application[] = [
  { cle: 'republier', nom: 'Republier', fond: '#efc02c', Icone: Republier },
  { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp },
  { cle: 'lien', nom: 'Copier le lien', fond: '#3b7df6', Icone: Maillon },
  { cle: 'status', nom: 'Status', Logo: LogoSMS },
  { cle: 'ephemere', nom: 'Messages éphémères', Logo: AppliEphemere },
  { cle: 'telegram', nom: 'Telegram', Logo: LogoTelegram },
]

// Actions offertes sur la publication de quelqu'un d'autre : ni
// statistiques ni suppression, mais le signalement et la reprise.
const ACTIONS_AUTRUI: Action[] = [
  { cle: 'signaler', nom: 'Signaler', Icone: Drapeau },
  { cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger },
  { cle: 'story', nom: 'Ajouter à la Story', Icone: AjoutStory },
  { cle: 'promouvoir', nom: 'Promouvoir', Icone: Megaphone },
  { cle: 'duo', nom: 'Duo', Icone: Duo },
  { cle: 'collage', nom: 'Collage', Icone: Collage },
  { cle: 'groupe', nom: 'Créer un groupe', Icone: Groupe },
  { cle: 'animee', nom: 'Photo animée', Icone: PhotoAnimee },
  { cle: 'sticker', nom: 'Créer un sticker', Icone: StickerPlus },
  { cle: 'gif', nom: 'Partager en tant que GIF', Icone: EtiquetteGif },
]

// Troisieme rangee : les actions sur sa propre publication.
const ACTIONS: Action[] = [
  { cle: 'stats', nom: 'Données analytiques', Icone: Statistiques },
  { cle: 'telecharger', nom: 'Télécharger', Icone: Telecharger },
  { cle: 'booster', nom: 'Augmenter le nombre de…', Icone: Flamme },
  { cle: 'diffuser', nom: 'Diffuser', Icone: Diffuser },
  { cle: 'epingler', nom: 'Épingler', Icone: Epingle },
  { cle: 'groupe', nom: 'Créer un groupe', Icone: Groupe },
  { cle: 'duo', nom: 'Duo', Icone: Duo },
  { cle: 'collage', nom: 'Collage', Icone: Collage },
  { cle: 'sticker', nom: 'Créer un sticker', Icone: StickerPlus },
  { cle: 'vitesse', nom: 'Vitesse de lecture', Icone: Vitesse },
  { cle: 'legendes', nom: 'Modifier les légendes', Icone: SousTitres },
  { cle: 'modifier', nom: 'Modifier la publication', Icone: Crayon2 },
  { cle: 'confidentialite', nom: 'Paramètres de confiden…', Icone: CadenasPlein },
  { cle: 'animee', nom: 'Photo animée', Icone: PhotoAnimee },
  { cle: 'gif', nom: 'Partager en tant que GIF', Icone: EtiquetteGif },
  { cle: 'pub', nom: 'Paramètres publicitaires', Icone: Portefeuille },
  { cle: 'supprimer', nom: 'Supprimer', Icone: Corbeille },
  { cle: 'motscles', nom: 'Gérer les mots-clés', Icone: MotsCles },
  { cle: 'story', nom: 'Ajouter à la Story', Icone: AjoutStory },
]

// Cles qui passent par le partage du navigateur plutot que par un
// message « disponible prochainement ».
const PARTAGEABLES = ['lien', 'whatsapp', 'status', 'telegram', 'ephemere', 'republier']

export default function EnvoyerA({
  legende, onFermer, onSupprimer, onAnalytiques, sienne = true, auteur,
}: {
  // Legende relayee au partage systeme.
  legende: string
  onFermer: () => void
  onSupprimer?: () => void
  // « Données analytiques » : ouvre l'ecran d'analyse video.
  onAnalytiques?: () => void
  // Faux sur la publication de quelqu'un d'autre : la feuille propose
  // alors de relayer et de signaler plutot que de gerer.
  sienne?: boolean
  // Pseudo de l'auteur, pour la premiere vignette « Répondre à ».
  auteur?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const node = ref.current!
    node.showModal()
    return () => node.close()
  }, [])

  const annoncer = (texte: string) => {
    setMessage(texte)
    setTimeout(() => setMessage(''), 2600)
  }

  // Le partage natif n'existe pas partout sur le web : le presse-papiers
  // sert de repli, et sans lui on le dit franchement.
  const partager = async () => {
    const texte = `${legende}\n\nRegarde cette vidéo sur Tok 229`
    if (navigator.share) {
      try { await navigator.share({ text: texte }) } catch { /* Partage annule. */ }
      return
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(texte)
        annoncer('Lien copié dans le presse-papiers.')
        return
      } catch { /* Presse-papiers refuse : on le signale ci-dessous. */ }
    }
    annoncer('Ce navigateur ne permet ni le partage ni la copie.')
  }

  const agir = (cle: string, nom: string) => {
    if (PARTAGEABLES.includes(cle)) { void partager(); return }
    if (cle === 'supprimer') { onFermer(); onSupprimer?.(); return }
    if (cle === 'stats' && onAnalytiques) { onFermer(); onAnalytiques(); return }
    annoncer(`${nom} : disponible prochainement.`)
  }

  return (
    <dialog ref={ref} className="eva-dialog" onCancel={onFermer}>
      <button className="eva-voile" aria-label="Fermer" onClick={onFermer} />
      <section className="eva-feuille">
        <header className="eva-entete">
          <button aria-label="Rechercher un destinataire"><Loupe taille={23} /></button>
          <h2>Envoyer à</h2>
          <button className="eva-croix" aria-label="Fermer" onClick={onFermer}>
            <FeuilleCroix taille={17} />
          </button>
        </header>

        {/* Destinataires */}
        <div className="eva-bande">
          {!sienne && !!auteur && (
            <button className="eva-case" onClick={() => void partager()}>
              <span className="eva-avatar eva-avatar-reponse">
                {auteur.charAt(0).toUpperCase()}
              </span>
              <span className="eva-nom">Répondre à {auteur}</span>
            </button>
          )}

          {comptesDemo.map(c => (
            <button className="eva-case" key={c.id} onClick={() => void partager()}>
              <span className="eva-avatar">{c.pseudo.charAt(0).toUpperCase()}</span>
              <span className="eva-nom eva-nom-court">{c.pseudo}</span>
            </button>
          ))}
        </div>

        <i className="eva-trait" />

        {/* Applications de partage */}
        <div className="eva-bande">
          {(sienne ? APPLICATIONS : APPLICATIONS_AUTRUI).map(a => (
            <button className="eva-case" key={a.cle} onClick={() => agir(a.cle, a.nom)}>
              {a.Logo
                ? <a.Logo taille={52} />
                : <span className="eva-pastille" style={{ background: a.fond }}>
                    <a.Icone taille={24} />
                  </span>}
              <span className="eva-nom">{a.nom}</span>
            </button>
          ))}
        </div>

        {/* Actions sur la publication */}
        <div className="eva-bande">
          {(sienne ? ACTIONS : ACTIONS_AUTRUI).map(a => (
            <button className="eva-case" key={a.cle} onClick={() => agir(a.cle, a.nom)}>
              <span className="eva-pastille eva-pastille-grise">
                <a.Icone taille={22} />
              </span>
              <span className="eva-nom">{a.nom}</span>
            </button>
          ))}
        </div>

        {!!message && <p className="eva-message" role="status">{message}</p>}
      </section>
    </dialog>
  )
}
