// ============================================================
// Sous-ecrans de « Parametres et confidentialite ».
//
// Chaque section de l'ecran des parametres ouvre un composant d'ici.
// Les ecrans qui agissent vraiment (notifications, compte, securite,
// langues, affichage, espace, economie de donnees) sont separes de
// ceux qui restent informatifs : ces derniers passent par
// `SectionInformative`, qui annonce honnetement ce que la section
// couvrira sans inventer de donnees.
//
// Tous les reglages vivent dans `etat.reglages` et sont ecrits par
// `enregistrer()` : ils survivent donc a une fermeture de
// l'application.
// ============================================================

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, Alert, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '../composants/Texte'
import {
  Chevron, ChevronDroit, CocheChoix, Personne, Telephone, Cle, Appareil,
} from '../composants/Icones'
import Interrupteur from '../composants/Interrupteur'
import { useAuth } from '../lib/auth'
import {
  etat, enregistrer, poidsLisible, type Reglages,
} from '../lib/demo'

// ------------------------------------------------------------
// Briques communes
// ------------------------------------------------------------

// Barre de titre, identique a celle de PreferencesContenu : les deux
// ecrans se suivent dans la navigation, leur entete ne doit pas sauter.
function Barre({ titre, sousTitre, onRetour }: {
  titre?: string; sousTitre?: string; onRetour: () => void
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
      <View style={s.barreBouton} />
    </View>
  )
}

// Libelle gris au-dessus d'une carte blanche.
const Groupe = ({ titre, children }: { titre?: string; children: React.ReactNode }) => (
  <View style={s.groupe}>
    {!!titre && <Text style={s.groupeTitre}>{titre}</Text>}
    <View style={s.carte}>{children}</View>
  </View>
)

// Ligne a interrupteur. `cle` designe le reglage a basculer : la ligne
// lit et ecrit directement `etat.reglages`, et le compteur passe par
// `onChange` pour forcer un nouveau rendu.
function LigneBascule({ nom, detail, cle, onChange }: {
  nom: string
  detail?: string
  cle: keyof Reglages
  onChange: () => void
}) {
  const actif = etat.reglages[cle] === true
  return (
    <View style={s.ligne}>
      <View style={s.ligneTexte}>
        <Text style={s.nom}>{nom}</Text>
        {!!detail && <Text style={s.detail}>{detail}</Text>}
      </View>
      <Interrupteur actif={actif} onChange={v => {
        (etat.reglages as Record<string, unknown>)[cle] = v
        enregistrer()
        onChange()
      }} />
    </View>
  )
}

// Ligne de navigation : libelle, valeur grise facultative, chevron.
const LigneNav = ({ nom, valeur, onPress }: {
  nom: string; valeur?: string; onPress: () => void
}) => (
  <Pressable style={s.ligne} onPress={onPress}>
    <Text style={s.nom}>{nom}</Text>
    {!!valeur && <Text style={s.valeur}>{valeur}</Text>}
    <ChevronDroit taille={17} couleur="#c4c4c6" />
  </Pressable>
)

// Ligne a choix unique : coche rose a droite du libelle retenu.
const LigneChoix = ({ nom, note, choisi, onPress }: {
  nom: string; note?: string; choisi: boolean; onPress: () => void
}) => (
  <Pressable style={s.ligne} onPress={onPress}>
    <Text style={s.nom}>{nom}</Text>
    {!!note && <Text style={s.valeur}>{note}</Text>}
    {choisi && <CocheChoix taille={20} couleur="#ff2856" />}
  </Pressable>
)

// Note grise de bas d'ecran : c'est la qu'on dit ce que le reglage ne
// fait pas encore, plutot que de laisser croire le contraire.
const Note = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.note}>{children}</Text>
)

// Compteur de rendu : les reglages vivent hors de React, il faut donc
// un etat local pour redessiner apres chaque bascule.
function useRafraichir() {
  const [, setTour] = useState(0)
  return () => setTour(n => n + 1)
}

