import React, { useEffect, useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView, SafeAreaView, Modal,
} from 'react-native'
import { useCadreFeuille } from '../lib/ecran'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '../composants/Texte'
import { Chevron, ChevronDroit, Maillon } from '../composants/Icones'
import IconeParametre from '../composants/IconesParametres'
import Interrupteur from '../composants/Interrupteur'
import Feuille from '../composants/Feuille'
import ComptesProfil from '../composants/ComptesProfil'
import GererPublications from './GererPublications'
import PreferencesContenu from './PreferencesContenu'
import Live from './Live'
import {
  Notifications, Compte, Securite, Langues, Affichage, LibererEspace,
  EconomiseurDonnees, SectionInformative, SECTIONS_INFO, partagerProfil,
  lienProfil,
} from './ParametresDetail'
import { useAuth } from '../lib/auth'
import { etat, enregistrer } from '../lib/demo'

// Sections extraites de app/src/pages/Parametres.tsx : memes intitules,
// meme ordre, memes pastilles de nouveaute.
// `bascule` marque les lignes qui portent un interrupteur au lieu d'un
// chevron : « Compte prive » se regle sur place, l'ouvrir dans un
// sous-ecran pour une seule case induisait en erreur.
const SECTIONS: {
  titre: string
  lignes: { nom: string; icone: string; pastille?: boolean; bascule?: boolean }[]
}[] =
[
  {
    "titre": "Activité",
    "lignes": [
      {
        "nom": "Gérer les publications",
        "icone": "publications",
        "pastille": false
      },
      {
        "nom": "Préférences de contenu",
        "icone": "contenu",
        "pastille": false
      },
      {
        "nom": "LIVE",
        "icone": "live",
        "pastille": false
      },
      {
        "nom": "Notifications",
        "icone": "cloche",
        "pastille": false
      },
      {
        "nom": "Temps d'écran et bien-être",
        "icone": "sablier",
        "pastille": false
      },
      {
        "nom": "Connexion Famille",
        "icone": "famille",
        "pastille": false
      }
    ]
  },
  {
    "titre": "Compte",
    "lignes": [
      {
        "nom": "Compte",
        "icone": "compte",
        "pastille": false
      },
      {
        "nom": "Sécurité et autorisations",
        "icone": "bouclier",
        "pastille": false
      },
      {
        "nom": "Partager le profil",
        "icone": "partage",
        "pastille": false
      }
    ]
  },
  {
    "titre": "Visibilité",
    "lignes": [
      {
        "nom": "Compte privé",
        "icone": "cadenas",
        "pastille": false,
        "bascule": true
      }
    ]
  },
  {
    "titre": "Préférences",
    "lignes": [
      {
        "nom": "Musique",
        "icone": "musique",
        "pastille": false
      },
      {
        "nom": "Boîte de réception et messagerie",
        "icone": "messagerie",
        "pastille": false
      },
      {
        "nom": "Centre des activités",
        "icone": "horloge",
        "pastille": false
      },
      {
        "nom": "Contrôle du public",
        "icone": "public",
        "pastille": false
      },
      {
        "nom": "Publicités",
        "icone": "pub",
        "pastille": false
      },
      {
        "nom": "Lecture",
        "icone": "lecture",
        "pastille": false
      },
      {
        "nom": "Langues",
        "icone": "langues",
        "pastille": false
      },
      {
        "nom": "Affichage",
        "icone": "affichage",
        "pastille": false
      },
      {
        "nom": "Accessibilité",
        "icone": "accessibilite",
        "pastille": false
      },
      {
        "nom": "Contacts et localisation",
        "icone": "localisation",
        "pastille": false
      }
    ]
  },
  {
    "titre": "Cache et données mobiles",
    "lignes": [
      {
        "nom": "Vidéos hors ligne",
        "icone": "horsligne",
        "pastille": false
      },
      {
        "nom": "Libérer de l'espace",
        "icone": "corbeille",
        "pastille": false
      },
      {
        "nom": "Économiseur de données",
        "icone": "economie",
        "pastille": false
      }
    ]
  },
  {
    "titre": "Assistance et informations",
    "lignes": [
      {
        "nom": "Centre d'aide",
        "icone": "aide",
        "pastille": false
      },
      {
        "nom": "Centre de confidentialité",
        "icone": "confidentialite",
        "pastille": false
      },
      {
        "nom": "Conditions et politiques",
        "icone": "info",
        "pastille": false
      }
    ]
  }
]

