// Miniature d'une video (image de couverture) : sur mobile, pas de toile
// pour la fabriquer ; la publication part sans miniature.
import type { ChoixCouverture } from '../ecrans/Couverture'

export async function fabriquerMiniature(_video: string, _choix?: ChoixCouverture | null): Promise<Blob | null> {
  return null
}
