// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { tr } from '../lib/i18n'
import { RACES, SURFS } from '../data/races'
import { supabase } from '../lib/auth'
import { parseRace, pdfText, norm } from '../lib/extract'

const TODAY = new Date().toISOString().slice(0, 10)
const MAPY = import.meta.env.VITE_MAPY_API_KEY
const KRAJ = (n) => (n || '').replace(/^Hlavní město /, '').replace(/^Kraj /, '').replace(/ kraj$/, '')
async function suggest(q) {
  if (!MAPY || q.trim().length < 2) return []
  try {
    const r = await fetch('https://api.mapy.cz/v1/suggest?lang=cs&limit=6&type=regional.municipality&type=regional.municipality_part&locality=cz&query=' + encodeURIComponent(q) + '&apikey=' + MAPY)
    const j = await r.json()
    return (j.items || []).map((it) => ({ name: it.name, lat: it.position.lat, lon: it.position.lon, region: KRAJ(((it.regionalStructure || []).find((x) => x.type === 'regional.region') || {}).name), label: it.location || '' }))
  } catch { return [] }
}

export function rowToRace(x) {
  const dists = (x.distances || []).map((d) => [Number(d), null])
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'přihláška' } }
  return {
    id: 'u-' + x.id, name: x.name, series: '', from: x.date_from, to: x.date_to || null, place: x.place, region: x.region,
    lat: x.lat, lon: x.lon, surface: x.surface || 'neuvedeno', tracks: dists, tracksYear: 2027, start: x.start_time || null, kids: false,
    flags: [], status: 'uzivatel', plat: ['user'], links: { reg: x.reg ? [host(x.reg), x.reg] : null, start: null, res: null },
    src: [['Přidáno běžcem na Startovce', x.source_url || x.web || '']], web: x.web || x.source_url || '', webOwn: !!x.web, venue: '', fee: '',
    note: tr('Přidáno automaticky z ') + (x.source_kind === 'pdf' ? 'propozic' : tr('webu závodu')) + tr(' – ověř si údaje u pořadatele.'), user: true,
  }
}

function nearestRegion(lat, lon) {
  let best = 'Středočeský', bd = 1e9
  RACES.forEach((r) => { const d = (r.lat - lat) ** 2 + ((r.lon - lon) * 0.65) ** 2; if (d < bd) { bd = d; best = r.region } })
  return best
}

const GENERIC = new Set(['beh', 'behu', 'bezecky', 'zavod', 'run', 'race', 'trail', 'cross', 'kros', 'mikulassky', 'vanocni', 'silvestrovsky', 'stepansky', 'novorocni', 'adventni', 'velikonocni', 'jarni', 'letni', 'podzimni', 'zimni', 'nocni', 'pulmaraton', 'maraton', 'desitka', 'petka', 'memorial', 'cena', 'velka', 'mala', 'pohar', 'night', 'winter', 'christmas', 'olympijsky', 'lesni', 'okolo', 'kolem', 'rocnik', '2026', '2027'])
const toks = (s, place) => { const pl = new Set(norm(place).split(/[^a-z0-9]+/)); return new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !GENERIC.has(w) && !pl.has(w) && !/^\d+$/.test(w))) }
const km = (a, b) => { const R = 6371, t = Math.PI / 180; const x = Math.sin((b[0] - a[0]) * t / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin((b[1] - a[1]) * t / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)) }
/** Stejný závod = do 1 dne od sebe, do 20 km od sebe a shodné výrazné slovo v názvu (nebo stejný web). */
export function findDup(d, pos) {
  if (!d.from) return null
  const a = toks(d.name, d.place)
  const host = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/$/, '') } catch { return '' } }
  const hw = host(d.web || '')
  return RACES.find((r) => {
    const dd = Math.abs((new Date(r.from) - new Date(d.from)) / 864e5)
    if (dd > 1) return false
    if (hw && hw.includes('/') && host(r.web || '') === hw) return true
    if (pos && km(pos, [r.lat, r.lon]) > 20) return false
    if (!pos && d.place && !norm(r.place).includes(norm(d.place)) && !norm(d.place).includes(norm(r.place.split(/ [–-] /)[0]))) return false
    const b = toks(r.name, r.place); const c = [...a].filter((x) => b.has(x)).length
    if (!a.size || !b.size) return dd === 0 // obecný název na stejném místě a ve stejný den
    return c / Math.min(a.size, b.size) >= 0.5
  }) || null
}

function F({ label, children, hint }) { return <div className="fld"><label>{label}{hint && <span style={{ fontWeight: 400, color: '#5A5F66' }}> · {hint}</span>}</label>{children}</div> }

