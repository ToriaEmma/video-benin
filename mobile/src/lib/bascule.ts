// Interrupteur synchronise avec le serveur (j'aime, favori, abonnement).
//
// L'affichage change tout de suite au toucher. Les envois partent ensuite
// un par un, jusqu'a ce que le serveur porte le dernier etat voulu : deux
// appuis rapides ne peuvent donc pas se croiser (l'annulation arrivant
// avant l'ajout) ni laisser une reponse perimee reafficher l'ancien etat.
// En cas d'echec, l'affichage revient a ce que le serveur a confirme.
import { useEffect, useRef, useState } from 'react'

type Options<R> = {
  // Reponse du serveur pour l'etat final (ex. nombre de j'aime a jour).
  surReponse?: (reponse: R) => void
  surErreur?: (erreur: Error) => void
}

export function useBascule<R>(
  initial: boolean,
  envoyer: (vise: boolean) => Promise<R>,
  options: Options<R> = {},
): [boolean, () => void] {
  const [valeur, setValeur] = useState(initial)
  const etat = useRef({ voulu: initial, confirme: initial, enCours: false })
  // Derniers rappels, sans relancer la synchronisation a chaque rendu.
  const rappels = useRef({ envoyer, ...options })
  useEffect(() => { rappels.current = { envoyer, ...options } })

  const synchroniser = async () => {
    const e = etat.current
    if (e.enCours) return
    e.enCours = true
    try {
      while (e.voulu !== e.confirme) {
        const cible = e.voulu
        try {
          const reponse = await rappels.current.envoyer(cible)
          e.confirme = cible
          if (e.voulu === cible) rappels.current.surReponse?.(reponse)
        } catch (erreur) {
          e.voulu = e.confirme
          setValeur(e.confirme)
          rappels.current.surErreur?.(erreur instanceof Error ? erreur : new Error(String(erreur)))
          return
        }
      }
    } finally {
      e.enCours = false
    }
  }

  const basculer = () => {
    const e = etat.current
    e.voulu = !e.voulu
    setValeur(e.voulu)
    synchroniser()
  }

  return [valeur, basculer]
}
