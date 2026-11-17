// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
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
    note: 'Přidáno automaticky z ' + (x.source_kind === 'pdf' ? 'propozic' : 'webu závodu') + ' – ověř si údaje u pořadatele.', user: true,
  }
}

function nearestRegion(lat, lon) {
  let best = 'Středočeský', bd = 1e9
  RACES.forEach((r) => { const d = (r.lat - lat) ** 2 + ((r.lon - lon) * 0.65) ** 2; if (d < bd) { bd = d; best = r.region } })
  return best
}

const toks = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['beh', 'behu', 'zavod', 'run', 'race', 'trail', '2026', '2027'].includes(w)))
export function findDup(d) {
  if (!d.from) return null
  const a = toks(d.name)
  return RACES.find((r) => {
    const dd = Math.abs((new Date(r.from) - new Date(d.from)) / 864e5)
    if (dd > 1) return false
    const b = toks(r.name); const c = [...a].filter((x) => b.has(x)).length
    if (c && c / Math.max(1, Math.min(a.size, b.size)) >= 0.5) return true
    return dd === 0 && d.place && norm(r.place).startsWith(norm(d.place)) && c > 0
  }) || null
}

function F({ label, children, hint }) { return <div className="fld"><label>{label}{hint && <span style={{ fontWeight: 400, color: '#5A5F66' }}> · {hint}</span>}</label>{children}</div> }

