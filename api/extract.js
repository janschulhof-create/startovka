// Rundar – načtení stránky závodu pro automatické vyplnění (zdarma, bez AI).
// Vrací text stránky, meta tagy, JSON-LD a odkazy; PDF předá dál beze změny.
const BLOCK = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i
const ENT = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—' }
const dec = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isNaN(n) ? m : String.fromCodePoint(n) }
  return ENT[e.toLowerCase()] ?? m
})

export default async function handler(req, res) {
  const url = String((req.query && req.query.url) || '').trim()
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Zadej celou adresu začínající http:// nebo https://' })
  let host = ''
  try { host = new URL(url).hostname } catch { return res.status(400).json({ error: 'Neplatná adresa' }) }
  if (BLOCK.test(host)) return res.status(400).json({ error: 'Tuhle adresu nejde načíst' })
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000)
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; RundarBot/1.0; +https://rundar-run.vercel.app)', 'accept-language': 'cs,en;q=0.8' } })
    clearTimeout(t)
    if (!r.ok) return res.status(502).json({ error: 'Stránka odpověděla chybou ' + r.status })
    const ct = r.headers.get('content-type') || ''
    if (/pdf/i.test(ct) || /\.pdf($|\?)/i.test(r.url)) {
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > 8e6) return res.status(413).json({ error: 'PDF je příliš velké' })
      res.setHeader('content-type', 'application/pdf'); return res.status(200).send(buf)
    }
    const html = (await r.text()).slice(0, 2e6)
    const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).slice(0, 12)
    const meta = {}
    for (const m of html.matchAll(/<meta\s[^>]*>/gi)) {
      const k = (m[0].match(/(?:property|name)=["']([^"']+)["']/i) || [])[1]; const v = (m[0].match(/content=["']([^"']*)["']/i) || [])[1]
      if (k && v !== undefined) meta[k.toLowerCase()] = dec(v)
    }
    const title = dec(((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim())
    const links = [...html.matchAll(/<a\s[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => {
      let h = dec(m[1]); try { h = new URL(h, r.url).href } catch { /* ignore */ }
      return [h, dec(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()]
    }).filter((l) => /^https?:/.test(l[0])).slice(0, 500)
    const text = dec(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|td|th|section|article|dd|dt)>/gi, '\n').replace(/<[^>]+>/g, ' '))
      .replace(/[ \t ]+/g, ' ').replace(/\n\s*/g, '\n').replace(/\n{2,}/g, '\n').slice(0, 60000)
    res.setHeader('cache-control', 's-maxage=1800')
    return res.status(200).json({ url: r.url, title, meta, ld, links, text })
  } catch (e) {
    return res.status(502).json({ error: 'Stránku se nepodařilo načíst (nedostupná nebo vyžaduje přihlášení).' })
  }
}
