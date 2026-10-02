import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Chevron } from '../components/Icones'
import './solde.css'

type Page = 'solde' | 'parametres' | 'devise' | 'aide' | 'tickets' | 'transactions'
type Popup = 'bienvenue' | 'guide' | 'filtres' | 'offre' | null
const types = ['Tout', 'Acheter', 'Récompenses', 'Paiement', 'Ajustement de la plateforme', 'Remboursement', 'Déduction']
const devises = ['AED','AUD','BRL','CAD','CHF','CNY','EUR','GBP','GHS','INR','JPY','KES','MAD','NGN','UAH','UGX','USD','UYU','UZS','VES','VND','XAF','XCD','XOF','YER','ZAR','ZMW']
const nomsDevises = new Intl.DisplayNames(['fr'], { type: 'currency' })

function Icone({ nom, taille = 24 }: { nom: string; taille?: number }) {
  return <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {nom === 'reglages' && <><circle cx="12" cy="12" r="8"/>{Array.from({length:8},(_,i)=><path key={i} d="M12 2v2" transform={`rotate(${i*45} 12 12)`}/>)}</>}
    {nom === 'filtre' && <path d="M2 3h20l-8 9v10l-5-3v-7Z"/>}
    {nom === 'papier' && <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h4"/></>}
    {nom === 'vide' && <path d="M3 13 7 3h10l4 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm0 0h6a3 3 0 0 0 6 0h6"/>}
    {nom === 'oeil' && <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}
    {nom === 'cadeau' && <><rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v9h14v-9M12 9v13"/><path d="M12 9C2 9 5 0 9 4l3 5c10 0 7-9 3-5Z"/></>}
    {nom === 'portefeuille' && <><path d="M3 7V4l15-2v5"/><rect x="2" y="7" width="20" height="15" rx="2"/><circle cx="17" cy="14" r="1"/></>}
    {nom === 'graphique' && <><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><path d="M8 16v-5m4 5V7m4 9v-3" stroke="white"/></>}
    {nom === 'etoile' && <><path d="M4 3h16v13l-8 6-8-6Z" fill="currentColor"/><path d="m12 6 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 9.5l3.5-.5Z" fill="white" stroke="none"/></>}
    {nom === 'piece' && <><circle cx="12" cy="12" r="10"/><path d="M15 7c-7-3-8 5-3 5s4 8-3 5m3-13v16"/></>}
    {nom === 'aide' && <><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 4 3v2m-1 3h.01"/></>}
    {nom === 'fermer' && <path d="m5 5 14 14M19 5 5 19"/>}
  </svg>
}

function Fenetre({ titre, onFermer, children, classe = '' }: { titre: string; onFermer: () => void; children: ReactNode; classe?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null
    const node = ref.current!
    node.showModal()
    return () => { node.close(); precedent?.focus() }
  }, [])
  return <dialog ref={ref} className={`solde-dialog ${classe}`} aria-label={titre} onCancel={onFermer}>
    <button className="solde-voile" aria-label="Fermer" onClick={onFermer}/>
    <section className="solde-feuille"><button className="solde-fermer" aria-label="Fermer" onClick={onFermer}><Icone nom="fermer"/></button>{children}</section>
  </dialog>
}

export default function Solde({ onRetour }: { onRetour: () => void }) {
  const [page, setPage] = useState<Page>('solde')
  const [popup, setPopup] = useState<Popup>('bienvenue')
  const [guideVu, setGuideVu] = useState(false)
  const [devise, setDevise] = useState(() => localStorage.getItem('solde-devise') || 'USD')
  const [choix, setChoix] = useState(devise)
  const [recherche, setRecherche] = useState('')
  const [visible, setVisible] = useState(true)
  const [type, setType] = useState('Tout')
  const [brouillon, setBrouillon] = useState('Tout')
  const [mois, setMois] = useState('')
  const [moisChoisi, setMoisChoisi] = useState('')
  const [pack, setPack] = useState(0)
  const [message, setMessage] = useState('')
  const aller = (suivante: Page) => { setPage(suivante); setMessage('') }
  const retour = () => {
    if (page === 'solde') onRetour()
    else aller(page === 'devise' || page === 'aide' ? 'parametres' : page === 'tickets' ? 'aide' : 'solde')
  }
  const transactions = () => { aller('transactions'); if (!guideVu) setPopup('guide') }
  const fermer = () => { if (popup === 'guide') setGuideVu(true); setPopup(null); setMessage('') }
  const titres: Record<Page,string> = { solde: 'Solde', parametres: 'Paramètres', devise: 'Sélectionner une devise', aide: 'Foire aux questions', tickets: 'Tes tickets d’assistance', transactions: 'Historique des transactions' }
  const packs = [{pieces:20,bonus:11,prix:'0,39'}, {pieces:70,bonus:47,prix:'1,19'}, {pieces:350,bonus:0,prix:'5,90'}]
  return <div className={`solde-page solde-${page}`}>
    <header className="solde-entete">
      {page === 'devise' ? <button onClick={retour}>Annuler</button> : <button aria-label="Retour" onClick={retour}><Chevron taille={24}/></button>}
      <div><h1>{titres[page]}</h1>{page === 'solde' && <span className="solde-securise">◇ Aperçu démo</span>}</div>
      {page === 'solde' ? <button aria-label="Paramètres du solde" onClick={() => aller('parametres')}><Icone nom="reglages"/></button>
        : page === 'devise' ? <button disabled={choix === devise} onClick={() => {setDevise(choix); localStorage.setItem('solde-devise',choix); aller('parametres')}}>Terminé</button>
        : page === 'aide' ? <button aria-label="Tickets d’assistance" onClick={() => aller('tickets')}><Icone nom="papier"/></button>
        : page === 'transactions' ? <button aria-label="Filtres" onClick={() => {setBrouillon(type);setMoisChoisi(mois);setPopup('filtres')}}><Icone nom="filtre"/></button> : <span/>}
    </header>
    {page === 'solde' && <>
      <div className="solde-montant"><div>Solde estimé <b>{devise}</b><button aria-label={visible ? 'Masquer le solde' : 'Afficher le solde'} onClick={() => setVisible(!visible)}><Icone nom="oeil" taille={19}/></button></div><button className="solde-total" onClick={transactions}>{visible ? '0,00' : '••••'}<Chevron taille={22}/></button></div>
      <button className="solde-pieces" onClick={() => setPopup('offre')}><span className="solde-or">◉</span><span>Pièces <b>0</b></span><i/><strong><Icone nom="cadeau" taille={17}/> Obtenir des Pièces →</strong></button>
      <button className="solde-carte solde-ligne" onClick={transactions}><b>Transactions</b><span>Tout voir <Chevron taille={18}/></span></button>
      <button className="solde-carte solde-promo" onClick={() => setPopup('offre')}><div><b>Offre de première recharge ›</b><p>Obtiens des Cadeaux et des Pièces bonus</p></div><span><Icone nom="cadeau" taille={30}/></span></button>
      <div className="solde-carte solde-outils">{['Récompenses LIVE','Monétisation','Campagnes','Gestionnaire d’abonnement'].map((nom,i)=><button key={nom} onClick={() => setMessage(`${nom} : TockTick n’a pas encore de système de paiement.`)}><span><Icone nom={['piece','graphique','etoile','etoile'][i]}/></span>{nom}</button>)}</div>
      {message && <p role="status" className="solde-note">{message}</p>}
    </>}
    {page === 'parametres' && <><button className="solde-carte solde-ligne" onClick={() => {setChoix(devise);setRecherche('');aller('devise')}}><Icone nom="portefeuille"/><b>Affichage de la devise</b><span>{devise}<Chevron taille={18}/></span></button><h2 className="solde-rubrique">Assistance</h2><button className="solde-carte solde-ligne" onClick={() => aller('aide')}><Icone nom="aide"/><b>Aide et commentaires</b><span><Chevron taille={18}/></span></button></>}
    {page === 'devise' && <><input className="solde-recherche" aria-label="Rechercher une devise" placeholder="⌕ Rechercher" value={recherche} onChange={e => setRecherche(e.target.value)}/><div className="solde-devises">{devises.filter(d => `${d} ${nomsDevises.of(d)}`.toLocaleLowerCase().includes(recherche.toLocaleLowerCase())).map((d,i,liste)=><div key={d}>{(i===0 || liste[i-1][0]!==d[0]) && <h2>{d[0]}</h2>}<label>{d} - {nomsDevises.of(d)}<input type="radio" name="devise" checked={choix===d} onChange={() => setChoix(d)}/></label></div>)}</div></>}
    {page === 'aide' && <div className="solde-faq">{['Guide général','Problèmes de retrait des récompenses'].map((t,i)=><details key={t}><summary>{t}</summary><p>{i===0 ? 'Cet espace présente le solde, les pièces et les transactions. Tu peux choisir la devise d’affichage dans les paramètres.' : 'Les retraits et récompenses ne sont pas encore disponibles dans cette version de démonstration.'}</p></details>)}</div>}
    {page === 'tickets' && <div className="solde-vide tickets-vide"><Icone nom="papier" taille={90}/><b>Aucun ticket d’assistance</b></div>}
    {page === 'transactions' && <><div className="solde-onglets">{types.map(t => <button key={t} className={type===t ? 'actif' : ''} onClick={() => setType(t)}>{t}</button>)}</div>{mois && <p className="solde-note">Mois : {mois}</p>}<div className="solde-vide"><Icone nom="vide" taille={86}/><p>Pas encore de transaction</p></div></>}
    {(page === 'solde' || page === 'transactions') && <footer className="solde-disclaimer">Démonstration : aucun argent réel, aucune transaction ni récompense disponible.</footer>}
    {popup && <Fenetre titre={popup === 'filtres' ? 'Sélectionne les filtres' : popup === 'offre' ? 'Offre de première recharge' : 'Présentation du solde'} onFermer={fermer} classe={popup}>
      {popup === 'bienvenue' && <><div className="solde-illustration"><Icone nom="portefeuille" taille={76}/><span>✦</span><i>＄</i></div><h2>Bienvenue dans le solde</h2><div className="solde-avantage"><Icone nom="piece"/><div><b>Consulte toutes tes récompenses d’un coup</b><p>Consulte tes récompenses issues des programmes de monétisation et plus encore.</p></div></div><div className="solde-avantage"><Icone nom="portefeuille"/><div><b>Gère tes Pièces</b><p>Obtiens des Pièces pour envoyer des Cadeaux.</p></div></div><button className="solde-action" onClick={fermer}>J’ai compris</button></>}
      {popup === 'guide' && <><div className="solde-guide-dessin"><Icone nom="papier" taille={110}/><span><Icone nom="filtre" taille={32}/></span></div><h2>Gère tes transactions plus facilement</h2><p>Filtre tes transactions par type de transaction ou par type d’activité.</p><button className="solde-action" onClick={fermer}>J’ai compris</button></>}
      {popup === 'filtres' && <><h2>Sélectionne les filtres</h2><h3>Type de transaction</h3><div className="solde-filtres">{types.map(t=><button aria-pressed={brouillon===t} key={t} className={brouillon===t?'actif':''} onClick={() => setBrouillon(t)}>{t}</button>)}</div><h3>Type d’activité</h3><div className="solde-filtres"><button className="actif" aria-pressed="true">Tout</button></div><label className="solde-mois">Mois<input aria-label="Sélectionner le mois" type="month" value={moisChoisi} onChange={e => setMoisChoisi(e.target.value)}/></label><div className="solde-actions"><button onClick={() => {setBrouillon('Tout');setMoisChoisi('')}}>Réinitialiser</button><button className="solde-action" onClick={() => {setType(brouillon);setMois(moisChoisi);fermer()}}>Appliquer</button></div></>}
      {popup === 'offre' && <><h2>Offre de première recharge</h2><p className="solde-note">Aperçu de l’offre — prix illustratifs en USD, paiement non disponible.</p><div className="solde-carte solde-bonus"><div><span>🌹</span><div><b>Obtiens ×3 Rose dans ton sac à dos</b><p>Une Rose maintenant et les suivantes après 24 heures.</p></div></div><div><span className="solde-or">◉</span><div><b>Reçois des Pièces bonus</b><p>Utilise les Pièces sur des articles virtuels comme les Cadeaux.</p></div></div></div><div className="solde-carte"><h3>Obtenir des Pièces</h3><p>Recharge pour obtenir des Cadeaux et des Pièces bonus.</p><div className="solde-packs">{packs.map((p,i)=><button key={p.pieces} aria-pressed={pack===i} className={pack===i?'selectionne':''} onClick={() => setPack(i)}><b><span className="solde-or">◉</span> {p.pieces}{p.bonus>0 && <em>+{p.bonus}</em>}</b><span>$ {p.prix}</span></button>)}</div></div><button className="solde-action" onClick={() => setMessage('La recharge n’est pas encore activée. Aucun paiement n’a été effectué.')}>Obtiens ◉ {packs[pack].pieces+packs[pack].bonus} ($ {packs[pack].prix})</button>{message && <p role="status" className="solde-note">{message}</p>}</>}
    </Fenetre>}
  </div>
}
