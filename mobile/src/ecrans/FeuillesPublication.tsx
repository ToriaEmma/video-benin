import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '../composants/Texte'
import Feuille from '../composants/Feuille'
import { feuille as F } from '../lib/theme'
import Interrupteur from '../composants/Interrupteur'
import {
  LiveEvents, PubMonde, Amies, Cadenas, ChevronDroit,
  PubCommentaire, PubReutilisation, PubDivulgation, PubDroitsSon,
  PubRechercheVisuelle, PubHauteQualite, PubTelecharger, PubFiligrane,
  PubLangue, PubOeilBarre, PubIA, PubLieu,
  LogoWhatsApp, LogoFacebook, LogoSMS,
} from '../composants/Icones'

// Les douze departements du Benin, dans l'ordre de la version web.
export const DEPARTEMENTS = [
  'Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Couffo',
  'Donga', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou',
] as const

export type Departement = typeof DEPARTEMENTS[number]

// Qui peut voir la publication : la valeur choisie sur la page de publication.
export type Audience = 'tous' | 'amis' | 'moi'

export const AUDIENCES: Record<Audience, string> = {
  tous: 'Tout le monde peut voir cette publication',
  amis: 'Tes ami(e)s peuvent voir cette publication',
  moi: 'Toi seul(e) peux voir cette publication',
}

// Les reglages de « Plus d'options », rassembles pour que la page de
// publication n'en garde qu'un seul etat.
export type Options = {
  commentaires: boolean
  reutilisation: boolean
  genereIA: boolean
  droitsSon: boolean
  rechercheVisuelle: boolean
  hauteQualite: boolean
  surAppareil: boolean
  filigrane: boolean
  publicAdulte: boolean
}

export const OPTIONS_PAR_DEFAUT: Options = {
  commentaires: true,
  reutilisation: true,
  genereIA: false,
  droitsSon: false,
  rechercheVisuelle: true,
  hauteQualite: false,
  surAppareil: true,
  filigrane: false,
  publicAdulte: false,
}

// Applications vers lesquelles la publication peut etre relayee.
const APPLICATIONS = [
  { cle: 'whatsapp', nom: 'WhatsApp', Logo: LogoWhatsApp },
  { cle: 'facebook', nom: 'Facebook', Logo: LogoFacebook },
  { cle: 'sms', nom: 'SMS', Logo: LogoSMS },
] as const

export type Application = typeof APPLICATIONS[number]['cle']

// --- Ligne a interrupteur, avec une explication facultative dessous ---
const LigneBascule = ({ Icone, titre, detail, valeur, onChange }: {
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
  titre: string
  detail?: React.ReactNode
  valeur: boolean
  onChange: (v: boolean) => void
}) => (
  <View style={s.ligne}>
    <Icone taille={F.icone} couleur="#111" />
    <View style={s.ligneCorps}>
      <Text style={s.ligneTitre}>{titre}</Text>
      {detail != null && <Text style={s.ligneDetail}>{detail}</Text>}
    </View>
    <Interrupteur actif={valeur} onChange={onChange} />
  </View>
)

// --- Ligne qui mene ailleurs : chevron a droite ---
const LigneChevron = ({ Icone, titre, detail, valeurDroite }: {
  Icone: React.ComponentType<{ taille?: number; couleur?: string }>
  titre: string
  detail?: string
  valeurDroite?: string
}) => (
  <Pressable style={s.ligne}>
    <Icone taille={F.icone} couleur="#111" />
    <View style={s.ligneCorps}>
      <Text style={s.ligneTitre}>{titre}</Text>
      {detail != null && <Text style={s.ligneDetail}>{detail}</Text>}
    </View>
    {valeurDroite != null && <Text style={s.valeurDroite}>{valeurDroite}</Text>}
    <ChevronDroit taille={F.chevron} couleur="#c4c4c6" />
  </Pressable>
)

// ============================================================
// « Ajouter un lien »
// ============================================================
export function FeuilleLien({ visible, onFermer }: {
  visible: boolean; onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Ajouter un lien" onFermer={onFermer}
      croixCerclee={false}>
      <Pressable style={s.ligneLien}>
        <LiveEvents taille={F.pastille} couleur="#ff2856" />
        <View style={s.ligneCorps}>
          <Text style={s.lienTitre}>LIVE Events</Text>
          <Text style={s.lienDetail}>Publie un lien vers ton LIVE</Text>
        </View>
      </Pressable>
    </Feuille>
  )
}

