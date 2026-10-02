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
  NouveauGroupe, Eclair, BulleDemande, Flamme, ChevronDroit,
} from '../components/Icones'
import {
  etatDemo, dateRelative, dernierMessage, conversationsTriees,
  demandesMessages, type Conversation, type Message,
} from '../lib/demo'
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

// Apercu d'une conversation, partage par la boite et par les demandes.
function Ligne({ conversation, onOuvrir }: {
  conversation: Conversation
  onOuvrir: () => void
}) {
  const dernier = dernierMessage(conversation)

  return (
    <button className="msg-ligne" onClick={onOuvrir}>
      {conversation.systeme
        ? <span className="msg-service"><Eclair taille={24} /></span>
        : <Avatar pseudo={conversation.pseudo} taille={52} />}

      <span className="msg-ligne-corps">
        <span className="msg-ligne-pseudo">
          {conversation.pseudo}
          {!!conversation.flamme && (
            <span className="msg-flamme">
              <Flamme taille={12} />{conversation.flamme}
            </span>
          )}
        </span>
        <span className={dernier && conversation.nonLus > 0
          ? 'msg-apercu msg-apercu-nonlu' : 'msg-apercu'}>
          {dernier
            ? `${dernier.moi ? 'Vous : ' : ''}${dernier.texte}`
            : conversation.invite ?? 'Nouvelle conversation'}
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
  conversation: Conversation
  onRetour: () => void
}) {
  const [texte, setTexte] = useState('')
  // Copie locale, du plus ancien au plus recent. L'etat partage reste la
  // source : cette copie ne sert qu'a redessiner le fil apres un envoi.
  const [messages, setMessages] = useState<Message[]>(() => [...conversation.messages])
  const bas = useRef<HTMLDivElement>(null)

  // Le fil s'ouvre et reste cale sur son dernier message, comme la liste
  // renversee de la version mobile.
  useEffect(() => {
    bas.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const envoyer = () => {
    const contenu = texte.trim()
    if (!contenu) return
    const message: Message = {
      id: `m${Date.now()}`, texte: contenu, moi: true, date: Date.now(),
    }
    conversation.messages.push(message)
    setMessages(l => [...l, message])
    setTexte('')
  }

  return (
    <section className="msg-page msg-fil-page">
      <header className="msg-barre-fil">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <Avatar pseudo={conversation.pseudo} taille={34} />
        <h1>{conversation.pseudo}</h1>
      </header>

      <div className="msg-fil">
        {messages.map(m => (
          <div key={m.id} className={m.moi ? 'msg-rang msg-rang-moi' : 'msg-rang'}>
            <p className={m.moi ? 'msg-bulle msg-bulle-moi' : 'msg-bulle'}>
              {m.texte}
            </p>
          </div>
        ))}
        <div ref={bas} />
      </div>

      <form className="msg-redaction" onSubmit={e => { e.preventDefault(); envoyer() }}>
        <textarea rows={1} maxLength={1000} placeholder="Envoyer un message…"
          value={texte} aria-label="Message"
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
          }} />
        <button type="submit" aria-label="Envoyer" disabled={!texte.trim()}>
          <EnvoiMessage taille={20} />
        </button>
      </form>
    </section>
  )
}

// ------------------------------------------------------------
// Demandes de messages
// ------------------------------------------------------------

function Demandes({ onRetour, onOuvrir }: {
  onRetour: () => void
  onOuvrir: (c: Conversation) => void
}) {
  const liste = demandesMessages()

  return (
    <section className="msg-page">
      <header className="msg-barre-fil">
        <button aria-label="Retour" onClick={onRetour}><Chevron taille={24} /></button>
        <h1>Demandes de messages</h1>
      </header>

      <div className="msg-liste">
        {liste.length === 0
          ? <p className="msg-vide-texte">Aucune demande en attente.</p>
          : liste.map(c => (
            <Ligne key={c.id} conversation={c} onOuvrir={() => onOuvrir(c)} />
          ))}
      </div>
    </section>
  )
}

// ------------------------------------------------------------
// Liste des conversations
// ------------------------------------------------------------

export default function Messages() {
  const { profil } = useAuth()
  // Conversation ouverte. Null = on est sur la boite de reception.
  const [ouverte, setOuverte] = useState<Conversation | null>(null)
  // Un compte de service mene a « Notifications système » plutot qu'a
  // un fil de discussion, comme sur mobile.
  const [notifications, setNotifications] = useState(false)
  const [demandes, setDemandes] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [chercher, setChercher] = useState(false)
  // Incremente au retour d'un fil : la liste reprend alors le dernier
  // message et la pastille de non-lus a jour.
  const [, setRevision] = useState(0)

  const terme = recherche.trim().toLowerCase()
  const conversations = conversationsTriees().filter(c => !terme
    || c.pseudo.toLowerCase().includes(terme)
    || (dernierMessage(c)?.texte.toLowerCase().includes(terme) ?? false))

  const enAttente = demandesMessages()
  const nonLusDemandes = enAttente.reduce((t, c) => t + c.nonLus, 0)

  const ouvrir = (c: Conversation) => {
    // Ouvrir la conversation vaut lecture : la pastille disparait.
    c.nonLus = 0
    if (c.systeme) { setNotifications(true); setRevision(n => n + 1); return }
    setOuverte(c)
  }

  const revenir = () => {
    setOuverte(null); setNotifications(false); setDemandes(false)
    setRevision(n => n + 1)
  }

  if (notifications) return <Notifications onRetour={revenir} />
  if (ouverte) return <Fil conversation={ouverte} onRetour={revenir} />
  if (demandes) return <Demandes onRetour={revenir} onOuvrir={ouvrir} />

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
        {enAttente.length > 0 && !terme && (
          <button className="msg-ligne" onClick={() => setDemandes(true)}>
            <span className="msg-service msg-service-bleu"><BulleDemande taille={24} /></span>
            <span className="msg-ligne-corps">
              <span className="msg-ligne-pseudo">Demandes de messages</span>
              <span className="msg-apercu">
                {enAttente.length} compte{enAttente.length > 1 ? 's' : ''} en attente
              </span>
            </span>
            <span className="msg-ligne-fin">
              {nonLusDemandes > 0 && <i className="msg-nonlu" />}
              <ChevronDroit taille={18} />
            </span>
          </button>
        )}

        {conversations.length === 0 ? (
          <div className="msg-vide">
            <IconeMessages taille={44} />
            <h2>{terme ? 'Aucun résultat' : 'Aucun message'}</h2>
            <p>{terme
              ? 'Essayez un autre pseudo ou un autre mot.'
              : 'Vos conversations apparaîtront ici.'}</p>
          </div>
        ) : conversations.map(c => (
          <Ligne key={c.id} conversation={c} onOuvrir={() => ouvrir(c)} />
        ))}
      </div>
    </section>
  )
}
