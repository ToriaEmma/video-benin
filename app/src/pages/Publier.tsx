// ============================================================
// Ecran de publication : description a gauche, apercu a droite, puis
// la liste des reglages et le pied « Brouillons / Publier ».
//
// Jumeau de mobile/src/ecrans/Publier.tsx : memes lignes, meme ordre,
// memes libelles. Les cinq feuilles vivent dans FeuillesPublication.tsx.
// ============================================================

import { useState } from 'react'
import {
  apiBrouillons, apiVideos, televerser, fichierDepuisUrl,
  type NouvelleVideo,
} from '../lib/api'
import Couverture from './Couverture'
import {
  FeuilleLien, FeuilleAudience, FeuilleOptions, FeuillePartage,
  FeuilleDepartement,
} from './FeuillesPublication'
import {
  AUDIENCES, OPTIONS_PAR_DEFAUT,
  type Audience, type Options, type Application, type Departement,
} from '../lib/publication'
import {
  Chevron, ChevronDroit, Brouillon,
  PubLien, PubMonde, PubOptions, PubPublier, MontagePartage, PubLieu,
} from '../components/Icones'
import './publier.css'

// L'ecran parle d'audience, l'API de visibilite : « tous » y devient
// « monde », les deux autres valeurs portent le meme nom.
const VISIBILITES: Record<Audience, NonNullable<NouvelleVideo['visibilite']>> = {
  tous: 'monde',
  amis: 'amis',
  moi: 'moi',
}