export default function AddRace({ onClose, onAdded, placeNames, cities, user }) {
  const [step, setStep] = useState('input')
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
    setKind(k); setD({ ...r, distText: r.distances.join(', ').replace(/\./g, ',') }); setDup(findDup(r)); setStep('form')
  }
  async function loadUrl() {
    setErr(''); const u = url.trim()
    if (!/^https?:\/\//i.test(u)) return setErr('Vlož celou adresu, např. https://www.mujzavod.cz')
    if (/facebook\.com|fb\.me/i.test(u)) setErr('Facebook bez přihlášení obsah neukáže – údaje nejspíš budeš muset doplnit ručně.')
    setBusy(true)
    try {
      const r = await fetch('/api/extract?url=' + encodeURIComponent(u))
      if ((r.headers.get('content-type') || '').includes('pdf')) { const t = await pdfText(new Uint8Array(await r.arrayBuffer())); await fromSource({ text: t, url: u }, 'pdf') }
      else { const j = await r.json(); if (j.error) { setErr(j.error); setBusy(false); return } await fromSource(j, 'url') }
    } catch { setErr('Stránku se nepodařilo načíst. Zkus nahrát propozice v PDF.') }
    setBusy(false)
  }
  async function loadFile(f) {
    if (!f) return
    setErr('')
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) return setErr('Zatím umím přečíst propozice v PDF.')
    if (f.size > 8e6) return setErr('Soubor je větší než 8 MB.')
    setBusy(true)
    try { const t = await pdfText(new Uint8Array(await f.arrayBuffer())); if (t.replace(/\s/g, '').length < 40) setErr('PDF neobsahuje text (asi je to sken) – údaje doplň ručně.'); await fromSource({ text: t, url: '' }, 'pdf') } catch { setErr('PDF se nepodařilo přečíst.') }
    setBusy(false)
  }
  async function save() {
    setErr('')
    const name = (d.name || '').trim(); const place = (d.place || '').trim()
    const c = d.geo ? [d.geo.lat, d.geo.lon] : cities[place]
    if (name.length < 3) return setErr('Doplň název závodu.')
    if (!d.from || d.from < TODAY) return setErr('Doplň datum závodu (v budoucnu).')
    if (!c) return setErr('Vyber místo z nabídky (začni psát název obce a klepni na ni).')
    const distances = (d.distText || '').split(/[;,/ ]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => x > 0 && x <= 400).slice(0, 12)
    const dp = findDup({ ...d, name, place })
    if (dp) { setDup(dp); return setErr('Tenhle závod už v kalendáři máme – díky!') }
    if (!supabase) return setErr('Přidávání závodů funguje jen na ostrém webu.')
    setBusy(true)
    const row = { name, date_from: d.from, date_to: d.to || null, place, region: (d.geo && d.geo.region) || nearestRegion(c[0], c[1]), lat: c[0], lon: c[1], distances, surface: d.surface || 'neuvedeno', start_time: d.start || null, web: /^https?:\/\//.test(d.web || '') ? d.web : null, reg: /^https?:\/\//.test(d.reg || '') ? d.reg : null, source_url: kind === 'url' ? url.trim() : null, source_kind: kind, submitter: user && user.method !== 'demo' ? user.id : null }
    const { data, error } = await supabase.from('user_races').insert(row).select().single()
    setBusy(false)
    if (error) return setErr('Uložení se nepovedlo: ' + error.message)
    onAdded(rowToRace(data)); setStep('done')
  }

  const ok = (k) => d && d.found && d.found.includes(k)

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(21,23,26,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, zIndex: 70 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="addTitle" style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 520, width: '100%', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '94vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="addTitle" style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 23 }}>{step === 'done' ? 'Závod je v kalendáři' : 'Přidat závod'}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#4A4F56', lineHeight: 1.5 }}>{step === 'input' ? 'Stačí odkaz na web závodu nebo propozice v PDF. Údaje vyplním sám, ty je jen zkontroluješ.' : step === 'form' ? (kind === 'manual' ? 'Vyplň základní údaje – stačí název, datum a místo.' : 'Takhle jsem to přečetl. Oprav, co nesedí, a ulož.') : 'Díky! Závod uvidí všichni hned teď.'}</p>
          </div>
          <button className="xbtn" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>

        {step === 'input' && <>
          <F label="Web závodu nebo odkaz na propozice">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadUrl() }} placeholder="https://www.mujzavod.cz" autoFocus />
          </F>
          <button className="btn" disabled={busy} onClick={loadUrl} style={{ minHeight: 46 }}>{busy ? 'Čtu stránku…' : 'Načíst údaje'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#5A5F66', fontSize: 13 }}><span style={{ flex: 1, height: 1, background: '#E2E0D8' }} />nebo<span style={{ flex: 1, height: 1, background: '#E2E0D8' }} /></div>
          <label className="ghost" style={{ minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            Nahrát propozice (PDF)
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => loadFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          <button className="linkbtn" style={{ alignSelf: 'center', fontWeight: 500, fontSize: 13 }} onClick={() => { setKind('manual'); setD({ name: '', from: '', to: '', place: '', distText: '', start: '', web: '', reg: '', surface: 'neuvedeno', found: [] }); setStep('form') }}>Vyplnit ručně</button>
        </>}

        {step === 'form' && d && <>
          {dup && <div style={{ background: '#FCE9DD', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#7C2D12' }}>Podobný závod už v kalendáři je: <b>{dup.name}</b> ({dup.from.split('-').reverse().join('. ')}, {dup.place}). Pokud jde o stejný závod, nemusíš nic přidávat.</div>}
          <F label="Název závodu" hint={ok('name') ? 'načteno' : 'doplň'}><input type="text" value={d.name} onChange={(e) => set({ name: e.target.value })} /></F>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
            <F label="Datum" hint={ok('from') ? 'načteno' : 'doplň'}><input type="date" value={d.from} min={TODAY} onChange={(e) => set({ from: e.target.value })} style={{ font: '500 15px Inter,sans-serif', border: '1px solid #D9D6CC', borderRadius: 10, minHeight: 44, padding: '0 10px' }} /></F>
            <F label="Start" hint="nepovinné"><input type="text" value={d.start} onChange={(e) => set({ start: e.target.value })} placeholder="10:00" /></F>
          </div>
          <F label="Místo (obec)" hint={ok('place') ? 'načteno' : 'vyber ze seznamu'}><input type="text" list="mista-add" value={d.place} onChange={(e) => typePlace(e.target.value)} placeholder="začni psát, např. Turnov" autoComplete="off" /><datalist id="mista-add">{placeNames.map((p) => <option key={p} value={p} />)}</datalist>
            {sugs.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sugs.map((g) => <button key={g.name + g.lat} type="button" className="chip" style={{ minHeight: 34, fontSize: 13, padding: '2px 10px' }} onClick={() => { set({ place: g.name, geo: g }); setSugs([]) }}>{g.name}<span style={{ color: '#5A5F66', marginLeft: 4 }}>{g.label.replace(/, Česko$/, '')}</span></button>)}</div>}
            {d.geo && <span style={{ fontSize: 12.5, color: '#24502F' }}>✓ {d.geo.name}, {d.geo.region}</span>}</F>
          <F label="Tratě v km" hint={ok('distances') ? 'načteno' : 'např. 5, 10, 21,1'}><input type="text" value={d.distText} onChange={(e) => set({ distText: e.target.value })} /></F>
          <F label="Povrch"><select value={d.surface} onChange={(e) => set({ surface: e.target.value })}>{SURFS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></F>
          <F label="Web závodu" hint="nepovinné"><input type="text" value={d.web} onChange={(e) => set({ web: e.target.value })} placeholder="https://" /></F>
          <F label="Odkaz na přihlášky" hint={ok('reg') ? 'načteno' : 'nepovinné'}><input type="text" value={d.reg} onChange={(e) => set({ reg: e.target.value })} placeholder="https://" /></F>
          <button className="btn" disabled={busy} onClick={save} style={{ minHeight: 46 }}>{busy ? 'Ukládám…' : 'Přidat do kalendáře'}</button>
          <button className="linkbtn" style={{ alignSelf: 'center', fontWeight: 500, fontSize: 13 }} onClick={() => { setStep('input'); setErr(''); setDup(null) }}>Zpět</button>
        </>}

        {step === 'done' && <button className="btn" onClick={onClose} style={{ minHeight: 46 }}>Hotovo</button>}
        {err && <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B42318' }}>{err}</p>}
      </div>
    </div>
  )
}
