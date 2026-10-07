// Taille d'ecran vue par les ecrans de l'application.
//
// Sur telephone, c'est la fenetre. Sur ordinateur et tablette, l'application
// s'affiche dans une colonne centrale (menu a gauche, comme TikTok sur
// ordinateur) : les ecrans qui se dimensionnent d'apres l'ecran (grille du
// profil, vignettes de la camera, feuilles) recoivent alors la taille de
// cette colonne, et gardent leurs proportions de telephone.
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWindowDimensions as useFenetre, type ScaledSize, type ViewStyle } from 'react-native'

type Taille = Pick<ScaledSize, 'width' | 'height' | 'scale' | 'fontScale'>

// `gauche` : position du bord gauche de la colonne dans la fenetre.
// `bas` : marge sous la colonne (cadre video arrondi qui ne touche pas le bas).
const Contexte = createContext<{ width: number; height: number; gauche: number; bas: number } | null>(null)

// Derniere colonne affichee, pour les fenetres montees hors de la colonne
// (invitation a se connecter).
let colonneAffichee: { gauche: number; largeur: number } | null = null
const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach(f => f())

export function FournisseurColonne({ width, height, gauche, bas = 0, children }: {
  width: number; height: number; gauche: number; bas?: number; children: React.ReactNode
}) {
  useEffect(() => {
    colonneAffichee = { gauche, largeur: width }
    prevenir()
    return () => { colonneAffichee = null; prevenir() }
  }, [gauche, width])
  return <Contexte.Provider value={{ width, height, gauche, bas }}>{children}</Contexte.Provider>
}

// Meme forme que celle de React Native, pour remplacer l'import tel quel.
export function useWindowDimensions(): Taille {
  const fenetre = useFenetre()
  const colonne = useContext(Contexte)
  return colonne ? { ...fenetre, width: colonne.width, height: colonne.height } : fenetre
}

// Feuilles du bas (partage, commentaires, sons…) : elles s'ouvrent par-dessus
// toute la fenetre ; sur grand ecran, ce style les cale exactement sur la
// colonne (meme largeur, meme position) au lieu de deborder du cadre video.
export function useCadreFeuille(): ViewStyle | undefined {
  const colonne = useContext(Contexte)
  if (!colonne) return undefined
  return {
    width: colonne.width, maxWidth: colonne.width, alignSelf: 'flex-start', marginLeft: colonne.gauche,
    marginBottom: colonne.bas,
    ...(colonne.bas ? { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' as const } : null),
  }
}

// Mise en page large : ordinateur, tablette (et telephone a l'horizontale
// assez haut). En dessous, la mise en page telephone, barre en bas.
export function useMiseEnPageLarge(): boolean {
  const { width, height } = useFenetre()
  return width >= 768 && height >= 520
}

// Colonne du grand ecran (bord gauche et largeur), ou null sur telephone.
export function useColonne(): { gauche: number; largeur: number } | null {
  const colonne = useContext(Contexte)
  const [, rafraichir] = useState(0)
  useEffect(() => {
    const f = () => rafraichir(n => n + 1)
    abonnes.add(f)
    return () => { abonnes.delete(f) }
  }, [])
  if (colonne) return { gauche: colonne.gauche, largeur: colonne.width }
  return colonneAffichee
}