export default function Publier({ onPublie, onAnnuler, onBrouillon, urlInitiale }: {
  onPublie: () => void
  // Retour a l'ecran de tournage, sans rien enregistrer.
  onAnnuler: () => void
  // Brouillon enregistre : la page appelante bascule sur le profil.
  onBrouillon?: () => void
  // Video arrivant du montage : elle existe deja en blob local.
  urlInitiale: string
}) {
  const [legende, setLegende] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  // Libelle de l'etape en cours : le televersement d'une video peut durer
  // sur un reseau mobile, et un bouton muet laisse croire a un blocage.
  const [etape, setEtape] = useState('')
  const [progression, setProgression] = useState(0)
  const [couverture, setCouverture] = useState(false)
  // Feuille ouverte depuis la liste d'options, s'il y en a une.
  const [feuille, setFeuille] =
    useState<'lien' | 'audience' | 'departement' | 'options' | 'partage' | null>(null)
  // Applications vers lesquelles relayer la publication, une fois publiee.
  const [partages, setPartages] = useState<Application[]>([])
  const [audience, setAudience] = useState<Audience>('tous')
  // Departement du Benin ou la video a ete filmee, pre-rempli sur « Littoral ».
  const [departement, setDepartement] = useState<Departement>('Littoral')
  const [options, setOptions] = useState<Options>(OPTIONS_PAR_DEFAUT)

  // La video est televersee avant l'enregistrement : publier l'adresse
  // locale ne donnerait une video lisible que dans cet onglet.
  const publier = async () => {
    if (envoi) return
    setEnvoi(true)
    setErreur('')
    setProgression(0)
    setEtape('Envoi de la vidéo…')
    try {
      const aEnvoyer = await fichierDepuisUrl(urlInitiale)
      const url = await televerser(aEnvoyer, setProgression)

      setEtape('Publication…')
      await apiVideos.creer({
        url,
        legende: legende.trim(),
        departement,
        visibilite: VISIBILITES[audience],
        // Les deux premiers interrupteurs de « Plus d'options » sont les
        // seuls que l'API connaisse ; les autres restent locaux a l'ecran.
        commentaires_autorises: options.commentaires,
        reutilisation_autorisee: options.reutilisation,
      })
      setLegende('')
      onPublie()
    } catch (e) {
      // Aucune video n'est creee si l'envoi echoue : la raison reelle est
      // montree telle quelle.
      setErreur(e instanceof Error ? e.message : "L'envoi a échoué")
      setProgression(0)
    } finally {
      setEnvoi(false)
      setEtape('')
    }
  }

  // « Brouillons » : la video est mise de cote avec sa description, puis
  // on repart sur le profil ou la tuile des brouillons l'affiche.
  const enregistrerBrouillon = async () => {
    if (envoi) return
    setEnvoi(true)
    setErreur('')
    setProgression(0)
    setEtape('Envoi de la vidéo…')
    try {
      // Un brouillon porte lui aussi un fichier : sans televersement il
      // serait perdu a la fermeture de l'onglet.
      const aEnvoyer = await fichierDepuisUrl(urlInitiale)
      const url = await televerser(aEnvoyer, setProgression)
      await apiBrouillons.creer(url, legende.trim(), aEnvoyer.size)
      setLegende('')
      if (onBrouillon) onBrouillon()
      else onAnnuler()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement a échoué")
    } finally {
      setEnvoi(false)
      setProgression(0)
      setEtape('')
    }
  }

  if (couverture) return <Couverture url={urlInitiale}
    onAnnuler={() => setCouverture(false)}
    onEnregistrer={() => setCouverture(false)} />

  return (
    <section className="pub-page">
      <div className="pub-corps">
        <button className="pub-retour" aria-label="Retour" onClick={onAnnuler}>
          <Chevron taille={24} />
        </button>

        {/* Description a gauche, apercu de la video a droite */}
        <div className="pub-entete">
          <textarea className="pub-description" maxLength={2200}
            placeholder="Ajouter une description…" aria-label="Description"
            value={legende} onChange={e => setLegende(e.target.value)} />
          <div className="pub-apercu">
            <video src={urlInitiale} muted loop autoPlay playsInline />
            <span className="pub-apercu-titre">Aperçu</span>
            <button className="pub-couverture" onClick={() => setCouverture(true)}>
              Modifier la couverture
            </button>
          </div>
        </div>

        <div className="pub-etiquettes">
          <button onClick={() => setLegende(l => l + '#')}># Hashtags</button>
          <button onClick={() => setLegende(l => l + '@')}>@ Mention</button>
        </div>

        <hr className="pub-separateur" />

        <button className="pub-ligne" onClick={() => setFeuille('lien')}>
          <PubLien taille={22} />
          <span className="pub-ligne-texte">Ajouter un lien</span>
          <ChevronDroit taille={18} />
        </button>

        <button className="pub-ligne" onClick={() => setFeuille('audience')}>
          <PubMonde taille={22} />
          <span className="pub-ligne-texte">{AUDIENCES[audience]}</span>
          <ChevronDroit taille={18} />
        </button>

        <button className="pub-ligne" onClick={() => setFeuille('departement')}>
          <PubLieu taille={22} />
          <span className="pub-ligne-texte">Département</span>
          <span className="pub-ligne-valeur">{departement}</span>
          <ChevronDroit taille={18} />
        </button>

        <button className="pub-ligne" onClick={() => setFeuille('options')}>
          <PubOptions taille={22} />
          <span className="pub-ligne-texte">Plus d&apos;options</span>
          <ChevronDroit taille={18} />
        </button>

        <button className="pub-ligne" onClick={() => setFeuille('partage')}>
          <MontagePartage taille={22} />
          <span className="pub-ligne-texte">Partager sur</span>
          <ChevronDroit taille={18} />
        </button>

        {erreur && <p className="pub-erreur" role="alert">{erreur}</p>}
      </div>

      <footer className="pub-pied">
        {envoi && (
          <div className="pub-progression"><div style={{ width: `${progression}%` }} /></div>
        )}
        <div className="pub-boutons">
          <button className="pub-brouillons" disabled={envoi}
            onClick={enregistrerBrouillon}>
            <Brouillon taille={20} />
            <span>Brouillons</span>
          </button>
          <button className="pub-publier" disabled={envoi} onClick={publier}>
            {envoi ? <span>{etape || 'Envoi…'}</span> : <>
              <PubPublier taille={20} />
              <span>Publier</span>
            </>}
          </button>
        </div>
      </footer>

      <FeuilleLien visible={feuille === 'lien'} onFermer={() => setFeuille(null)} />
      <FeuilleAudience visible={feuille === 'audience'} audience={audience}
        onChoisir={a => { setAudience(a); setFeuille(null) }}
        onFermer={() => setFeuille(null)} />
      <FeuilleDepartement visible={feuille === 'departement'} departement={departement}
        onChoisir={d => { setDepartement(d); setFeuille(null) }}
        onFermer={() => setFeuille(null)} />
      <FeuilleOptions visible={feuille === 'options'} options={options}
        onChange={setOptions} onFermer={() => setFeuille(null)} />
      <FeuillePartage visible={feuille === 'partage'} choisies={partages}
        onBasculer={a => setPartages(l =>
          l.includes(a) ? l.filter(x => x !== a) : [...l, a])}
        onFermer={() => setFeuille(null)} />
    </section>
  )
}
