// ============================================================
// Ponts vers les fonctions natives (Capacitor).
//
// Chaque fonction a un repli web : l'application tourne a l'identique dans un
// navigateur pour le developpement, et utilise l'API du telephone une fois
// installee. Rien n'est a dupliquer dans les ecrans.
// ============================================================

import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

export const estNatif = () => Capacitor.isNativePlatform()
export const plateforme = () => Capacitor.getPlatform() // 'android' | 'ios' | 'web'

/* ---------------- Partage ---------------- */

export async function partager(titre: string, texte: string, url: string) {
  // Sur mobile, la feuille de partage du systeme : WhatsApp y figure en
  // premier, ce qui compte au Benin ou il domine les usages.
  if (estNatif()) {
    try {
      await Share.share({ title: titre, text: texte, url, dialogTitle: 'Partager la vidéo' })
      return 'partage'
    } catch {
      return 'annule'
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: titre, text: texte, url })
      return 'partage'
    } catch {
      return 'annule'
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copie'
}

/* ---------------- Barre d'etat ---------------- */

export async function preparerInterface() {
  if (!estNatif()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    if (plateforme() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#000000' })
      // La video occupe tout l'ecran : la barre d'etat se superpose plutot
      // que de reduire la hauteur disponible.
      await StatusBar.setOverlaysWebView({ overlay: false })
    }
  } catch {
    // La barre d'etat n'est pas disponible : sans consequence sur le reste.
  }
}

export async function masquerEcranDemarrage() {
  if (!estNatif()) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // idem
  }
}

/* ---------------- Camera et galerie ---------------- */

export type VideoChoisie = { fichier: File; url: string }

export async function choisirVideo(): Promise<VideoChoisie | null> {
  // Capacitor Camera ne gere que les images : pour la video on passe par un
  // <input type="file" accept="video/*" capture>, que le systeme redirige
  // vers l'appareil photo ou la galerie, sur Android comme sur iOS.
  return new Promise(resolve => {
    const champ = document.createElement('input')
    champ.type = 'file'
    champ.accept = 'video/*'
    champ.setAttribute('capture', 'environment')
    champ.style.display = 'none'
    document.body.appendChild(champ)

    champ.onchange = () => {
      const f = champ.files?.[0] ?? null
      document.body.removeChild(champ)
      resolve(f ? { fichier: f, url: URL.createObjectURL(f) } : null)
    }
    // L'utilisateur peut fermer le selecteur sans rien choisir : on libere
    // alors le champ pour ne pas le laisser dans le document.
    champ.oncancel = () => {
      document.body.removeChild(champ)
      resolve(null)
    }

    champ.click()
  })
}

/* ---------------- Retour materiel (Android) ---------------- */

export async function surRetourAndroid(action: () => boolean) {
  if (!estNatif() || plateforme() !== 'android') return () => undefined
  const { App } = await import('@capacitor/app')
  const ecouteur = await App.addListener('backButton', ({ canGoBack }) => {
    // `action` renvoie true si elle a traite le retour (fermeture d'un ecran).
    // Sinon on laisse le comportement par defaut : revenir en arriere, ou
    // quitter l'application si on est deja a la racine.
    if (action()) return
    if (canGoBack) window.history.back()
    else App.exitApp()
  })
  return () => ecouteur.remove()
}
