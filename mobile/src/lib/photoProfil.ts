// Choix d'une photo de profil : galerie, recadrage carre, envoi en data URL
// dans `avatar_url`. Sur le web l'image est reduite a 400 px (JPEG), pour
// rester legere ; ailleurs le selecteur recadre et compresse.
import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

async function reduireWeb(uri: string): Promise<string> {
  const img = new Image()
  img.src = uri
  await img.decode()
  const cote = 400
  const toile = document.createElement('canvas')
  toile.width = cote; toile.height = cote
  const ctx = toile.getContext('2d')!
  // Recadrage carre au centre, comme le cercle de l'avatar.
  const c = Math.min(img.naturalWidth, img.naturalHeight)
  ctx.drawImage(img, (img.naturalWidth - c) / 2, (img.naturalHeight - c) / 2, c, c, 0, 0, cote, cote)
  return toile.toDataURL('image/jpeg', 0.85)
}

// Renvoie la photo prete a enregistrer, ou null si rien n'est choisi.
export async function choisirPhotoProfil(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) throw new Error('Autorise l’accès à tes photos pour choisir une photo de profil.')
  }
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], quality: .7, base64: Platform.OS !== 'web',
    allowsEditing: Platform.OS !== 'web', aspect: [1, 1],
  })
  if (r.canceled || !r.assets[0]) return null
  const image = r.assets[0]
  if (Platform.OS === 'web') return reduireWeb(image.uri)
  // L'API refuse une photo de plus de 300 Ko (encodee).
  if ((image.fileSize ?? 0) > 280_000) throw new Error('Choisis une image plus légère (moins de 280 Ko).')
  return image.base64 ? `data:image/jpeg;base64,${image.base64}` : image.uri
}
