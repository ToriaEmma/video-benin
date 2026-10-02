// ============================================================
// Rangee de stories deployee, posee en haut de l'onglet « Amis ».
//
// Version minimale : la bulle « Créer » du compte connecte, puis une
// bulle par recit. Une story « suggestion » porte un voile sombre et
// l'icone d'ajout de personne, pour la distinguer d'un recit a regarder.
// ============================================================

import { AjoutPersonne, PlusStory } from './Icones'
import type { Story } from '../lib/demo'
import './bande-stories.css'

export default function BandeStories({ pseudo, stories, clair, onOuvrir, onCreer }: {
  pseudo: string
  stories: Story[]
  clair?: boolean
  onOuvrir?: (pseudo: string) => void
  onCreer?: () => void
}) {
  return (
    <div className={`bst-rangee${clair ? ' bst-clair' : ''}`}>
      <button className="bst-bulle" onClick={onCreer}>
        <span className="bst-avatar-simple">{pseudo.charAt(0).toUpperCase()}</span>
        <span className="bst-pastille-plus"><PlusStory taille={12} /></span>
        <span className="bst-libelle">Créer</span>
      </button>

      {stories.map((st) => (
        <button key={st.id} className="bst-bulle" onClick={() => onOuvrir?.(st.pseudo)}>
          <span className={`bst-anneau${st.vue ? ' bst-vu' : ''}`}>
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
    </div>
  )
}
