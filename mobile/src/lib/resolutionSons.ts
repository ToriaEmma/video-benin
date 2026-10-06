// Sons rattaches a une publication par un identifiant distant :
// - « dz:<numero> »  : extrait Deezer, redemande a la lecture ;
// - « video:<id> »   : son original d'une autre video (sa piste audio).
//   Si cette video utilisait elle-meme un son, c'est ce son qui revient,
//   comme sur TikTok.
import { apiVideos } from './api'
import { sonDeezer } from './deezer'
import { sonOriginal, sonParId, type Son } from './sons'

export const estSonDistant = (id?: string | null): id is string =>
  !!id && (id.startsWith('dz:') || id.startsWith('video:'))

const cache = new Map<string, Promise<Son | null>>()

export function resoudreSon(id: string, profondeur = 0): Promise<Son | null> {
  if (id.startsWith('dz:')) return sonDeezer(id)
  if (!id.startsWith('video:')) return Promise.resolve(sonParId(id))
  if (!cache.has(id)) {
    const promesse = apiVideos.une(id.slice(6))
      .then(v => {
        if (v.sonId && profondeur < 3) return resoudreSon(v.sonId, profondeur + 1)
        return sonOriginal({ id: v.id, url: v.url, pseudo: v.pseudo })
      })
      .catch(() => { cache.delete(id); return null })
    cache.set(id, promesse)
  }
  return cache.get(id)!
}
