// @ts-nocheck
/* Vytažení údajů o závodu z webu nebo propozic – bez AI, jen pravidla (zdarma). */

const MONTHS = { ledna: 1, leden: 1, unora: 2, unor: 2, brezna: 3, brezen: 3, dubna: 4, duben: 4, kvetna: 5, kveten: 5, cervna: 6, cerven: 6, cervence: 7, cervenec: 7, srpna: 8, srpen: 8, zari: 9, rijna: 10, rijen: 10, listopadu: 11, listopad: 11, prosince: 12, prosinec: 12 }
export const norm = (x) => (x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const iso = (y, m, d) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
const valid = (y, m, d) => { const dt = new Date(y, m - 1, d); return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d }

function ldEvents(ld) {
  const out = []
  const walk = (o) => {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o)) return o.forEach(walk)
    const t = [].concat(o['@type'] || [])
    if (t.some((x) => /Event/i.test(x))) out.push(o)
    if (o['@graph']) walk(o['@graph'])
  }
  ;(ld || []).forEach((s) => { try { walk(JSON.parse(s)) } catch { /* ignore */ } })
  return out
}

function findDates(text, today) {
  const t = norm(text)
  const res = []
  const add = (pos, y, m, d, d2) => { if (valid(y, m, d)) { const a = iso(y, m, d); if (a >= today) res.push({ pos, from: a, to: d2 && valid(y, m, d2) && d2 > d ? iso(y, m, d2) : '' }) } }
  for (const m of t.matchAll(/(\d{1,2})\.\s?(?:[–-]\s?(\d{1,2})\.\s?)?(\d{1,2})\.\s?(20\d{2})/g)) add(m.index, +m[4], +m[3], +m[1], m[2] ? +m[2] : 0)
  for (const m of t.matchAll(/(\d{1,2})\.\s?(?:[–-]\s?(\d{1,2})\.\s?)?(ledna|leden|unora|unor|brezna|brezen|dubna|duben|kvetna|kveten|cervence|cervenec|cervna|cerven|srpna|srpen|zari|rijna|rijen|listopadu|listopad|prosince|prosinec)\s?(20\d{2})?/g)) {
    const y = m[4] ? +m[4] : new Date().getFullYear(); const mo = MONTHS[m[3]]
    let yy = y; if (!m[4] && iso(y, mo, +m[1]) < today) yy = y + 1
    add(m.index, yy, mo, +m[1], m[2] ? +m[2] : 0)
  }
  for (const m of t.matchAll(/(20\d{2})-(\d{2})-(\d{2})/g)) add(m.index, +m[1], +m[2], +m[3], 0)
  const kw = [...t.matchAll(/termin|datum|kdy|konani|kona se|date|zavod se kona/g)].map((m) => m.index)
  res.forEach((r) => { r.score = (kw.some((k) => r.pos - k >= 0 && r.pos - k < 120) ? 3 : 0) - r.pos / 20000 })
  res.sort((a, b) => b.score - a.score)
  return res
}

function findDistances(text) {
  const out = []
  for (const m of text.matchAll(/(\d{1,3}(?:[,.]\d{1,3})?)\s?(km|kilometr)/gi)) {
    const v = parseFloat(m[1].replace(',', '.'))
    if (v >= 1 && v <= 300 && !out.includes(v)) out.push(v)
  }
  const n = norm(text)
  if (/pulmaraton|half marathon/.test(n) && !out.some((v) => v > 20 && v < 22)) out.push(21.1)
  if (/(^|[^l])maraton(?!sk)/.test(n.replace(/pulmaraton/g, '')) && !out.some((v) => v > 42 && v < 43)) out.push(42.2)
  return out.sort((a, b) => a - b).slice(0, 8)
}

