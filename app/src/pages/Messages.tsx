// ============================================================
// Boite de reception : la liste des conversations, puis le fil
// d'une conversation ouverte par-dessus.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import BandeStories from '../components/BandeStories'
import Notifications from './Notifications'
import { useAuth } from '../lib/auth'
import {
  Loupe, Chevron, EnvoiMessage, Messages as IconeMessages,
  NouveauGroupe, Eclair, ChevronDroit,
} from '../components/Icones'
import { etatDemo, dateRelative } from '../lib/demo'
import {
  apiMessagerie, type ApercuConversation, type MessageApi,
} from '../lib/api'
import './messages.css'

// Teintes des avatars, piochees d'apres le pseudo : deux comptes differents
// gardent ainsi la meme couleur d'un ecran a l'autre.
const TEINTES = ['#6f5bd4', '#ff2856', '#16cce0', '#e8820c', '#1aa260', '#c43cc0']

const teinteAvatar = (pseudo: string) => {
  let somme = 0
  for (let i = 0; i < pseudo.length; i++) somme += pseudo.charCodeAt(i)
  return TEINTES[somme % TEINTES.length]
}

function Avatar({ pseudo, taille }: { pseudo: string; taille: number }) {
  return (
    <span className="msg-avatar" style={{
      width: taille, height: taille, background: teinteAvatar(pseudo),
      fontSize: taille * .4,
    }}>
      {pseudo.charAt(0).toUpperCase()}
    </span>
  )
}

// Apercu d'une conversation de la boite de reception.
function Ligne({ conversation, onOuvrir }: {
  conversation: ApercuConversation
  onOuvrir: () => void
}) {
  const dernier = conversation.dernierMessage
  // Une conversation ouverte depuis un profil n'a pas encore de pseudo si
  // l'autre participant a supprime son compte.
  const pseudo = conversation.pseudo ?? 'compte supprimé'

  return (
    <button className="msg-ligne" onClick={onOuvrir}>
      <Avatar pseudo={pseudo} taille={52} />

      <span className="msg-ligne-corps">
        <span className="msg-ligne-pseudo">{pseudo}</span>
        <span className={dernier && conversation.nonLus > 0
          ? 'msg-apercu msg-apercu-nonlu' : 'msg-apercu'}>
          {dernier
            ? `${dernier.moi ? 'Vous : ' : ''}${dernier.texte}`
            : `Dis bonjour à ${pseudo}`}
        </span>
      </span>

      <span className="msg-ligne-fin">
        {!!dernier && <span className="msg-heure">{dateRelative(dernier.date)}</span>}
        {conversation.nonLus > 0 && <i className="msg-nonlu" />}
      </span>
    </button>
  )
}

// ------------------------------------------------------------
// Fil d'une conversation
// ------------------------------------------------------------

