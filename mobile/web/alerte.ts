// Sur le web, Alert.alert de react-native-web ne fait rien. On le remplace par
// une boite de dialogue au style Android : titre, message, boutons a droite.
import { Alert } from 'react-native'

type Bouton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }

export function installerAlerte() {
  Alert.alert = (titre: string, message?: string, boutons?: Bouton[]) => {
    const liste: Bouton[] = boutons && boutons.length ? boutons : [{ text: 'OK' }]
    const voile = document.createElement('div')
    voile.setAttribute('role', 'alertdialog')
    voile.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);font-family:-apple-system,system-ui,Roboto,sans-serif'
    const boite = document.createElement('div')
    boite.style.cssText = 'width:min(86vw,320px);background:#fff;border-radius:16px;padding:22px 22px 10px;box-shadow:0 10px 40px rgba(0,0,0,.25)'
    const t = document.createElement('div')
    t.textContent = titre
    t.style.cssText = 'font-size:18px;font-weight:600;color:#111;margin-bottom:' + (message ? '10px' : '18px')
    boite.appendChild(t)
    if (message) {
      const m = document.createElement('div')
      m.textContent = message
      m.style.cssText = 'font-size:15px;line-height:21px;color:#555;margin-bottom:18px'
      boite.appendChild(m)
    }
    const rangee = document.createElement('div')
    rangee.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap'
    const fermer = () => voile.remove()
    liste.forEach(b => {
      const el = document.createElement('button')
      el.type = 'button'
      el.textContent = b.text ?? 'OK'
      const couleur = b.style === 'destructive' ? '#ed2753' : b.style === 'cancel' ? '#666' : '#ff2856'
      el.style.cssText = `border:0;background:none;padding:10px 12px;font-size:15px;font-weight:600;color:${couleur};cursor:pointer;border-radius:8px`
      el.onclick = () => { fermer(); b.onPress?.() }
      rangee.appendChild(el)
    })
    boite.appendChild(rangee)
    voile.appendChild(boite)
    voile.onclick = e => {
      if (e.target !== voile) return
      const annuler = liste.find(b => b.style === 'cancel')
      fermer(); annuler?.onPress?.()
    }
    document.body.appendChild(voile)
    ;(rangee.lastElementChild as HTMLElement | null)?.focus()
  }
}
