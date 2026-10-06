// Passage a la video suivante ou precedente depuis l'exterieur du fil :
// fleches du grand ecran (App) et clavier. Le fil s'abonne et defile.
type Ecouteur = (sens: 1 | -1) => void

const ecouteurs = new Set<Ecouteur>()

export function allerVideo(sens: 1 | -1) {
  ecouteurs.forEach(e => e(sens))
}

export function ecouterNavigationFil(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur)
  return () => { ecouteurs.delete(ecouteur) }
}
