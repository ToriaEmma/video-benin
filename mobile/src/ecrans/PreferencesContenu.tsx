// ============================================================
// Portage de app/src/pages/PreferencesContenu.tsx : memes ecrans,
// memes textes, memes illustrations SVG.
// ============================================================

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { Text } from '../composants/Texte'
import { Chevron, ChevronDroit } from '../composants/Icones'

type Ecran = 'menu' | 'motscles' | 'stem' | 'restreint' | 'sujets' | 'actualiser' | 'sourdine'

function Icone({ nom, taille = 24, couleur = '#111' }: {
  nom: string; taille?: number; couleur?: string
}) {
  const t = {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: couleur, strokeWidth: 1.7,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  return (
    <Svg {...t}>
      {nom === 'fiole' && <>
        <Path d="M9.5 3v6.2L5 18.6A2 2 0 0 0 6.8 21.5h10.4a2 2 0 0 0 1.8-2.9L14.5 9.2V3" />
        <Path d="M8.2 3h7.6M7.4 14.5h9.2" />
      </>}
      {nom === 'curseurs' && <>
        <Path d="M3 7.5h4M11 7.5h10M3 16.5h10M17 16.5h4" />
        <Circle cx="9" cy="7.5" r="2.2" />
        <Circle cx="15" cy="16.5" r="2.2" />
      </>}
      {nom === 'entonnoir' && (
        <Path d="M3.5 4.5h17l-6.6 7.8v7.2l-3.8-2.4v-4.8L3.5 4.5Z" />
      )}
      {nom === 'cadenas' && <>
        <Rect x="5" y="10.5" width="14" height="10.5" rx="2" fill={couleur} stroke="none" />
        <Path d="M8.2 10.5V7a3.8 3.8 0 0 1 7.6 0v3.5" />
        <Circle cx="12" cy="15.5" r="1.3" fill="#fff" stroke="none" />
      </>}
      {nom === 'info' && <>
        <Circle cx="12" cy="12" r="8.8" />
        <Path d="M12 11.2v5.4" />
        <Circle cx="12" cy="7.8" r="1" fill={couleur} stroke="none" />
      </>}
      {nom === 'silhouette' && <>
        <Circle cx="12" cy="8" r="4.6" />
        <Path d="M4.5 21.5c0-4.4 3.4-7 7.5-7s7.5 2.6 7.5 7" />
      </>}
    </Svg>
  )
}

// --- Illustrations des ecrans d'activation ---
const Ampoule = () => (
  <Svg width={112} height={112} viewBox="0 0 96 96" fill="none">
    <Path d="M48 12c-11 0-19.5 8.4-19.5 19 0 7 3.6 11.4 6.4 14.9 1.9 2.3 3.1 3.8 3.1 5.6v2.5h20v-2.5c0-1.8 1.2-3.3 3.1-5.6 2.8-3.5 6.4-7.9 6.4-14.9 0-10.6-8.5-19-19.5-19Z" fill="#16cce0" />
    <Path d="M42 54c0-3-6-6-6-13a12 12 0 0 1 24 0c0 7-6 10-6 13" stroke="#111" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M42 60h12M43 66h10M45 71h6" stroke="#111" strokeWidth={2.4} strokeLinecap="round" />
    <Path d="M69 26l7-4M72 38h8M68 50l7 4" stroke="#111" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
)

const Parapluie = () => (
  <Svg width={86} height={86} viewBox="0 0 72 72" fill="none">
    <Path d="M6 38c0-16 13.4-28 30-28s30 12 30 28c0 0-6-6-12-6s-9 6-9 6-3-6-9-6-9 6-9 6-3-6-9-6-12 6-12 6Z" fill="#111" />
    <Path d="M36 38v20a6 6 0 0 1-12 0" stroke="#111" strokeWidth={4} strokeLinecap="round" fill="none" />
  </Svg>
)

const Presse = () => (
  <Svg width={124} height={124} viewBox="0 0 120 120" fill="none">
    <Rect x="34" y="20" width="52" height="72" rx="4" stroke="#c8c8cc" strokeWidth={3.2} />
    <Rect x="50" y="14" width="20" height="10" rx="3" fill="#dcdce0" />
    <Path d="M46 44h28M46 56h28M46 68h18" stroke="#c8c8cc" strokeWidth={3.2} strokeLinecap="round" />
    <Path d="M34 78v14h14" stroke="#c8c8cc" strokeWidth={3.2} strokeLinejoin="round" />
    <Path d="m22 34 7 5M20 46h8" stroke="#c8c8cc" strokeWidth={3.2} strokeLinecap="round" />
    <Path d="m94 74 3.4 7.6L105 85l-7.6 3.4L94 96l-3.4-7.6L83 85l7.6-3.4L94 74Z" fill="#dcdce0" />
  </Svg>
)

const SUJETS = [
  'Animaux', 'Arts créatifs', 'Contenu généré par IA', 'Danse', 'Humour',
  'Lifestyle', 'Mode et beauté', 'Musique', 'Sport', 'Voyage',
]

function Barre({ titre, sousTitre, onRetour, action }: {
  titre?: string; sousTitre?: string; onRetour: () => void; action?: React.ReactNode
}) {
  return (
    <View style={s.barre}>
      <Pressable onPress={onRetour} hitSlop={10} style={s.barreBouton}>
        <Chevron taille={24} couleur="#111" />
      </Pressable>
      <View style={s.barreTitreGroupe}>
        {!!titre && <Text style={s.barreTitre} numberOfLines={1}>{titre}</Text>}
        {!!sousTitre && <Text style={s.barreSousTitre}>{sousTitre}</Text>}
      </View>
      <View style={s.barreAction}>{action}</View>
    </View>
  )
}

export default function PreferencesContenu({ onRetour }: { onRetour: () => void }) {
  const [ecran, setEcran] = useState<Ecran>('menu')
  const [stem, setStem] = useState(false)
  const [restreint, setRestreint] = useState(false)
  // Trois crans par sujet : moins (0), par defaut (1), plus (2).
  const [sujets, setSujets] = useState<Record<string, number>>(
    Object.fromEntries(SUJETS.map(x => [x, 1])),
  )
  const [motsCles] = useState<string[]>([])

  // ---------------- Menu ----------------
  if (ecran === 'menu') {
    const lignes = [
      { cle: 'motscles' as const, nom: 'Filtrer des mots-clés', valeur: String(motsCles.length) },
      { cle: 'stem' as const, nom: "Fil d'actualité STEM", valeur: stem ? 'Activé' : 'Désactivé' },
      { cle: 'restreint' as const, nom: 'Mode restreint', valeur: restreint ? 'Activé' : 'Désactivé' },
      { cle: 'sujets' as const, nom: 'Gérer les sujets' },
      { cle: 'actualiser' as const, nom: "Actualiser ton fil d'actualité Pour toi" },
      { cle: 'sourdine' as const, nom: 'Comptes mis en sourdine' },
    ]
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Préférences de contenu" onRetour={onRetour} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.carte}>
            {lignes.map(l => (
              <Pressable style={s.ligne} key={l.cle} onPress={() => setEcran(l.cle)}>
                <Text style={s.nom}>{l.nom}</Text>
                {!!l.valeur && <Text style={s.valeur}>{l.valeur}</Text>}
                <ChevronDroit taille={17} couleur="#c4c4c6" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Filtrer des mots-cles ----------------
  if (ecran === 'motscles') {
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Filtrer des mots-clés"
          sousTitre={`${motsCles.length} mots-clés`}
          onRetour={() => setEcran('menu')} />
        <ScrollView contentContainerStyle={[s.corps, s.centre]}>
          <View style={s.vide}>
            <Presse />
            <Text style={s.videTitre}>Ajouter un mot-clé</Text>
            <Text style={s.videTexte}>
              Lorsque tu filtres un mot-clé, tu ne vois pas les publications qui
              contiennent ce mot dans leur titre, leur description ou leurs
              stickers. Certains mots-clés ne peuvent pas être filtrés.
            </Text>
          </View>
        </ScrollView>
        <View style={s.pied}>
          <Pressable style={s.bouton}>
            <Text style={s.boutonTexte}>Ajouter un mot-clé</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ---------------- Fil STEM ----------------
  if (ecran === 'stem') {
    return (
      <SafeAreaView style={[s.page, s.blanc]} edges={['top']}>
        <Barre onRetour={() => setEcran('menu')} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.illustration}><Ampoule /></View>
          <Text style={s.grandTitre}>Fil d&apos;actualité STEM</Text>
          <View style={s.avantage}>
            <Icone nom="fiole" taille={23} />
            <Text style={s.avantageTexte}>
              Bénéficie d&apos;un fil d&apos;actualité contenant des vidéos sur
              les sciences, la technologie, l&apos;ingénierie et les mathématiques
            </Text>
          </View>
          <View style={s.avantage}>
            <Icone nom="curseurs" taille={23} />
            <Text style={s.avantageTexte}>Active et désactive-le à tout moment</Text>
          </View>
        </ScrollView>
        <View style={s.pied}>
          <Pressable style={s.bouton}
            onPress={() => { setStem(!stem); setEcran('menu') }}>
            <Text style={s.boutonTexte}>{stem ? 'Désactiver' : 'Activer'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ---------------- Mode restreint ----------------
  if (ecran === 'restreint') {
    return (
      <SafeAreaView style={[s.page, s.blanc]} edges={['top']}>
        <Barre onRetour={() => setEcran('menu')} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={[s.illustration, s.illustrationSerree]}><Parapluie /></View>
          <Text style={s.titreEtat}>
            Mode restreint : <Text style={s.titreEtatValeur}>
              {restreint ? 'Activé' : 'Désactivé'}
            </Text>
          </Text>
          <View style={s.filet} />
          <View style={s.avantage}>
            <Icone nom="entonnoir" taille={23} />
            <Text style={s.avantageTexte}>
              Limite le contenu non adapté à certains publics. Si tu trouves du
              contenu qui te met mal à l&apos;aise en mode restreint,
              signale-le pour nous aider à nous améliorer.
            </Text>
          </View>
          <View style={s.avantage}>
            <Icone nom="cadenas" taille={23} />
            <Text style={s.avantageTexte}>
              Active et désactive le paramètre à tout moment
            </Text>
          </View>
        </ScrollView>
        <View style={s.pied}>
          <Pressable style={s.bouton}
            onPress={() => { setRestreint(!restreint); setEcran('menu') }}>
            <Text style={s.boutonTexte}>{restreint ? 'Désactiver' : 'Activer'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ---------------- Gerer les sujets ----------------
  if (ecran === 'sujets') {
    const etiquette = ['Moins', 'Par défaut', 'Plus']
    return (
      <SafeAreaView style={[s.page, s.blanc]} edges={['top']}>
        <View style={s.barreTexte}>
          <Pressable hitSlop={10} onPress={() => setEcran('menu')}>
            <Text style={s.barreLien}>Retour</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={() => setEcran('menu')}>
            <Text style={[s.barreLien, s.enregistrer]}>Enregistrer</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={s.corps}>
          <Text style={[s.grandTitre, s.grandTitreGauche]}>Gérer les sujets</Text>
          <Text style={s.intro}>
            Personnalise ton fil d&apos;actualité pour voir davantage ou moins
            de contenu que tu aimes. <Text style={s.gras}>En savoir plus</Text>
          </Text>
          {SUJETS.map(x => (
            <View style={s.sujet} key={x}>
              <View style={s.sujetEntete}>
                <View style={s.sujetNomGroupe}>
                  <Text style={s.sujetNom}>{x}</Text>
                  <Icone nom="info" taille={16} couleur="#888" />
                </View>
                <Text style={s.sujetValeur}>{etiquette[sujets[x]]}</Text>
              </View>
              {/* Trois crans : React Native n'a pas de <input type=range>,
                  on pose donc trois pastilles sur une piste. */}
              <View style={s.curseur}>
                <View style={s.piste} />
                {[0, 1, 2].map(n => (
                  <Pressable key={n} hitSlop={10}
                    style={[s.cran, sujets[x] === n && s.cranActif]}
                    onPress={() => setSujets(v => ({ ...v, [x]: n }))} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ---------------- Actualiser le fil ----------------
  if (ecran === 'actualiser') {
    const etapes = [
      'Nous allons temporairement te montrer du contenu populaire que tu ne vois peut-être pas normalement.',
      "Plus tu aimes, commentes et partages du contenu, mieux nous pourrons mettre à jour ton fil d'actualité.",
      "Une fois actualisé, ton fil d'actualité reflétera tes nouveaux et tes anciens centres d'intérêt.",
    ]
    return (
      <SafeAreaView style={[s.page, s.blanc]} edges={['top']}>
        <Barre onRetour={() => setEcran('menu')}
          action={<Pressable hitSlop={8}><Icone nom="info" taille={22} /></Pressable>} />
        <ScrollView contentContainerStyle={s.corps}>
          <View style={s.pilule}>
            <Text style={s.piluleTexte}>Actualisation de ton fil…</Text>
            <ChevronDroit taille={15} couleur="#888" />
          </View>
          <View style={s.points}>
            <View style={[s.point, s.pointActif]} />
            <View style={s.point} />
            <View style={s.point} />
          </View>
          <Text style={s.grandTitre}>Actualise ton fil d&apos;actualité</Text>
          {etapes.map((texte, i) => (
            <View style={s.etape} key={i}>
              <View style={s.etapeNumero}>
                <Text style={s.etapeNumeroTexte}>{i + 1}</Text>
              </View>
              <Text style={s.etapeTexte}>{texte}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={s.pied}>
          <Pressable style={s.bouton} onPress={() => setEcran('menu')}>
            <Text style={s.boutonTexte}>Commencer</Text>
          </Pressable>
          <Text style={s.note}>Tu peux arrêter l&apos;actualisation à tout moment</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ---------------- Comptes mis en sourdine ----------------
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Comptes mis en sourdine" onRetour={() => setEcran('menu')} />
      <ScrollView contentContainerStyle={[s.corps, s.centre]}>
        <View style={s.vide}>
          <Icone nom="silhouette" taille={72} couleur="#aaa" />
          <Text style={s.videTitre}>Aucun compte mis en sourdine</Text>
          <Text style={s.videTexte}>
            Les comptes que tu auras mis en sourdine apparaîtront ici. Les
            publications importées par les comptes mis en sourdine
            n&apos;apparaîtront pas dans tes fils d&apos;actualité Pour toi,
            Suivis et Ami(e)s.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Styles repris de preferences.css.
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },
  blanc: { backgroundColor: '#fff' },

  barre: { flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 48, paddingHorizontal: 12 },
  barreBouton: { width: 36, height: 40, justifyContent: 'center' },
  barreTitreGroupe: { flex: 1, alignItems: 'center' },
  barreTitre: { fontSize: 17, fontWeight: '600', color: '#111' },
  barreSousTitre: { fontSize: 12, color: '#888', marginTop: 2 },
  barreAction: { width: 36, alignItems: 'flex-end' },

  barreTexte: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', minHeight: 48, paddingHorizontal: 16 },
  barreLien: { fontSize: 16, color: '#111' },
  enregistrer: { fontWeight: '600' },

  corps: { paddingHorizontal: 16, paddingBottom: 28 },
  centre: { flexGrow: 1, justifyContent: 'center' },

  carte: { backgroundColor: '#fff', borderRadius: 10, marginTop: 10,
    paddingHorizontal: 16 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10,
    minHeight: 56, paddingVertical: 12 },
  nom: { flex: 1, fontSize: 16, color: '#111' },
  valeur: { fontSize: 14, color: '#888' },

  vide: { alignItems: 'center', paddingHorizontal: 10, gap: 14 },
  videTitre: { fontSize: 17, fontWeight: '700', color: '#111',
    textAlign: 'center', marginTop: 10 },
  videTexte: { fontSize: 14, lineHeight: 19, color: '#888', textAlign: 'center' },

  illustration: { alignItems: 'center', paddingTop: 40, paddingBottom: 30 },
  illustrationSerree: { paddingTop: 30, paddingBottom: 20 },
  grandTitre: { fontSize: 27, fontWeight: '800', color: '#111',
    textAlign: 'center', lineHeight: 32, marginBottom: 32, letterSpacing: -.5 },
  grandTitreGauche: { textAlign: 'left', marginBottom: 12 },

  titreEtat: { fontSize: 22, fontWeight: '700', color: '#111',
    textAlign: 'center', marginBottom: 20 },
  titreEtatValeur: { color: '#888' },
  filet: { height: 1, backgroundColor: '#eee', marginBottom: 24 },

  avantage: { flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    marginBottom: 26 },
  avantageTexte: { flex: 1, fontSize: 15, lineHeight: 21, color: '#444' },

  intro: { fontSize: 14, lineHeight: 19, color: '#888', marginBottom: 24 },
  gras: { color: '#111', fontWeight: '700' },

  sujet: { marginBottom: 26 },
  sujetEntete: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12 },
  sujetNomGroupe: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sujetNom: { fontSize: 16, color: '#111' },
  sujetValeur: { fontSize: 14, color: '#888' },
  curseur: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', height: 22 },
  piste: { position: 'absolute', left: 0, right: 0, height: 3,
    borderRadius: 2, backgroundColor: '#ececec' },
  cran: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#d4d4d8' },
  cranActif: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#111' },

  pilule: { flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: '#f1f1f2', borderRadius: 16,
    paddingVertical: 8, paddingHorizontal: 14, marginTop: 20 },
  piluleTexte: { fontSize: 13, color: '#666' },
  points: { flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: 18, marginBottom: 26 },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dcdce0' },
  pointActif: { backgroundColor: '#111', width: 16 },

  etape: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  etapeNumero: { width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#f1f1f2', alignItems: 'center', justifyContent: 'center' },
  etapeNumeroTexte: { fontSize: 13, fontWeight: '700', color: '#111' },
  etapeTexte: { flex: 1, fontSize: 14.5, lineHeight: 20, color: '#444' },

  pied: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 },
  bouton: { backgroundColor: '#ff2856', borderRadius: 8, minHeight: 48,
    alignItems: 'center', justifyContent: 'center' },
  boutonTexte: { color: '#fff', fontSize: 17, fontWeight: '500' },
  note: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 },
})