// ============================================================
// « Qui peut voir cette publication »
// ============================================================
export function FeuilleAudience({ visible, audience, onChoisir, onFermer }: {
  visible: boolean
  audience: Audience
  onChoisir: (a: Audience) => void
  onFermer: () => void
}) {
  // Un rond rouge plein marque le choix courant, un rond vide les autres.
  const rond = (valeur: Audience) => valeur === audience
    ? <View style={s.rondChoisi}><View style={s.rondCoeur} /></View>
    : <View style={s.rondVide} />

  return (
    <Feuille visible={visible} titre="Qui peut voir cette publication"
      onFermer={onFermer}>
      <View style={s.audienceHaut} />

      <Pressable style={s.ligne} onPress={() => onChoisir('tous')}>
        <PubMonde taille={F.icone} couleur="#111" />
        <View style={s.ligneCorps}><Text style={s.audienceTitre}>Tout le monde</Text></View>
        {rond('tous')}
      </Pressable>

      <Pressable style={s.ligne} onPress={() => onChoisir('amis')}>
        <Amies taille={F.icone} couleur="#111" />
        <View style={s.ligneCorps}>
          <Text style={s.audienceTitre}>Ami(e)s</Text>
          <View style={s.amisDetail}>
            <Text style={s.ligneDetail}>Followers que tu suis en retour · 38 ami(e)s</Text>
            <ChevronDroit taille={13} couleur="#9a9a9c" />
          </View>
        </View>
        {rond('amis')}
      </Pressable>

      <Pressable style={s.ligne} onPress={() => onChoisir('moi')}>
        <Cadenas taille={F.icone} couleur="#111" />
        <View style={s.ligneCorps}><Text style={s.audienceTitre}>Toi uniquement</Text></View>
        {rond('moi')}
      </Pressable>
    </Feuille>
  )
}

// ============================================================
// « Choisir un département »
// ============================================================
export function FeuilleDepartement({ visible, departement, onChoisir, onFermer }: {
  visible: boolean
  departement: Departement
  onChoisir: (d: Departement) => void
  onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Choisir un département" onFermer={onFermer}>
      <Text style={s.intro}>
        Indique le département du Bénin où cette vidéo a été filmée.
      </Text>

      <View style={s.bloc}>
        {DEPARTEMENTS.map((d, i) => (
          <Pressable key={d} style={[s.ligne, i > 0 && s.ligneSuivante]}
            onPress={() => onChoisir(d)}>
            <PubLieu taille={F.icone} couleur="#111" />
            <View style={s.ligneCorps}><Text style={s.audienceTitre}>{d}</Text></View>
            {d === departement
              ? <View style={s.rondChoisi}><View style={s.rondCoeur} /></View>
              : <View style={s.rondVide} />}
          </Pressable>
        ))}
      </View>
    </Feuille>
  )
}

// ============================================================
// « Plus d'options »
// ============================================================
export function FeuilleOptions({ visible, options, onChange, onFermer }: {
  visible: boolean
  options: Options
  onChange: (o: Options) => void
  onFermer: () => void
}) {
  const bascule = (cle: keyof Options) => (v: boolean) =>
    onChange({ ...options, [cle]: v })

  return (
    <Feuille visible={visible} titre="Plus d'options" onFermer={onFermer}>
      <Text style={s.section}>Paramètres de confidentialité</Text>
      <View style={s.bloc}>
        <LigneBascule Icone={PubCommentaire} titre="Autoriser les commentaires"
          valeur={options.commentaires} onChange={bascule('commentaires')} />
        <LigneBascule Icone={PubReutilisation} titre="Autoriser la réutilisation du contenu"
          detail="Duos, Collages, stickers et ajout en Story"
          valeur={options.reutilisation} onChange={bascule('reutilisation')} />
      </View>

      <Text style={s.section}>Paramètres avancés</Text>
      <View style={s.bloc}>
        <LigneChevron Icone={PubDivulgation}
          titre="Divulgation de contenu et publicités" />
        <LigneBascule Icone={PubIA} titre="Contenu généré par IA"
          detail={<>
            Ajoute cette étiquette pour indiquer aux spectateurs que ton contenu
            a été généré ou modifié par une IA.{' '}
            <Text style={s.enSavoirPlus}>En savoir plus</Text>
          </>}
          valeur={options.genereIA} onChange={bascule('genereIA')} />
        <LigneBascule Icone={PubDroitsSon}
          titre="Vérification automatique des droits d'auteur du son"
          detail="Les sons de ta vidéo seront vérifiés automatiquement afin d'identifier tout problème relatif aux droits d'auteur. Les résultats te seront communiqués immédiatement."
          valeur={options.droitsSon} onChange={bascule('droitsSon')} />
        <LigneBascule Icone={PubRechercheVisuelle} titre="Autoriser la recherche visuelle"
          detail="Ton contenu sera éligible à la recherche visuelle pour que les autres personnes puissent trouver du contenu ou des produits similaires."
          valeur={options.rechercheVisuelle} onChange={bascule('rechercheVisuelle')} />
        <LigneBascule Icone={PubHauteQualite}
          titre="Autoriser les importations de haute qualité"
          detail="Les vidéos de qualité supérieure peuvent être plus longues à traiter."
          valeur={options.hauteQualite} onChange={bascule('hauteQualite')} />
        <LigneBascule Icone={PubTelecharger} titre="Enregistrer sur l'appareil"
          detail="Ta publication sera enregistrée sur l'appareil, sauf en cas d'infraction aux Règles de la communauté."
          valeur={options.surAppareil} onChange={bascule('surAppareil')} />
        <LigneBascule Icone={PubFiligrane} titre="Enregistrer les publications avec filigrane"
          detail="Cela n'affecte que les photos et les vidéos que tu as publiées."
          valeur={options.filigrane} onChange={bascule('filigrane')} />
        <LigneChevron Icone={PubLangue} titre="Sélectionner la langue de la vidéo"
          detail="Les vidéos dans les langues prises en charge s'accompagneront de légendes générées …"
          valeurDroite="Fr" />
        <LigneBascule Icone={PubOeilBarre} titre="Contrôles du public⑦"
          detail="Cette vidéo n'est accessible qu'aux utilisateur(trice)s de 18 ans et plus."
          valeur={options.publicAdulte} onChange={bascule('publicAdulte')} />
      </View>
    </Feuille>
  )
}

