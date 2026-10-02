import { useCallback, useEffect, useState } from 'react'
import {
  apiBrouillons, apiInteractions, apiMessagerie, apiVideos,
  type BrouillonApi, type ProfilDetaille, type VideoApi,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { poidsLisible } from '../lib/demo'
import {
  Chevron, Cloche, Fleche, Crayon, Menu, AjoutPersonne,
  Grille, Cadenas, Coeur, Repartage, Studio, Lecture,
  Plus, Brouillon,
} from '../components/Icones'
import './profil.css'
import MenuProfil from '../components/MenuProfil'
import Parametres from './Parametres'
import ComptesProfil from '../components/ComptesProfil'
import ListeComptes, { type SensListe } from '../components/ListeComptes'
import ModifierProfil from './ModifierProfil'
import Solde from './Solde'

type Props = {
  // Sans pseudoVisite, on affiche le profil du compte connecte. Avec, on
  // affiche celui d'un autre : les deux ecrans different par leur barre
  // superieure, leurs boutons d'action et leurs onglets.
  pseudoVisite?: string
  onRetour?: () => void
  // Message affiche brievement en arrivant, apres un enregistrement.
  messageArrivee?: string
  // Ouvre la page qui liste les brouillons.
  onBrouillons?: () => void
  // Ouvre le profil d'un compte touche dans les listes d'abonnement.
  onVisiter?: (pseudo: string) => void
}

const abreger = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M`
  : n >= 1_000 ? `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} K`
  : String(n)

export default function Profil({
  pseudoVisite, onRetour, messageArrivee, onBrouillons, onVisiter,
}: Props) {
  const { profil, deconnecter } = useAuth()
  const monProfil = !pseudoVisite || pseudoVisite === profil?.pseudo

  // Le bandeau gris « Brouillon enregistré » s'efface au bout de 2 secondes.
  const [efface, setEfface] = useState(false)
  useEffect(() => {
    if (!messageArrivee) return
    const minuterie = setTimeout(() => setEfface(true), 2000)
    return () => clearTimeout(minuterie)
  }, [messageArrivee])
  const message = efface ? undefined : messageArrivee

  const [videos, setVideos] = useState<VideoApi[]>([])
  const [entete, setEntete] = useState<ProfilDetaille | null>(null)
  const [suivi, setSuivi] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  // Incremente par le bouton de reprise : relance le chargement de l'entete et
  // de la grille.
  const [reprise, setReprise] = useState(0)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [edition, setEdition] = useState(false)
  const [soldeOuvert, setSoldeOuvert] = useState(false)
  const [parametresOuverts, setParametresOuverts] = useState(false)
  const [comptesOuverts, setComptesOuverts] = useState(false)
  // Panneau ouvert par les compteurs « Suivis » et « Followers ».
  const [listeOuverte, setListeOuverte] = useState<SensListe | null>(null)
  const [onglet, setOnglet] = useState<'videos' | 'privees' | 'repartages' | 'favoris' | 'aimees'>('videos')
  useEffect(() => { setOnglet('videos') }, [pseudoVisite])

  const pseudo = monProfil ? profil?.pseudo ?? '' : pseudoVisite ?? ''
  // La bio de l'entete fait foi : c'est celle que le serveur renvoie, pour
  // son propre compte comme pour celui qu'on visite.
  const bio = entete?.bio ?? (monProfil ? profil?.bio ?? '' : '')
  const nbSuivis = entete?.nbSuivis ?? 0
  const nbAbonnes = entete?.nbAbonnes ?? 0

  // Les compteurs et la relation d'abonnement viennent de la meme route :
  // un seul aller-retour sert l'entete entiere.
  useEffect(() => {
    if (!pseudo) return
    let valable = true
    setChargement(true)
    setErreur('')
    Promise.all([apiInteractions.profil(pseudo), apiVideos.duProfil(pseudo)])
      .then(([p, v]) => {
        if (!valable) return
        setEntete(p)
        setSuivi(p.suivi)
        setVideos(v)
      })
      .catch((e: Error) => { if (valable) setErreur(e.message) })
      .finally(() => { if (valable) setChargement(false) })
    return () => { valable = false }
  }, [pseudo, reprise])

  // Favoris et « J'aime » ne concernent que son propre compte : ce sont des
  // listes personnelles, le serveur les refuse pour un autre profil.
  const [listeOnglet, setListeOnglet] = useState<VideoApi[]>([])
  const [chargementOnglet, setChargementOnglet] = useState(false)
  const [erreurOnglet, setErreurOnglet] = useState('')
  const [repriseOnglet, setRepriseOnglet] = useState(0)

  useEffect(() => {
    if (!monProfil || (onglet !== 'favoris' && onglet !== 'aimees')) return
    let valable = true
    setChargementOnglet(true)
    setErreurOnglet('')
    const demande = onglet === 'favoris'
      ? apiInteractions.favoris()
      : apiInteractions.jaimees()
    demande
      .then(v => { if (valable) setListeOnglet(v) })
      .catch((e: Error) => { if (valable) setErreurOnglet(e.message) })
      .finally(() => { if (valable) setChargementOnglet(false) })
    return () => { valable = false }
  }, [monProfil, onglet, repriseOnglet])

  // Les brouillons sont prives : on ne les demande que sur son profil.
  const [brouillons, setBrouillons] = useState<BrouillonApi[]>([])
  useEffect(() => {
    if (!monProfil || onglet !== 'videos') return
    let valable = true
    apiBrouillons.liste()
      .then(b => { if (valable) setBrouillons(b) })
      .catch(() => { /* Brouillons indisponibles : la tuile reste absente. */ })
    return () => { valable = false }
  }, [monProfil, onglet, reprise])

  // L'onglet « videos » de son propre profil est le seul a montrer la
  // tuile des brouillons, en tete de grille.
  const tuileBrouillons = monProfil && onglet === 'videos' ? brouillons : []
  const poidsBrouillons = tuileBrouillons.reduce((t, b) => t + b.octets, 0)

  // Le total des j'aime recus se somme sur les publications affichees : le
  // serveur ne renvoie pas d'agregat par compte.
  const nbAime = videos.reduce((t, v) => t + v.nbAime, 0)

  // Contenu de la grille selon l'onglet. L'onglet prive filtre la liste deja
  // chargee, les deux listes personnelles ont leur propre route.
  const grille = onglet === 'privees'
    ? videos.filter(v => v.visibilite === 'moi')
    : onglet === 'favoris' || onglet === 'aimees' ? listeOnglet
    : onglet === 'repartages' ? []
    : videos

  const videsOnglet = onglet === 'privees' ? 'Aucune vidéo privée'
    : onglet === 'favoris' ? 'Aucune vidéo enregistrée'
    : onglet === 'aimees' ? 'Aucune vidéo aimée'
    : monProfil ? "Vous n'avez pas encore publié de vidéo"
    : 'Aucune vidéo publiée'

  // L'appui long supprime, mais seulement ses propres publications : le
  // serveur refuserait les favoris d'un autre compte.
  const supprimable = monProfil && (onglet === 'videos' || onglet === 'privees')

  const supprimer = async (id: string) => {
    if (!monProfil) return
    if (!confirm('Supprimer cette vidéo ?')) return
    const avant = videos
    setVideos(l => l.filter(v => v.id !== id))
    try {
      await apiVideos.supprimer(id)
    } catch (err) {
      setVideos(avant)
      setErreur(err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  // Abonnement optimiste : le bouton change tout de suite, et revient en
  // arriere si le serveur refuse.
  const basculerSuivi = useCallback(() => {
    const vise = !suivi
    setSuivi(vise)
    setEntete(e => e && { ...e, nbAbonnes: e.nbAbonnes + (vise ? 1 : -1) })
    const envoi = vise
      ? apiInteractions.suivre(pseudo)
      : apiInteractions.nePlusSuivre(pseudo)
    envoi
      .then(r => setSuivi(r.suivi))
      .catch((e: Error) => {
        setSuivi(!vise)
        setEntete(p => p && { ...p, nbAbonnes: p.nbAbonnes + (vise ? -1 : 1) })
        setErreur(e.message)
      })
  }, [pseudo, suivi])

  // La conversation est bien creee cote serveur ; l'ecran des messages
  // n'etant pas atteignable d'ici, on indique ou la retrouver plutot que
  // de pretendre l'ouvrir.
  const [ouvertureMessage, setOuvertureMessage] = useState(false)
  const [avisMessage, setAvisMessage] = useState('')

  const ouvrirMessage = async () => {
    setOuvertureMessage(true)
    setAvisMessage('')
    try {
      await apiMessagerie.ouvrirConversation(pseudo)
      setAvisMessage(`Conversation avec @${pseudo} ouverte : retrouve-la dans l’onglet Messages.`)
    } catch (err) {
      setAvisMessage(err instanceof Error ? err.message : 'Ouverture impossible')
    } finally {
      setOuvertureMessage(false)
    }
  }

  if (monProfil && !profil) return <div className="chargement">Chargement…</div>
  if (monProfil && edition) return <ModifierProfil onRetour={() => setEdition(false)} />
  if (monProfil && soldeOuvert) return <Solde onRetour={() => setSoldeOuvert(false)} />
  if (monProfil && parametresOuverts) return <Parametres
    pseudo={pseudo}
    onRetour={() => setParametresOuverts(false)}
    onDeconnecter={deconnecter}
  />

  return (
    <div className={`page page-profil ${monProfil ? 'profil-personnel' : 'profil-visite'}`}>
      {/* Barre superieure : elle differe selon qu'on visite ou qu'on est chez soi */}
      <div className="profil-barre">
        {monProfil ? (
          <>
            <button aria-label="Modifier" onClick={() => setEdition(true)}><Crayon taille={24} /></button>
            <div className="groupe">
              <button aria-label="Ajouter un ami"><AjoutPersonne taille={24} /></button>
              <button aria-label="Menu" aria-haspopup="dialog" aria-expanded={menuOuvert} onClick={() => setMenuOuvert(true)}><Menu taille={24} /></button>
            </div>
          </>
        ) : (
          <>
            <button aria-label="Retour" onClick={onRetour}><Chevron taille={26} /></button>
            <div className="groupe">
              <button aria-label="Notifications"><Cloche taille={24} /></button>
              <button aria-label="Partager"><Fleche taille={24} /></button>
            </div>
          </>
        )}
      </div>

      {menuOuvert && <MenuProfil onFermer={() => setMenuOuvert(false)} onDeconnecter={deconnecter} onSolde={() => { setMenuOuvert(false); setSoldeOuvert(true) }} onParametres={() => { setMenuOuvert(false); setParametresOuverts(true) }} />}
      {monProfil && comptesOuverts && <ComptesProfil pseudo={pseudo} avatar={profil?.avatar_url} onFermer={() => setComptesOuverts(false)} />}
      {listeOuverte && <ListeComptes pseudo={pseudo} sens={listeOuverte} onFermer={() => setListeOuverte(null)} onVisiter={onVisiter} />}

      {/* Identite : nom, pseudo, avatar */}
      <div className="profil-identite">
        <div className="profil-resume">
          <div className="profil-nom">{monProfil ? <button className="profil-choix-compte" aria-label="Changer de compte" aria-haspopup="dialog" aria-expanded={comptesOuverts} onClick={() => setComptesOuverts(true)}><span>{profil?.nom || pseudo}</span><svg width="15" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M2 3h12L8 10z" /></svg></button> : pseudo}</div>
          <div className="profil-pseudo">@{pseudo}</div>
          <div className="profil-stats">
        <button className="bloc" aria-haspopup="dialog" onClick={() => setListeOuverte('abonnements')}><b>{abreger(nbSuivis)}</b><span>Suivis</span></button>
        <button className="bloc" aria-haspopup="dialog" onClick={() => setListeOuverte('abonnes')}><b>{abreger(nbAbonnes)}</b><span>Followers</span></button>
        <div className="bloc"><b>{abreger(nbAime)}</b><span>J'aime</span></div>
          </div>
        </div>
        <div className="profil-avatar-zone">
          {monProfil && <span className="profil-note">Dis-nous tout</span>}
          <div className="profil-avatar">
            {monProfil && profil?.avatar_url ? <img src={profil.avatar_url} alt={`Avatar de ${pseudo}`} /> : <span>{pseudo.charAt(0).toUpperCase()}</span>}
          </div>
          {monProfil && <span className="profil-avatar-plus" aria-hidden="true"><Plus taille={21} /></span>}
        </div>
      </div>

      {/* Actions */}
      {!monProfil && (
        <div className="profil-actions">
          <button
            className={`principal${suivi ? ' suivi' : ''}`}
            onClick={basculerSuivi}
          >
            {suivi ? 'Abonné' : 'Suivre'}
          </button>
          <button className="secondaire" disabled={ouvertureMessage}
            onClick={ouvrirMessage}>
            {ouvertureMessage ? 'Ouverture…' : 'Message'}
          </button>
          <button className="carre" aria-label="Suggestions"><AjoutPersonne taille={20} plein /></button>
        </div>
      )}

      {avisMessage && <p className="profil-avis" role="status">{avisMessage}</p>}

      {/* Bio */}
      {bio && <div className="profil-bio">{bio}</div>}
      {/* Le studio reposerait sur des statistiques d'audience que l'API ne
          produit pas : le bouton reste inerte et le dit. */}
      {monProfil && <button className="profil-studio" disabled
        title="Le studio attend les statistiques d’audience, que l’API ne calcule pas encore">
        <Studio taille={18} /> Studio créateur
      </button>}

      {/* Onglets : cinq chez soi, deux chez les autres */}
      <div className="profil-onglets">
        <button
          className={onglet === 'videos' ? 'actif' : ''}
          onClick={() => setOnglet('videos')}
          aria-label="Vidéos"
        >
          <Grille taille={22} />
        </button>
        {monProfil && (
          <>
            <button
              className={onglet === 'privees' ? 'actif' : ''}
              onClick={() => setOnglet('privees')}
              aria-label="Privées"
            >
              <Cadenas taille={22} />
            </button>
            <button
              className={onglet === 'repartages' ? 'actif' : ''}
              onClick={() => setOnglet('repartages')}
              aria-label="Repartages"
            ><Repartage taille={22} /></button>
            <button
              className={onglet === 'favoris' ? 'actif' : ''}
              onClick={() => setOnglet('favoris')}
              aria-label="Favoris"
            ><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" /></svg></button>
            <button
              className={onglet === 'aimees' ? 'actif' : ''}
              onClick={() => setOnglet('aimees')}
              aria-label="Aimées"
            >
              <Coeur taille={22} />
            </button>
          </>
        )}
        {!monProfil && <button className={onglet === 'repartages' ? 'actif' : ''} onClick={() => setOnglet('repartages')} aria-label="Repartages"><Repartage taille={22} /></button>}
      </div>

      {/* Grille. Les publications privees se deduisent de la visibilite
          « moi » : elles sont deja dans la liste du profil. Les repartages
          n'existent pas dans le schema, d'ou le message explicite. */}
      {chargement ? (
        <p className="profil-etat">Chargement…</p>
      ) : erreur ? (
        <div className="profil-echec">
          <p role="alert">{erreur}</p>
          <button onClick={() => setReprise(n => n + 1)}>Réessayer</button>
        </div>
      ) : onglet === 'repartages' ? (
        <p className="profil-etat">
          Tok 229 n’enregistre pas encore les repartages : rien à lister ici.
        </p>
      ) : (onglet === 'favoris' || onglet === 'aimees') && chargementOnglet ? (
        <p className="profil-etat">Chargement…</p>
      ) : (onglet === 'favoris' || onglet === 'aimees') && erreurOnglet ? (
        <div className="profil-echec">
          <p role="alert">{erreurOnglet}</p>
          <button onClick={() => setRepriseOnglet(n => n + 1)}>Réessayer</button>
        </div>
      ) : grille.length === 0 && tuileBrouillons.length === 0 ? (
        <p className="profil-etat">{videsOnglet}</p>
      ) : (
        <div className="grille">
          {/* La tuile des brouillons occupe la premiere case, devant les
              videos : c'est de la qu'on atteint la liste des brouillons. */}
          {tuileBrouillons.length > 0 && (
            <button className="case prf-case-brouillons" onClick={onBrouillons}>
              <video src={tuileBrouillons[0].url} preload="metadata" muted playsInline />
              <span className="prf-brouillons-titre">
                Brouillons: {tuileBrouillons.length}
              </span>
              <span className="vues">
                <Brouillon taille={12} /> {poidsLisible(poidsBrouillons)}
              </span>
            </button>
          )}
          {grille.map((v) => (
            <div className="case" key={v.id}
              onClick={() => { if (supprimable) supprimer(v.id) }}>
              <video src={v.url} preload="metadata" muted playsInline />
              <span className="vues"><Lecture taille={11} /> {abreger(v.vues)}</span>
            </div>
          ))}
        </div>
      )}

      {!!message && <p className="prf-toast">{message}</p>}

      {supprimable && grille.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--texte-attenue)', marginTop: 12, textAlign: 'center' }}>
          Appuyez sur une vidéo pour la supprimer
        </p>
      )}
    </div>
  )
}