function findPlace(text, ldPlace, placeNames) {
  const cands = []
  const t = ' ' + norm(text).replace(/[^a-z0-9]+/g, ' ') + ' '
  const kw = [...t.matchAll(/ (misto|start|prezence|kde|areal|sraz|centrum zavodu) /g)].map((m) => m.index)
  if (ldPlace) { const lp = norm(ldPlace); const hit = placeNames.filter((p) => lp.includes(norm(p))).sort((a, b) => b.length - a.length)[0]; if (hit) return hit }
  const ALIAS = { praha: ['praze', 'prahy', 'prahou'], brno: ['brne', 'brna', 'brnem'], plzen: ['plzni', 'plzne'], ostrava: ['ostrave', 'ostravy'] }
  for (const p of placeNames) {
    const words = norm(p).replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    if (words.join(' ').length < 4) continue
    const stem = (w) => (w.length > 4 ? w.replace(/[aeiouy]$/, '') : w) + (w.length > 3 ? '[a-z]{0,3}' : '')
    const alts = [words.map(stem).join(' ')].concat(ALIAS[words.join(' ')] || [])
    const re = new RegExp(' (?:' + alts.join('|') + ') ', 'g')
    let cnt = 0, near = 0, first = -1
    for (const m of t.matchAll(re)) { cnt++; if (first < 0) first = m.index; if (kw.some((q) => m.index - q >= 0 && m.index - q < 160)) near++; if (cnt > 20) break }
    if (cnt) cands.push({ p, score: near * 3 + Math.min(cnt, 5) + words.join(' ').length / 30 - first / 30000 })
  }
  cands.sort((a, b) => b.score - a.score)
  return cands[0] ? cands[0].p : ''
}

function findSurface(text) {
  const n = norm(text)
  if (/prekazk|ocr|gladiator|spartan/.test(n)) return 'OCR'
  if (/do vrchu|vybeh na|skyrace|vertical/.test(n)) return 'vrch'
  if (/trail|teren|kros|lesni|stezk/.test(n)) return /asfalt|silnic/.test(n) ? 'smiseny' : 'trail'
  if (/asfalt|silnic|ulicemi|mestem/.test(n)) return 'silnice'
  return 'neuvedeno'
}

function cleanTitle(s) {
  return (s || '').split(/\s[|–—-]\s|\s::\s/)[0].replace(/\s+/g, ' ').trim().slice(0, 120)
}

/** Vrátí odhad údajů závodu. src = {url,title,meta,ld,links,text} (u PDF jen text). */
export function parseRace(src, placeNames, today) {
  const text = src.text || ''
  const ev = ldEvents(src.ld)[0] || null
  const meta = src.meta || {}
  const out = { name: '', from: '', to: '', place: '', distances: [], start: '', reg: '', web: src.url && !/\.pdf/i.test(src.url) ? src.url : '', surface: 'neuvedeno', found: [] }
  out.name = cleanTitle(ev && ev.name) || cleanTitle(meta['og:title']) || cleanTitle(src.title) || (text.split('\n').map((l) => l.trim()).find((l) => l.length > 4 && l.length < 90) || '')
  if (ev && ev.startDate && String(ev.startDate).slice(0, 10) >= today) { out.from = String(ev.startDate).slice(0, 10); if (ev.endDate && String(ev.endDate).slice(0, 10) > out.from) out.to = String(ev.endDate).slice(0, 10) }
  if (!out.from) { const d = findDates(text + ' ' + (meta['og:description'] || ''), today)[0]; if (d) { out.from = d.from; out.to = d.to } }
  const ldPlace = ev && ev.location ? [ev.location.name, ev.location.address && (ev.location.address.addressLocality || ev.location.address.name)].filter(Boolean).join(' ') : ''
  out.place = findPlace(ldPlace + '\n' + (meta['og:description'] || '') + '\n' + text, ldPlace, placeNames)
  out.distances = findDistances(text)
  const st = norm(text).match(/start\w*[^0-9\n]{0,40}?(\d{1,2})[:.](\d{2})/)
  if (st && +st[1] < 24) out.start = st[1].padStart(2, '0') + ':' + st[2]
  const reg = (src.links || []).find((l) => /prihl|registr|register|entry|sign.?up/i.test(norm(l[1]) + ' ' + l[0]) && !/facebook|instagram|login/i.test(l[0]))
  if (reg) out.reg = reg[0]
  out.surface = findSurface(text)
  ;['name', 'from', 'place', 'distances', 'start', 'reg'].forEach((k) => { if (out[k] && (!Array.isArray(out[k]) || out[k].length)) out.found.push(k) })
  return out
}

/** Text z PDF v prohlížeči (pdf.js se načte až při potřebě). */
export async function pdfText(data) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data }).promise
  let t = ''
  for (let i = 1; i <= Math.min(doc.numPages, 8); i++) {
    const p = await doc.getPage(i); const c = await p.getTextContent()
    let last = null
    c.items.forEach((it) => { const y = it.transform ? Math.round(it.transform[5]) : 0; t += (last !== null && y !== last ? '\n' : ' ') + it.str; last = y })
    t += '\n'
  }
  return t
}
