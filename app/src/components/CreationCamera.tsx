import { useEffect, useRef, useState } from 'react'
import './creation-camera.css'

const filtres = [
  { nom: 'Original', effet: 'none' },
  { nom: 'Chaud', effet: 'sepia(.25) saturate(1.2)' },
  { nom: 'Froid', effet: 'saturate(.85) hue-rotate(15deg) contrast(1.05)' },
  { nom: 'Éclat', effet: 'brightness(1.12) saturate(1.3)' },
  { nom: 'Vintage', effet: 'sepia(.5) contrast(.9)' },
  { nom: 'Noir & blanc', effet: 'grayscale(1)' },
]

export default function CreationCamera({ onChoisir, onFermer }: { onChoisir: (f: File | null) => void; onFermer: () => void }) {
  const importer = useRef<HTMLInputElement>(null)
  const apercu = useRef<HTMLVideoElement>(null)
  const flux = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const limite = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pret, setPret] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const [mode, setMode] = useState('15 s')
  const [face, setFace] = useState(true)
  const [message, setMessage] = useState('')
  const [vignette, setVignette] = useState('')
  const [filtre, setFiltre] = useState(0)
  // Defilement tactile du carrousel : on suit l'abscisse du doigt et on avance
  // d'un filtre tous les 60 px parcourus, dans le sens du glissement. Le seuil
  // evite qu'un simple appui sur une vignette soit pris pour un balayage.
  const depart = useRef<number | null>(null)
  const dejaFranchi = useRef(0)

  const glisserDebut = (x: number) => { depart.current = x; dejaFranchi.current = 0 }
  const glisserSuite = (x: number) => {
    if (depart.current === null) return
    const crans = Math.trunc((depart.current - x) / 60)
    if (crans === dejaFranchi.current) return
    const pas = crans - dejaFranchi.current
    dejaFranchi.current = crans
    setFiltre(v => (v + pas + filtres.length * 10) % filtres.length)
  }
  const glisserFin = () => { depart.current = null }
  const outil = (nom: string) => {
    if (nom === 'Filtres' || nom === 'Effets') {setFiltre(v => (v + 1) % filtres.length);setMessage('');return}
    // Ces outils relevent de la capture et du montage : ni l'API Tok 229
    // ni la camera du navigateur ne les portent.
    setMessage(`${nom} : non pris en charge par la caméra du navigateur.`)
  }
  useEffect(() => {
    let annule = false
    setPret(false)
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('La caméra intégrée nécessite HTTPS sur téléphone. Ouvre une adresse sécurisée pour autoriser la caméra et le micro.')
      return
    }
    navigator.mediaDevices.getUserMedia({video:{facingMode:face?'user':'environment'},audio:true}).then(async stream => {
      if (annule) {stream.getTracks().forEach(t=>t.stop());return}
      flux.current = stream
      if (apercu.current) {apercu.current.srcObject=stream;await apercu.current.play().catch(()=>undefined)}
      if (!annule) setPret(true)
    }).catch(() => {if(!annule)setMessage('Autorise la caméra et le microphone dans ton navigateur, puis rouvre cet écran.')})
    return () => {
      annule=true
      if(limite.current) clearTimeout(limite.current)
      if(recorder.current && recorder.current.state !== 'inactive') {recorder.current.onstop=null;recorder.current.stop()}
      flux.current?.getTracks().forEach(t=>t.stop())
      flux.current=null
    }
  },[face])
  const enregistrer = () => {
    if(enregistrement){recorder.current?.stop();return}
    if(!flux.current || !pret)return
    if(typeof MediaRecorder==='undefined'){setMessage('Ce navigateur ne permet pas l’enregistrement intégré. Tu peux importer une vidéo.');return}
    try {
      const mimeType=['video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))
      const rec=new MediaRecorder(flux.current,mimeType?{mimeType}:undefined)
      recorder.current=rec
      const morceaux:Blob[]=[]
      rec.ondataavailable=e=>{if(e.data.size)morceaux.push(e.data)}
      rec.onstop=()=>{
        if(limite.current)clearTimeout(limite.current)
        setEnregistrement(false)
        const type=rec.mimeType || mimeType || 'video/webm'
        const blob=new Blob(morceaux,{type})
        if(blob.size)onChoisir(new File([blob],`video-${Date.now()}.${type.includes('mp4')?'mp4':'webm'}`,{type}))
      }
      rec.onerror=()=>{setMessage('L’enregistrement a échoué. Réessaie.');setEnregistrement(false)}
      rec.start(250)
      setEnregistrement(true)
      setMessage('')
      limite.current=setTimeout(()=>{if(rec.state==='recording')rec.stop()},mode==='60 s'?60000:15000)
    }catch{setMessage('Impossible de démarrer l’enregistrement sur ce navigateur.')}
  }
  return <div className="creation-camera"><div className="creation-viseur">
    <video ref={apercu} className={`creation-video ${face?'miroir':''}`} style={{filter:filtres[filtre].effet}} autoPlay muted playsInline onLoadedData={() => {const v=apercu.current;if(!v?.videoWidth)return;const c=document.createElement('canvas');c.width=120;c.height=120;const ctx=c.getContext('2d');const taille=Math.min(v.videoWidth,v.videoHeight);ctx?.drawImage(v,(v.videoWidth-taille)/2,(v.videoHeight-taille)/2,taille,taille,0,0,120,120);setVignette(c.toDataURL('image/jpeg',.7))}}/>
    <header><button aria-label="Fermer" onClick={onFermer}><svg viewBox="0 0 24 24"><path d="m4 4 16 16M20 4 4 20"/></svg></button><button className="creation-son" onClick={()=>outil('Ajouter un son')}><svg viewBox="0 0 24 24"><path d="M10 17V3l8 3v5l-8-3"/><ellipse cx="7" cy="18" rx="3" ry="4" fill="currentColor" stroke="none"/></svg>Ajouter un son</button><button aria-label="Changer de caméra" disabled={enregistrement} onClick={()=>setFace(!face)}><svg viewBox="0 0 24 24"><path d="M4 8a9 9 0 0 1 17 3M20 16A9 9 0 0 1 3 13"/><path d="m17 9 4 4 3-5M7 15l-4-4-3 5" fill="currentColor" stroke="none"/></svg></button></header>
    <div className="creation-outils">{['Flash','Minuteur','Disposition','Retouche','Filtres','Plus d’outils'].map((n,i)=><button key={n} aria-label={n} onClick={()=>outil(n)}><svg viewBox="0 0 24 24">{i===0?<><path d="m13 2-8 12h6l-1 8 9-13h-6Z"/><path d="m3 3 18 18"/></>:i===1?<><path d="M12 3a9 9 0 1 1-8 5M12 7v6l-4-3"/></>:i===2?<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18m0-9h9"/></>:i===3?<><circle cx="12" cy="8" r="4"/><path d="M4 22c0-11 16-11 16 0M21 2v6m-3-3h6"/></>:i===4?<><circle cx="12" cy="7" r="5"/><circle cx="7" cy="16" r="5"/><circle cx="17" cy="16" r="5"/></>:<path d="m4 8 8 8 8-8"/>}</svg></button>)}</div>
    {message && <p className="creation-message" role="status">{message}</p>}
    <div className="creation-commandes"><div className="creation-durees">{['10 min','60 s','15 s','PHOTO','TEXTE'].map(m=><button key={m} disabled={enregistrement} className={mode===m?'active':''} onClick={()=>{if(m==='10 min'||m==='PHOTO'||m==='TEXTE'){setMessage('Ce format n’est pas encore disponible. Tu peux importer une vidéo de 90 secondes maximum.');return}setMode(m)}}>{m}</button>)}</div><div className="creation-capture creation-carrousel" aria-label="Effets caméra" onTouchStart={e=>glisserDebut(e.touches[0].clientX)} onTouchMove={e=>glisserSuite(e.touches[0].clientX)} onTouchEnd={glisserFin} onPointerDown={e=>{if(e.pointerType!=="touch")glisserDebut(e.clientX)}} onPointerMove={e=>{if(e.pointerType!=="touch"&&e.buttons===1)glisserSuite(e.clientX)}} onPointerUp={glisserFin} onPointerLeave={glisserFin}>{[-2,-1,0,1,2].map(decalage => {const index=(filtre+decalage+filtres.length)%filtres.length;if(decalage===0)return <button key="filmer" className={`creation-enregistrer ${enregistrement?'en-cours':''}`} disabled={!pret} aria-label={enregistrement?'Arrêter l’enregistrement':`Filmer avec le filtre ${filtres[index].nom}`} title={filtres[index].nom} onClick={enregistrer}>{vignette && index!==0 ? <img className="creation-enregistrer-apercu" src={vignette} alt="" style={{filter:filtres[index].effet}}/> : null}<span/></button>;return <button key={decalage} className="creation-vignette-effet" aria-label={`Aperçu ${filtres[index].nom}`} title={`${filtres[index].nom} — aperçu uniquement`} onClick={()=>setFiltre(index)}>{vignette ? <img src={vignette} alt="" style={{filter:filtres[index].effet}}/> : <span style={{filter:filtres[index].effet}}/>}</button>})}</div><p className="creation-filtre-actif">{filtres[filtre].nom}</p></div>
  </div><footer><button className="creation-galerie" aria-label="Importer depuis la galerie" onClick={()=>importer.current?.click()}><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 17 6-6 12 7"/><circle cx="16" cy="8" r="2"/></svg></button><button onClick={()=>outil('Diffusion LIVE')}>LIVE</button><button className="active">PUBLIER</button><button onClick={()=>outil('Créer')}>CRÉER</button></footer>
  <input hidden ref={importer} type="file" accept="video/*" onChange={e=>onChoisir(e.target.files?.[0]??null)}/></div>
}
