// Mise en route propre au web : styles de base, son automatique, application
// installable. La mise en page ordinateur et tablette (menu a gauche, colonne
// centrale) est geree par l'application elle-meme (src/lib/ecran.tsx).
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

  installerAlerte()
  return false
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
    // Souris : « Clique » ; grand ecran : en haut a droite, hors de la video.
    const souris = matchMedia('(pointer: fine)').matches
    const grand = window.innerWidth >= 768
    pastille.textContent = souris ? '🔇  Clique n’importe où pour activer le son' : '🔇  Touche l’écran pour activer le son'
    pastille.style.cssText = `position:fixed;${grand ? 'top:18px;right:24px' : 'left:50%;top:calc(env(safe-area-inset-top) + 78px);transform:translateX(-50%)'};z-index:9998;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,.72);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;pointer-events:none;white-space:nowrap`
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

  // Rend le son a un lecteur. Il ne quitte la sourdine que si le navigateur
  // accepte de le jouer : sur iPhone, un essai hors d'un geste valide est
  // refuse, et le lecteur doit alors rester en sourdine (et continuer a
  // jouer) jusqu'au prochain toucher, sinon il resterait muet pour de bon.
  const rendreLeSon = (m: HTMLMediaElement) => {
    const voulu = !m.paused || aRelancer.has(m)
    assourdir(m, false)
    if (!voulu) { sourdine.delete(m); return }
    jouer.call(m)
      .then(() => {
        sourdine.delete(m); aRelancer.delete(m)
        if (!sourdine.size) { pastille?.remove(); pastille = null }
      })
      .catch(() => { assourdir(m, true); jouer.call(m).catch(() => {}) })
  }
  const essayer = () => { [...sourdine].forEach(rendreLeSon) }

  // Debut du geste : le toucher qui active le son ne doit rien faire
  // d'autre (sinon il mettrait aussi la video en pause), on l'absorbe donc
  // tant que la bulle est affichee. Android et ordinateur acceptent deja
  // le son a ce moment-la.
  // La musique (Web Audio, src/lib/piste.web.ts) attend elle aussi un
  // toucher : elle le signale, et la bulle s'affiche de la meme facon.
  const sonBloque = () => (window as unknown as { __sonBloque?: boolean }).__sonBloque === true
  window.addEventListener('tocktick:son-bloque', montrerPastille)
  window.addEventListener('tocktick:son-actif', () => {
    if (!sourdine.size) { pastille?.remove(); pastille = null }
  })

  const debutGeste = (e: Event) => {
    if (!sourdine.size && !sonBloque()) { pastille?.remove(); pastille = null; return }
    if (pastille && e.type !== 'keydown') {
      for (const t of ['pointerup', 'click', 'touchend', 'mouseup']) window.addEventListener(t, absorber, { capture: true })
      absorber(e)
      setTimeout(() => { for (const t of ['pointerup', 'click', 'touchend', 'mouseup']) window.removeEventListener(t, absorber, { capture: true }) }, 450)
    }
    essayer()
  }
  // Fin du geste : Safari (iPhone) n'autorise le son qu'ici, pas au simple
  // contact du doigt. Ecouteurs poses avant l'absorbeur : ils passent
  // toujours (stopPropagation n'arrete pas les ecouteurs de la meme cible).
  const finGeste = () => { if (sourdine.size) essayer() }
  for (const evt of ['touchend', 'click']) window.addEventListener(evt, finGeste, { capture: true })
  for (const evt of ['pointerdown', 'touchstart', 'keydown']) window.addEventListener(evt, debutGeste, { capture: true })

  // Diagnostic du son, sur demande (adresse terminee par ?diagnostic) :
  // un panneau montre en direct l'etat de chaque lecteur, pour comprendre
  // un probleme de son sur un telephone qu'on n'a pas sous la main.
  if (/[?&]diagnostic\b/.test(location.search)) afficherDiagnostic()
}

function afficherDiagnostic() {
  const panneau = document.createElement('pre')
  panneau.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:9999;margin:0;padding:8px;max-height:45vh;overflow:auto;background:rgba(0,0,0,.82);color:#7CFC00;font:11px/1.35 ui-monospace,Menlo,monospace;border-radius:8px;white-space:pre-wrap;pointer-events:none'
  document.body.appendChild(panneau)
  const erreurs: string[] = []
  window.addEventListener('error', e => erreurs.push(String(e.message).slice(0, 120)))
  window.addEventListener('unhandledrejection', e => erreurs.push(String(e.reason).slice(0, 120)))
  setInterval(() => {
    const medias = [...((window as unknown as { __medias?: Set<HTMLMediaElement> }).__medias ?? [])]
    const lignes = medias.map(m => {
      const src = (m.currentSrc || m.src || '').replace(/^https?:\/\//, '').slice(0, 38)
      return `${m.tagName === 'AUDIO' ? 'musique' : 'video  '} ${m.paused ? 'PAUSE' : 'JOUE '} ${m.muted ? 'MUET' : 'son '} t=${m.currentTime.toFixed(1)} pret=${m.readyState} err=${m.error?.code ?? '-'} ${src}`
    })
    panneau.textContent = [
      `TockTick diagnostic · ${navigator.userAgent.match(/(iPhone|Android|Macintosh|Windows)[^;)]*/)?.[0] ?? '?'}`,
      `son bloque : ${(window as unknown as { __sonBloque?: boolean }).__sonBloque ? "oui" : "non"} · en sourdine auto : ${sourdine.size} · a relancer : ${aRelancer.size} · bulle : ${document.body.innerText.includes('activer le son') ? 'oui' : 'non'}`,
      ...lignes,
      ...(erreurs.length ? ['erreurs :', ...erreurs.slice(-4)] : []),
    ].join('\n')
  }, 500)
}