// ============================================================
// « Partager sur »
// ============================================================
export function FeuillePartage({ visible, choisies, onBasculer, onFermer }: {
  visible: boolean
  choisies: Application[]
  onBasculer: (a: Application) => void
  onFermer: () => void
}) {
  return (
    <Feuille visible={visible} titre="Partager sur" onFermer={onFermer}
      croixCerclee={false} fondGris>
      <Text style={s.intro}>
        Après la publication, TockTick ouvrira l&apos;application que tu
        sélectionnes ci-dessous afin que tu puisses la partager.
      </Text>

      <View style={s.blocBlanc}>
        {APPLICATIONS.map(({ cle, nom, Logo }, i) => (
          <Pressable key={cle} style={[s.lignePartage, i > 0 && s.lignePartageSuivante]}
            onPress={() => onBasculer(cle)}>
            <Logo taille={F.pastille} />
            <Text style={s.partageNom}>{nom}</Text>
            {choisies.includes(cle)
              ? <View style={s.rondChoisi}><View style={s.rondCoeur} /></View>
              : <View style={s.rondVide} />}
          </Pressable>
        ))}
      </View>
    </Feuille>
  )
}

const s = StyleSheet.create({
  // Lignes communes aux trois feuilles.
  ligne: { flexDirection: 'row', alignItems: 'center', gap: F.interligne,
    paddingHorizontal: F.marge, paddingVertical: F.hauteurLigne },
  ligneCorps: { flex: 1, gap: 3 },
  ligneTitre: { color: '#111', fontSize: F.entree, lineHeight: 20 },
  ligneDetail: { color: '#8e8e93', fontSize: F.description, lineHeight: 15 },
  valeurDroite: { color: '#9a9a9c', fontSize: F.valeur },
  enSavoirPlus: { color: '#111', fontSize: F.description, fontWeight: '700' },

  // « Ajouter un lien » : une seule entree, avec sa vignette rouge.
  ligneLien: { flexDirection: 'row', alignItems: 'center', gap: F.interligne,
    paddingHorizontal: F.marge, paddingVertical: 8 },
  lienTitre: { color: '#111', fontSize: F.entree, fontWeight: '700' },
  lienDetail: { color: '#8e8e93', fontSize: F.description },

  // « Qui peut voir » : espace avant la premiere ligne, puis les ronds.
  audienceHaut: { height: 10 },
  audienceTitre: { color: '#111', fontSize: F.entree },
  amisDetail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rondVide: { width: F.rond, height: F.rond, borderRadius: F.rond / 2,
    borderWidth: 1.8, borderColor: '#d1d1d6' },
  rondChoisi: { width: F.rond, height: F.rond, borderRadius: F.rond / 2,
    backgroundColor: '#ff2856', alignItems: 'center', justifyContent: 'center' },
  rondCoeur: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // « Partager sur » : un paragraphe, puis les applications sur fond blanc.
  intro: { color: '#8e8e93', fontSize: F.intro, lineHeight: 18,
    paddingHorizontal: F.marge, paddingTop: 6, paddingBottom: 16 },
  blocBlanc: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 12,
    paddingHorizontal: 4 },
  lignePartage: { flexDirection: 'row', alignItems: 'center', gap: F.interligne,
    paddingHorizontal: 12, paddingVertical: 14 },
  lignePartageSuivante: { borderTopWidth: 1, borderTopColor: '#f0f0f1' },
  partageNom: { flex: 1, color: '#111', fontSize: F.entree, fontWeight: '700' },

  // « Plus d'options » : des blocs gris clair sous des titres de section.
  section: { color: '#8e8e93', fontSize: F.section, paddingHorizontal: F.marge,
    paddingTop: 15, paddingBottom: 8 },
  bloc: { backgroundColor: '#f7f7f8', borderRadius: 12, marginHorizontal: 12 },

  // « Choisir un département » : les douze entrees separees d'un filet.
  ligneSuivante: { borderTopWidth: 1, borderTopColor: '#ececed' },
})
