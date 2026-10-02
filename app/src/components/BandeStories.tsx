// ============================================================
// Rangee de stories deployee, posee en haut de l'onglet « Amis » et
// de la boite de reception.
//
// Les recits viennent de GET /stories : ceux du lecteur et des comptes
// qu'il suit, les expires ecartes par le serveur. L'anneau de couleur
// ne designe donc que des comptes portant vraiment un recit.
//
// La bulle « Créer » televerse une video et la publie en recit.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { AjoutPersonne, PlusStory } from './Icones'
import { apiStories, televerser, type RecitApi } from '../lib/api'
import type { Story } from '../lib/demo'
import './bande-stories.css'

export default function BandeStories({ pseudo, stories, clair, onOuvrir, onCreer }: {
  pseudo: string
  // Bulles decoratives locales, affichees apres les vrais recits.
  stories: Story[]
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
  onCreer?: () => void
}) {
  const [recits, setRecits] = useState<RecitApi[]>([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const champFichier = useRef<HTMLInputElement>(null)

  const charger = () => {
    apiStories.liste()
      .then(setRecits)
      // Visiteur sans session ou reseau coupe : la bande garde ses
      // bulles locales plutot que d'afficher une erreur.
      .catch(() => undefined)
  }

  useEffect(charger, [])

  // La video part vers le stockage, puis l'API ne recoit que son
  // adresse : les octets ne traversent pas le serveur.
  const publier = async (fichier: File) => {
    setErreur('')
    setEnvoi(true)
    try {
      await apiStories.publier(await televerser(fichier))
      charger()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Publication impossible')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className={`bst-rangee${clair ? ' bst-clair' : ''}`}>
      <input ref={champFichier} type="file" accept="video/*" hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void publier(f)
        }} />

      <button className="bst-bulle" disabled={envoi}
        onClick={() => { onCreer?.(); champFichier.current?.click() }}>
        <span className="bst-avatar-simple">{pseudo.charAt(0).toUpperCase()}</span>
        <span className="bst-pastille-plus"><PlusStory taille={12} /></span>
        <span className="bst-libelle">{envoi ? 'Envoi…' : 'Créer'}</span>
      </button>

      {recits.map((r) => (
        <button key={r.id} className="bst-bulle" onClick={() => onOuvrir?.(r.pseudo)}>
          <span className="bst-anneau">
            <span className="bst-anneau-interieur">
              <span className="bst-avatar">{r.pseudo.charAt(0).toUpperCase()}</span>
            </span>
          </span>
          <span className="bst-libelle">{r.moi ? 'Mon récit' : r.pseudo}</span>
        </button>
      ))}

      {/* DECOR LOCAL : bulles de demonstration, sans recit reel. Elles ne
          portent donc pas l'anneau de couleur. */}
      {stories.map((st) => (
        <button key={st.id} className="bst-bulle" onClick={() => onOuvrir?.(st.pseudo)}>
          <span className="bst-anneau bst-sans-recit">
            <span className="bst-anneau-interieur">
              <span className="bst-avatar">{st.pseudo.charAt(0).toUpperCase()}</span>
            </span>
          </span>
          {st.suggestion && (
            <span className="bst-voile"><AjoutPersonne taille={26} /></span>
          )}
          <span className="bst-libelle">{st.libelle ?? st.pseudo}</span>
        </button>
      ))}

      {!!erreur && <p className="bst-erreur">{erreur}</p>}
    </div>
  )
}
