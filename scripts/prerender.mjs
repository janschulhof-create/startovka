// Po buildu vytvoří statickou stránku pro každý závod (náhled ve Facebooku/WhatsAppu, Google),
// sitemap.xml a robots.txt. Spouští se automaticky v `npm run build`.
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const SITE = (process.env.SITE_URL || 'https://rundar-run.vercel.app').replace(/\/$/, '')
const DIST = 'dist'
const tmp = path.join('node_modules', '.cache', 'races.prerender.mjs')
fs.mkdirSync(path.dirname(tmp), { recursive: true })
await build({ entryPoints: ['src/data/races.ts'], bundle: true, format: 'esm', platform: 'node', outfile: tmp, loader: { '.json': 'json' }, logLevel: 'silent' })
globalThis.localStorage = { getItem: () => null, setItem() {} }
try { Object.defineProperty(globalThis, 'navigator', { value: { language: 'cs' }, configurable: true }) } catch { /* ignore */ }
globalThis.document = { documentElement: {} }
const { RACES, SURFLAB, regionLabel } = await import(path.resolve(tmp) + '?t=' + Date.now())

const tpl = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const MON = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']
const fmt = (iso) => { const d = new Date(iso + 'T12:00:00'); return d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear() }
const km = (r) => r.tracks.map((t) => String(t[0]).replace('.', ',') + ' km').join(', ')

function page(urlPath, title, desc, body, extraHead = '') {
  let h = tpl
  h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(title) + '</title>')
  h = h.replace(/<meta name="description"[^>]*>/, '<meta name="description" content="' + esc(desc) + '" />')
  h = h.replace(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="' + esc(title) + '" />')
  h = h.replace(/<meta property="og:description"[^>]*>/, '<meta property="og:description" content="' + esc(desc) + '" />')
  h = h.replace(/<meta property="og:url"[^>]*>/, '<meta property="og:url" content="' + SITE + urlPath + '" />')
  h = h.replace(/<link rel="canonical"[^>]*>/, '<link rel="canonical" href="' + SITE + urlPath + '" />')
  h = h.replace('</head>', extraHead + '</head>')
  h = h.replace('<div id="root"></div>', '<div id="root">' + body + '</div>')
  const dir = path.join(DIST, urlPath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), h)
}

const today = new Date().toISOString().slice(0, 10)
const urls = [SITE + '/']
let n = 0
for (const r of RACES) {
  const p = '/zavod/' + r.id + '/'
  const when = fmt(r.from) + (r.to ? ' – ' + fmt(r.to) : '')
  const title = r.name + ' – ' + when + ', ' + r.place + ' | Rundar'
  const desc = 'Běžecký závod ' + r.name + ' ' + when + ' (' + r.place + ', ' + regionLabel(r.region) + ')' + (r.tracks.length ? '. Tratě: ' + km(r) : '') + '. Přihláška, navigace a výsledky na Rundaru.'
  const ld = {
    '@context': 'https://schema.org', '@type': 'SportsEvent', name: r.name, sport: 'Running',
    startDate: r.from + (r.start ? 'T' + r.start : ''), endDate: r.to || r.from,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: r.place, address: { '@type': 'PostalAddress', addressLocality: r.place.split(' – ')[0], addressRegion: regionLabel(r.region), addressCountry: 'CZ' }, geo: { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lon } },
    url: SITE + p, description: desc, ...(r.webOwn ? { sameAs: r.web } : {}),
  }
  const body = '<main style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px"><p><a href="/">Rundar</a></p><h1>' + esc(r.name) + '</h1><p>' + esc(when) + ' · ' + esc(r.place) + ', ' + esc(regionLabel(r.region)) + '</p>' + (r.tracks.length ? '<p>Tratě: ' + esc(km(r)) + ' · ' + esc(SURFLAB[r.surface] || '') + '</p>' : '') + (r.start ? '<p>Start ' + esc(r.start) + '</p>' : '') + (r.web ? '<p><a href="' + esc(r.web) + '" rel="nofollow noopener">Web závodu</a></p>' : '') + '</main>'
  page(p, title, desc, body, '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>')
  if ((r.to || r.from) >= today) urls.push(SITE + p)
  n++
}
const STATIC = [
  ['/o-projektu/', 'O projektu a zdroje dat | Rundar', 'Odkud Rundar bere závody, jak funguje a kdo za ní stojí.'],
  ['/ochrana-udaju/', 'Ochrana osobních údajů | Rundar', 'Jak Rundar nakládá s osobními údaji (GDPR).'],
  ['/podminky/', 'Podmínky používání | Rundar', 'Podmínky používání webu Rundar.'],
]
for (const [p, t, d] of STATIC) { page(p, t, d, ''); urls.push(SITE + p) }
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n</urlset>\n')
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' + SITE + '/sitemap.xml\n')
console.log('prerender: ' + n + ' závodů, sitemap ' + urls.length + ' adres')
