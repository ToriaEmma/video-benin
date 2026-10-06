// Feuille ouverte en touchant le disque d'une video : le son de la
// publication, a mettre en favori ou a reprendre pour sa propre video.
import React from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { Text } from './Texte'
import Feuille from './Feuille'
import { MarquePage, Camera, SonNote } from './Icones'
import { abregerPublications, type Son } from '../lib/sons'
import { basculerFavoriSon, useFavorisSons } from '../lib/favorisSons'

export default function FeuilleSon({ visible, son, pseudo, onFermer, onUtiliser }: {
  visible: boolean
  // Null : la video garde sa propre piste (« son original »).
  son: Son | null
  pseudo: string
  onFermer: () => void
  onUtiliser: (son: Son) => void
}) {
  const { estFavori } = useFavorisSons()
  const favori = !!son && estFavori(son.id)

  return (
    <Feuille visible={visible} titre="Son" onFermer={onFermer}>
      <View style={s.corps}>
        <View style={s.entete}>
          <View style={[s.pochette, { backgroundColor: son?.couleur ?? '#2a2a2a' }]}>
            {son?.pochette
              ? <Image source={{ uri: son.pochette }} style={s.image} />
              : <SonNote taille={30} couleur="#fff" />}
          </View>
          <View style={s.textes}>
            <Text style={s.titre} numberOfLines={2}>{son ? son.titre : 'son original'}</Text>
            <Text style={s.artiste} numberOfLines={1}>{son ? (son.original ? `@${son.artiste}` : son.artiste) : `@${pseudo}`}</Text>
            <Text style={s.meta} numberOfLines={1}>
              {son ? (son.original ? 'Son original · piste de la vidéo' : `${abregerPublications(son.publications)} publications · ${son.licence}`) : 'Piste enregistrée avec la vidéo'}
            </Text>
          </View>
        </View>

        {!son && (
          <Text style={s.avis}>
            Ce son fait partie de la vidéo : il ne peut pas encore être repris dans une autre publication.
          </Text>
        )}

        <View style={s.boutons}>
          <Pressable style={[s.bouton, s.boutonGris, !son && s.inactif]} disabled={!son}
            onPress={() => son && basculerFavoriSon(son)}>
            <MarquePage taille={20} couleur="#111" plein={favori} />
            <Text style={s.boutonGrisTexte}>{favori ? 'Dans tes favoris' : 'Ajouter aux favoris'}</Text>
          </Pressable>
          <Pressable style={[s.bouton, s.boutonRose, !son && s.inactif]} disabled={!son}
            onPress={() => { if (son) { onFermer(); onUtiliser(son) } }}>
            <Camera taille={20} couleur="#fff" />
            <Text style={s.boutonRoseTexte}>Utiliser ce son</Text>
          </Pressable>
        </View>
      </View>
    </Feuille>
  )
}

const s = StyleSheet.create({
  corps: { paddingHorizontal: 16, paddingBottom: 26, gap: 18 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pochette: { width: 76, height: 76, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  textes: { flex: 1, gap: 3 },
  titre: { fontSize: 18, fontWeight: '700', color: '#111' },
  artiste: { fontSize: 14.5, color: '#444' },
  meta: { fontSize: 12.5, color: '#8e8e93' },
  avis: { fontSize: 13.5, lineHeight: 19, color: '#8e8e93' },
  boutons: { flexDirection: 'row', gap: 10 },
  bouton: { flex: 1, minHeight: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 },
  boutonGris: { backgroundColor: '#f1f1f2' },
  boutonGrisTexte: { fontSize: 15, fontWeight: '700', color: '#111' },
  boutonRose: { backgroundColor: '#ff2856' },
  boutonRoseTexte: { fontSize: 15, fontWeight: '700', color: '#fff' },
  inactif: { opacity: .45 },
})
