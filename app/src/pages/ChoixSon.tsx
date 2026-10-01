// ============================================================
// Feuille « Ajouter un son » : elle s'ouvre a mi-hauteur et
// se deploie quand on tire la poignee vers le haut.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { Loupe, Egaliseur, Ciseaux, MarquePage } from '../components/Icones'
import { SONS, parPopularite, abregerPublications, dureeLisible, type Son } from '../lib/sons'
import './son.css'

const ONGLETS = ['Populaire', 'Pour toi', 'Favoris', 'Récents']

// Une ligne de son : pochette, titre, auteur et compteurs.
function Ligne({ son, choisi, rang, favori, onChoisir, onFavori }: {
  son: Son
  choisi: boolean
  // Numero affiche dans l'onglet « Populaire ».
  rang?: number
  favori: boolean
  onChoisir: () => void
  onFavori: () => void
}) {
  return (
    <div className={`son-ligne ${choisi ? 'actif' : ''}`}>
      <button className="son-choisir" onClick={onChoisir}>
        {rang != null && <span className="son-rang">{rang}</span>}
        <span className="son-pochette" style={{ background: son.couleur }}>
          {son.titre.charAt(0).toUpperCase()}
        </span>
        <span className="son-corps">
          <span className="son-titre-ligne">
            {choisi && <Egaliseur taille={15} />}
            <b>{son.titre}</b>
          </span>
          <span className="son-meta">
            {son.artiste} · {abregerPublications(son.publications)} publications
            {' · '}{dureeLisible(son.duree)}
          </span>
          {choisi && <span className="son-licence">{son.licence}</span>}
        </span>
      </button>

      {/* Les deux actions n'apparaissent que sur le son retenu. */}
      {choisi && <div className="son-actions">
        <button aria-label="Découper le son"><Ciseaux taille={23} /></button>
        <button aria-label={favori ? 'Retirer des favoris' : 'Enregistrer le son'}
          aria-pressed={favori} onClick={onFavori}>
          <MarquePage taille={23} plein={favori} />
        </button>
      </div>}
    </div>
  )
}

export default function ChoixSon({ visible, onFermer, onChoisir }: {
  visible: boolean
  onFermer: () => void
  onChoisir: (son: Son | null) => void
}) {
  // Deux crans : la feuille s'arrete d'abord a mi-hauteur, puis se
  // deploie quand on tire la poignee.
  const [deploye, setDeploye] = useState(false)
  const [onglet, setOnglet] = useState('Pour toi')
  const [zone, setZone] = useState<'Bénin' | 'Mondial'>('Bénin')
  const [choisi, setChoisi] = useState<string | null>(SONS[0].id)
  const [favoris, setFavoris] = useState<string[]>([])
  const lecteur = useRef<HTMLAudioElement | null>(null)
  // Ordonnee de depart du glissement sur la poignee.
  const depart = useRef<number | null>(null)

  // Le lecteur suit le son retenu, et se tait des que la feuille se referme.
  useEffect(() => {
    if (!visible) {
      lecteur.current?.pause()
      return
    }
    const son = SONS.find(x => x.id === choisi)
    if (!son) return
    lecteur.current?.pause()
    const audio = new Audio(son.url)
    audio.loop = true
    lecteur.current = audio
    audio.play().catch(() => { /* Son illisible ou lecture refusee : silence. */ })
    return () => { audio.pause() }
  }, [visible, choisi])

  const retenir = (x: Son) => {
    // Second appui sur le meme son : on valide et on referme.
    if (choisi === x.id) { onChoisir(x); onFermer(); return }
    setChoisi(x.id)
  }

  const basculerFavori = (id: string) => setFavoris(l =>
    l.includes(id) ? l.filter(x => x !== id) : [...l, id])

  // Chaque onglet trie la meme bibliotheque differemment.
  const liste = onglet === 'Populaire' ? parPopularite(SONS)
    : onglet === 'Favoris' ? SONS.filter(x => favoris.includes(x.id))
    : onglet === 'Récents' ? [...SONS].reverse()
    : SONS

  if (!visible) return null

  return (
    <div className="son-fond">
      <button className="son-voile" aria-label="Fermer" onClick={onFermer} />

      <section className={`son-feuille ${deploye ? 'deploye' : ''}`} aria-label="Ajouter un son">
        {/* Poignee : glisser vers le haut deploie, vers le bas replie. */}
        <div className="son-poignee-zone"
          onPointerDown={e => { depart.current = e.clientY }}
          onPointerUp={e => {
            const y = depart.current
            depart.current = null
            if (y === null) return
            const ecart = e.clientY - y
            if (ecart < -30) setDeploye(true)
            else if (ecart > 30) setDeploye(false)
            else setDeploye(v => !v)
          }}>
          <button className="son-poignee"
            aria-label={deploye ? 'Replier la feuille' : 'Déployer la feuille'} />
        </div>

        <div className="son-onglets">
          <div className="son-onglets-liste" role="tablist" aria-label="Catégories de sons">
            {ONGLETS.map(t => (
              <button key={t} role="tab" aria-selected={onglet === t}
                className={onglet === t ? 'actif' : ''} onClick={() => setOnglet(t)}>
                {t}
              </button>
            ))}
          </div>
          <button className="son-loupe" aria-label="Rechercher un son"><Loupe taille={24} /></button>
        </div>

        {/* « Populaire » ajoute le choix du territoire */}
        {onglet === 'Populaire' && (
          <div className="son-zones">
            {(['Bénin', 'Mondial'] as const).map(z => (
              <button key={z} className={zone === z ? 'actif' : ''} onClick={() => setZone(z)}>{z}</button>
            ))}
          </div>
        )}

        <div className="son-liste">
          {liste.length ? liste.map((x, i) => (
            <Ligne key={x.id} son={x} choisi={choisi === x.id}
              rang={onglet === 'Populaire' ? i + 1 : undefined}
              favori={favoris.includes(x.id)}
              onChoisir={() => retenir(x)}
              onFavori={() => basculerFavori(x.id)} />
          )) : (
            <p className="son-vide">
              {onglet === 'Favoris' ? 'Aucun son enregistré' : 'Aucun son pour le moment'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