function Fil({ conversation, onRetour }: {
  conversation: ApercuConversation
  onRetour: () => void
}) {
  const [texte, setTexte] = useState('')
  const [messages, setMessages] = useState<MessageApi[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [reprise, setReprise] = useState(0)
  const bas = useRef<HTMLDivElement>(null)
  const pseudo = conversation.pseudo ?? 'compte supprimé'

  useEffect(() => {
    let valable = true
    setChargement(true)
    setErreur('')
    apiMessagerie.messages(conversation.id)
      .then(m => { if (valable) setMessages(m) })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [conversation.id, reprise])

  // Ouvrir le fil vaut lecture : la pastille de non-lus disparait cote
  // serveur. L'echec est sans consequence visible, on l'ignore.
  useEffect(() => {
    apiMessagerie.marquerLu(conversation.id)
      .catch(() => { /* La pastille se rattrapera au prochain chargement. */ })
  }, [conversation.id])

  // Le fil s'ouvre et reste cale sur son dernier message, comme la liste
  // renversee de la version mobile.
  useEffect(() => {
    bas.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || envoi) return
    setEnvoi(true)
    setErreur('')
    try {
      const cree = await apiMessagerie.envoyer(conversation.id, contenu)
      setMessages(l => [...l, cree])
      setTexte('')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Envoi impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <section className="msg-page msg-fil-page">
      <header className="msg-barre-fil">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <Avatar pseudo={pseudo} taille={34} />
        <h1>{pseudo}</h1>
      </header>

      <div className="msg-fil">
        {chargement ? (
          <p className="msg-vide-texte">Chargement…</p>
        ) : erreur && messages.length === 0 ? (
          <div className="msg-echec">
            <p role="alert">{erreur}</p>
            <button onClick={() => setReprise(n => n + 1)}>Réessayer</button>
          </div>
        ) : messages.length === 0 ? (
          <p className="msg-vide-texte">Dis bonjour à {pseudo}</p>
        ) : messages.map(m => (
          <div key={m.id} className={m.moi ? 'msg-rang msg-rang-moi' : 'msg-rang'}>
            <p className={m.moi ? 'msg-bulle msg-bulle-moi' : 'msg-bulle'}>
              {m.texte}
            </p>
          </div>
        ))}
        <div ref={bas} />
      </div>

      {/* Un envoi refuse se signale sans effacer la saisie : le texte
          reste dans le champ pour etre retente. */}
      {!!erreur && messages.length > 0 && (
        <p className="msg-erreur-envoi" role="alert">{erreur}</p>
      )}

      <form className="msg-redaction" onSubmit={e => { e.preventDefault(); envoyer() }}>
        <textarea rows={1} maxLength={1000} placeholder="Envoyer un message…"
          value={texte} aria-label="Message"
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
          }} />
        <button type="submit" aria-label="Envoyer" disabled={!texte.trim() || envoi}>
          <EnvoiMessage taille={20} />
        </button>
      </form>
    </section>
  )
}

// ------------------------------------------------------------
// Liste des conversations
// ------------------------------------------------------------

export default function Messages() {
  const { profil } = useAuth()
  // Conversation ouverte. Null = on est sur la boite de reception.
  const [ouverte, setOuverte] = useState<ApercuConversation | null>(null)
  // Les notifications systeme restent un ecran local : l'API n'en diffuse
  // de notifications, la rangee de service y mene quand meme.
  const [notifications, setNotifications] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [chercher, setChercher] = useState(false)
  const [liste, setListe] = useState<ApercuConversation[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Incremente au retour d'un fil : la liste reprend alors le dernier
  // message et la pastille de non-lus a jour.
  const [reprise, setReprise] = useState(0)

  useEffect(() => {
    let valable = true
    setChargement(true)
    setErreur('')
    apiMessagerie.conversations()
      .then(c => { if (valable) setListe(c) })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [reprise])

  const terme = recherche.trim().toLowerCase()
  const conversations = liste.filter(c => !terme
    || (c.pseudo?.toLowerCase().includes(terme) ?? false)
    || (c.dernierMessage?.texte.toLowerCase().includes(terme) ?? false))

  const revenir = () => {
    setOuverte(null); setNotifications(false)
    setReprise(n => n + 1)
  }

  if (notifications) return <Notifications onRetour={revenir} />
  if (ouverte) return <Fil conversation={ouverte} onRetour={revenir} />

  return (
    <section className="msg-page">
      <header className="msg-barre">
        <button aria-label="Créer un groupe"><NouveauGroupe taille={25} /></button>
        <h1>Messages</h1>
        <button aria-label="Rechercher" onClick={() => {
          setChercher(v => !v)
          if (chercher) setRecherche('')
        }}><Loupe taille={24} /></button>
      </header>

      {chercher && (
        <div className="msg-recherche">
          <Loupe taille={17} />
          <input placeholder="Rechercher" value={recherche} autoFocus
            aria-label="Rechercher une conversation"
            onChange={e => setRecherche(e.target.value)} />
        </div>
      )}

      <BandeStories pseudo={profil?.pseudo ?? 'moi'} stories={etatDemo.stories} clair />

      <div className="msg-liste">
        {/* Rangee de service : elle ouvre les notifications de
            l'application, qui restent locales a l'ecran. */}
        {!terme && (
          <button className="msg-ligne" onClick={() => setNotifications(true)}>
            <span className="msg-service"><Eclair taille={24} /></span>
            <span className="msg-ligne-corps">
              <span className="msg-ligne-pseudo">Notifications système</span>
              <span className="msg-apercu">Activités et mises à jour de TockTick</span>
            </span>
            <span className="msg-ligne-fin"><ChevronDroit taille={18} /></span>
          </button>
        )}

        {chargement ? (
          <p className="msg-vide-texte">Chargement…</p>
        ) : erreur ? (
          <div className="msg-echec">
            <p role="alert">{erreur}</p>
            <button onClick={() => setReprise(n => n + 1)}>Réessayer</button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="msg-vide">
            <IconeMessages taille={44} />
            <h2>{terme ? 'Aucun résultat' : 'Aucun message'}</h2>
            <p>{terme
              ? 'Essayez un autre pseudo ou un autre mot.'
              : 'Vos conversations apparaîtront ici.'}</p>
          </div>
        ) : conversations.map(c => (
          <Ligne key={c.id} conversation={c} onOuvrir={() => setOuverte(c)} />
        ))}
      </div>
    </section>
  )
}
