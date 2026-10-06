// Taille d'ecran vue par les ecrans de l'application.
//
// Sur telephone, c'est la fenetre. Sur ordinateur et tablette, l'application
// s'affiche dans une colonne centrale (menu a gauche, comme TikTok sur
// ordinateur) : les ecrans qui se dimensionnent d'apres l'ecran (grille du
// profil, vignettes de la camera, feuilles) recoivent alors la taille de
// cette colonne, et gardent leurs proportions de telephone.
import React, { createContext, useContext } from 'react'
import { useWindowDimensions as useFenetre, type ScaledSize } from 'react-native'

type Taille = Pick<ScaledSize, 'width' | 'height' | 'scale' | 'fontScale'>

const Contexte = createContext<{ width: number; height: number } | null>(null)

export function FournisseurColonne({ width, height, children }: {
  width: number; height: number; children: React.ReactNode
}) {
  return <Contexte.Provider value={{ width, height }}>{children}</Contexte.Provider>
}

// Meme forme que celle de React Native, pour remplacer l'import tel quel.
export function useWindowDimensions(): Taille {
  const fenetre = useFenetre()
  const colonne = useContext(Contexte)
  return colonne ? { ...fenetre, ...colonne } : fenetre
}

// Mise en page large : ordinateur, tablette (et telephone a l'horizontale
// assez haut). En dessous, la mise en page telephone, barre en bas.
export function useMiseEnPageLarge(): boolean {
  const { width, height } = useFenetre()
  return width >= 768 && height >= 520
}
