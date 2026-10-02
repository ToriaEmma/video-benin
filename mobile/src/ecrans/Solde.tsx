// ============================================================
// Portage de app/src/pages/Solde.tsx : memes pages, memes
// fenetres, memes intitules et memes traces SVG.
// ============================================================

import React, { useState } from 'react'
import {
  View, StyleSheet, Pressable, ScrollView, Modal, useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { Text, TextInput } from '../composants/Texte'
import { Chevron } from '../composants/Icones'

type Page = 'solde' | 'parametres' | 'devise' | 'aide' | 'tickets' | 'transactions'
type Popup = 'bienvenue' | 'guide' | 'filtres' | 'offre' | null

const TYPES = [
  'Tout', 'Acheter', 'Récompenses', 'Paiement',
  'Ajustement de la plateforme', 'Remboursement', 'Déduction',
]

const DEVISES = [
  'AED', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'GHS', 'INR',
  'JPY', 'KES', 'MAD', 'NGN', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES',
  'VND', 'XAF', 'XCD', 'XOF', 'YER', 'ZAR', 'ZMW',
]

// Intl.DisplayNames n'est pas garanti sur Hermes : on garde les noms en dur.
const NOMS_DEVISES: Record<string, string> = {
  AED: 'dirham des Émirats arabes unis', AUD: 'dollar australien',
  BRL: 'réal brésilien', CAD: 'dollar canadien', CHF: 'franc suisse',
  CNY: 'yuan renminbi chinois', EUR: 'euro', GBP: 'livre sterling',
  GHS: 'cedi ghanéen', INR: 'roupie indienne', JPY: 'yen japonais',
  KES: 'shilling kényan', MAD: 'dirham marocain', NGN: 'naira nigérian',
  UAH: 'hryvnia ukrainienne', UGX: 'shilling ougandais',
  USD: 'dollar des États-Unis', UYU: 'peso uruguayen',
  UZS: 'sum ouzbek', VES: 'bolivar vénézuélien', VND: 'dong vietnamien',
  XAF: 'franc CFA (BEAC)', XCD: 'dollar des Caraïbes orientales',
  XOF: 'franc CFA (BCEAO)', YER: 'rial yéménite', ZAR: 'rand sud-africain',
  ZMW: 'kwacha zambien',
}

const PACKS = [
  { pieces: 20, bonus: 11, prix: '0,39' },
  { pieces: 70, bonus: 47, prix: '1,19' },
  { pieces: 350, bonus: 0, prix: '5,90' },
]

function Icone({ nom, taille = 24, couleur = '#111' }: {
  nom: string; taille?: number; couleur?: string
}) {
  const t = {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: couleur, strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  return (
    <Svg {...t}>
      {nom === 'reglages' && <>
        <Circle cx="12" cy="12" r="8" />
        {Array.from({ length: 8 }, (_, i) => (
          <Path key={i} d="M12 2v2" transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </>}
      {nom === 'filtre' && <Path d="M2 3h20l-8 9v10l-5-3v-7Z" />}
      {nom === 'papier' && <>
        <Rect x="4" y="2" width="16" height="20" rx="2" />
        <Path d="M8 7h8M8 12h8M8 17h4" />
      </>}
      {nom === 'vide' && (
        <Path d="M3 13 7 3h10l4 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm0 0h6a3 3 0 0 0 6 0h6" />
      )}
      {nom === 'oeil' && <>
        <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <Circle cx="12" cy="12" r="3" />
      </>}
      {nom === 'cadeau' && <>
        <Rect x="3" y="9" width="18" height="4" rx="1" />
        <Path d="M5 13v9h14v-9M12 9v13" />
        <Path d="M12 9C2 9 5 0 9 4l3 5c10 0 7-9 3-5Z" />
      </>}
      {nom === 'portefeuille' && <>
        <Path d="M3 7V4l15-2v5" />
        <Rect x="2" y="7" width="20" height="15" rx="2" />
        <Circle cx="17" cy="14" r="1" />
      </>}
      {nom === 'graphique' && <>
        <Rect x="3" y="3" width="18" height="18" rx="4" fill={couleur} />
        <Path d="M8 16v-5m4 5V7m4 9v-3" stroke="white" />
      </>}
      {nom === 'etoile' && <>
        <Path d="M4 3h16v13l-8 6-8-6Z" fill={couleur} />
        <Path d="m12 6 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 9.5l3.5-.5Z" fill="white" stroke="none" />
      </>}
      {nom === 'piece' && <>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M15 7c-7-3-8 5-3 5s4 8-3 5m3-13v16" />
      </>}
      {nom === 'aide' && <>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M9 9a3 3 0 1 1 4 3v2m-1 3h.01" />
      </>}
      {nom === 'fermer' && <Path d="m5 5 14 14M19 5 5 19" />}
    </Svg>
  )
}

// Feuille modale des quatre fenetres du solde.
function Fenetre({ visible, onFermer, fondGris = false, flottante = false, children }: {
  visible: boolean
  onFermer: () => void
  fondGris?: boolean
  // La fenetre « Bienvenue » flotte, detachee des bords.
  flottante?: boolean
  children: React.ReactNode
}) {
  const { height } = useWindowDimensions()
  return (
    <Modal visible={visible} transparent animationType="slide"
      onRequestClose={onFermer} statusBarTranslucent>
      <View style={s.fenetreFond}>
        <Pressable style={s.voile} onPress={onFermer} />
        <View style={[
          s.feuille, fondGris && s.feuilleGrise, flottante && s.feuilleFlottante,
          { maxHeight: height * .85 },
        ]}>
          <Pressable style={s.feuilleFermer} hitSlop={8} onPress={onFermer}>
            <Icone nom="fermer" taille={22} />
          </Pressable>
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={s.feuilleCorps}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default function Solde({ onRetour }: { onRetour: () => void }) {
  const [page, setPage] = useState<Page>('solde')
  const [popup, setPopup] = useState<Popup>('bienvenue')
  const [guideVu, setGuideVu] = useState(false)
  const [devise, setDevise] = useState('USD')
  const [choix, setChoix] = useState('USD')
  const [recherche, setRecherche] = useState('')
  const [visible, setVisible] = useState(true)
  const [type, setType] = useState('Tout')
  const [brouillon, setBrouillon] = useState('Tout')
  const [mois, setMois] = useState('')
  const [pack, setPack] = useState(0)
  const [message, setMessage] = useState('')
  const [faqOuverte, setFaqOuverte] = useState<number | null>(null)

  const aller = (suivante: Page) => { setPage(suivante); setMessage('') }

  const retour = () => {
    if (page === 'solde') onRetour()
    else aller(
      page === 'devise' || page === 'aide' ? 'parametres'
      : page === 'tickets' ? 'aide'
      : 'solde')
  }

  const versTransactions = () => {
    aller('transactions')
    if (!guideVu) setPopup('guide')
  }

  const fermer = () => {
    if (popup === 'guide') setGuideVu(true)
    setPopup(null); setMessage('')
  }

  const titres: Record<Page, string> = {
    solde: 'Solde', parametres: 'Paramètres',
    devise: 'Sélectionner une devise', aide: 'Foire aux questions',
    tickets: 'Tes tickets d’assistance', transactions: 'Historique des transactions',
  }

  const devisesFiltrees = DEVISES.filter(d =>
    `${d} ${NOMS_DEVISES[d] ?? ''}`.toLocaleLowerCase()
      .includes(recherche.toLocaleLowerCase()))

  // Cet ecran est une demonstration : il n'existe ni paiement ni
  // monetisation cote serveur. Chaque outil le dit a sa facon, plutot que
  // de laisser croire a une mise en service prochaine.
  const OUTILS = [
    { nom: 'Récompenses LIVE', icone: 'piece',
      raison: 'TockTick n’a pas encore de diffusion en direct, donc aucune récompense à reverser.' },
    { nom: 'Monétisation', icone: 'graphique',
      raison: 'Aucun programme de monétisation n’est ouvert : TockTick ne verse pas de revenus.' },
    { nom: 'Campagnes', icone: 'etoile',
      raison: 'TockTick ne vend pas de publicité : il n’y a aucune campagne à gérer.' },
    { nom: 'Gestionnaire d’abonnement', icone: 'etoile',
      raison: 'TockTick ne propose aucun abonnement payant.' },
  ]

  const FAQ = [
    {
      titre: 'Guide général',
      texte: 'Cet espace présente le solde, les pièces et les transactions. Tu peux choisir la devise d’affichage dans les paramètres.',
    },
    {
      titre: 'Problèmes de retrait des récompenses',
      texte: 'Les retraits et récompenses ne sont pas encore disponibles dans cette version de démonstration.',
    },
  ]

  return (
    <SafeAreaView style={[s.page, (page === 'devise' || page === 'aide') && s.blanc]}
      edges={['top']}>
      {/* En-tete commun aux six pages */}
      <View style={s.entete}>
        {page === 'devise' ? (
          <Pressable hitSlop={10} onPress={retour}>
            <Text style={s.enteteLien}>Annuler</Text>
          </Pressable>
        ) : (
          <Pressable hitSlop={10} onPress={retour} style={s.enteteBouton}>
            <Chevron taille={24} couleur="#111" />
          </Pressable>
        )}

        <View style={s.enteteMilieu}>
          <Text style={s.enteteTitre} numberOfLines={1}>{titres[page]}</Text>
          {page === 'solde' && (
            <Text style={s.securise}>◇ Aperçu démo</Text>
          )}
        </View>

        <View style={s.enteteDroite}>
          {page === 'solde' && (
            <Pressable hitSlop={8} onPress={() => aller('parametres')}>
              <Icone nom="reglages" />
            </Pressable>
          )}
          {page === 'devise' && (
            <Pressable hitSlop={8} disabled={choix === devise}
              onPress={() => { setDevise(choix); aller('parametres') }}>
              <Text style={[s.enteteLien, choix === devise && s.enteteLienInactif]}>
                Terminé
              </Text>
            </Pressable>
          )}
          {page === 'aide' && (
            <Pressable hitSlop={8} onPress={() => aller('tickets')}>
              <Icone nom="papier" />
            </Pressable>
          )}
          {page === 'transactions' && (
            <Pressable hitSlop={8}
              onPress={() => { setBrouillon(type); setPopup('filtres') }}>
              <Icone nom="filtre" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.corps}>
        {/* ---------------- Solde ---------------- */}
        {page === 'solde' && <>
          <View style={s.montant}>
            <View style={s.montantLigne}>
              <Text style={s.montantLabel}>Solde estimé</Text>
              <Text style={s.montantDevise}>{devise}</Text>
              <Pressable hitSlop={8} onPress={() => setVisible(!visible)}>
                <Icone nom="oeil" taille={19} couleur="#888" />
              </Pressable>
            </View>
            <Pressable style={s.total} onPress={versTransactions}>
              <Text style={s.totalTexte}>{visible ? '0,00' : '••••'}</Text>
              <View style={s.chevronDroit}>
                <Chevron taille={22} couleur="#111" />
              </View>
            </Pressable>
          </View>

          <Pressable style={s.pieces} onPress={() => setPopup('offre')}>
            <Text style={s.or}>◉</Text>
            <Text style={s.piecesTexte}>Pièces <Text style={s.gras}>0</Text></Text>
            <View style={s.piecesTrait} />
            <View style={s.piecesAction}>
              <Icone nom="cadeau" taille={17} couleur="#ff2856" />
              <Text style={s.piecesActionTexte}>Obtenir des Pièces →</Text>
            </View>
          </Pressable>

          <Pressable style={[s.carte, s.ligne]} onPress={versTransactions}>
            <Text style={s.ligneTitre}>Transactions</Text>
            <View style={s.ligneFin}>
              <Text style={s.ligneValeur}>Tout voir</Text>
              <View style={s.chevronDroit}>
                <Chevron taille={18} couleur="#999" />
              </View>
            </View>
          </Pressable>

          <Pressable style={[s.carte, s.promo]} onPress={() => setPopup('offre')}>
            <View style={s.promoCorps}>
              <Text style={s.ligneTitre}>Offre de première recharge ›</Text>
              <Text style={s.promoTexte}>
                Obtiens des Cadeaux et des Pièces bonus
              </Text>
            </View>
            <View style={s.promoPastille}>
              <Icone nom="cadeau" taille={30} couleur="#fff" />
            </View>
          </Pressable>

          <View style={[s.carte, s.outils]}>
            {OUTILS.map(o => (
              <Pressable key={o.nom} style={s.outil}
                onPress={() => setMessage(o.raison)}>
                <View style={s.outilPastille}>
                  <Icone nom={o.icone} />
                </View>
                <Text style={s.outilTexte}>{o.nom}</Text>
              </Pressable>
            ))}
          </View>

          {!!message && <Text style={s.note}>{message}</Text>}
          <Text style={s.disclaimer}>
            Démonstration : aucun argent réel, aucune transaction ni récompense
            disponible.
          </Text>
        </>}

        {/* ---------------- Parametres ---------------- */}
        {page === 'parametres' && <>
          <Pressable style={[s.carte, s.ligne]}
            onPress={() => { setChoix(devise); setRecherche(''); aller('devise') }}>
            <Icone nom="portefeuille" />
            <Text style={s.ligneTitre}>Affichage de la devise</Text>
            <View style={s.ligneFin}>
              <Text style={s.ligneValeur}>{devise}</Text>
              <View style={s.chevronDroit}>
                <Chevron taille={18} couleur="#999" />
              </View>
            </View>
          </Pressable>

          <Text style={s.rubrique}>Assistance</Text>
          <Pressable style={[s.carte, s.ligne]} onPress={() => aller('aide')}>
            <Icone nom="aide" />
            <Text style={s.ligneTitre}>Aide et commentaires</Text>
            <View style={s.ligneFin}>
              <View style={s.chevronDroit}>
                <Chevron taille={18} couleur="#999" />
              </View>
            </View>
          </Pressable>
        </>}

        {/* ---------------- Devise ---------------- */}
        {page === 'devise' && <>
          <TextInput style={s.recherche} placeholder="⌕ Rechercher"
            placeholderTextColor="#999"
            value={recherche} onChangeText={setRecherche} />
          <View style={s.devises}>
            {devisesFiltrees.map((d, i, liste) => (
              <View key={d}>
                {(i === 0 || liste[i - 1][0] !== d[0]) && (
                  <Text style={s.deviseLettre}>{d[0]}</Text>
                )}
                <Pressable style={s.deviseLigne} onPress={() => setChoix(d)}>
                  <Text style={s.deviseNom}>{d} - {NOMS_DEVISES[d]}</Text>
                  <View style={[s.rond, choix === d && s.rondChoisi]} />
                </Pressable>
              </View>
            ))}
          </View>
        </>}

        {/* ---------------- Foire aux questions ---------------- */}
        {page === 'aide' && (
          <View>
            {FAQ.map((f, i) => (
              <View style={s.faq} key={f.titre}>
                <Pressable style={s.faqTitreLigne}
                  onPress={() => setFaqOuverte(faqOuverte === i ? null : i)}>
                  <Text style={s.faqTitre}>{f.titre}</Text>
                  <Text style={s.faqFleche}>{faqOuverte === i ? '⌃' : '⌄'}</Text>
                </Pressable>
                {faqOuverte === i && <Text style={s.faqTexte}>{f.texte}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* ---------------- Tickets ---------------- */}
        {page === 'tickets' && (
          <View style={[s.vide, s.videTickets]}>
            <Icone nom="papier" taille={90} couleur="#bbb" />
            <Text style={s.videTitre}>Aucun ticket d’assistance</Text>
          </View>
        )}

        {/* ---------------- Transactions ---------------- */}
        {page === 'transactions' && <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={s.bandeOnglets} contentContainerStyle={s.onglets}>
            {TYPES.map(t => (
              <Pressable key={t} onPress={() => setType(t)}
                style={[s.onglet, type === t && s.ongletActif]}>
                <Text style={[s.ongletTexte, type === t && s.ongletTexteActif]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {!!mois && <Text style={s.note}>Mois : {mois}</Text>}
          <View style={s.vide}>
            <Icone nom="vide" taille={86} couleur="#777" />
            <Text style={s.videTexte}>Pas encore de transaction</Text>
          </View>
          <Text style={s.disclaimer}>
            Démonstration : aucun argent réel, aucune transaction ni récompense
            disponible.
          </Text>
        </>}
      </ScrollView>

      {/* ---------------- Bienvenue ---------------- */}
      <Fenetre visible={popup === 'bienvenue'} onFermer={fermer} flottante>
        <View style={s.illustration}>
          <Icone nom="portefeuille" taille={76} couleur="#7044ff" />
          <Text style={s.illustrationEtoile}>✦</Text>
          <Text style={s.illustrationDollar}>＄</Text>
        </View>
        <Text style={s.feuilleTitre}>Bienvenue dans le solde</Text>
        <View style={s.avantage}>
          <Icone nom="piece" />
          <View style={s.avantageCorps}>
            <Text style={s.avantageTitre}>
              Consulte toutes tes récompenses d’un coup
            </Text>
            <Text style={s.avantageTexte}>
              Consulte tes récompenses issues des programmes de monétisation et
              plus encore.
            </Text>
          </View>
        </View>
        <View style={s.avantage}>
          <Icone nom="portefeuille" />
          <View style={s.avantageCorps}>
            <Text style={s.avantageTitre}>Gère tes Pièces</Text>
            <Text style={s.avantageTexte}>
              Obtiens des Pièces pour envoyer des Cadeaux.
            </Text>
          </View>
        </View>
        <Pressable style={s.action} onPress={fermer}>
          <Text style={s.actionTexte}>J’ai compris</Text>
        </Pressable>
      </Fenetre>

      {/* ---------------- Guide des transactions ---------------- */}
      <Fenetre visible={popup === 'guide'} onFermer={fermer}>
        <View style={s.guideDessin}>
          <Icone nom="papier" taille={110} couleur="#e5e5e5" />
          <View style={s.guidePastille}>
            <Icone nom="filtre" taille={32} />
          </View>
        </View>
        <Text style={[s.feuilleTitre, s.centre]}>
          Gère tes transactions plus facilement
        </Text>
        <Text style={[s.feuilleTexte, s.centre]}>
          Filtre tes transactions par type de transaction ou par type d’activité.
        </Text>
        <Pressable style={s.action} onPress={fermer}>
          <Text style={s.actionTexte}>J’ai compris</Text>
        </Pressable>
      </Fenetre>

      {/* ---------------- Filtres ---------------- */}
      <Fenetre visible={popup === 'filtres'} onFermer={fermer}>
        <Text style={[s.feuilleTitre, s.centre, s.filtresTitre]}>
          Sélectionne les filtres
        </Text>
        <Text style={s.feuilleSousTitre}>Type de transaction</Text>
        <View style={s.filtres}>
          {TYPES.map(t => (
            <Pressable key={t} onPress={() => setBrouillon(t)}
              style={[s.filtre, brouillon === t && s.filtreActif]}>
              <Text style={[s.filtreTexte, brouillon === t && s.filtreTexteActif]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.feuilleSousTitre}>Type d’activité</Text>
        <View style={s.filtres}>
          <View style={[s.filtre, s.filtreActif]}>
            <Text style={[s.filtreTexte, s.filtreTexteActif]}>Tout</Text>
          </View>
        </View>
        <View style={s.actions}>
          <Pressable style={s.actionSecondaire}
            onPress={() => setBrouillon('Tout')}>
            <Text style={s.actionSecondaireTexte}>Réinitialiser</Text>
          </Pressable>
          <Pressable style={[s.action, s.actionMoitie]}
            onPress={() => { setType(brouillon); setMois(''); fermer() }}>
            <Text style={s.actionTexte}>Appliquer</Text>
          </Pressable>
        </View>
      </Fenetre>

      {/* ---------------- Offre de recharge ---------------- */}
      <Fenetre visible={popup === 'offre'} onFermer={fermer} fondGris>
        <Text style={[s.feuilleTitre, s.offreTitre]}>
          Offre de première recharge
        </Text>
        <Text style={s.note}>
          Aperçu de l’offre — prix illustratifs en USD, paiement non disponible.
        </Text>

        <View style={[s.carte, s.bonus]}>
          <View style={s.bonusLigne}>
            <Text style={s.bonusEmoji}>🌹</Text>
            <View style={s.bonusCorps}>
              <Text style={s.bonusTitre}>Obtiens ×3 Rose dans ton sac à dos</Text>
              <Text style={s.bonusTexte}>
                Une Rose maintenant et les suivantes après 24 heures.
              </Text>
            </View>
          </View>
          <View style={s.bonusLigne}>
            <Text style={[s.bonusEmoji, s.or]}>◉</Text>
            <View style={s.bonusCorps}>
              <Text style={s.bonusTitre}>Reçois des Pièces bonus</Text>
              <Text style={s.bonusTexte}>
                Utilise les Pièces sur des articles virtuels comme les Cadeaux.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.carte}>
          <Text style={s.feuilleSousTitreSerre}>Obtenir des Pièces</Text>
          <Text style={s.feuilleTexte}>
            Recharge pour obtenir des Cadeaux et des Pièces bonus.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.packs}>
            {PACKS.map((p, i) => (
              <Pressable key={p.pieces} onPress={() => setPack(i)}
                style={[s.pack, pack === i && s.packChoisi]}>
                <View style={s.packHaut}>
                  <Text style={s.or}>◉</Text>
                  <Text style={s.packPieces}>{p.pieces}</Text>
                  {p.bonus > 0 && <Text style={s.packBonus}>+{p.bonus}</Text>}
                </View>
                <Text style={s.packPrix}>$ {p.prix}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable style={s.action}
          onPress={() => setMessage('La recharge n’est pas encore activée. Aucun paiement n’a été effectué.')}>
          <Text style={s.actionTexte}>
            Obtiens ◉ {PACKS[pack].pieces + PACKS[pack].bonus} ($ {PACKS[pack].prix})
          </Text>
        </Pressable>
        {!!message && <Text style={s.note}>{message}</Text>}
      </Fenetre>
    </SafeAreaView>
  )
}

// Styles repris de solde.css.
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },
  blanc: { backgroundColor: '#fff' },

  entete: { flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: 48, paddingHorizontal: 16, marginBottom: 18 },
  enteteBouton: { width: 32, height: 40, justifyContent: 'center' },
  enteteMilieu: { flex: 1, alignItems: 'center' },
  enteteTitre: { fontSize: 17, fontWeight: '600', color: '#111' },
  enteteDroite: { minWidth: 32, alignItems: 'flex-end' },
  enteteLien: { fontSize: 16, fontWeight: '500', color: '#111' },
  enteteLienInactif: { color: '#aaa' },
  securise: { fontSize: 12, color: '#74877f', marginTop: 3 },

  corps: { paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 },

  // Solde
  montant: { alignItems: 'center', marginBottom: 12 },
  montantLigne: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  montantLabel: { color: '#888', fontSize: 16, fontWeight: '500' },
  montantDevise: { color: '#888', fontSize: 16, fontWeight: '700' },
  total: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  totalTexte: { fontSize: 44, fontWeight: '700', color: '#111' },
  chevronDroit: { transform: [{ rotate: '180deg' }] },

  pieces: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, alignSelf: 'center', borderWidth: 1, borderColor: '#fff',
    borderRadius: 30, paddingVertical: 10, paddingHorizontal: 12,
    marginBottom: 24 },
  piecesTexte: { fontSize: 13, color: '#111' },
  piecesTrait: { width: 1, height: 16, backgroundColor: '#ddd',
    marginHorizontal: 4 },
  piecesAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  piecesActionTexte: { color: '#ff2856', fontSize: 13, fontWeight: '600' },
  or: { color: '#edaa00' },
  gras: { fontWeight: '700' },

  carte: { backgroundColor: '#fff', borderRadius: 14, padding: 17,
    marginBottom: 12 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 58 },
  ligneTitre: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111' },
  ligneFin: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ligneValeur: { color: '#999', fontSize: 14 },

  promo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoCorps: { flex: 1 },
  promoTexte: { fontSize: 13, color: '#999', lineHeight: 17, marginTop: 6 },
  promoPastille: { backgroundColor: '#ff5670', borderRadius: 28, width: 55,
    height: 55, alignItems: 'center', justifyContent: 'center' },

  outils: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 18,
    paddingHorizontal: 10, rowGap: 28 },
  outil: { width: '33.33%', alignItems: 'center', gap: 12 },
  outilPastille: { backgroundColor: '#f5f5f5', borderRadius: 10, width: 42,
    height: 42, alignItems: 'center', justifyContent: 'center' },
  outilTexte: { fontSize: 13, fontWeight: '500', color: '#111',
    textAlign: 'center', lineHeight: 17 },

  disclaimer: { textAlign: 'center', color: '#aaa', fontSize: 10,
    lineHeight: 14, marginTop: 'auto', paddingTop: 50 },
  note: { fontSize: 12, lineHeight: 17, color: '#888', marginTop: 10 },
  rubrique: { fontSize: 14, fontWeight: '500', color: '#888',
    marginTop: 8, marginBottom: 12, marginHorizontal: 16 },

  // Devise
  recherche: { backgroundColor: '#f1f1f1', borderRadius: 10, padding: 12,
    color: '#111', fontSize: 16 },
  devises: { marginTop: 4 },
  deviseLettre: { fontSize: 13, color: '#999', fontWeight: '500',
    marginTop: 18 },
  deviseLigne: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12, minHeight: 59 },
  deviseNom: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111' },
  rond: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ddd' },
  rondChoisi: { borderWidth: 7, borderColor: '#ff2856' },

  // Foire aux questions
  faq: { borderBottomWidth: 1, borderBottomColor: '#ddd',
    paddingVertical: 18, paddingHorizontal: 8 },
  faqTitreLigne: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10 },
  faqTitre: { flex: 1, fontSize: 17, color: '#111' },
  faqFleche: { color: '#999', fontSize: 17 },
  faqTexte: { color: '#777', lineHeight: 21, fontSize: 14, marginTop: 10 },

  // Listes vides
  vide: { flex: 1, minHeight: 300, alignItems: 'center',
    justifyContent: 'center', gap: 16 },
  videTickets: { justifyContent: 'flex-start', paddingTop: 100 },
  videTitre: { color: '#111', fontSize: 17, fontWeight: '600' },
  videTexte: { color: '#999', fontSize: 15 },

  // Transactions
  bandeOnglets: { flexGrow: 0, marginHorizontal: -8 },
  onglets: { gap: 6, paddingHorizontal: 8 },
  onglet: { backgroundColor: '#eee', borderRadius: 9, paddingVertical: 12,
    paddingHorizontal: 12 },
  ongletActif: { backgroundColor: '#000' },
  ongletTexte: { color: '#888', fontSize: 14, fontWeight: '500' },
  ongletTexteActif: { color: '#fff' },

  // Fenetres
  fenetreFond: { flex: 1, backgroundColor: 'rgba(0,0,0,.53)',
    justifyContent: 'flex-end' },
  voile: { flex: 1 },
  feuille: { backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, paddingTop: 26 },
  feuilleGrise: { backgroundColor: '#f5f5f5' },
  feuilleFlottante: { marginHorizontal: 16, marginBottom: 20,
    borderRadius: 30 },
  feuilleFermer: { position: 'absolute', right: 14, top: 13, width: 34,
    height: 34, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  feuilleCorps: { paddingHorizontal: 20, paddingBottom: 30 },
  feuilleTitre: { fontSize: 24, lineHeight: 29, fontWeight: '700',
    color: '#111', marginVertical: 22 },
  feuilleSousTitre: { fontSize: 16, fontWeight: '600', color: '#111',
    marginTop: 24, marginBottom: 16 },
  feuilleSousTitreSerre: { fontSize: 16, fontWeight: '600', color: '#111',
    marginBottom: 8 },
  feuilleTexte: { fontSize: 14, lineHeight: 19, color: '#111' },
  centre: { textAlign: 'center' },

  illustration: { backgroundColor: '#6de4da', borderRadius: 50, width: 108,
    height: 85, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: 34, marginBottom: 26,
    transform: [{ rotate: '-8deg' }] },
  illustrationEtoile: { position: 'absolute', right: -8, top: -13,
    color: '#ff6279', fontSize: 40 },
  illustrationDollar: { position: 'absolute', bottom: -5, left: 3,
    backgroundColor: '#ff647b', color: '#fff', borderRadius: 16, fontSize: 26 },

  avantage: { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginTop: 20 },
  avantageCorps: { flex: 1 },
  avantageTitre: { fontWeight: '600', fontSize: 16, color: '#111' },
  avantageTexte: { color: '#777', fontSize: 14, lineHeight: 19, marginTop: 7 },

  action: { backgroundColor: '#ff2856', borderRadius: 30, paddingVertical: 15,
    alignItems: 'center', marginTop: 30 },
  actionTexte: { color: '#fff', fontSize: 16, fontWeight: '500' },
  actionMoitie: { flex: 1, marginTop: 0 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 30 },
  actionSecondaire: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 30,
    paddingVertical: 15, alignItems: 'center' },
  actionSecondaireTexte: { fontSize: 16, fontWeight: '600', color: '#111' },

  guideDessin: { alignItems: 'center', marginVertical: 26 },
  guidePastille: { position: 'absolute', right: 20, top: 0,
    backgroundColor: '#fff', borderRadius: 32, padding: 16,
    shadowColor: '#000', shadowOpacity: .12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4 },

  filtresTitre: { fontSize: 18, marginTop: 0, marginBottom: 26 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtre: { backgroundColor: '#eee', borderRadius: 9, paddingVertical: 12,
    paddingHorizontal: 12 },
  filtreActif: { backgroundColor: '#000' },
  filtreTexte: { color: '#888', fontSize: 14, fontWeight: '500' },
  filtreTexteActif: { color: '#fff' },

  offreTitre: { fontSize: 23, marginTop: 14, marginBottom: 8 },
  bonus: { marginTop: 14 },
  bonusLigne: { flexDirection: 'row', alignItems: 'center', gap: 18,
    marginBottom: 20 },
  bonusEmoji: { fontSize: 38, width: 46, textAlign: 'center' },
  bonusCorps: { flex: 1 },
  bonusTitre: { fontSize: 15, fontWeight: '600', color: '#111' },
  bonusTexte: { fontSize: 14, lineHeight: 19, color: '#111', marginTop: 5 },

  packs: { gap: 8, paddingTop: 8 },
  pack: { minWidth: 118, borderWidth: 1, borderColor: '#ddd', borderRadius: 5,
    paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', gap: 5 },
  packChoisi: { borderWidth: 2, borderColor: '#ff2856' },
  packHaut: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  packPieces: { fontSize: 21, fontWeight: '700', color: '#111' },
  packBonus: { color: '#ff2856', fontSize: 21, fontWeight: '700' },
  packPrix: { color: '#888', fontSize: 13 },
})