// Drapeau de premiere visite, sous la meme cle que la version web.
const CLE_ACCUEIL = 'parametres-reutilisation-vu'

export default function Parametres({ onRetour, pseudo }: {
  onRetour: () => void; pseudo: string
}) {
  // Grand ecran : la feuille se cale sur la colonne (voir lib/ecran).
  const cadre = useCadreFeuille()
  const { deconnecter, profil } = useAuth()
  const [selection, setSelection] = useState<string | null>(null)
  // Panneau « Changer de compte » et feuille « Partager le profil ».
  const [comptes, setComptes] = useState(false)
  const [partage, setPartage] = useState(false)
  // Les reglages vivent hors de React : ce compteur redessine la liste
  // apres une bascule faite sur place.
  const [, setTour] = useState(0)
  const rafraichir = () => setTour(n => n + 1)
  // Le panneau de reutilisation n'apparait qu'a la toute premiere visite,
  // comme sur la reference. Le choix est conserve d'une session a l'autre.
  const [accueil, setAccueil] = useState(false)
  const [choix, setChoix] = useState<'oui' | 'non' | null>(null)

  useEffect(() => {
    let vivant = true
    AsyncStorage.getItem(CLE_ACCUEIL)
      .then(vu => { if (vivant && !vu) setAccueil(true) })
      .catch(() => { /* stockage indisponible : on n'insiste pas */ })
    return () => { vivant = false }
  }, [])

  const fermerAccueil = () => {
    AsyncStorage.setItem(CLE_ACCUEIL, '1')
      .catch(() => { /* stockage indisponible */ })
    setAccueil(false)
  }

  const fermer = () => setSelection(null)

  // Les trois sections portees depuis la version web.
  if (selection === 'Gérer les publications')
    return <GererPublications onRetour={fermer} />
  if (selection === 'Préférences de contenu')
    return <PreferencesContenu onRetour={fermer} />
  if (selection === 'LIVE')
    return <Live onRetour={fermer} />

  // Sous-ecrans qui agissent vraiment.
  if (selection === 'Notifications') return <Notifications onRetour={fermer} />
  if (selection === 'Compte') return <Compte onRetour={fermer} />
  if (selection === 'Sécurité et autorisations') return <Securite onRetour={fermer} />
  if (selection === 'Langues') return <Langues onRetour={fermer} />
  if (selection === 'Affichage') return <Affichage onRetour={fermer} />
  if (selection === "Libérer de l'espace") return <LibererEspace onRetour={fermer} />
  if (selection === 'Économiseur de données')
    return <EconomiseurDonnees onRetour={fermer} />

  // Sections encore informatives : titre, explication, et les
  // interrupteurs qui existent deja.
  const info = selection ? SECTIONS_INFO[selection] : undefined
  if (info) return <SectionInformative info={info} onRetour={fermer} />

  return (
    <SafeAreaView style={s.page}>
      <View style={s.barre}>
        <Pressable onPress={onRetour} hitSlop={10}><Chevron taille={24} couleur="#111" /></Pressable>
        <View style={{ width: 44 }} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.corps}>
        <Text style={s.grandTitre}>Paramètres et{'\n'}confidentialité</Text>

        {SECTIONS.map(section => (
          <View style={s.section} key={section.titre}>
            <Text style={s.sectionTitre}>{section.titre}</Text>
            <View style={s.carte}>
              {section.lignes.map(ligne => ligne.bascule ? (
                <View key={ligne.nom}>
                  <View style={s.ligne}>
                    <IconeParametre nom={ligne.icone} taille={24} couleur="#111" />
                    <Text style={s.nom}>{ligne.nom}</Text>
                    <Interrupteur actif={etat.reglages.comptePrive}
                      onChange={v => {
                        etat.reglages.comptePrive = v
                        enregistrer()
                        rafraichir()
                      }} />
                  </View>
                  {etat.reglages.comptePrive && (
                    <Text style={s.explication}>
                      Lorsque ton compte est privé, seules les personnes que tu
                      approuves peuvent voir tes vidéos, tes j&apos;aime et tes
                      abonnements. Les demandes d&apos;abonnement arrivent dans
                      « Messages ». Ton pseudo et ta photo restent visibles de
                      tous.
                    </Text>
                  )}
                </View>
              ) : (
                <Pressable style={s.ligne} key={ligne.nom}
                  onPress={() => {
                    if (ligne.nom === 'Partager le profil') setPartage(true)
                    else setSelection(ligne.nom)
                  }}>
                  <IconeParametre nom={ligne.icone} taille={24} couleur="#111" />
                  <Text style={s.nom}>{ligne.nom}</Text>
                  {ligne.pastille && <View style={s.pastille} />}
                  <ChevronDroit taille={17} couleur="#c4c4c6" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={s.section}>
          <Text style={s.sectionTitre}>Connexion</Text>
          <View style={s.carte}>
            <Pressable style={s.ligne} onPress={() => setComptes(true)}>
              <IconeParametre nom="changer" taille={24} couleur="#111" />
              <Text style={s.nom}>Changer de compte</Text>
              <View style={s.avatar}>
                <Text style={s.avatarLettre}>{pseudo.charAt(0).toUpperCase()}</Text>
              </View>
              <ChevronDroit taille={17} couleur="#c4c4c6" />
            </Pressable>
            <Pressable style={s.ligne} onPress={deconnecter}>
              <IconeParametre nom="deconnexion" taille={24} couleur="#111" />
              <Text style={s.nom}>Se déconnecter</Text>
              <ChevronDroit taille={17} couleur="#c4c4c6" />
            </Pressable>
          </View>
        </View>

        <Text style={s.version}>v1.0.0 (démonstration)</Text>
      </ScrollView>

      {comptes && (
        <ComptesProfil pseudo={profil?.pseudo || pseudo}
          avatar={profil?.avatar_url} onFermer={() => setComptes(false)} />
      )}

      <Feuille visible={partage} titre="Partager le profil"
        onFermer={() => setPartage(false)}>
        <View style={s.partage}>
          <View style={s.partageAvatar}>
            <Text style={s.partageLettre}>
              {(profil?.pseudo || pseudo).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={s.partagePseudo}>@{profil?.pseudo || pseudo}</Text>
          <Text style={s.partageLien}>{lienProfil(profil?.pseudo || pseudo)}</Text>
          <Pressable style={s.partageBouton}
            onPress={() => {
              setPartage(false)
              partagerProfil(profil?.pseudo || pseudo)
            }}>
            <Maillon taille={20} couleur="#fff" />
            <Text style={s.partageBoutonTexte}>Copier le lien du profil</Text>
          </Pressable>
          <Text style={s.partageNote}>
            Le lien ouvre ton profil dans un navigateur. La page web arrive
            avec la prochaine version du site.
          </Text>
        </View>
      </Feuille>

      <Modal visible={accueil} transparent animationType="slide"
        statusBarTranslucent onRequestClose={() => { /* choix obligatoire */ }}>
        <View style={s.voile}>
          <View style={[s.feuille, cadre]}>
            <Text style={s.feuilleTitre}>Paramètre de réutilisation du contenu</Text>
            <Text style={s.feuilleTexte}>
              Les paramètres d&apos;autorisation permettant de choisir qui peut
              réaliser des Duos ou des Collages avec ta publication, créer des
              stickers avec celle-ci et l&apos;ajouter, ainsi que tes
              commentaires, en Story sont maintenant regroupés sous un même
              paramètre de réutilisation du contenu. Ce paramètre est
              actuellement défini sur <Text style={s.feuilleGras}>Tout le monde</Text>.
            </Text>
            <Text style={s.feuilleTexte}>
              Les paramètres sont différents pour 1 de tes publications. Pour ces
              publications, tu peux autoriser les utilisateurs à réutiliser ton
              contenu ou non.
            </Text>
            <Text style={s.feuilleSousTitre}>
              Autoriser la réutilisation de ces{'\n'}1 publications
            </Text>

            <View style={s.choix}>
              {(['oui', 'non'] as const).map((valeur, i) => (
                <Pressable key={valeur} style={[s.choixLigne, i > 0 && s.choixSuivant]}
                  onPress={() => setChoix(valeur)}>
                  <Text style={s.choixTexte}>{valeur === 'oui' ? 'Oui' : 'Non'}</Text>
                  <View style={choix === valeur ? s.rondChoisi : s.rondVide} />
                </Pressable>
              ))}
            </View>

            <Pressable style={[s.confirmer, !choix && s.confirmerInactif]}
              disabled={!choix} onPress={fermerAccueil}>
              <Text style={s.confirmerTexte}>Confirmer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// .param-page : fond #f1f1f2, cartes blanches.
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f1f2' },
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6 },
  barreTitre: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111' },
  corps: { paddingHorizontal: 16, paddingBottom: 28 },
  grandTitre: { fontSize: 31, fontWeight: '800', lineHeight: 36, color: '#111',
    marginTop: 4, marginBottom: 26 },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 14, fontWeight: '500', color: '#8a8a8e', marginBottom: 8, marginLeft: 4 },
  carte: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15, paddingHorizontal: 16, minHeight: 56 },
  icone: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#e8e8ea' },
  nom: { flex: 1, fontSize: 16, color: '#111' },
  pastille: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff2856' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ddd',
    alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#555', fontSize: 13, fontWeight: '700' },
  version: { textAlign: 'center', color: '#9b9b9f', fontSize: 13, marginTop: 26 },
  explication: { fontSize: 12.5, lineHeight: 18, color: '#8a8a8e',
    paddingHorizontal: 16, paddingBottom: 14, marginTop: -4 },

  // Feuille « Partager le profil ».
  partage: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 6 },
  partageAvatar: { width: 66, height: 66, borderRadius: 33,
    backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  partageLettre: { fontSize: 28, color: '#555', fontWeight: '700' },
  partagePseudo: { fontSize: 17, fontWeight: '700', color: '#111', marginTop: 12 },
  partageLien: { fontSize: 13, color: '#8a8a8e', marginTop: 5 },
  partageBouton: { flexDirection: 'row', alignItems: 'center', gap: 9,
    alignSelf: 'stretch', justifyContent: 'center', marginTop: 20,
    backgroundColor: '#ff2856', borderRadius: 30, minHeight: 48 },
  partageBoutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
  partageNote: { fontSize: 12, lineHeight: 17, color: '#9b9b9f',
    textAlign: 'center', marginTop: 14 },

  // Panneau de premiere visite : .param-voile / .param-feuille du web.
  voile: { flex: 1, backgroundColor: 'rgba(0,0,0,.35)', justifyContent: 'flex-end' },
  feuille: { width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 22, paddingTop: 24, paddingBottom: 26 },
  feuilleTitre: { color: '#111', fontSize: 22, fontWeight: '800', lineHeight: 27,
    textAlign: 'center', marginBottom: 18 },
  feuilleTexte: { color: '#111', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  feuilleGras: { fontWeight: '700' },
  feuilleSousTitre: { color: '#111', fontSize: 15, fontWeight: '700', lineHeight: 21,
    marginTop: 8, marginBottom: 10 },

  choix: { backgroundColor: '#f6f6f7', borderRadius: 12, overflow: 'hidden',
    marginBottom: 20 },
  choixLigne: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 52 },
  choixSuivant: { borderTopWidth: 1, borderTopColor: '#e6e6e8' },
  choixTexte: { color: '#111', fontSize: 15 },
  rondVide: { width: 23, height: 23, borderRadius: 11.5,
    borderWidth: 1.5, borderColor: '#d0d0d3' },
  rondChoisi: { width: 23, height: 23, borderRadius: 11.5,
    borderWidth: 7, borderColor: '#ff2856' },

  confirmer: { backgroundColor: '#ff2856', borderRadius: 30, minHeight: 46,
    alignItems: 'center', justifyContent: 'center' },
  confirmerInactif: { opacity: .45 },
  confirmerTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