export default function AddRace({ onClose, onAdded, placeNames, cities, user }) {
  const [step, setStep] = useState('input')
  const hp = useRef(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [d, setD] = useState(null)
  const [kind, setKind] = useState('url')
  const [dup, setDup] = useState(null)
  const set = (o) => setD((p) => ({ ...p, ...o }))
  const [sugs, setSugs] = useState([])
  const tmr = useRef(null)
  const typePlace = (v) => { set({ place: v, geo: null }); clearTimeout(tmr.current); tmr.current = setTimeout(async () => setSugs(cities[v] ? [] : await suggest(v)), 250) }
  useEffect(() => () => clearTimeout(tmr.current), [])

  async function fromSource(src, k) {
    const r = parseRace(src, placeNames, TODAY)
    setKind(k); setD({ ...r, distText: r.distances.join(', ').replace(/\./g, ',') }); setDup(findDup(r, r.place && cities[r.place])); setStep('form')
  }
  async function loadUrl() {
    setErr(''); const u = url.trim()
    if (!/^https?:\/\//i.test(u)) return setErr(tr('Vlož celou adresu, např. https://www.mujzavod.cz'))
    if (/facebook\.com|fb\.me/i.test(u)) setErr(tr('Facebook bez přihlášení obsah neukáže – údaje nejspíš budeš muset doplnit ručně.'))
    setBusy(true)
    try {
      const r = await fetch('/api/extract?url=' + encodeURIComponent(u))
      if ((r.headers.get('content-type') || '').includes('pdf')) { const t = await pdfText(new Uint8Array(await r.arrayBuffer())); await fromSource({ text: t, url: u }, 'pdf') }
      else { const j = await r.json(); if (j.error) { setErr(j.error); setBusy(false); return } await fromSource(j, 'url') }
    } catch { setErr(tr('Stránku se nepodařilo načíst. Zkus nahrát propozice v PDF.')) }
    setBusy(false)
  }
  async function loadFile(f) {
    if (!f) return
    setErr('')
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) return setErr(tr('Zatím umím přečíst propozice v PDF.'))
    if (f.size > 8e6) return setErr(tr('Soubor je větší než 8 MB.'))
    setBusy(true)
    try { const t = await pdfText(new Uint8Array(await f.arrayBuffer())); if (t.replace(/\s/g, '').length < 40) setErr(tr('PDF neobsahuje text (asi je to sken) – údaje doplň ručně.')); await fromSource({ text: t, url: '' }, 'pdf') } catch { setErr(tr('PDF se nepodařilo přečíst.')) }
    setBusy(false)
  }
  async function save(force) {
    setErr('')
    const name = (d.name || '').trim(); const place = (d.place || '').trim()
    const c = d.geo ? [d.geo.lat, d.geo.lon] : cities[place]
    if (name.length < 3) return setErr(tr('Doplň název závodu.'))
    if (!d.from || d.from < TODAY) return setErr(tr('Doplň datum závodu (v budoucnu).'))
    if (!c) return setErr(tr('Vyber místo z nabídky (začni psát název obce a klepni na ni).'))
    const distances = (d.distText || '').split(/[;,/ ]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => x > 0 && x <= 400).slice(0, 12)
    const dp = force ? null : findDup({ ...d, name, place }, c)
    if (dp) { setDup(dp); return setErr(tr('Tenhle závod už v kalendáři máme – díky! Pokud jde o jiný závod, klikni na „Je to jiný závod“.')) }
    if (!supabase) return setErr(tr('Přidávání závodů funguje jen na ostrém webu.'))
    if (hp.current && hp.current.value) return setStep('done')
    const LK = 'startovka.adds'; let log = []
    try { log = JSON.parse(localStorage.getItem(LK) || '[]').filter((t) => t > Date.now() - 36e5) } catch { /* ignore */ }
    if (log.length >= 6) return setErr(tr('Za poslední hodinu jsi přidal(a) hodně závodů – další zkus prosím později.'))
    setBusy(true)
    const row = { name, date_from: d.from, date_to: d.to || null, place, region: (d.geo && d.geo.region) || nearestRegion(c[0], c[1]), lat: c[0], lon: c[1], distances, surface: d.surface || 'neuvedeno', start_time: d.start || null, web: /^https?:\/\//.test(d.web || '') ? d.web : null, reg: /^https?:\/\//.test(d.reg || '') ? d.reg : null, source_url: kind === 'url' ? url.trim() : null, source_kind: kind, submitter: user && user.method !== 'demo' ? user.id : null }
    const { data, error } = await supabase.from('user_races').insert(row).select().single()
    setBusy(false)
    if (error) return setErr(tr('Uložení se nepovedlo: ') + error.message)
    try { localStorage.setItem(LK, JSON.stringify([...log, Date.now()])) } catch { /* ignore */ }
    onAdded(rowToRace(data)); setStep('done')
  }

  const ok = (k) => d && d.found && d.found.includes(k)

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(21,23,26,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, zIndex: 70 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="addTitle" style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 520, width: '100%', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '94vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="addTitle" style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 23 }}>{step === 'done' ? tr('Závod je v kalendáři') : tr('Přidat závod')}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#4A4F56', lineHeight: 1.5 }}>{step === 'input' ? tr('Stačí odkaz na web závodu nebo propozice v PDF. Údaje vyplním sám, ty je jen zkontroluješ.') : step === 'form' ? (kind === 'manual' ? tr('Vyplň základní údaje – stačí název, datum a místo.') : tr('Takhle jsem to přečetl. Oprav, co nesedí, a ulož.')) : tr('Díky! Závod uvidí všichni hned teď.')}</p>
          </div>
          <button className="xbtn" onClick={onClose} aria-label={tr('Zavřít')}>✕</button>
        </div>

        {step === 'input' && <>
          <F label="Web závodu nebo odkaz na propozice">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadUrl() }} placeholder={tr('https://www.mujzavod.cz')} autoFocus />
          </F>
          <button className="btn" disabled={busy} onClick={loadUrl} style={{ minHeight: 46 }}>{busy ? tr('Čtu stránku…') : tr('Načíst údaje')}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#5A5F66', fontSize: 13 }}><span style={{ flex: 1, height: 1, background: '#E2E0D8' }} />{tr('nebo')}<span style={{ flex: 1, height: 1, background: '#E2E0D8' }} /></div>
          <label className="ghost" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            Nahrát propozice (PDF)
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => loadFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          <button className="linkbtn" style={{ alignSelf: 'center', fontWeight: 500, fontSize: 13 }} onClick={() => { setKind('manual'); setD({ name: '', from: '', to: '', place: '', distText: '', start: '', web: '', reg: '', surface: 'neuvedeno', found: [] }); setStep('form') }}>Vyplnit ručně</button>
        </>}

        {step === 'form' && d && <>
          {dup && <div style={{ background: '#FCE9DD', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#7C2D12' }}>{tr('Podobný závod už v kalendáři je:')} <b>{dup.name}</b> ({dup.from.split('-').reverse().join('. ')}, {dup.place}). Pokud jde o stejný závod, nemusíš nic přidávat.</div>}
          <F label="Název závodu" hint={ok('name') ? tr('načteno') : tr('doplň')}><input type="text" value={d.name} onChange={(e) => set({ name: e.target.value })} /></F>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
            <F label="Datum" hint={ok('from') ? tr('načteno') : tr('doplň')}><input type="date" value={d.from} min={TODAY} onChange={(e) => set({ from: e.target.value })} style={{ font: '500 15px Inter,sans-serif', border: '1px solid #D9D6CC', borderRadius: 10, minHeight: 44, padding: '0 10px' }} /></F>
            <F label="Start" hint="nepovinné"><input type="text" value={d.start} onChange={(e) => set({ start: e.target.value })} placeholder="10:00" /></F>
          </div>
          <F label="Místo (obec)" hint={ok('place') ? tr('načteno') : 'vyber ze seznamu'}><input type="text" list="mista-add" value={d.place} onChange={(e) => typePlace(e.target.value)} placeholder={tr('začni psát, např. Turnov')} autoComplete="off" /><datalist id="mista-add">{placeNames.map((p) => <option key={p} value={p} />)}</datalist>
            {sugs.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sugs.map((g) => <button key={g.name + g.lat} type="button" className="chip" style={{ minHeight: 34, fontSize: 13, padding: '2px 10px' }} onClick={() => { set({ place: g.name, geo: g }); setSugs([]) }}>{g.name}<span style={{ color: '#5A5F66', marginLeft: 4 }}>{g.label.replace(/, Česko$/, '')}</span></button>)}</div>}
            {d.geo && <span style={{ fontSize: 12.5, color: '#24502F' }}>✓ {d.geo.name}, {d.geo.region}</span>}</F>
          <F label="Tratě v km" hint={ok('distances') ? tr('načteno') : tr('např. 5, 10, 21,1')}><input type="text" value={d.distText} onChange={(e) => set({ distText: e.target.value })} /></F>
          <F label="Povrch"><select value={d.surface} onChange={(e) => set({ surface: e.target.value })}>{SURFS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></F>
          <F label="Web závodu" hint="nepovinné"><input type="text" value={d.web} onChange={(e) => set({ web: e.target.value })} placeholder={tr('https://')} /></F>
          <F label="Odkaz na přihlášky" hint={ok('reg') ? tr('načteno') : tr('nepovinné')}><input type="text" value={d.reg} onChange={(e) => set({ reg: e.target.value })} placeholder={tr('https://')} /></F>
          <input ref={hp} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
          <button className="btn" disabled={busy} onClick={() => save(false)} style={{ minHeight: 46 }}>{busy ? tr('Ukládám…') : tr('Přidat do kalendáře')}</button>
          {dup && <button className="ghost" disabled={busy} onClick={() => save(true)} style={{ minHeight: 42 }}>Je to jiný závod – přidat</button>}
          <button className="linkbtn" style={{ alignSelf: 'center', fontWeight: 500, fontSize: 13 }} onClick={() => { setStep('input'); setErr(''); setDup(null) }}>Zpět</button>
        </>}

        {step === 'done' && <button className="btn" onClick={onClose} style={{ minHeight: 46 }}>{tr('Hotovo')}</button>}
        {err && <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B42318' }}>{err}</p>}
      </div>
    </div>
  )
}
