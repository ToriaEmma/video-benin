// Aperçu des liens partagés (fonction Vercel du site).
//
// WhatsApp, Telegram, Facebook ou X n'exécutent pas l'application : pour
// afficher une carte (image, titre, description) sous un lien, ils lisent
// les balises Open Graph de la page. Les adresses …/v/<id> et …/@<pseudo>
// passent donc par cette fonction, qui renvoie la page du site complétée de
// ces balises ; pour un visiteur, le site se lance ensuite normalement.

const API = 'https://tok-229-api.vercel.app'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PSEUDO = /^[a-z0-9._]{3,24}$/i

const echapper = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const raccourcir = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t)

async function lireJson(chemin) {
  try {
    const r = await fetch(API + chemin, { signal: AbortSignal.timeout(2500) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

// Titre, description et image pour une video publique.
async function apercuVideo(id, origine) {
  const v = await lireJson(`/videos/${id}`)
  // Video privee ou supprimee : l'API repond 404, on garde l'apercu general.
  if (!v) return null
  const musique = v.deezer ? `♫ ${v.deezer.title_short || v.deezer.title} — ${v.deezer.artist?.name ?? ''}` : ''
  return {
    titre: `${v.pseudo} sur TockTick`,
    description: raccourcir([v.legende, musique].filter(Boolean).join(' · ') || 'Regarde cette vidéo sur TockTick.', 200),
    image: v.miniature || `${origine}/icone-512.png`,
    grandeImage: !!v.miniature,
    type: 'video.other',
  }
}

async function apercuProfil(pseudo, origine) {
  const [p, videos] = await Promise.all([
    lireJson(`/profils/${encodeURIComponent(pseudo)}`),
    lireJson(`/profils/${encodeURIComponent(pseudo)}/videos?limite=1`),
  ])
  if (!p) return null
  const chiffres = `${p.nbAbonnes ?? 0} abonné${(p.nbAbonnes ?? 0) > 1 ? 's' : ''} · ${p.nbVideos ?? 0} vidéo${(p.nbVideos ?? 0) > 1 ? 's' : ''}`
  const miniature = Array.isArray(videos) && videos[0]?.miniature
  return {
    titre: `${p.nom || p.pseudo} (${p.pseudo}) sur TockTick`,
    description: raccourcir([chiffres, p.bio].filter(Boolean).join(' · '), 200),
    image: miniature || `${origine}/icone-512.png`,
    grandeImage: !!miniature,
    type: 'profile',
  }
}

module.exports = async (req, res) => {
  const origine = `https://${req.headers.host}`
  const { video, pseudo } = req.query
  const general = {
    titre: 'TockTick',
    description: 'Des vidéos courtes du Bénin : danse, musique, humour. Regarde sans compte.',
    image: `${origine}/icone-512.png`,
    grandeImage: false,
    type: 'website',
  }
  const apercu = (typeof video === 'string' && UUID.test(video) && await apercuVideo(video, origine))
    || (typeof pseudo === 'string' && PSEUDO.test(pseudo) && await apercuProfil(pseudo, origine))
    || general
  const adresse = typeof video === 'string' && UUID.test(video) ? `${origine}/v/${video}`
    : typeof pseudo === 'string' && PSEUDO.test(pseudo) ? `${origine}/@${pseudo}` : origine

  let page
  try {
    page = await (await fetch(`${origine}/index.html`, { signal: AbortSignal.timeout(2500) })).text()
  } catch {
    page = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>'
  }

  const balises = [
    `<meta name="description" content="${echapper(apercu.description)}">`,
    `<meta property="og:site_name" content="TockTick">`,
    `<meta property="og:type" content="${apercu.type}">`,
    `<meta property="og:title" content="${echapper(apercu.titre)}">`,
    `<meta property="og:description" content="${echapper(apercu.description)}">`,
    `<meta property="og:url" content="${echapper(adresse)}">`,
    `<meta property="og:image" content="${echapper(apercu.image)}">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta name="twitter:card" content="${apercu.grandeImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${echapper(apercu.titre)}">`,
    `<meta name="twitter:description" content="${echapper(apercu.description)}">`,
    `<meta name="twitter:image" content="${echapper(apercu.image)}">`,
  ].join('\n    ')

  page = page
    .replace(/<title>[^<]*<\/title>/, `<title>${echapper(apercu.titre)}</title>`)
    .replace('</head>', `    ${balises}\n  </head>`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Les robots de partage repassent rarement : quelques minutes suffisent.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600')
  res.status(200).send(page)
}
