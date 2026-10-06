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

  // Les lecteurs video interrompent souvent play() (changement de carte,
  // pause) : la promesse rejetee est attendue, on la marque comme geree.
  const jouer = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    const promesse = jouer.call(this)
    promesse?.catch(() => {})
    return promesse
  }
  document.documentElement.lang = 'fr'
  document.title = 'TockTick'

  const surOrdinateur = window.innerWidth > 640 && window.self === window.top && !matchMedia('(pointer: coarse)').matches
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