// ------------------------------------------------------------
// 1. Notifications
// ------------------------------------------------------------

export function Notifications({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Notifications" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Interactions">
          <LigneBascule nom="J'aime" cle="notifJaime" onChange={rafraichir} />
          <LigneBascule nom="Commentaires" cle="notifCommentaires" onChange={rafraichir} />
          <LigneBascule nom="Nouveaux abonnés" cle="notifAbonnes" onChange={rafraichir} />
          <LigneBascule nom="Mentions et identifications" cle="notifMentions"
            onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Contenu">
          <LigneBascule nom="Vidéos suggérées"
            detail="Les vidéos que nous pensons pouvoir te plaire"
            cle="notifSuggestions" onChange={rafraichir} />
          <LigneBascule nom="LIVE"
            detail="Quand un compte que tu suis commence un direct"
            cle="notifLive" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Messagerie">
          <LigneBascule nom="Messages directs" cle="notifMessages" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Application">
          <LigneBascule nom="Rappels d'application"
            detail="Un rappel quand tu n'as rien publié depuis plusieurs jours"
            cle="notifRappels" onChange={rafraichir} />
        </Groupe>

        <Note>
          Ces préférences valent pour les notifications envoyées par Vidéo
          Bénin. Ton téléphone garde le dernier mot : s&apos;il bloque les
          notifications de l&apos;application, rien ne t&apos;est envoyé.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 2. Compte
// ------------------------------------------------------------

// « +229 97 12 34 42 » devient « +229 •• •• •• 42 » : seuls le
// prefixe et les deux derniers chiffres restent lisibles.
export function telephoneMasque(telephone: string | null | undefined) {
  if (!telephone) return 'Non renseigné'
  const chiffres = telephone.replace(/\D/g, '')
  if (chiffres.length < 4) return '•• •• •• ••'
  const fin = chiffres.slice(-2)
  const prefixe = chiffres.length > 8 ? `+${chiffres.slice(0, chiffres.length - 8)} ` : ''
  return `${prefixe}•• •• •• ${fin}`
}

export function Compte({ onRetour }: { onRetour: () => void }) {
  const { profil, deconnecter } = useAuth()

  const supprimer = () => {
    Alert.alert(
      'Supprimer le compte',
      'Ton compte, tes publications et tes brouillons seront effacés. '
      + 'Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => { deconnecter().catch(() => { /* session deja fermee */ }) },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Compte" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Informations du compte">
          <View style={s.ligne}>
            <Personne taille={21} couleur="#111" />
            <View style={s.ligneTexte}>
              <Text style={s.nom}>Nom d&apos;utilisateur</Text>
              {!!profil?.nom && <Text style={s.detail}>{profil.nom}</Text>}
            </View>
            <Text style={s.valeur}>{profil?.pseudo || '—'}</Text>
          </View>
          <View style={s.ligne}>
            <Telephone taille={21} couleur="#111" />
            <Text style={s.nom}>Numéro de téléphone</Text>
            <Text style={s.valeur}>{telephoneMasque(profil?.telephone)}</Text>
          </View>
          <Pressable style={s.ligne} onPress={() => Alert.alert(
            'Mot de passe',
            'La modification du mot de passe passera par une confirmation '
            + 'envoyée à ton numéro. Cette étape n’est pas encore branchée.',
          )}>
            <Cle taille={21} couleur="#111" />
            <Text style={s.nom}>Mot de passe</Text>
            <Text style={s.valeur}>Modifier</Text>
            <ChevronDroit taille={17} couleur="#c4c4c6" />
          </Pressable>
        </Groupe>

        {!!profil?.bio && (
          <Groupe titre="Bio">
            <View style={s.ligne}>
              <Text style={s.nom}>{profil.bio}</Text>
            </View>
          </Groupe>
        )}

        <Groupe>
          <Pressable style={s.ligne} onPress={supprimer}>
            <Text style={s.nomRouge}>Supprimer le compte</Text>
          </Pressable>
        </Groupe>

        <Note>
          Le nom d&apos;utilisateur et la bio se modifient depuis
          « Modifier le profil », sur ta page de profil.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 3. Securite et autorisations
// ------------------------------------------------------------

export function Securite({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  const [appareils, setAppareils] = useState(false)

  if (appareils) {
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Appareils connectés" sousTitre="1 appareil"
          onRetour={() => setAppareils(false)} />
        <ScrollView contentContainerStyle={s.corps}>
          <Groupe titre="Cet appareil">
            <View style={s.ligne}>
              <Appareil taille={21} couleur="#111" />
              <View style={s.ligneTexte}>
                <Text style={s.nom}>Téléphone — session en cours</Text>
                <Text style={s.detail}>Connecté maintenant</Text>
              </View>
              <View style={s.pastilleVerte} />
            </View>
          </Groupe>
          <Note>
            Aucune autre session n&apos;est ouverte. Pour fermer celle-ci,
            utilise « Se déconnecter » au bas des paramètres.
          </Note>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Sécurité et autorisations" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Connexion">
          <LigneBascule nom="Authentification à deux facteurs"
            detail="Un code est demandé en plus du mot de passe"
            cle="doubleFacteur" onChange={rafraichir} />
          <LigneBascule nom="Alertes de connexion"
            detail="Être averti dès qu'un nouvel appareil se connecte"
            cle="alertesConnexion" onChange={rafraichir} />
        </Groupe>

        <Groupe titre="Appareils">
          <LigneNav nom="Appareils connectés" valeur="1"
            onPress={() => setAppareils(true)} />
        </Groupe>

        <Note>
          L&apos;authentification à deux facteurs sera appliquée lors du
          branchement du service d&apos;envoi de SMS. Le choix fait ici est
          déjà conservé.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 4. Langues
// ------------------------------------------------------------

const LANGUES: { cle: Reglages['langue']; nom: string; prete: boolean }[] = [
  { cle: 'fr', nom: 'Français', prete: true },
  { cle: 'fon', nom: 'Fon', prete: false },
  { cle: 'yo', nom: 'Yoruba', prete: false },
  { cle: 'en', nom: 'Anglais', prete: false },
]

export function Langues({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Langues" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Langue de l'application">
          {LANGUES.map(l => (
            <LigneChoix key={l.cle} nom={l.nom}
              note={l.prete ? undefined : 'Bientôt'}
              choisi={etat.reglages.langue === l.cle}
              onPress={() => {
                etat.reglages.langue = l.cle
                enregistrer()
                rafraichir()
              }} />
          ))}
        </Groupe>
        <Note>
          Seul le français est traduit pour l&apos;instant : choisir une autre
          langue conserve ton choix, mais l&apos;interface reste en français
          jusqu&apos;à ce que la traduction soit disponible.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 5. Affichage
// ------------------------------------------------------------

const THEMES: { cle: Reglages['theme']; nom: string }[] = [
  { cle: 'clair', nom: 'Clair' },
  { cle: 'sombre', nom: 'Sombre' },
  { cle: 'systeme', nom: 'Système' },
]

const TAILLES: { cle: Reglages['tailleTexte']; nom: string }[] = [
  { cle: 'petit', nom: 'Petit' },
  { cle: 'normal', nom: 'Normal' },
  { cle: 'grand', nom: 'Grand' },
]

export function Affichage({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  const [taille, setTaille] = useState(false)

  if (taille) {
    return (
      <SafeAreaView style={s.page} edges={['top']}>
        <Barre titre="Taille du texte" onRetour={() => setTaille(false)} />
        <ScrollView contentContainerStyle={s.corps}>
          <Groupe>
            {TAILLES.map(t => (
              <LigneChoix key={t.cle} nom={t.nom}
                choisi={etat.reglages.tailleTexte === t.cle}
                onPress={() => {
                  etat.reglages.tailleTexte = t.cle
                  enregistrer()
                  rafraichir()
                }} />
            ))}
          </Groupe>
          <Note>
            L&apos;application est dessinée sur des tailles fixes pour que les
            écrans ne débordent pas : ce choix est conservé mais n&apos;est pas
            encore appliqué aux textes.
          </Note>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const nomTheme = THEMES.find(t => t.cle === etat.reglages.theme)?.nom ?? 'Système'
  const nomTaille = TAILLES.find(t => t.cle === etat.reglages.tailleTexte)?.nom ?? 'Normal'

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Affichage" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Thème">
          {THEMES.map(t => (
            <LigneChoix key={t.cle} nom={t.nom}
              choisi={etat.reglages.theme === t.cle}
              onPress={() => {
                etat.reglages.theme = t.cle
                enregistrer()
                rafraichir()
              }} />
          ))}
        </Groupe>

        <Groupe titre="Texte">
          <LigneNav nom="Taille du texte" valeur={nomTaille}
            onPress={() => setTaille(true)} />
        </Groupe>

        <Groupe titre="Mouvement">
          <LigneBascule nom="Réduire les animations"
            detail="Moins de transitions et de défilements animés"
            cle="animationsReduites" onChange={rafraichir} />
        </Groupe>

        <Note>
          Ton choix ({nomTheme}) est conservé, mais le thème n&apos;est pas
          encore appliqué à l&apos;ensemble de l&apos;application : les écrans
          restent dessinés en clair. Le mode sombre viendra d&apos;un seul
          coup, sur tous les écrans à la fois.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 6. Liberer de l'espace
// ------------------------------------------------------------

export function LibererEspace({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  // Le cache de lecture n'est pas mesurable depuis l'application : on
  // affiche ce qu'on sait vraiment, c'est-a-dire le nombre de videos
  // deja telechargees, et on laisse le vidage au systeme.
  const [cacheVide, setCacheVide] = useState(false)

  const octets = etat.brouillons.reduce((total, b) => total + (b.octets || 0), 0)
  const nb = etat.brouillons.length

  const viderBrouillons = () => {
    if (nb === 0) return
    Alert.alert(
      'Vider les brouillons',
      `${nb} brouillon${nb > 1 ? 's' : ''} ${nb > 1 ? 'seront' : 'sera'} `
      + 'supprimé' + (nb > 1 ? 's' : '') + ' définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider', style: 'destructive',
          onPress: () => {
            etat.brouillons = []
            enregistrer()
            rafraichir()
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Libérer de l'espace" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe titre="Occupé par l'application">
          <View style={s.ligne}>
            <View style={s.ligneTexte}>
              <Text style={s.nom}>Brouillons</Text>
              <Text style={s.detail}>
                {nb === 0 ? 'Aucun brouillon'
                  : `${nb} brouillon${nb > 1 ? 's' : ''} enregistré${nb > 1 ? 's' : ''}`}
              </Text>
            </View>
            <Text style={s.poids}>{poidsLisible(octets)}</Text>
            <Pressable style={[s.vider, nb === 0 && s.viderInactif]}
              disabled={nb === 0} onPress={viderBrouillons} hitSlop={6}>
              <Text style={s.viderTexte}>Vider</Text>
            </Pressable>
          </View>

          <View style={s.ligne}>
            <View style={s.ligneTexte}>
              <Text style={s.nom}>Cache</Text>
              <Text style={s.detail}>
                {cacheVide
                  ? 'Vidé : les vidéos seront rechargées'
                  : 'Vidéos et images gardées pour la lecture'}
              </Text>
            </View>
            <Pressable style={[s.vider, cacheVide && s.viderInactif]}
              disabled={cacheVide} onPress={() => setCacheVide(true)} hitSlop={6}>
              <Text style={s.viderTexte}>Vider</Text>
            </Pressable>
          </View>
        </Groupe>

        <Note>
          Le poids des brouillons est celui de leurs fichiers vidéo. Le cache
          de lecture est géré par le système : le vider ici demande simplement
          à l&apos;application de recharger les vidéos, sa taille exacte ne
          nous est pas communiquée.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 7. Economiseur de donnees
// ------------------------------------------------------------

export function EconomiseurDonnees({ onRetour }: { onRetour: () => void }) {
  const rafraichir = useRafraichir()
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre="Économiseur de données" onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Groupe>
          <LigneBascule nom="Économiseur de données" cle="economieDonnees"
            onChange={rafraichir} />
        </Groupe>
        <Text style={s.paragraphe}>
          Avec l&apos;économiseur de données, les vidéos sont chargées dans une
          qualité plus basse et ne sont plus préchargées à l&apos;avance. Les
          images sont plus légères, et le téléchargement automatique est
          suspendu hors Wi-Fi. C&apos;est utile sur un forfait limité ou
          quand le réseau est lent.
        </Text>
        <Groupe titre="Téléchargements">
          <LigneBascule nom="Télécharger seulement en Wi-Fi"
            cle="telechargementWifi" onChange={rafraichir} />
        </Groupe>
        <Note>
          Le réglage est conservé. La baisse de qualité suivra le branchement
          du lecteur sur plusieurs définitions de la même vidéo.
        </Note>
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 8. Sections informatives
//
// Un titre, un paragraphe honnete, et des interrupteurs quand la
// section en comporte de vrais. Aucune donnee inventee.
// ------------------------------------------------------------

type Bascule = { nom: string; detail?: string; cle: keyof Reglages }

export type SectionInfo = {
  titre: string
  paragraphe: string
  groupe?: string
  bascules?: Bascule[]
  note?: string
}

// Contenu des sections encore informatives, dans l'ordre de l'ecran
// des parametres.
export const SECTIONS_INFO: Record<string, SectionInfo> = {
  "Temps d'écran et bien-être": {
    titre: "Temps d'écran et bien-être",
    paragraphe: 'Cette section réunira le temps passé chaque jour dans '
      + "l'application, une limite quotidienne à se fixer soi-même, et des "
      + 'pauses proposées au bout d’un long moment de visionnage. Le '
      + 'relevé du temps d’écran demande une mesure côté application '
      + 'qui n’est pas encore en place : rien n’est donc affiché '
      + 'plutôt qu’un chiffre inventé.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Rappels de pause',
        detail: 'Un rappel après un long moment de visionnage',
        cle: 'rappelPause' },
    ],
  },
  'Connexion Famille': {
    titre: 'Connexion Famille',
    paragraphe: 'La Connexion Famille permettra de relier ce compte à celui '
      + 'd’un parent, qui pourra alors fixer une limite de temps, '
      + 'restreindre le contenu affiché et choisir qui peut envoyer des '
      + 'messages. Le lien entre deux comptes se fera par un code à '
      + 'scanner. Aucune fonction de contrôle n’est active pour '
      + 'l’instant.',
  },
  Musique: {
    titre: 'Musique',
    paragraphe: 'Tu pourras ici relier un service de musique pour retrouver '
      + 'les sons entendus dans les vidéos, et garder une liste de ceux que '
      + 'tu as enregistrés. Les sons utilisés dans tes montages restent '
      + 'accessibles depuis l’écran de montage.',
  },
  'Boîte de réception et messagerie': {
    titre: 'Boîte de réception et messagerie',
    paragraphe: 'Cette section réglera qui peut t’envoyer un message, '
      + 'où arrivent les demandes des comptes que tu ne suis pas, et si les '
      + 'accusés de lecture sont envoyés. La boîte de réception, elle, est '
      + 'déjà utilisable depuis l’onglet « Messages ».',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Notifications de messages', cle: 'notifMessages' },
    ],
  },
  'Centre des activités': {
    titre: 'Centre des activités',
    paragraphe: 'Le centre des activités regroupera, en une seule liste, '
      + 'les j’aime, les commentaires, les mentions et les nouveaux '
      + 'abonnés. En attendant, ces activités arrivent dans l’onglet '
      + '« Messages », via le compte « Activité et nouveaux abonnés ».',
  },
  'Contrôle du public': {
    titre: 'Contrôle du public',
    paragraphe: 'Cette section servira à filtrer les commentaires sur des '
      + 'mots-clés, à mettre en sourdine des comptes, et à choisir qui peut '
      + 'commenter tes publications. Le réglage par publication existe déjà '
      + 'dans « Gérer les publications ».',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Filtrer les commentaires offensants',
        detail: 'Les commentaires signalés comme offensants sont masqués',
        cle: 'filtreCommentaires' },
    ],
  },
  Publicités: {
    titre: 'Publicités',
    paragraphe: 'Tu pourras consulter ici les thèmes utilisés pour choisir '
      + 'les publicités qui t’es montrées, et refuser qu’elles '
      + 'soient personnalisées. Tok 229 ne diffuse pas encore de '
      + 'publicité : ce réglage est pris d’avance.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Publicités personnalisées', cle: 'pubPersonnalisees' },
    ],
  },
  Lecture: {
    titre: 'Lecture',
    paragraphe: 'Les réglages de lecture décident si une vidéo démarre '
      + 'seule, si elle repart au début à la fin, et si le son est actif '
      + 'dès l’ouverture du fil. La vitesse de lecture et le saut des '
      + 'génériques viendront ensuite.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Lecture automatique', cle: 'lectureAuto' },
      { nom: 'Lire en boucle', cle: 'boucle' },
      { nom: 'Son au démarrage', cle: 'sonDemarrage' },
    ],
  },
  Accessibilité: {
    titre: 'Accessibilité',
    paragraphe: 'Cette section réunira les sous-titres automatiques, la '
      + 'réduction des animations et un contraste renforcé. Les sous-titres '
      + 'demandent une transcription côté serveur, qui n’est pas '
      + 'encore branchée.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Réduire les animations', cle: 'animationsReduites' },
      { nom: 'Sous-titres automatiques',
        detail: 'Dès que la transcription sera disponible',
        cle: 'sousTitresAuto' },
    ],
  },
  'Contacts et localisation': {
    titre: 'Contacts et localisation',
    paragraphe: 'La synchronisation des contacts sert à retrouver les '
      + 'personnes que tu connais déjà ; la localisation sert à proposer des '
      + 'vidéos tournées dans ton département. Aucune de ces deux '
      + 'autorisations n’est demandée pour l’instant : les activer '
      + 'ici enregistre ton accord, la demande système viendra avec la '
      + 'fonction.',
    groupe: 'Autorisations',
    bascules: [
      { nom: 'Synchroniser les contacts', cle: 'syncContacts' },
      { nom: 'Utiliser ma localisation', cle: 'localisation' },
    ],
  },
  'Vidéos hors ligne': {
    titre: 'Vidéos hors ligne',
    paragraphe: 'Les vidéos enregistrées pour une lecture sans réseau '
      + 'apparaîtront ici, avec le poids qu’elles occupent. Le '
      + 'téléchargement d’une vidéo depuis le fil n’est pas encore '
      + 'disponible, la liste est donc vide pour tout le monde.',
    groupe: 'Déjà réglable',
    bascules: [
      { nom: 'Télécharger seulement en Wi-Fi', cle: 'telechargementWifi' },
    ],
  },
  "Centre d'aide": {
    titre: "Centre d'aide",
    paragraphe: 'Le centre d’aide rassemblera les réponses aux '
      + 'questions courantes : récupérer un compte, signaler une vidéo, '
      + 'comprendre pourquoi une publication a été retirée. En attendant, '
      + 'écris-nous à aide@videobenin.bj.',
  },
  'Centre de confidentialité': {
    titre: 'Centre de confidentialité',
    paragraphe: 'Le centre de confidentialité expliquera, en français '
      + 'simple, quelles données sont enregistrées, pourquoi, et comment en '
      + 'demander une copie ou la suppression. Pour mémoire, cette version '
      + 'de démonstration garde tes données sur ton téléphone seulement.',
  },
  'Conditions et politiques': {
    titre: 'Conditions et politiques',
    paragraphe: 'Les conditions d’utilisation, les règles de la '
      + 'communauté et la politique de confidentialité seront publiées ici. '
      + 'Elles sont en cours de rédaction : aucun texte n’est affiché '
      + 'plutôt qu’un texte provisoire qui n’engagerait personne.',
  },
}

export function SectionInformative({ info, onRetour }: {
  info: SectionInfo; onRetour: () => void
}) {
  const rafraichir = useRafraichir()
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <Barre titre={info.titre} onRetour={onRetour} />
      <ScrollView contentContainerStyle={s.corps}>
        <Text style={s.paragraphe}>{info.paragraphe}</Text>
        {!!info.bascules?.length && (
          <Groupe titre={info.groupe}>
            {info.bascules.map(b => (
              <LigneBascule key={String(b.cle) + b.nom} nom={b.nom}
                detail={b.detail} cle={b.cle} onChange={rafraichir} />
            ))}
          </Groupe>
        )}
        {!!info.note && <Note>{info.note}</Note>}
      </ScrollView>
    </SafeAreaView>
  )
}

// ------------------------------------------------------------
// 9. Partager le profil
// ------------------------------------------------------------

// Lien public du profil. Le domaine est celui de l'application, meme si
// la page web n'existe pas encore : c'est l'adresse qui sera servie.
export const lienProfil = (pseudo: string) =>
  `https://videobenin.bj/@${pseudo}`

export async function partagerProfil(pseudo: string) {
  const lien = lienProfil(pseudo)
  try {
    await Share.share({
      message: `Retrouve @${pseudo} sur Tok 229\n${lien}`,
    })
  } catch { /* partage annule */ }
}

// ------------------------------------------------------------
// Styles — memes cartes blanches sur fond gris que
// PreferencesContenu, pour que les deux ecrans se ressemblent.
// ------------------------------------------------------------

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f1f2' },

  barre: { flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 48, paddingHorizontal: 12 },
  barreBouton: { width: 36, height: 40, justifyContent: 'center' },
  barreTitreGroupe: { flex: 1, alignItems: 'center' },
  barreTitre: { fontSize: 17, fontWeight: '600', color: '#111' },
  barreSousTitre: { fontSize: 12, color: '#888', marginTop: 2 },

  corps: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 6 },

  groupe: { marginBottom: 22 },
  groupeTitre: { fontSize: 14, fontWeight: '500', color: '#8a8a8e',
    marginBottom: 8, marginLeft: 4 },
  carte: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 16 },

  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 56, paddingVertical: 12 },
  ligneTexte: { flex: 1 },
  nom: { flex: 1, fontSize: 16, color: '#111' },
  nomRouge: { flex: 1, fontSize: 16, color: '#ff2856' },
  detail: { fontSize: 12.5, lineHeight: 17, color: '#8a8a8e', marginTop: 3 },
  valeur: { fontSize: 14, color: '#8a8a8e' },
  poids: { fontSize: 14, color: '#111', fontWeight: '600' },

  pastilleVerte: { width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: '#2fbf6b' },

  vider: { backgroundColor: '#f1f1f2', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 7 },
  viderInactif: { opacity: .45 },
  viderTexte: { fontSize: 13.5, fontWeight: '600', color: '#111' },

  paragraphe: { fontSize: 14.5, lineHeight: 21, color: '#5a5a5e',
    marginBottom: 22, marginTop: 4 },
  note: { fontSize: 12.5, lineHeight: 18, color: '#9b9b9f', marginTop: 2 },
})
