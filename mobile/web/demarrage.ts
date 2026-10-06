// Mise en route propre au web. Sur ordinateur, l'application s'affiche dans un
// cadre de telephone (une iframe a la taille d'un ecran mobile), pour que toutes
// les mesures d'ecran soient celles d'un telephone, comme dans l'application.
import { installerAlerte } from './alerte'

export function preparerWeb(): boolean {
  const style = document.createElement('style')
  style.textContent = `
    html, body, #root { height: 100%; margin: 0; background: #000; }
    body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
    input, textarea { outline: none; }
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }
  `
  document.head.appendChild(style)

  // Lecture automatique : le navigateur refuse le son avant le premier geste.
  // Une video refusee repart sans le son au lieu de rester figee ; au premier
  // toucher, le son revient sur tout ce qui avait ete coupe ainsi.
  installerSonAutomatique()

  document.documentElement.lang = 'fr'
  document.title = 'TockTick'

  // Installable comme application : une fois installee, Chrome autorise le
  // son des la lecture, sans toucher prealable.
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {})

  const installee = matchMedia('(display-mode: standalone)').matches
  const surOrdinateur = !installee && window.innerWidth > 640 && window.self === window.top && !matchMedia('(pointer: coarse)').matches
  if (surOrdinateur) {
    afficherCadreTelephone()
    return true
  }
  installerAlerte()
  return false
}

function afficherCadreTelephone() {
  const racine = document.getElementById('root')
  if (racine) racine.style.display = 'none'
  const scene = document.createElement('div')
  scene.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0b0b0b;'
  const cadre = document.createElement('iframe')
  cadre.src = location.pathname + location.search + (location.search ? '&' : '?') + 'cadre=1' + location.hash
  cadre.title = 'TockTick'
  cadre.allow = 'camera; microphone; autoplay; clipboard-write; web-share; fullscreen'
  const ajuster = () => {
    const h = Math.min(window.innerHeight - 32, 880)
    const w = Math.round(h * 393 / 852)
    cadre.style.cssText = `width:${w}px;height:${h}px;border:0;border-radius:44px;background:#000;box-shadow:0 0 0 10px #1c1c1e,0 0 0 11px #3a3a3c,0 30px 80px rgba(0,0,0,.6);`
  }
  ajuster()
  window.addEventListener('resize', ajuster)
  scene.appendChild(cadre)
  document.body.appendChild(scene)
}

// Lecteurs mis en sourdine par nous (lecture avec son refusee), y compris
// ceux qui ne sont pas dans la page (la musique joue par un element Audio
// detache). Ils restent marques jusqu'au toucher qui rend le son, meme s'ils
// sont mis en pause entre-temps : sinon ils resteraient muets pour de bon.
const sourdine = new Set<HTMLMediaElement>()
// Parmi eux, ceux que l'application veut voir jouer.
const aRelancer = new Set<HTMLMediaElement>()

function installerSonAutomatique() {
  const jouer = HTMLMediaElement.prototype.play
  let pastille: HTMLDivElement | null = null
  const montrerPastille = () => {
    if (pastille) return
    pastille = document.createElement('div')
    pastille.textContent = '🔇  Touche l’écran pour activer le son'
    pastille.style.cssText = 'position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9998;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,.6);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;pointer-events:none;white-space:nowrap'
    document.body.appendChild(pastille)
  }
  // Une pause demandee par l'application : ce lecteur ne doit pas repartir seul.
  const arreter = HTMLMediaElement.prototype.pause
  HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
    aRelancer.delete(this)
    return arreter.call(this)
  }
  // Une sourdine posee par l'application elle-meme (video dont la musique
  // remplace la piste) prime : on ne la levera pas au toucher.
  const descripteur = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted')!
  let nousMemes = false
  Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    ...descripteur,
    set(this: HTMLMediaElement, v: boolean) {
      if (!nousMemes) sourdine.delete(this)
      descripteur.set!.call(this, v)
    },
  })
  const assourdir = (m: HTMLMediaElement, v: boolean) => { nousMemes = true; m.muted = v; nousMemes = false }

  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    const media = this
    ;(window as unknown as { __medias?: Set<HTMLMediaElement> }).__medias ??= new Set()
    ;(window as unknown as { __medias: Set<HTMLMediaElement> }).__medias.add(media)
    if (sourdine.has(media)) aRelancer.add(media)
    const promesse = jouer.call(media)
    promesse?.catch((e: DOMException) => {
      // Sur iPhone, chaque nouveau lecteur peut etre refuse, meme apres un
      // premier toucher : la sourdine automatique reste donc toujours prete.
      if (e?.name !== 'NotAllowedError' || media.muted) return
      assourdir(media, true)
      sourdine.add(media)
      aRelancer.add(media)
      jouer.call(media).catch(() => {})
      montrerPastille()
    })
    return promesse
  }
  // Le geste qui active le son ne doit rien faire d'autre (sinon il mettrait
  // aussi la video en pause) : on l'absorbe quand une sourdine automatique attend.
  const absorber = (e: Event) => { e.stopPropagation(); e.preventDefault() }
  const debloquer = (e: Event) => {
    if (!sourdine.size) { pastille?.remove(); pastille = null; return }
    if (pastille && e.type !== 'keydown') {
      for (const t of ['pointerup', 'click', 'touchend', 'mouseup']) window.addEventListener(t, absorber, { capture: true })
      absorber(e)
      setTimeout(() => { for (const t of ['pointerup', 'click', 'touchend', 'mouseup']) window.removeEventListener(t, absorber, { capture: true }) }, 450)
    }
    // Le son revient. Relancer pendant le toucher autorise aussi le lecteur
    // pour la suite (iPhone) ; ceux mis en pause par l'application restent en pause.
    sourdine.forEach(m => {
      assourdir(m, false)
      if (!m.paused || aRelancer.has(m)) jouer.call(m).catch(() => {})
    })
    sourdine.clear(); aRelancer.clear()
    pastille?.remove(); pastille = null
  }
  for (const evt of ['pointerdown', 'touchstart', 'keydown']) window.addEventListener(evt, debloquer, { capture: true })
}
