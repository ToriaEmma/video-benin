import { useCallback, useRef } from 'react'
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

// Sur le web, `onMomentumScrollEnd` n'est jamais emis : la carte active ne
// changeait donc pas au defilement (l'ancienne video continuait, la nouvelle
// restait noire). On detecte ici la fin du geste, aimantation comprise, a
// l'arret des evenements `onScroll`. Sur Android et iOS, rien ne change.
export function useFinDefilementWeb(surFin: (y: number) => void) {
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rappel = useRef(surFin)
  rappel.current = surFin
  return useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS !== 'web') return
    const y = e.nativeEvent.contentOffset.y
    if (minuteur.current) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => rappel.current(y), 120)
  }, [])
}
