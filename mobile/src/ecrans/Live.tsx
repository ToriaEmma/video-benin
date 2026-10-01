// ============================================================
// Portage de app/src/pages/Live.tsx : memes sous-ecrans, memes
// intitules, memes traces SVG.
// ============================================================

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Rect, Circle, G } from 'react-native-svg'
import { Text, TextInput } from '../composants/Texte'
import { Chevron, ChevronDroit, Cloche } from '../composants/Icones'

type Ecran = 'accueil' | 'evenements' | 'promotion' | 'creer'
  | 'enregistrements' | 'reglages' | 'aide' | 'moderateurs' | 'publications'

type Evenement = {
  nom: string; date: string; duree: string; description: string; adultes: boolean
}

// Calendrier etoile (evenements) ou fleche de rejeu (enregistrements).
function Symbole({ replay = false, taille = 23, couleur = '#aaa' }: {
  replay?: boolean; taille?: number; couleur?: string
}) {
  const t = {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: couleur, strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  return (
    <Svg {...t}>
      {replay ? <>
        <Path d="M3 11a9 9 0 1 1 2 7M1 8l2 5 4-3" />
        <Path d="m10 7 7 5-7 5Z" fill={couleur} stroke="none" />
      </> : <>
        <Rect x="3" y="5" width="18" height="17" rx="2" />
        <Path d="M7 2v6M17 2v6" />
        <Path d="m12 9 1.55 3.14 3.47.51-2.51 2.44.59 3.45L12 16.91l-3.1 1.63.59-3.45-2.51-2.44 3.47-.51Z" />
      </>}
    </Svg>
  )
}

// Illustration des listes vides de « Publications video ».
const Nuage = () => (
  <Svg width={145} height={100} viewBox="0 0 160 110" fill="none">
    <Path d="M30 13c-25 0-31 33-7 40 13 4 28-1 43 9-9-10-1-24-9-37-5-8-15-12-27-12Z" fill="#ddd" />
    <Path d="m25 31-1 6m13-5v6m12-4-2 6" stroke="white" strokeWidth={4} />
    <G stroke="#bfbfbf" strokeWidth={3.5}>
      <Path d="M88 65c-9-21-8-48 10-49 13-2 20 7 25 15l9 8-7 7 1 15c18 8 25 18 29 33M82 40l45-22M98 40q3 8 7 0m4-4q4 8 8-1m-18 12q12 14 22-3M89 66c-22 4-35 15-29 24 7 6 15-10-10-18-18-6-31-4-17 3-26-4-38 7-18 8 20-1 30 3 35 13" />
    </G>
  </Svg>
)

// Interrupteur vert de la page LIVE (.live-switch).
function Interrupteur({ actif, changer }: { actif: boolean; changer: () => void }) {
  return (
    <Pressable hitSlop={8} onPress={changer}
      style={[s.switch, actif && s.switchActif]}>
      <View style={[s.switchPastille, actif && s.switchPastilleActive]} />
    </Pressable>
  )
}

export default function Live({ onRetour }: { onRetour: () => void }) {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [onglet, setOnglet] = useState('Créés')
  const [replay, setReplay] = useState('Temps forts')
  const [options, setOptions] = useState<Record<string, boolean>>({})
  const [banniere, setBanniere] = useState(true)
  const [nom, setNom] = useState('')
  const [duree, setDuree] = useState('60')
  const [description, setDescription] = useState('')
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [origineAide, setOrigineAide] = useState<Ecran>('evenements')

  const changer = (cle: string) => setOptions(o => ({ ...o, [cle]: !o[cle] }))
  const aide = () => { setOrigineAide(ecran); setEcran('aide') }

  const retour = () => {
    if (ecran === 'accueil') onRetour()
    else setEcran(
      ecran === 'aide' ? origineAide
      : ecran === 'moderateurs' ? 'reglages'
      : ecran === 'reglages' || ecran === 'publications' ? 'enregistrements'
      : ecran === 'creer' || ecran === 'promotion' ? 'evenements'
      : 'accueil')
  }

  const titres: Record<Ecran, string> = {
    accueil: 'LIVE', evenements: 'Événements LIVE',
    promotion: 'Paramètres de l’événement', creer: '',
    enregistrements: 'Enregistrements de LIVE', reglages: 'Paramètres',
    aide: 'Aide LIVE', moderateurs: 'Modérateurs et modératrices',
    publications: '',
  }

  // Bloc « titre + interrupteur + explication » des ecrans de reglages.
  const reglage = (cle: string, titre: string, texte: string) => (
    <View style={s.reglage} key={cle}>
      <View style={s.reglageHaut}>
        <Text style={s.reglageTitre}>{titre}</Text>
        <Interrupteur actif={!!options[cle]} changer={() => changer(cle)} />
      </View>
      <Text style={s.reglageTexte}>{texte}</Text>
    </View>
  )

  const creerEvenement = () => {
    if (!nom.trim()) return
    setEvenements(l => [...l, {
      nom: nom.trim(), date: new Date().toISOString(), duree, description,
      adultes: !!options.adultes,
    }])
    setNom(''); setDescription(''); setOnglet('Créés'); setEcran('evenements')
  }

  return (
    <SafeAreaView style={[s.page, ecran === 'creer' && s.blanc]} edges={['top']}>
      {/* En-tete commun */}
      <View style={s.entete}>
        <Pressable onPress={retour} hitSlop={10} style={s.enteteBouton}>
          <Chevron taille={24} couleur="#111" />
        </Pressable>
        <Text style={s.enteteTitre} numberOfLines={1}>{titres[ecran]}</Text>
        <View style={s.enteteActions}>
          {ecran === 'evenements' && <>
            <Pressable hitSlop={8} onPress={() => setEcran('promotion')}>
              <Text style={s.points}>•••</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={aide}>
              <View style={s.aideRond}><Text style={s.aideTexte}>?</Text></View>
            </Pressable>
          </>}
          {ecran === 'reglages' && (
            <Pressable hitSlop={8} onPress={aide}>
              <View style={s.aideRond}><Text style={s.aideTexte}>?</Text></View>
            </Pressable>
          )}
          {ecran === 'enregistrements' && <>
            <Pressable hitSlop={8} onPress={() => setEcran('publications')}>
              <Svg width={25} height={25} viewBox="0 0 24 24" fill="none"
                stroke="#111" strokeWidth={1.8} strokeLinejoin="round">
                <Path d="M15 3H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
                <Path d="m9 9 6 4-6 4Z" fill="#111" stroke="none" />
                <Path d="m19 0 1.4 3.6L24 5l-3.6 1.4L19 10l-1.4-3.6L14 5l3.6-1.4Z" fill="#111" stroke="none" />
              </Svg>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setEcran('reglages')}>
              <Svg width={25} height={25} viewBox="0 0 24 24" fill="none"
                stroke="#111" strokeWidth={1.8}>
                <Path d="m9 2-1 3-3 1-2 4 2 2-1 4 3 3 3-1 3 3 4-2 1-3 3-2-1-4-3-1-1-4Z" />
                <Circle cx="12" cy="12" r="4" />
              </Svg>
            </Pressable>
          </>}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.corps}>
        {/* ---------------- Accueil ---------------- */}
        {ecran === 'accueil' && (
          <View style={s.menu}>
            {['Événements LIVE', 'Enregistrements de LIVE'].map((t, i) => (
              <Pressable key={t} style={s.menuLigne}
                onPress={() => setEcran(i ? 'enregistrements' : 'evenements')}>
                <Symbole replay={!!i} />
                <Text style={s.menuTexte}>{t}</Text>
                <ChevronDroit taille={18} couleur="#aaa" />
              </Pressable>
            ))}
          </View>
        )}

        {/* ---------------- Evenements ---------------- */}
        {ecran === 'evenements' && <>
          <View style={s.onglets}>
            {['Créés', 'Inscrit(e)'].map(t => (
              <Pressable key={t} onPress={() => setOnglet(t)}
                style={[s.onglet, onglet === t && s.ongletActif]}>
                <Text style={[s.ongletTexte, onglet === t && s.ongletTexteActif]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {onglet === 'Créés' ? <>
            {evenements.length ? (
              <View style={s.liste}>
                {evenements.map((e, i) => (
                  <View style={s.carte} key={i}>
                    <Text style={s.carteTitre}>{e.nom}</Text>
                    <Text style={s.carteTexte}>
                      {new Date(e.date).toLocaleString('fr-FR')} · {e.duree} min
                    </Text>
                    {!!e.description && (
                      <Text style={s.carteTexte}>{e.description}</Text>
                    )}
                    <Text style={s.petit}>
                      Brouillon local{e.adultes ? ' · Public 18+' : ''} — non publié
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.presentation}>
                <Text style={s.presentationTitre}>
                  Crée un événement pour{'\n'}ton prochain LIVE
                </Text>
                <View style={s.presentationBloc}>
                  <Symbole couleur="#111" taille={24} />
                  <View style={s.presentationCorps}>
                    <Text style={s.presentationSousTitre}>
                      Annonce ton programme LIVE
                    </Text>
                    <Text style={s.presentationTexte}>
                      Le lien de l’événement apparaîtra sur tes vidéos
                      promotionnelles et ta page de profil. Les spectateurs
                      peuvent s’inscrire en avance.
                    </Text>
                  </View>
                </View>
                <View style={s.presentationBloc}>
                  <Cloche taille={24} couleur="#111" />
                  <View style={s.presentationCorps}>
                    <Text style={s.presentationSousTitre}>
                      Garde les spectateurs au courant
                    </Text>
                    <Text style={s.presentationTexte}>
                      Les followers et les spectateurs inscrits recevront une
                      notification au début de l’événement.
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <Pressable style={s.principal} onPress={() => setEcran('creer')}>
              <Text style={s.principalTexte}>Créer un événement</Text>
            </Pressable>
          </> : (
            <View style={s.vide}>
              <Symbole taille={76} />
              <Text style={s.videTitre}>Pas d’événements LIVE enregistrés</Text>
              <Text style={s.videTexte}>
                Explore et participe à plus d’événements LIVE
              </Text>
            </View>
          )}
        </>}

        {/* ---------------- Promotion ---------------- */}
        {ecran === 'promotion' && (
          <View style={s.carte}>
            {reglage('promotion', 'Promotion d’événements à venir',
              'Promeus les événements LIVE sur tes vidéos. Seul ton prochain événement à venir sera promu. Les liens vers les événements ne seront affichés que dans « Pour toi » et « Suivis ».')}
          </View>
        )}

        {/* ---------------- Creer un evenement ---------------- */}
        {ecran === 'creer' && <>
          <Text style={s.formTitre}>Créer un événement</Text>

          <Text style={s.label}>
            Nom de l’événement <Text style={s.etoile}>*</Text>
          </Text>
          <View style={s.champ}>
            <TextInput style={s.saisie} maxLength={32}
              placeholder="Saisis le nom de l’événement" placeholderTextColor="#aaa"
              value={nom} onChangeText={setNom} />
            <Text style={s.compteur}>{nom.length}/32</Text>
          </View>

          <Text style={s.label}>Durée</Text>
          <View style={s.dureeLigne}>
            {['30', '60', '90', '120'].map(n => (
              <Pressable key={n} onPress={() => setDuree(n)}
                style={[s.dureeChoix, duree === n && s.dureeChoisie]}>
                <Text style={[s.dureeTexte, duree === n && s.dureeTexteChoisi]}>
                  {n} min
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Description</Text>
          <View style={[s.champ, s.champDescription]}>
            <TextInput style={[s.saisie, s.saisieLongue]} maxLength={200} multiline
              placeholder="Décris en quoi consiste cet événement"
              placeholderTextColor="#aaa"
              value={description} onChangeText={setDescription} />
            <Text style={[s.compteur, s.compteurDroite]}>
              {description.length}/200
            </Text>
          </View>

          <View style={s.reglage}>
            <View style={s.reglageHaut}>
              <Text style={s.reglageTitre}>Contrôle du public ⓘ</Text>
              <Interrupteur actif={!!options.adultes}
                changer={() => changer('adultes')} />
            </View>
            <Text style={s.reglageTexte}>
              Ce LIVE n’est accessible que pour les utilisateurs de 18 ans ou plus.
            </Text>
          </View>

          <Text style={s.demo}>
            Démonstration : création d’un brouillon local uniquement, sans
            diffusion ni notification.
          </Text>
          <Pressable style={[s.principal, !nom.trim() && s.principalInactif]}
            onPress={creerEvenement} disabled={!nom.trim()}>
            <Text style={s.principalTexte}>Créer</Text>
          </Pressable>
        </>}

        {/* ---------------- Enregistrements ---------------- */}
        {ecran === 'enregistrements' && <>
          {banniere && !options.notifications && (
            <View style={s.banniere}>
              <Pressable style={s.banniereFermer} hitSlop={8}
                onPress={() => setBanniere(false)}>
                <Text style={s.banniereCroix}>×</Text>
              </Pressable>
              <Text style={s.banniereTitre} numberOfLines={1}>
                Recevoir des notifications en cas de nouveaux temps forts
              </Text>
              <Text style={s.banniereTexte} numberOfLines={2}>
                Reçois des notifications dans ta boîte de réception lorsque de
                nouveaux temps forts sont prêts à être publiés.
              </Text>
              <Pressable hitSlop={6} onPress={() => changer('notifications')}>
                <Text style={s.banniereActiver}>Activer</Text>
              </Pressable>
            </View>
          )}

          <View style={s.onglets}>
            {['Temps forts', 'Rediffusions', 'Clips'].map(t => (
              <Pressable key={t} onPress={() => setReplay(t)}
                style={[s.onglet, replay === t && s.ongletActif]}>
                <Text style={[s.ongletTexte, replay === t && s.ongletTexteActif]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[s.vide, s.videReplays]}>
            <Symbole replay taille={92} />
            <Text style={s.replaysTitre}>
              {replay === 'Temps forts' ? 'Aucun temps fort pour le moment'
                : replay === 'Clips' ? 'Aucun clip pour le moment'
                : 'Aucune rediffusion pour le moment'}
            </Text>
            <Text style={s.videTexte}>
              {replay === 'Temps forts'
                ? 'Les temps forts sont générés automatiquement à partir de tes diffusions LIVE.'
                : 'Tes enregistrements apparaîtront ici après tes diffusions LIVE.'}
            </Text>
          </View>
        </>}

        {/* ---------------- Reglages ---------------- */}
        {ecran === 'reglages' && <>
          <View style={s.carte}>
            {reglage('notifications',
              'Recevoir des notifications en cas de nouveaux temps forts',
              'Reçois des notifications dans ta boîte de réception lorsque de nouveaux temps forts sont prêts à être publiés.')}
          </View>
          <View style={s.carte}>
            {reglage('fans', 'Fan Club',
              'Une fois cette option activée, les fans de ton Fan Club pourront publier des temps forts de tes LIVE.')}
            {reglage('invites', 'Partager les enregistrements avec les invités',
              'Après chaque LIVE multi-invité, les invité(e)s reçoivent les enregistrements par le biais de notifications dans leur boîte de réception.')}
            <View style={s.reglage}>
              <Pressable style={s.moderateurs} onPress={() => setEcran('moderateurs')}>
                <Text style={[s.reglageTitre, s.moderateursTitre]}>
                  Partager les enregistrements avec les modérateur(trice)s
                </Text>
                <Text style={s.moderateursValeur}>0 ›</Text>
              </Pressable>
              <Text style={s.reglageTexte}>
                Après chaque LIVE, les modérateur(trice)s sélectionné(e)s
                reçoivent les enregistrements par le biais de notifications
                dans leur boîte de réception.
              </Text>
            </View>
            {reglage('donateurs',
              'Partager des temps forts avec les donateur(trice)s',
              'Après chacun de tes LIVE, tes donateur(trice)s reçoivent leurs temps forts via des notifications dans leur boîte de réception.')}
          </View>
          <Text style={s.demo}>
            Réglages de démonstration — les envois ne sont pas encore activés.
          </Text>
        </>}

        {/* ---------------- Aide ---------------- */}
        {ecran === 'aide' && (
          <View style={s.carte}>
            <Text style={s.carteTitre}>Événements et enregistrements LIVE</Text>
            <Text style={s.carteTexte}>
              Prépare un événement depuis l’onglet Créés. Les onglets Temps
              forts, Rediffusions et Clips regroupent les différents
              enregistrements.
            </Text>
            <Text style={s.carteTexte}>
              Cette version présente le parcours : les événements restent des
              brouillons locaux et aucune diffusion, promotion ou notification
              n’est envoyée.
            </Text>
          </View>
        )}

        {/* ---------------- Publications video ---------------- */}
        {ecran === 'publications' && <>
          <Text style={s.publicationsTitre}>Publications vidéo</Text>
          {['Tes publications', 'Partagées par d’autres personnes'].map((titre, i) => (
            <View style={s.publicationsCarte} key={titre}>
              <Text style={s.publicationsSousTitre}>{titre}</Text>
              <View style={s.publicationsVide}>
                <Nuage />
                <Text style={s.publicationsVideTitre}>
                  Aucune publication pour le moment
                </Text>
                <Text style={s.publicationsVideTexte}>
                  {i === 0
                    ? 'Les publications que tu crées à partir de tes enregistrements de LIVE s’affichent ici.'
                    : 'Les publications créées par les autres personnes à partir des enregistrements de LIVE que tu partages s’affichent ici.'}
                </Text>
              </View>
            </View>
          ))}
        </>}

        {/* ---------------- Moderateurs ---------------- */}
        {ecran === 'moderateurs' && (
          <View style={s.vide}>
            <Text style={s.videTitre}>Aucun modérateur pour le moment</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Styles repris de live.css.
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },
  blanc: { backgroundColor: '#fff' },

  entete: { flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 48, paddingHorizontal: 12, marginBottom: 10 },
  enteteBouton: { width: 36, height: 40, justifyContent: 'center' },
  enteteTitre: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111',
    textAlign: 'center' },
  enteteActions: { width: 70, flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', gap: 6 },
  points: { fontSize: 17, color: '#111' },
  aideRond: { width: 23, height: 23, borderRadius: 12, borderWidth: 2,
    borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  aideTexte: { fontSize: 14, fontWeight: '700', color: '#111', lineHeight: 17 },

  corps: { paddingHorizontal: 12, paddingBottom: 28, flexGrow: 1 },

  carte: { backgroundColor: '#fff', borderRadius: 10, padding: 16,
    marginBottom: 16 },
  carteTitre: { fontSize: 16, fontWeight: '500', color: '#111', lineHeight: 21 },
  carteTexte: { fontSize: 13, color: '#888', lineHeight: 18, marginTop: 5 },
  petit: { fontSize: 11, color: '#888', marginTop: 8 },

  menu: { backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 16,
    marginTop: 14 },
  menuLigne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 66 },
  menuTexte: { flex: 1, fontSize: 16, color: '#111' },

  onglets: { flexDirection: 'row', marginHorizontal: -12,
    borderBottomWidth: 1, borderBottomColor: '#ddd' },
  onglet: { flex: 1, minHeight: 42, alignItems: 'center',
    justifyContent: 'center', borderBottomWidth: 2,
    borderBottomColor: 'transparent' },
  ongletActif: { borderBottomColor: '#111' },
  ongletTexte: { fontSize: 15, color: '#888' },
  ongletTexteActif: { color: '#111' },

  liste: { paddingVertical: 20 },

  presentation: { paddingTop: 50, paddingHorizontal: 8, paddingBottom: 24 },
  presentationTitre: { fontSize: 27, lineHeight: 30, textAlign: 'center',
    fontWeight: '800', letterSpacing: -.6, color: '#111', marginBottom: 42 },
  presentationBloc: { flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginBottom: 30 },
  presentationCorps: { flex: 1 },
  presentationSousTitre: { fontSize: 17, fontWeight: '600', color: '#111',
    lineHeight: 22 },
  presentationTexte: { fontSize: 15, lineHeight: 20, color: '#666',
    marginTop: 8 },

  principal: { backgroundColor: '#ff2856', borderRadius: 8, minHeight: 48,
    alignItems: 'center', justifyContent: 'center', marginTop: 'auto',
    marginHorizontal: 12 },
  principalInactif: { backgroundColor: '#ffadbf' },
  principalTexte: { color: '#fff', fontSize: 17, fontWeight: '500' },

  vide: { alignItems: 'center', paddingTop: 120, paddingHorizontal: 20,
    paddingBottom: 40, gap: 20 },
  videReplays: { paddingTop: 100 },
  videTitre: { fontSize: 15, fontWeight: '500', color: '#111',
    textAlign: 'center' },
  videTexte: { fontSize: 14, lineHeight: 18, color: '#666',
    textAlign: 'center', marginTop: -10, maxWidth: 255 },
  replaysTitre: { fontSize: 17, fontWeight: '600', color: '#111',
    textAlign: 'center' },

  reglage: { marginBottom: 28 },
  reglageHaut: { flexDirection: 'row', alignItems: 'center', gap: 12,
    justifyContent: 'space-between' },
  reglageTitre: { flex: 1, fontSize: 16, fontWeight: '500', color: '#111',
    lineHeight: 20 },
  reglageTexte: { fontSize: 13, lineHeight: 18, color: '#999', marginTop: 5 },

  switch: { width: 49, height: 29, borderRadius: 15, backgroundColor: '#e2e2e2',
    padding: 3, justifyContent: 'center' },
  switchActif: { backgroundColor: '#00cba2' },
  switchPastille: { width: 23, height: 23, borderRadius: 12,
    backgroundColor: '#fff' },
  switchPastilleActive: { alignSelf: 'flex-end' },

  moderateurs: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 },
  moderateursTitre: { flex: 1 },
  moderateursValeur: { color: '#999', fontSize: 15 },

  banniere: { backgroundColor: '#eaeaea', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10 },
  banniereFermer: { position: 'absolute', right: 9, top: 5, zIndex: 1 },
  banniereCroix: { color: '#888', fontSize: 23, lineHeight: 26 },
  banniereTitre: { fontSize: 15, fontWeight: '500', color: '#111',
    paddingRight: 20 },
  banniereTexte: { fontSize: 13, color: '#999', lineHeight: 17,
    marginVertical: 7 },
  banniereActiver: { color: '#ff2856', fontSize: 14, fontWeight: '500' },

  formTitre: { fontSize: 25, fontWeight: '700', color: '#111',
    marginTop: 8, marginBottom: 34 },
  label: { fontSize: 16, fontWeight: '500', color: '#111',
    marginTop: 24, marginBottom: 12, marginHorizontal: 4 },
  etoile: { color: '#ff514d' },
  champ: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0f0f0', borderRadius: 9, padding: 14 },
  champDescription: { flexDirection: 'column', alignItems: 'stretch' },
  saisie: { flex: 1, fontSize: 16, color: '#111', padding: 0 },
  saisieLongue: { minHeight: 64, textAlignVertical: 'top' },
  compteur: { color: '#999', fontSize: 14 },
  compteurDroite: { textAlign: 'right', marginTop: 6 },

  dureeLigne: { flexDirection: 'row', gap: 8 },
  dureeChoix: { backgroundColor: '#f0f0f0', borderRadius: 8, height: 38,
    justifyContent: 'center', paddingHorizontal: 14 },
  dureeChoisie: { backgroundColor: '#111' },
  dureeTexte: { fontSize: 15, color: '#111' },
  dureeTexteChoisi: { color: '#fff' },

  demo: { fontSize: 11, lineHeight: 15, color: '#999', marginVertical: 14,
    marginHorizontal: 4 },

  publicationsTitre: { fontSize: 28, lineHeight: 34, fontWeight: '700',
    letterSpacing: -.6, color: '#111', marginHorizontal: 4, marginBottom: 22 },
  publicationsCarte: { backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 16, marginBottom: 16 },
  publicationsSousTitre: { fontSize: 18, fontWeight: '500', color: '#111',
    lineHeight: 23 },
  publicationsVide: { minHeight: 300, alignItems: 'center',
    justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 4 },
  publicationsVideTitre: { fontSize: 17, lineHeight: 22, fontWeight: '600',
    color: '#111', textAlign: 'center', marginTop: 28, marginBottom: 10 },
  publicationsVideTexte: { fontSize: 14, lineHeight: 19, color: '#aaa',
    textAlign: 'center', maxWidth: 330 },
})
