// Version web de expo-media-library : un navigateur n'a pas acces a la
// pellicule. Le cadre « galerie » garde son icone et l'import passe par le
// selecteur de fichiers (expo-image-picker, qui fonctionne sur le web).
export const requestPermissionsAsync = async () => ({ granted: false, canAskAgain: false, status: 'denied' as const })
export const getPermissionsAsync = requestPermissionsAsync
export const getAssetsAsync = async () => ({ assets: [] as { uri: string }[], endCursor: '', hasNextPage: false, totalCount: 0 })
export const saveToLibraryAsync = async (uri: string) => {
  // Sur le web, « enregistrer » telecharge le fichier.
  const a = document.createElement('a'); a.href = uri; a.download = 'tocktick.mp4'; a.click()
}
export const createAssetAsync = async (uri: string) => { await saveToLibraryAsync(uri); return { uri } }
export const MediaType = { video: 'video', photo: 'photo', audio: 'audio' }
export const SortBy = { creationTime: 'creationTime' }
