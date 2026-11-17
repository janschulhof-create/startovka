// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import {
  RACES, HOME, MON, DOW, DISTS, SURFS, SURFLAB, TERR, FLAGS, SERIES, PLATS, STATUS, RADII, KRAJE, KMP, TERRLAB, PAGE,
  regionLabel, terrainOf, hasFlag, fmtKm, hasReg, resultLink,
} from './data/races'
import {
  DEMO, currentUser, onAuthChange, signInGoogle, signUpEmail, signInEmail, resetPassword, signOut,
  loadSaved, setSaved, setPendingSave, takePendingSave,
} from './lib/auth'
import { downloadIcs } from './lib/ics'
import MapView from './components/MapView'
import AddRace, { rowToRace } from './components/AddRace'
import { supabase } from './lib/auth'

const INITIAL = {
  q: '', radius: 0, dist: [], surf: [], terrain: 'vse', regions: [], kmMin: '', kmMax: '', flags: [], series: [], plats: [], status: [],
  regOnly: false, month: '', sort: 'datum', view: 'seznam', limit: PAGE,
  types: [], who: [], dateFrom: '', dateTo: '', distC: '', tol: 2,
}

const MONFULL = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
const QTYPES = [
  { id: 'silnice', label: 'Silnice', test: (r) => r.surface === 'silnice' },
  { id: 'trail', label: 'Trail / kros', test: (r) => r.surface === 'trail' },
  { id: 'vrch', label: 'Běh do vrchu', test: (r) => r.surface === 'vrch' },
  { id: 'smiseny', label: 'Smíšený terén', test: (r) => r.surface === 'smiseny' },
  { id: 'OCR', label: 'Překážkový (OCR)', test: (r) => r.surface === 'OCR' },
  { id: 'stafety', label: 'Štafety', test: (r) => hasFlag(r, 'stafety') },
  { id: 'nocni', label: 'Noční běh', test: (r) => hasFlag(r, 'nocni') },
  { id: 'ultra', label: 'Ultra', test: (r) => r.tracks.some((t) => t[0] > 42.5) },
]
const QWHO = [
  { id: 'kids', label: 'Pro děti', test: (r) => r.kids },
  { id: 'pes', label: 'Se psem', test: (r) => hasFlag(r, 'pes') },
  { id: 'reg', label: 'Online přihláška', test: (r) => hasReg(r) },
  { id: 'ofic', label: 'Ověřený termín', test: (r) => r.status === 'oficialni' },
]
const isoD = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function today0() { const t = new Date(); t.setHours(12, 0, 0, 0); return t }
function weekend(offset) { const t = today0(); const day = t.getDay(); if (day === 0) { const sat = addD(t, -1 + offset * 7); return [isoD(offset ? sat : t), isoD(addD(sat, 1))] } const sat = addD(t, 6 - day + offset * 7); return [isoD(sat), isoD(addD(sat, 1))] }
const TODAY = isoD(today0())
const isPast = (r) => (r.to || r.from) < TODAY
const RES_FROM = isoD(addD(today0(), -35))
function weekLabel(iso) {
  const d = new Date(iso + 'T12:00:00'); const dow = (d.getDay() + 6) % 7
  const mon = addD(d, -dow), sun = addD(mon, 6)
  const f = (x) => x.getDate() + '. ' + (x.getMonth() + 1) + '.'
  return { key: isoD(mon), label: (dow >= 5 ? 'Víkend ' + f(addD(mon, 5)) + '–' + f(sun) : 'Týden ' + f(mon) + '–' + f(sun)) }
}
const GOOGLE = import.meta.env.VITE_AUTH_GOOGLE === '1'
const QWHEN = [
  { id: 'dnes', label: 'Dnes', range: () => { const t = isoD(today0()); return [t, t] } },
  { id: 'zitra', label: 'Zítra', range: () => { const t = isoD(addD(today0(), 1)); return [t, t] } },
  { id: 'vikend', label: 'Tento víkend', range: () => weekend(0) },
  { id: 'pristi', label: 'Příští víkend', range: () => weekend(1) },
]
const DCENT = [{ v: 5, l: '5 km' }, { v: 10, l: '10 km' }, { v: 15, l: '15 km' }, { v: 21.1, l: 'Půlmaraton' }, { v: 30, l: '30 km' }, { v: 42.2, l: 'Maraton' }, { v: 'ultra', l: 'Ultra 50+' }]
const TOLS = [{ v: 0.5, l: 'přesně' }, { v: 2, l: '± 2 km' }, { v: 5, l: '± 5 km' }, { v: 10, l: '± 10 km' }]
const r1 = (x) => Math.round(x * 10) / 10
const CITIES = { 'Praha': [50.087, 14.421], 'Brno': [49.195, 16.608], 'Ostrava': [49.835, 18.292], 'Plzeň': [49.747, 13.378], 'Liberec': [50.767, 15.056], 'Olomouc': [49.594, 17.251], 'České Budějovice': [48.975, 14.474], 'Hradec Králové': [50.209, 15.832], 'Ústí nad Labem': [50.661, 14.032], 'Pardubice': [50.034, 15.781], 'Zlín': [49.226, 17.667], 'Jihlava': [49.396, 15.591], 'Karlovy Vary': [50.231, 12.871], 'Jablonec nad Nisou': [50.724, 15.171], 'Turnov': [50.587, 15.157], 'Mladá Boleslav': [50.411, 14.903], 'Kladno': [50.147, 14.103], 'Most': [50.503, 13.636], 'Opava': [49.938, 17.902], 'Frýdek-Místek': [49.683, 18.350], 'Teplice': [50.640, 13.825], 'Děčín': [50.773, 14.196], 'Chomutov': [50.460, 13.418], 'Karviná': [49.854, 18.543], 'Havířov': [49.780, 18.430], 'Prostějov': [49.472, 17.111], 'Přerov': [49.455, 17.451], 'Třebíč': [49.215, 15.882], 'Tábor': [49.414, 14.658], 'Kolín': [50.028, 15.200], 'Trutnov': [50.561, 15.913], 'Semily': [50.602, 15.335], 'Jičín': [50.437, 15.352], 'Česká Lípa': [50.686, 14.538], 'Znojmo': [48.856, 16.049], 'Písek': [49.309, 14.148], 'Příbram': [49.690, 14.010], 'Cheb': [50.080, 12.374], 'Náchod': [50.417, 16.163], 'Vsetín': [49.339, 17.996] }
RACES.forEach((r) => { const k = r.place.split(/ [–-] /)[0]; if (!CITIES[k]) CITIES[k] = [r.lat, r.lon] })
const PLACE_NAMES = Object.keys(CITIES).sort((a, b) => a.localeCompare(b, 'cs'))
const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
function findPlace(q) {
  const n = norm(q || '')
  if (n) { const exact = PLACE_NAMES.find((p) => norm(p) === n) || PLACE_NAMES.find((p) => norm(p).startsWith(n)); if (exact) return { name: exact, lat: CITIES[exact][0], lon: CITIES[exact][1], found: true } }
  return { name: 'Turnov', lat: HOME.lat, lon: HOME.lon, found: false }
}
function kmFrom(h, r) { const R0 = 6371, t = Math.PI / 180; const dLat = (r.lat - h.lat) * t, dLon = (r.lon - h.lon) * t; const a = Math.sin(dLat / 2) ** 2 + Math.cos(h.lat * t) * Math.cos(r.lat * t) * Math.sin(dLon / 2) ** 2; return Math.round(2 * R0 * Math.asin(Math.sqrt(a)) * 1.3 / 5) * 5 }

const QPATHS = {
  silnice: <path d="M8 3L5 21M16 3l3 18M12 5v2M12 11v2M12 17v2" />,
  trail: <path d="M3 20l6-10 4 6 3-4 5 8z" />,
  vrch: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  smiseny: <><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>,
  OCR: <><path d="M4 20V8h16v12M4 12h16M4 16h16M9 8v4M15 12v4M9 16v4" /></>,
  stafety: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.5a3 3 0 0 1 0 6M21 21v-2a4 4 0 0 0-3-3.9" /></>,
  nocni: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  ultra: <path d="M12 12c-2-3-4-4.5-6-4.5a4.5 4.5 0 0 0 0 9c2 0 4-1.5 6-4.5zm0 0c2 3 4 4.5 6 4.5a4.5 4.5 0 0 0 0-9c-2 0-4 1.5-6 4.5z" />,
  kids: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
  pes: <><circle cx="6" cy="10" r="1.8" /><circle cx="10" cy="5.5" r="1.8" /><circle cx="14.5" cy="5.5" r="1.8" /><circle cx="18" cy="10" r="1.8" /><path d="M12 11c-3 0-6 4.5-6 7 0 1.6 1.4 2.5 3 2.5 1.3 0 2-.6 3-.6s1.7.6 3 .6c1.6 0 3-.9 3-2.5 0-2.5-3-7-6-7z" /></>,
  reg: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  ofic: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
}
function QIcon({ id }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{QPATHS[id]}</svg> }

function Icon({ d, size = 15, w = 2 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
}

export default function App() {
  const [s, setS] = useState(INITIAL)
  const PREF = 'startovka.home'
  const pref0 = (() => { try { return JSON.parse(localStorage.getItem(PREF) || 'null') } catch { return null } })()
  const [loc, setLoc] = useState(pref0 && pref0.name ? pref0.name : 'Turnov')
  const [geo, setGeo] = useState(pref0 && pref0.geo ? pref0.geo : null)
  const [hasPref, setHasPref] = useState(!!pref0)
  const [geoMsg, setGeoMsg] = useState('')
  const [adv, setAdv] = useState(false)
  const MQ = '(max-width: 720px)'
  const [mob, setMob] = useState(() => typeof window !== 'undefined' && window.matchMedia(MQ).matches)
  useEffect(() => { const m = window.matchMedia(MQ); const f = () => setMob(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  const [sheet, setSheet] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [ver, setVer] = useState(0)
  const addRaces = (list) => { let n = 0; list.forEach((r) => { if (!RACES.some((x) => x.id === r.id)) { RACES.push(r); n++ } }); if (n) setVer((v) => v + 1) }
  useEffect(() => {
    if (!supabase) return
    supabase.from('user_races').select('*').gte('date_from', RES_FROM).limit(2000).then(({ data }) => { if (data) addRaces(data.map(rowToRace)) })
  }, [])
  useEffect(() => { document.body.style.overflow = sheet ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [sheet])
  const home = useMemo(() => geo ? { name: 'tvoje poloha (u ' + geo.near + ')', short: geo.near, lat: geo.lat, lon: geo.lon, found: true, geo: true } : findPlace(loc), [loc, geo])
  useEffect(() => {
    if (!hasPref) return
    try { if (geo) localStorage.setItem(PREF, JSON.stringify({ geo })); else if (home.found) localStorage.setItem(PREF, JSON.stringify({ name: home.name })) } catch { /* ignore */ }
  }, [geo, home, hasPref])
  const typeLoc = (v) => { setGeo(null); setLoc(v); setHasPref(true); setGeoMsg(''); set({}) }
  function useMyLocation() {
    if (!navigator.geolocation) { setGeoMsg('Tento prohlížeč polohu nepodporuje – zadej město.'); return }
    setGeoMsg('Zjišťuji polohu…')
    navigator.geolocation.getCurrentPosition((p) => {
      const lat = p.coords.latitude, lon = p.coords.longitude
      let best = 'Turnov', bd = 1e9
      PLACE_NAMES.forEach((n) => { const c = CITIES[n]; const d = (c[0] - lat) ** 2 + ((c[1] - lon) * 0.65) ** 2; if (d < bd) { bd = d; best = n } })
      setGeo({ lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000, near: best }); setLoc(best); setHasPref(true); setGeoMsg(''); set({})
    }, (e) => setGeoMsg(e.code === 1 ? 'Přístup k poloze je zamítnutý – povol ho v prohlížeči, nebo zadej město.' : 'Polohu se nepodařilo zjistit – zadej město.'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 })
  }
  const kmOf = (r) => kmFrom(home, r)
  const pickCenter = (v) => setS((p) => {
    if (p.distC === v) return { ...p, distC: '', kmMin: '', kmMax: '', limit: PAGE }
    if (v === 'ultra') return { ...p, distC: v, kmMin: '50', kmMax: '', limit: PAGE }
    return { ...p, distC: v, kmMin: String(Math.max(0, r1(v - p.tol))), kmMax: String(r1(v + p.tol)), limit: PAGE }
  })
  const setTol = (t) => setS((p) => (typeof p.distC === 'number' ? { ...p, tol: t, kmMin: String(Math.max(0, r1(p.distC - t))), kmMax: String(r1(p.distC + t)), limit: PAGE } : { ...p, tol: t }))
  const set = (o) => setS((p) => ({ ...p, ...o, limit: PAGE }))
  const tog = (key, val) => setS((p) => { const a = p[key].slice(); const i = a.indexOf(val); if (i >= 0) a.splice(i, 1); else a.push(val); return { ...p, [key]: a, limit: PAGE } })

  // ---- účet ----
  const [user, setUser] = useState(null)
  const [saved, setSavedState] = useState([])
  const [auth, setAuth] = useState({ open: false, mode: 'login', name: '', email: '', pass: '', error: '', info: '', busy: false, pending: null })

  async function afterLogin(u) {
    setUser(u)
    let list = await loadSaved(u)
    const p = takePendingSave() || auth.pending
    if (p && !list.includes(p)) { list = [...list, p]; await setSaved(u, p, true, list) }
    setSavedState(list)
    setAuth((a) => ({ ...a, open: false, pass: '', error: '', info: '', busy: false, pending: null }))
  }
  useEffect(() => {
    currentUser().then((u) => { if (u) afterLogin(u) })
    return onAuthChange((u) => { if (u) afterLogin(u); else { setUser(null); setSavedState([]) } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAuth = (mode, pending = null) => setAuth((a) => ({ ...a, open: true, mode, error: '', info: '', pending }))
  const closeAuth = () => { setPendingSave(null); setAuth((a) => ({ ...a, open: false, pending: null, error: '', info: '' })) }

  async function doGoogle() {
    setPendingSave(auth.pending)
    const u = await signInGoogle()
    if (u) afterLogin(u)
  }
  async function doEmail() {
    const email = auth.email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setAuth((a) => ({ ...a, error: 'Zadej platný e-mail.' }))
    if (auth.pass.length < 8) return setAuth((a) => ({ ...a, error: 'Heslo musí mít alespoň 8 znaků.' }))
    setAuth((a) => ({ ...a, busy: true, error: '', info: '' }))
    setPendingSave(auth.pending)
    const r = auth.mode === 'register' ? await signUpEmail(auth.name.trim(), email, auth.pass) : await signInEmail(email, auth.pass)
    if (r.user) return afterLogin(r.user)
    setAuth((a) => ({ ...a, busy: false, error: r.error || '', info: r.info || '' }))
  }
  async function doReset() {
    const email = auth.email.trim()
    if (!email) return setAuth((a) => ({ ...a, error: 'Nejdřív vyplň e-mail.' }))
    const msg = await resetPassword(email)
    setAuth((a) => ({ ...a, info: msg, error: '' }))
  }
  async function doLogout() { await signOut(); setUser(null); setSavedState([]); if (s.view === 'muj') setS((p) => ({ ...p, view: 'seznam' })) }

  async function toggleSave(id) {
    if (!user) return openAuth('register', id)
    const on = !saved.includes(id)
    const list = on ? [...saved, id] : saved.filter((x) => x !== id)
    setSavedState(list)
    await setSaved(user, id, on, list)
  }
  const showMuj = () => { if (!user) return openAuth('login'); setS((p) => ({ ...p, view: 'muj' })) }

  // ---- filtrování ----
  function match(r, skip) {
    if (s.view === 'vysledky') { if (!isPast(r) || r.from < RES_FROM) return false } else if (isPast(r)) return false
    if (s.kmMin !== '' || s.kmMax !== '') { const lo = s.kmMin === '' ? 0 : parseFloat(s.kmMin), hi = s.kmMax === '' ? 9999 : parseFloat(s.kmMax); if (!r.tracks.some((t) => t[0] >= lo && t[0] <= hi)) return false }
    if (s.radius && kmOf(r) > s.radius) return false
    if (s.q) { const q = s.q.toLowerCase(); if ((r.name + ' ' + r.place + ' ' + r.region).toLowerCase().indexOf(q) < 0) return false }
    if (s.dist.length && !r.tracks.some((t) => DISTS.some((d) => s.dist.includes(d.id) && t[0] >= d.lo && t[0] <= d.hi))) return false
    if (skip !== 'surf' && s.surf.length && !s.surf.includes(r.surface)) return false
    if (s.terrain !== 'vse' && terrainOf(r) !== s.terrain) return false
    if (skip !== 'region' && s.regions.length && !s.regions.includes(r.region)) return false
    if (s.flags.length && !s.flags.every((f) => hasFlag(r, f))) return false
    if (skip !== 'series' && s.series.length && !s.series.includes(r.series)) return false
    if (skip !== 'plat' && s.plats.length && !s.plats.some((p) => r.plat.includes(p))) return false
    if (skip !== 'status' && s.status.length && !s.status.includes(r.status)) return false
    if (skip !== 'reg' && s.regOnly && !hasReg(r)) return false
    if (skip !== 'month' && s.month && r.from.slice(0, 7) !== s.month) return false
    if (s.types.length && !QTYPES.some((t) => s.types.includes(t.id) && t.test(r))) return false
    if (s.who.length && !QWHO.every((t) => !s.who.includes(t.id) || t.test(r))) return false
    if (skip !== 'month' && s.dateFrom && (r.to || r.from) < s.dateFrom) return false
    if (skip !== 'month' && s.dateTo && r.from > s.dateTo) return false
    return true
  }
  const isMuj = s.view === 'muj' && !!user
  const isRes = s.view === 'vysledky' && !isMuj

  const res = useMemo(() => {
    const list = isMuj ? RACES.filter((r) => saved.includes(r.id)) : RACES.filter((r) => match(r, isRes ? 'month' : ''))
    const minKm = (r) => (r.tracks.length ? Math.min(...r.tracks.map((t) => t[0])) : 9999)
    if (s.sort === 'blizko' && !isMuj) list.sort((a, b) => kmOf(a) - kmOf(b))
    else if (s.sort === 'kratke' && !isMuj) list.sort((a, b) => minKm(a) - minKm(b))
    else if (isRes) list.sort((a, b) => (a.from < b.from ? 1 : a.from > b.from ? -1 : a.name.localeCompare(b.name, 'cs')))
    else list.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : (a.start || '99') < (b.start || '99') ? -1 : 1))
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, saved, isMuj, home, ver])

  const counted = (list, key, skip, test) => {
    const base = RACES.filter((r) => match(r, skip))
    return list.map((x) => { const id = x.id || x; const on = s[key].includes(id); const c = base.filter((r) => test(r, id)).length; return { id, label: x.label || x, count: c, on, cls: on ? 'chip on' : c === 0 ? 'chip zero' : 'chip', pick: () => tog(key, id) } })
  }
  const simple = (list, key, getId, getLabel) => list.map((x) => { const id = getId(x); const on = s[key].includes(id); return { id, label: getLabel(x), on, cls: on ? 'chip on' : 'chip', pick: () => tog(key, id) } })

  // měsíce
  const months = (() => {
    const base = RACES.filter((r) => match(r, 'month'))
    const mc = []; let y = 2026, m = 10
    for (let i = 0; i < 12; i++) { const key = y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1); mc.push({ key, mm: m, yy: y, cnt: base.filter((r) => r.from.slice(0, 7) === key).length }); m++; if (m > 11) { m = 0; y++ } }
    const mx = Math.max(1, ...mc.map((x) => x.cnt))
    return mc.map((x) => ({ ...x, h: 4 + Math.round((x.cnt / mx) * 74), on: s.month === x.key }))
  })()

  // aktivní filtry
  const active = []
  const add = (label, fn) => active.push({ label, fn })
  if (s.regOnly) add('jen s online přihláškou', () => set({ regOnly: false }))
  if (s.radius) add('do ' + s.radius + ' km', () => set({ radius: 0 }))
  if (s.q) add('„' + s.q + '“', () => set({ q: '' }))
  if (s.kmMin !== '' || s.kmMax !== '') add(s.kmMax === '' ? s.kmMin + '+ km' : s.kmMin === '' ? 'do ' + s.kmMax + ' km' : s.kmMin + '–' + s.kmMax + ' km', () => set({ kmMin: '', kmMax: '' }))
  s.dist.forEach((id) => add(DISTS.find((x) => x.id === id).label, () => tog('dist', id)))
  s.surf.forEach((v) => add(SURFLAB[v], () => tog('surf', v)))
  if (s.terrain !== 'vse') add(TERRLAB[s.terrain], () => set({ terrain: 'vse' }))
  s.regions.forEach((v) => add(regionLabel(v), () => tog('regions', v)))
  s.flags.forEach((v) => add(FLAGS.find((x) => x.id === v).label, () => tog('flags', v)))
  s.series.forEach((v) => add(v, () => tog('series', v)))
  s.plats.forEach((v) => add(PLATS.find((x) => x.id === v).label, () => tog('plats', v)))
  s.status.forEach((v) => add(STATUS.find((x) => x.id === v).label, () => tog('status', v)))
  s.types.forEach((v) => add(QTYPES.find((x) => x.id === v).label, () => tog('types', v)))
  s.who.forEach((v) => add(QWHO.find((x) => x.id === v).label, () => tog('who', v)))
  if (s.dateFrom || s.dateTo) add((s.dateFrom ? s.dateFrom.split('-').reverse().join('. ') : '…') + ' – ' + (s.dateTo ? s.dateTo.split('-').reverse().join('. ') : '…'), () => set({ dateFrom: '', dateTo: '' }))
  if (s.month) add(MON[parseInt(s.month.slice(5, 7), 10) - 1] + ' ' + s.month.slice(0, 4), () => set({ month: '' }))

  const advCount = (s.terrain !== 'vse' ? 1 : 0) + s.series.length + s.regions.length + s.plats.length
  const kmSummary = s.kmMin !== '' || s.kmMax !== '' ? 'Hledám tratě ' + (s.kmMax === '' ? 'od ' + fmtKm(s.kmMin) + ' km' : s.kmMin === '' ? 'do ' + fmtKm(s.kmMax) + ' km' : fmtKm(s.kmMin) + '–' + fmtKm(s.kmMax) + ' km') + '. Stačí, když se do rozmezí vejde jedna z tratí závodu.' : 'Vyber délku a rozptyl, nebo zadej vlastní rozmezí.'
  const n = res.length
  const countLabel = isRes ? n + (n === 1 ? ' doběhnutý závod' : n >= 2 && n <= 4 ? ' doběhnuté závody' : ' doběhnutých závodů') : n + (n === 1 ? ' závod' : n >= 2 && n <= 4 ? ' závody' : ' závodů')
  const cntP = (p) => RACES.filter((r) => r.plat.includes(p)).length
  const nReg = RACES.filter(hasReg).length
  const regOnlyCount = RACES.filter((r) => match(r, 'reg')).filter(hasReg).length
  const shown = isMuj ? res : res.slice(0, s.limit)
  const hx = ((home.lon - 12.09) / (18.86 - 12.09) * 100).toFixed(1), hy = ((51.06 - home.lat) / (51.06 - 48.55) * 100).toFixed(1)
  const initials = user ? user.name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') : ''

  let mujSummary = ''
  if (isMuj) {
    if (!n) mujSummary = 'Zatím žádné uložené závody'
    else {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const next = res.find((r) => new Date(r.from + 'T00:00:00') >= today)
      mujSummary = n + (n === 1 ? ' uložený závod' : n <= 4 ? ' uložené závody' : ' uložených závodů')
      if (next) { const dd = Math.round((new Date(next.from + 'T00:00:00') - today) / 86400000); mujSummary += ' · nejbližší ' + (dd === 0 ? 'dnes' : dd === 1 ? 'zítra' : 'za ' + dd + (dd < 5 ? ' dny' : ' dní')) + ': ' + next.name }
    }
  }

  const isReg = auth.mode === 'register'
  const segBtn = (on) => ({ minHeight: 32, padding: '0 10px', border: 0, font: '600 13px Inter, sans-serif', cursor: 'pointer', background: on ? '#FFFFFF' : 'transparent', color: on ? '#15171A' : '#B8BCC2' })
  const reset = () => setS({ ...INITIAL, view: s.view, sort: s.sort })

  const filterPanel = (
          <section aria-label="Filtry" className="qpanel">
            {!isRes && (<>
            <div className="qrow">
              <p className="qlab">Kdy:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <label className="qdate"><span className="sr">Od data</span><input type="date" value={s.dateFrom} onChange={(e) => set({ dateFrom: e.target.value, month: '' })} /></label>
                <label className="qdate"><span className="sr">Do data</span><input type="date" value={s.dateTo} onChange={(e) => set({ dateTo: e.target.value, month: '' })} /></label>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginLeft: 6 }}>
                  {QWHEN.map((w) => { const r = w.range(); const on = s.dateFrom === r[0] && s.dateTo === r[1]; return <button key={w.id} className={on ? 'qlink on' : 'qlink'} aria-pressed={on} onClick={() => set(on ? { dateFrom: '', dateTo: '' } : { dateFrom: r[0], dateTo: r[1], month: '' })}>{w.label}</button> })}
                </span>
              </div>
              <div className="wrapchips" style={{ marginTop: 12 }}>
                {months.map((m) => <button key={m.key} className={m.on ? 'qchip on' : m.cnt ? 'qchip' : 'qchip zero'} aria-pressed={m.on} onClick={() => set({ month: m.on ? '' : m.key, dateFrom: '', dateTo: '' })} style={{ minHeight: 42 }}>{MONFULL[m.mm]}{m.mm === 0 ? ' ' + m.yy : ''}<span className="cnt">{m.cnt}</span></button>)}
              </div>
            </div>

            </>)}
            <div className="qrow qsplit">
              <div>
                <label htmlFor="loc" className="qlab" style={{ display: 'block' }}>Kde:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <input id="loc" type="text" value={loc} onChange={(e) => typeLoc(e.target.value)} placeholder="tvoje město, např. Liberec" style={{ flex: '1 1 180px', minHeight: 48 }} list="mista" />
                  <button type="button" className="geobtn" onClick={useMyLocation}><Icon size={16} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></>} />Moje poloha</button>
                  <datalist id="mista">{PLACE_NAMES.map((p) => <option key={p} value={p} />)}</datalist>
                  <div className="wrapchips">
                    {RADII.map((r) => <button key={r.id} className={s.radius === r.id ? 'qchip on' : 'qchip'} aria-pressed={s.radius === r.id} onClick={() => set({ radius: r.id })} style={{ minHeight: 48 }}>{r.id ? 'do ' + r.label : r.label}</button>)}
                  </div>
                </div>
                <p className="qhint">{geoMsg || (home.found ? 'Vzdálenosti počítám od: ' + home.name + (hasPref ? ' · pamatuji si to v tomto prohlížeči' : '') : 'Místo „' + loc + '“ zatím neznám, počítám od Turnova. Zkus větší město.')}</p>
              </div>
              <div>
                <label htmlFor="q" className="qlab" style={{ display: 'block' }}>Hledat:</label>
                <input id="q" type="text" value={s.q} onChange={(e) => set({ q: e.target.value })} placeholder="název závodu, např. Ještěd" style={{ width: '100%', minHeight: 48 }} />
              </div>
            </div>

            <div className="qrow">
              <p className="qlab">Typ závodu:</p>
              <div className="wrapchips">
                {QTYPES.map((t) => { const on = s.types.includes(t.id); return <button key={t.id} className={on ? 'qchip on' : 'qchip'} aria-pressed={on} onClick={() => tog('types', t.id)}><QIcon id={t.id} />{t.label}</button> })}
              </div>
            </div>

            <div className="qrow" style={{ borderBottom: 0 }}>
              <p className="qlab">Vzdálenost:</p>
              <div className="wrapchips">
                {DCENT.map((d) => { const on = s.distC === d.v; return <button key={d.l} className={on ? 'qchip on' : 'qchip'} aria-pressed={on} onClick={() => pickCenter(d.v)}>{d.l}</button> })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', alignItems: 'center', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: '#4A4F56', fontWeight: 600 }}>Rozptyl</span>
                  <span className="tolseg">
                    {TOLS.map((t) => <button key={t.v} className={s.tol === t.v ? 'on' : ''} aria-pressed={s.tol === t.v} onClick={() => setTol(t.v)}>{t.l}</button>)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: '#4A4F56', fontWeight: 600 }}>nebo vlastní rozmezí</span>
                  <label htmlFor="kmmin" className="sr">Od kilometrů</label>
                  <input id="kmmin" className="kmin" type="number" min="0" placeholder="od" value={s.kmMin} onChange={(e) => set({ kmMin: e.target.value, distC: '' })} />
                  <span aria-hidden="true">–</span>
                  <label htmlFor="kmmax" className="sr">Do kilometrů</label>
                  <input id="kmmax" className="kmin" type="number" min="0" placeholder="do" value={s.kmMax} onChange={(e) => set({ kmMax: e.target.value, distC: '' })} />
                  <span style={{ fontSize: 14, color: '#5A5F66' }}>km</span>
                </div>
              </div>
              <p className="qhint">{kmSummary}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button className={adv ? 'advbtn on' : 'advbtn'} aria-expanded={adv} onClick={() => setAdv(!adv)}>
                <Icon size={18} d={<><path d="M4 6h16M7 12h10M10 18h4" /></>} />
                Kompletní filtrace{advCount ? ' (' + advCount + ')' : ''}
                <span aria-hidden="true" style={{ transform: adv ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
              </button>
            </div>

            {adv && (
              <div className="advpanel">
                <div className="advgrid">
                  <div>
                    <p className="flab">Profil trati</p>
                    <div className="wrapchips">{TERR.map((t) => <button key={t.id} className={s.terrain === t.id ? 'chip on' : 'chip'} aria-pressed={s.terrain === t.id} onClick={() => set({ terrain: t.id })}>{t.label}</button>)}</div>
                    <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#5A5F66', lineHeight: 1.5 }}>Podle převýšení na km. Zatím známe jen u části závodů.</p>
                  </div>
                  <div>
                    <p className="flab">Seriál</p>
                    <div className="wrapchips">{counted(SERIES, 'series', 'series', (r, id) => r.series === id).map((c) => <button key={c.id} className={c.cls} aria-pressed={c.on} onClick={c.pick}>{c.label}<span className="cnt">{c.count}</span></button>)}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="flab">Kraj</p>
                    <div className="wrapchips">{counted(KRAJE, 'regions', 'region', (r, id) => r.region === id).map((c) => <button key={c.id} className={c.cls} aria-pressed={c.on} onClick={c.pick}>{c.label}<span className="cnt">{c.count}</span></button>)}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="flab">Zdroj dat</p>
                    <div className="wrapchips">{counted(PLATS, 'plats', 'plat', (r, id) => r.plat.includes(id)).map((c) => <button key={c.id} className={c.cls} aria-pressed={c.on} onClick={c.pick}>{c.label}<span className="cnt">{c.count}</span></button>)}</div>
                  </div>
                </div>
              </div>
            )}
          </section>
  )

  const wk = weekend(0)
  const onWk = s.dateFrom === wk[0] && s.dateTo === wk[1]
  const QUICK = [
    { l: 'Tento víkend', on: onWk, f: () => set(onWk ? { dateFrom: '', dateTo: '' } : { dateFrom: wk[0], dateTo: wk[1], month: '' }) },
    { l: 'Do 50 km', on: s.radius === 50, f: () => set({ radius: s.radius === 50 ? 0 : 50 }) },
    { l: '5 km', on: s.distC === 5, f: () => pickCenter(5) },
    { l: '10 km', on: s.distC === 10, f: () => pickCenter(10) },
    { l: 'Půlmaraton', on: s.distC === 21.1, f: () => pickCenter(21.1) },
    { l: 'Trail', on: s.types.includes('trail'), f: () => tog('types', 'trail') },
    { l: 'Silnice', on: s.types.includes('silnice'), f: () => tog('types', 'silnice') },
    { l: 'S online přihláškou', on: s.regOnly, f: () => set({ regOnly: !s.regOnly }) },
  ]
  const fCount = active.filter((a) => !a.label.startsWith('„')).length
  const openLoc = () => { setSheet(true); setTimeout(() => { const el = document.getElementById('loc'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); el.select() } }, 80) }
  const goView = (v) => { if (v === 'muj') return showMuj(); setS((p) => ({ ...p, view: v })); window.scrollTo(0, 0) }

  return (
    <div className={mob ? 'mroot' : ''} style={{ fontFamily: 'Inter, sans-serif', color: '#15171A', background: '#F5F4EF', minHeight: '100vh' }}>
      {DEMO && (
        <div role="status" style={{ background: '#FCE9DD', color: '#7C2D12', fontSize: 13, padding: '8px 16px', textAlign: 'center' }}>
          {mob ? 'Testovací verze – účty jen v tomto prohlížeči' : 'Testovací verze · účty a uložené závody se zatím ukládají jen v tomto prohlížeči'}
        </div>
      )}
      {mob ? (<>
      <header className="mhead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#C2410C', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Icon size={17} w={2.2} d={<><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></>} />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>Startovka</span>
        </div>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button className="hbtn" onClick={() => setAddOpen(true)} style={{ minHeight: 36, padding: '0 10px', borderColor: '#C2410C', color: '#FDBA8C' }} aria-label="Přidat závod">+ Závod</button>
        {!user ? <button className="hbtn" onClick={() => openAuth('login')} style={{ minHeight: 36 }}>Přihlásit</button>
          : <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="avatar" aria-hidden="true" style={{ width: 30, height: 30, fontSize: 12 }}>{initials}</span><button className="hbtn" onClick={doLogout} style={{ minHeight: 34, fontSize: 13, padding: '0 10px' }}>Odhlásit</button></span>}</span>
      </header>
      </>) : (<>
      <header style={{ background: '#15171A', color: '#FFFFFF' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#C2410C', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <Icon size={20} w={2.2} d={<><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></>} />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>Startovka</span>
            <span style={{ fontSize: 13, color: '#B8BCC2' }}>kalendář běžeckých závodů</span>
          </div>
          <nav aria-label="Hlavní" style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 14, flexWrap: 'wrap' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setS((p) => ({ ...p, view: 'seznam' })) }} style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>Závody</a>
            <a href="#zdroje" style={{ color: '#B8BCC2', textDecoration: 'none' }}>Zdroje dat</a>
            <span style={{ display: 'inline-flex', border: '1px solid #3A3E45', borderRadius: 8, overflow: 'hidden' }}>
              <button aria-pressed="true" style={segBtn(true)}>CZ</button>
              <button aria-pressed="false" style={segBtn(false)} title="Anglická verze se připravuje">EN</button>
            </span>
            <button className="hbtn" onClick={() => setAddOpen(true)} style={{ borderColor: '#C2410C', color: '#FDBA8C' }}>+ Přidat závod</button>
            {!user ? (
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="hbtn" onClick={() => openAuth('login')}>Přihlásit</button>
                <button className="btn" onClick={() => openAuth('register')} style={{ minHeight: 38 }}>Registrace</button>
              </span>
            ) : (
              <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="hbtn" onClick={showMuj}>♥ Můj kalendář ({saved.length})</button>
                <span className="avatar" aria-hidden="true">{initials}</span>
                <span className="uemail" style={{ fontSize: 13, color: '#C9CCD1', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                <button className="hbtn" onClick={doLogout} style={{ minHeight: 34, fontSize: 13 }}>Odhlásit</button>
              </span>
            )}
          </nav>
        </div>
      </header>

      <section style={{ background: '#15171A', color: '#FFFFFF', padding: '8px 0 30px' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(30px, 4.4vw, 50px)', lineHeight: 1.05, margin: '10px 0 8px', letterSpacing: '-0.02em' }}>Najdi svůj další start.</h1>
          <p style={{ margin: 0, color: '#C9CCD1', fontSize: 16, maxWidth: '70ch' }}>{RACES.filter((r) => !isPast(r)).length} závodů sezóny 2026/27 z termínovky ČAS, registrací stopnito.cz, seriálů RunCzech a Běhej lesy a termínovek running.life, behej.com, SvětBěhu a BezvaBĚH – ze všech 14 krajů, bez duplicit.</p>
        </div>
      </section>
      </>)}

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '26px 24px 64px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {!isMuj && !mob && filterPanel}

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: mob ? 12 : 18 }}>
          {mob && !isMuj && (
            <div className="mtop">
              <div className="msbar">
                <label htmlFor="mq" className="sr">Hledat závod nebo místo</label>
                <input id="mq" type="search" value={s.q} onChange={(e) => set({ q: e.target.value })} placeholder="Hledat závod nebo místo" />
                <button className={fCount ? 'mfilt on' : 'mfilt'} onClick={() => setSheet(true)} aria-label={'Filtry' + (fCount ? ', aktivních ' + fCount : '')}>
                  <Icon size={18} d={<path d="M4 6h16M7 12h10M10 18h4" />} />Filtry{fCount ? <span className="fbadge">{fCount}</span> : null}
                </button>
              </div>
              <div className="mquick" role="group" aria-label="Rychlý výběr">
                {QUICK.filter((q) => !(isRes && q.l === 'Tento víkend')).map((q) => <button key={q.l} className={q.on ? 'qc on' : 'qc'} aria-pressed={q.on} onClick={q.f}>{q.l}</button>)}
              </div>
            </div>
          )}

          {mob ? (
            <div className="mtool">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, whiteSpace: 'nowrap' }}>{countLabel}</span>
                {!isMuj && <button className="mloc" onClick={openLoc}>od: {home.short || home.name}</button>}
              </div>
              {!isMuj && <select aria-label="Řadit" value={s.sort} onChange={(e) => setS((p) => ({ ...p, sort: e.target.value }))} style={{ minHeight: 38, fontSize: 14, padding: '0 8px' }}>
                <option value="datum">Podle data</option><option value="blizko">Nejblíž</option><option value="kratke">Nejkratší</option>
              </select>}
            </div>
          ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700 }}>{countLabel}</span>
              {!isMuj && <span style={{ fontSize: mob ? 13 : 14, color: '#5A5F66' }}>{isRes ? 'za posledních 5 týdnů · výsledky z archivu ČAS a časomír' : mob ? 'od: ' + home.name : ((s.radius ? 'do ' + s.radius + ' km od: ' + home.name : 'v celé ČR · vzdálenosti od: ' + home.name) + ' · ' + nReg + ' s online přihláškou')}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isMuj && <>
                <label htmlFor="sort" className={mob ? 'sr' : ''} style={{ fontSize: 13, color: '#5A5F66' }}>Řadit</label>
                <select id="sort" value={s.sort} onChange={(e) => setS((p) => ({ ...p, sort: e.target.value }))} style={{ minHeight: mob ? 38 : 40, fontSize: mob ? 14 : 15 }}>
                  <option value="datum">Podle data</option><option value="blizko">Nejblíž ode mě</option><option value="kratke">Nejkratší trať</option>
                </select>
              </>}
              {!mob && <span style={{ display: 'inline-flex', background: '#ECEAE3', borderRadius: 10, padding: 3 }}>
                <button className={s.view === 'seznam' ? 'seg on' : 'seg'} aria-pressed={s.view === 'seznam'} onClick={() => setS((p) => ({ ...p, view: 'seznam' }))}>Seznam</button>
                <button className={isRes ? 'seg on' : 'seg'} aria-pressed={isRes} onClick={() => setS((p) => ({ ...p, view: 'vysledky', limit: PAGE }))}>Výsledky</button>
                <button className={s.view === 'mapa' ? 'seg on' : 'seg'} aria-pressed={s.view === 'mapa'} onClick={() => setS((p) => ({ ...p, view: 'mapa' }))}>Mapa</button>
                <button className={isMuj ? 'seg on' : 'seg'} aria-pressed={isMuj} onClick={showMuj}>♥ Můj kalendář</button>
              </span>}
            </div>
          </div>

          )}

          {!isMuj && active.length > 0 && (
            <div className={mob ? 'mscroll' : ''} style={{ display: 'flex', flexWrap: mob ? 'nowrap' : 'wrap', gap: 8 }}>
              {active.map((a) => <button key={a.label} className="chip" onClick={a.fn} aria-label={'Odebrat filtr ' + a.label} style={{ background: '#FCE9DD', borderColor: '#F2C4A6', color: '#7C2D12', minHeight: 34, padding: '4px 12px' }}>{a.label}  ✕</button>)}
            </div>
          )}

          {!isMuj && !hasPref && (
            <div className="locbox">
              <p><b>Odkud vyrážíš?</b> Vzdálenosti teď počítám od Turnova. Nastav si svoje místo – zapamatuju si ho.</p>
              <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="geobtn" onClick={useMyLocation}>📍 Použít moji polohu</button>
                <button className="ghost" style={{ minHeight: 44 }} onClick={() => { if (mob) openLoc(); else { const el = document.getElementById('loc'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); el.select() } } }}>Zadat město</button>
                <button className="linkbtn" style={{ color: '#5A5F66', fontWeight: 500 }} onClick={() => setHasPref(true)}>Turnov mi vyhovuje</button>
              </span>
              {geoMsg && <p style={{ flexBasis: '100%', color: '#7C2D12' }}>{geoMsg}</p>}
            </div>
          )}

          {isRes && (
            <div className="resinfo">
              <b>Výsledky závodů.</b> Po doběhnutí se každý závod z kalendáře přesune sem a tlačítko vede rovnou na výsledky – u časomíry nebo v archivu Českého běhu. Filtry místa, vzdálenosti a typu fungují stejně jako v kalendáři.
            </div>
          )}

          {isMuj && (
            <div style={{ background: '#15171A', color: '#FFFFFF', borderRadius: 14, padding: '18px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="avatar" aria-hidden="true" style={{ width: 44, height: 44, fontSize: 15 }}>{initials}</span>
                <div>
                  <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700 }}>Můj kalendář</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#C9CCD1' }}>{mujSummary}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="act" disabled={!n} onClick={() => downloadIcs(res, 'muj-kalendar-zavodu.ics', 'Moje závody – Startovka')}>Stáhnout do kalendáře (.ics)</button>
                <button className="act" onClick={() => setS((p) => ({ ...p, view: 'seznam' }))}>Zpět na všechny závody</button>
              </div>
              <p style={{ margin: 0, flexBasis: '100%', fontSize: 12.5, color: '#9AA0A8' }}>Soubor .ics otevřeš v Google, Apple i Outlook kalendáři. Automatický odběr se změnami termínů přidáme v další verzi.</p>
            </div>
          )}

          {isMuj && n === 0 && (
            <div style={{ background: '#FFFFFF', border: '1px dashed #B9B5A8', borderRadius: 14, padding: 36, textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600 }}>Zatím nemáš uložené žádné závody</p>
              <p style={{ margin: '0 0 16px', color: '#5A5F66' }}>U závodu klikni na „♡ Uložit závod“ a objeví se tady.</p>
              <button className="btn" onClick={() => setS((p) => ({ ...p, view: 'seznam' }))}>Procházet závody</button>
            </div>
          )}

          {(s.view === 'seznam' || isRes || isMuj) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shown.map((r, i) => {
                const wl = isRes ? weekLabel(r.from) : null
                const head = isRes && (i === 0 || weekLabel(shown[i - 1].from).key !== wl.key)
                return <div key={r.id} style={{ display: 'contents' }}>
                  {head && <h2 className="wkhead">{wl.label}<span>{res.filter((x) => weekLabel(x.from).key === wl.key).length}</span></h2>}
                  <RaceCard r={r} km={kmOf(r)} loc={home.name} saved={!!user && saved.includes(r.id)} onSave={() => toggleSave(r.id)} mob={mob} />
                </div>
              })}
              {!isMuj && n > s.limit && <button className="ghost" onClick={() => setS((p) => ({ ...p, limit: p.limit + PAGE }))} style={{ alignSelf: 'center', minHeight: 44, padding: '0 22px' }}>Zobrazit další ({n - s.limit})</button>}
              {!isMuj && n === 0 && (
                <div style={{ background: '#FFFFFF', border: '1px dashed #B9B5A8', borderRadius: 14, padding: 36, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600 }}>{isRes ? 'Žádné doběhnuté závody pro tyto filtry' : 'Žádný závod neodpovídá filtrům'}</p>
                  <p style={{ margin: '0 0 16px', color: '#5A5F66' }}>Zkus rozšířit vzdálenost nebo ubrat některý filtr.</p>
                  <button className="btn" onClick={reset}>Zrušit filtry</button>
                </div>
              )}
            </div>
          )}

          {s.view === 'mapa' && !isMuj && (
            <>
              <MapView races={res} home={home} height={mob ? '62vh' : 600} onOpen={(id) => { const r = RACES.find((x) => x.id === id); if (r) { setS((p) => ({ ...p, view: 'seznam', q: r.name, limit: PAGE })); window.scrollTo(0, 0) } }} />
              <p style={{ margin: 0, fontSize: 12.5, color: '#5A5F66' }}>Body jsou podle obce (střed), ne přesné místo startu. Klepnutím na název závodu ho otevřeš v seznamu.</p>
            </>
          )}

          {mob ? (
            <details id="zdroje" className="msrc"><summary>Zdroje dat a registrační platformy</summary>
          <section aria-label="Zdroje dat" style={{ background: '#FFFFFF', border: '1px solid #E2E0D8', borderRadius: 14, padding: '18px 20px', marginTop: 10 }}>
            
            <p style={{ margin: '0 0 14px', fontSize: 14, color: '#4A4F56', maxWidth: '80ch' }}>Kalendář skládá závody z oficiálních termínovek, seriálů a registračních systémů. U každého závodu si pamatujeme, odkud termín máme, a vedeme na platformu, kde se dá přihlásit, najít startovka a výsledky.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="ptab">
                <thead><tr><th>Platforma</th><th>Co nabízí</th><th>V kalendáři</th><th>Stav</th></tr></thead>
                <tbody>
                  <tr><td><a href="https://ceskybeh.cz/terminovka/" target="_blank" rel="noopener">Český běh – termínovka ČAS</a></td><td>Oficiální termínovka ČAS: čas startu, místo, startovné, archiv výsledků.</td><td>{cntP('cb')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.stopnito.cz/zavody" target="_blank" rel="noopener">stopnito.cz</a></td><td>Registrace, seznam přihlášených, výsledky, GPS tracking.</td><td>{cntP('sn')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.runczech.com" target="_blank" rel="noopener">RunCzech</a></td><td>Vlastní registrace a výsledky seriálu.</td><td>{cntP('rc')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://behejlesy.cz" target="_blank" rel="noopener">Běhej lesy</a></td><td>Vlastní registrace a výsledky seriálu.</td><td>{cntP('bl')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://zavody.4timing.cz/" target="_blank" rel="noopener">4timing.cz</a></td><td>Časomíra: připravované závody, přihlášky, výsledky.</td><td>—</td><td><span className="st st-next">Další krok</span></td></tr>
                  <tr><td><a href="https://www.nazavody.cz" target="_blank" rel="noopener">naZávody.cz</a></td><td>Registrační systém s veřejným API.</td><td>—</td><td><span className="st st-next">Další krok – API</span></td></tr>
                  <tr><td><a href="https://www.behej.com/terminovka" target="_blank" rel="noopener">behej.com</a></td><td>Termínovka s mapou; u závodů web pořadatele a čas startu.</td><td>{cntP('bj')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.svetbehu.cz/terminovka/" target="_blank" rel="noopener">SvětBěhu.cz</a></td><td>Termínovka časopisu Svět běhu.</td><td>{cntP('sb')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.bezvabeh.cz/terminovka" target="_blank" rel="noopener">BezvaBĚH.cz</a></td><td>Termínovka a výsledky.</td><td>{cntP('bz')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://running.life/terminovka/cesko" target="_blank" rel="noopener">running.life</a></td><td>Celostátní termínovka – doplňuje závody ze všech krajů. Údaje ověřuj u pořadatele.</td><td>{cntP('rl')} závodů</td><td><span className="st st-low">Doplňkový</span></td></tr>
                  <tr><td><a href="https://gotrail.run/trailove-behy/cesko/liberecky-kraj" target="_blank" rel="noopener">gotrail.run</a></td><td>Agregátor trailů – jen pro objevování.</td><td>{cntP('gt')} závodů</td><td><span className="st st-low">Doplňkový</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
            </details>
          ) : (
          <section id="zdroje" aria-label="Zdroje dat" style={{ background: '#FFFFFF', border: '1px solid #E2E0D8', borderRadius: 14, padding: '18px 20px', marginTop: 10 }}>
            <h2 style={{ margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 22 }}>Zdroje dat a registrační platformy</h2>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: '#4A4F56', maxWidth: '80ch' }}>Kalendář skládá závody z oficiálních termínovek, seriálů a registračních systémů. U každého závodu si pamatujeme, odkud termín máme, a vedeme na platformu, kde se dá přihlásit, najít startovka a výsledky.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="ptab">
                <thead><tr><th>Platforma</th><th>Co nabízí</th><th>V kalendáři</th><th>Stav</th></tr></thead>
                <tbody>
                  <tr><td><a href="https://ceskybeh.cz/terminovka/" target="_blank" rel="noopener">Český běh – termínovka ČAS</a></td><td>Oficiální termínovka ČAS: čas startu, místo, startovné, archiv výsledků.</td><td>{cntP('cb')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.stopnito.cz/zavody" target="_blank" rel="noopener">stopnito.cz</a></td><td>Registrace, seznam přihlášených, výsledky, GPS tracking.</td><td>{cntP('sn')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://www.runczech.com" target="_blank" rel="noopener">RunCzech</a></td><td>Vlastní registrace a výsledky seriálu.</td><td>{cntP('rc')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://behejlesy.cz" target="_blank" rel="noopener">Běhej lesy</a></td><td>Vlastní registrace a výsledky seriálu.</td><td>{cntP('bl')} závodů</td><td><span className="st st-on">Napojeno</span></td></tr>
                  <tr><td><a href="https://zavody.4timing.cz/" target="_blank" rel="noopener">4timing.cz</a></td><td>Časomíra: připravované závody, přihlášky, výsledky.</td><td>—</td><td><span className="st st-next">Další krok</span></td></tr>
                  <tr><td><a href="https://www.nazavody.cz" target="_blank" rel="noopener">naZávody.cz</a></td><td>Registrační systém s veřejným API.</td><td>—</td><td><span className="st st-next">Další krok – API</span></td></tr>
                  <tr><td><a href="https://running.life/terminovka/cesko" target="_blank" rel="noopener">running.life</a></td><td>Celostátní termínovka – doplňuje závody ze všech krajů. Údaje ověřuj u pořadatele.</td><td>{cntP('rl')} závodů</td><td><span className="st st-low">Doplňkový</span></td></tr>
                  <tr><td><a href="https://gotrail.run/trailove-behy/cesko/liberecky-kraj" target="_blank" rel="noopener">gotrail.run</a></td><td>Agregátor trailů – jen pro objevování.</td><td>{cntP('gt')} závodů</td><td><span className="st st-low">Doplňkový</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#5A5F66', lineHeight: 1.6 }}>Stav dat k 17. 11. 2026. Souřadnice jsou zatím střed obce (odhad). Vzdálenost a čas cesty jsou orientační, počítané z Turnova. Odkazy na stopnito.cz vedou na přehled závodů.</p>
        </main>
      </div>

      {mob && (
        <nav className="mnav" aria-label="Zobrazení">
          <button className={s.view === 'seznam' ? 'on' : ''} onClick={() => goView('seznam')}><Icon size={20} d={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />} />Závody</button>
          <button className={isRes ? 'on' : ''} onClick={() => goView('vysledky')}><Icon size={20} d={<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>} />Výsledky</button>
          <button className={s.view === 'mapa' ? 'on' : ''} onClick={() => goView('mapa')}><Icon size={20} d={<><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>} />Mapa</button>
          <button className={isMuj ? 'on' : ''} onClick={() => goView('muj')}><Icon size={20} d={<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />} />Můj kalendář{user && saved.length ? ' (' + saved.length + ')' : ''}</button>
        </nav>
      )}

      {mob && sheet && (
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="shTitle">
          <div className="shead">
            <h2 id="shTitle">Filtry</h2>
            <button className="xbtn" onClick={() => setSheet(false)} aria-label="Zavřít filtry"><Icon size={16} w={2.4} d={<path d="M6 6l12 12M18 6L6 18" />} /></button>
          </div>
          <div className="sbody">{filterPanel}</div>
          <div className="sfoot">
            <button className="ghost" onClick={reset} disabled={!active.length}>Zrušit vše</button>
            <button className="btn" onClick={() => { setSheet(false); window.scrollTo(0, 0) }}>Zobrazit {countLabel}</button>
          </div>
        </div>
      )}

      {addOpen && <AddRace onClose={() => setAddOpen(false)} onAdded={(r) => addRaces([r])} placeNames={PLACE_NAMES} cities={CITIES} user={user} />}

      {auth.open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeAuth() }} style={{ position: 'fixed', inset: 0, background: 'rgba(21,23,26,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="authTitle" style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 420, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h2 id="authTitle" style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24 }}>{isReg ? 'Vytvořit účet' : 'Přihlásit se'}</h2>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#4A4F56', lineHeight: 1.5 }}>{auth.pending ? 'Pro uložení závodu do tvého kalendáře se přihlas nebo si založ účet.' : isReg ? 'Ukládej si závody do vlastního kalendáře.' : 'Vítej zpátky. Tvůj kalendář závodů na tebe čeká.'}</p>
              </div>
              <button className="xbtn" onClick={closeAuth} aria-label="Zavřít"><Icon size={16} w={2.4} d={<path d="M6 6l12 12M18 6L6 18" />} /></button>
            </div>
            {GOOGLE && <button className="gbtn" onClick={doGoogle}><Icon size={18} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />Pokračovat přes Google</button>}
            {GOOGLE && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#5A5F66', fontSize: 13 }}><span style={{ flex: 1, height: 1, background: '#E2E0D8' }} />nebo e-mailem<span style={{ flex: 1, height: 1, background: '#E2E0D8' }} /></div>}
            {isReg && <div className="fld"><label htmlFor="fname">Jméno</label><input id="fname" type="text" value={auth.name} onChange={(e) => setAuth((a) => ({ ...a, name: e.target.value }))} placeholder="Jak ti máme říkat" autoComplete="name" /></div>}
            <div className="fld"><label htmlFor="femail">E-mail</label><input id="femail" type="email" value={auth.email} onChange={(e) => setAuth((a) => ({ ...a, email: e.target.value }))} placeholder="jmeno@email.cz" autoComplete="email" /></div>
            <div className="fld"><label htmlFor="fpass">Heslo</label><input id="fpass" type="password" value={auth.pass} onChange={(e) => setAuth((a) => ({ ...a, pass: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') doEmail() }} placeholder="alespoň 8 znaků" autoComplete={isReg ? 'new-password' : 'current-password'} style={{ font: '500 15px Inter, sans-serif', border: '1px solid #D9D6CC', borderRadius: 10, minHeight: 44, padding: '0 12px' }} /></div>
            {auth.error && <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B42318' }}>{auth.error}</p>}
            {auth.info && <p role="status" style={{ margin: 0, fontSize: 14, color: '#24502F' }}>{auth.info}</p>}
            <button className="btn" disabled={auth.busy} onClick={doEmail} style={{ width: '100%', minHeight: 46, fontSize: 15 }}>{auth.busy ? 'Moment…' : isReg ? 'Vytvořit účet' : 'Přihlásit se'}</button>
            {!isReg && <button className="linkbtn" onClick={doReset} style={{ alignSelf: 'center', fontWeight: 500, fontSize: 13 }}>Zapomenuté heslo? Pošleme odkaz na e-mail</button>}
            <p style={{ margin: 0, fontSize: 14, textAlign: 'center', color: '#4A4F56' }}>{isReg ? 'Už máš účet?' : 'Ještě nemáš účet?'} <button className="linkbtn" onClick={() => setAuth((a) => ({ ...a, mode: isReg ? 'login' : 'register', error: '', info: '' }))}>{isReg ? 'Přihlas se' : 'Zaregistruj se'}</button></p>
            {DEMO && <p style={{ margin: 0, fontSize: 12, color: '#5A5F66', lineHeight: 1.5, borderTop: '1px solid #EEECE5', paddingTop: 12 }}>Testovací verze: přihlášení zatím běží jen v tomto prohlížeči, nic se neodesílá.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function RaceCard({ r, km, loc, saved, onSave, mob }) {
  const [open, setOpen] = useState(false)
  const d = new Date(r.from + 'T12:00:00')
  const d2 = r.to ? new Date(r.to + 'T12:00:00') : null
  const ll = r.lat + ',' + r.lon
  const placeFull = r.place + (r.venue ? ' – ' + r.venue : '')
  const terr = terrainOf(r)
  let trackNote = r.note || ''
  if (r.tracksYear < 2027) trackNote = (trackNote ? trackNote + ' · ' : '') + 'tratě podle ročníku ' + r.tracksYear
  const lk = r.links || {}
  const mins = Math.round(km / 65 * 60 + 10)
  const travel = km <= 5 ? 'Start kousek od vás' : '≈ ' + (mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min' : mins + ' min') + ' autem z: ' + loc
  const ymd = r.from.replace(/-/g, '')
  const e = new Date((r.to || r.from) + 'T12:00:00'); e.setDate(e.getDate() + 1)
  const p2 = (x) => (x < 10 ? '0' : '') + x
  let gdates = ymd + '/' + e.getFullYear() + p2(e.getMonth() + 1) + p2(e.getDate())
  if (r.start && !r.to) { const [h, m] = r.start.split(':'); const h0 = parseInt(h, 10); gdates = ymd + 'T' + p2(h0) + m + '00/' + ymd + 'T' + p2(Math.min(h0 + 3, 23)) + m + '00' }
  const where = placeFull + ', ' + regionLabel(r.region)
  const past = isPast(r)
  const rl = resultLink(r)
  const gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(r.name) + '&dates=' + gdates + '&ctz=Europe/Prague&location=' + encodeURIComponent(where) + '&details=' + encodeURIComponent((r.web || '') + (lk.reg ? ' · přihláška: ' + lk.reg[1] : ''))

  if (mob) {
    const main = past ? (rl ? [rl.label, rl.url] : [r.webOwn ? 'Web závodu' : 'Detail závodu', r.web]) : lk.reg ? ['Přihláška', lk.reg[1]] : [r.webOwn ? 'Web závodu' : 'Detail závodu', r.web]
    const shortDow = d2 ? DOW[d.getDay()].slice(0, 2) + '–' + DOW[d2.getDay()].slice(0, 2) : DOW[d.getDay()].slice(0, 2)
    return (
      <article className="mcard">
        <div className="mrow" onClick={() => setOpen(!open)}>
          <div className="mdate">
            <b>{d2 ? d.getDate() + '.–' + d2.getDate() + '.' : d.getDate() + '.'}</b>
            <span>{MON[d.getMonth()]}</span>
            <small>{shortDow}</small>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3>{r.name}</h3>
            <p className="mplace">{r.place.split(' – ')[0]} · {km <= 5 ? 'kousek od tebe' : '≈ ' + km + ' km'}{r.start ? ' · ' + r.start : ''}</p>
            <div className="mtrk">
              <span className={'surf s-' + r.surface}>{SURFLAB[r.surface] || r.surface}</span>
              {r.tracks.slice(0, 4).map((t, i) => <span key={i} className="trk"><b>{fmtKm(t[0])} km</b></span>)}
              {r.tracks.length > 4 && <span className="trk">+{r.tracks.length - 4}</span>}
            </div>
          </div>
          <button className={saved ? 'mheart on' : 'mheart'} aria-pressed={saved} aria-label={saved ? 'Odebrat z mého kalendáře' : 'Uložit do mého kalendáře'} onClick={(e) => { e.stopPropagation(); onSave() }}>{saved ? '♥' : '♡'}</button>
        </div>
        <div className="mact">
          <a className={lk.reg || (past && rl) ? 'btn' : 'ghost'} href={main[1]} target="_blank" rel="noopener">{main[0]}</a>
          {past ? <a className="ghost" href={r.web} target="_blank" rel="noopener">{r.webOwn ? 'Web' : 'Detail'}</a> : <a className="ghost" href={'https://mapy.cz/fnc/v1/route?mapset=traffic&end=' + r.lon + ',' + r.lat} target="_blank" rel="noopener">Navigovat</a>}
          <button className="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Méně' : 'Více'}</button>
        </div>
        {open && (
          <div className="mmore">
            {past && rl && <p style={{ margin: 0, fontSize: 13, color: '#4A4F56' }}>Výsledky najdeš na {rl.host}{r.resReady === false ? ' – pořadatel je možná ještě nenahrál, zkus to později' : ''}.</p>}
            <p style={{ margin: 0 }}><span className={past ? 'tag' : r.status === 'oficialni' || r.plat.length > 1 ? 'tag ok' : 'tag est'}>{past ? 'Doběhnuto' : r.user ? 'Přidáno běžcem' : r.status === 'oficialni' ? '✓ Oficiální termín' : r.plat.length > 1 ? '✓ Ve ' + r.plat.length + ' termínovkách' : 'Z agregátoru – ověř u pořadatele'}</span>{r.series ? <span className="tag" style={{ marginLeft: 6 }}>{r.series}</span> : null}</p>
            <p style={{ margin: 0 }}>{placeFull}, {regionLabel(r.region)} · {travel}</p>
            <p style={{ margin: 0 }}>{r.start ? 'Start ' + r.start : 'Čas startu zatím nezveřejněn'}{r.kids ? ' · dětské závody' : ''}{r.fee ? ' · startovné ' + r.fee : ''}</p>
            {(r.tracks.some((t) => t[1] !== null) || r.flags.length > 0) && <div className="mtrk">{r.tracks.filter((t) => t[1] !== null).map((t, i) => <span key={i} className="trk">{fmtKm(t[0])} km · ↑ {t[1]} m</span>)}{r.flags.map((f) => <span key={f} className="trk">{f}</span>)}</div>}
            {trackNote && <p style={{ margin: 0, fontSize: 12.5, color: '#5A5F66' }}>{trackNote}</p>}
            <div className="mlinks">
              {lk.reg && <a href={r.web} target="_blank" rel="noopener">{r.webOwn ? 'Web závodu' : 'Detail závodu'}</a>}
              {lk.prop && <a href={lk.prop[1]} target="_blank" rel="noopener">Propozice</a>}
              {lk.start && <a href={lk.start[1]} target="_blank" rel="noopener">Startovka</a>}
              {lk.res && !past && <a href={lk.res[1]} target="_blank" rel="noopener">Minulé ročníky</a>}
            </div>
            <div className="mlinks"><span>Navigace:</span>
              <a href={'https://mapy.cz/fnc/v1/route?mapset=traffic&end=' + r.lon + ',' + r.lat} target="_blank" rel="noopener">Mapy.cz</a>
              <a href={'https://www.google.com/maps/dir/?api=1&destination=' + ll} target="_blank" rel="noopener">Google</a>
              <a href={'https://waze.com/ul?ll=' + ll + '&navigate=yes'} target="_blank" rel="noopener">Waze</a>
            </div>
            <div className="mlinks"><span>Do kalendáře:</span>
              <a href={gcal} target="_blank" rel="noopener">Google</a>
              <button onClick={() => downloadIcs([r], r.id + '.ics', r.name)}>Apple / Outlook</button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#5A5F66' }}>Zdroj: {r.src.map((x, i) => <span key={x[1]}>{i ? ', ' : ''}<a href={x[1]} target="_blank" rel="noopener" style={{ color: '#5A5F66' }}>{x[0]}</a></span>)}</p>
          </div>
        )}
      </article>
    )
  }

  return (
    <article className="card">
      <div className="dateb">
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: d2 ? 18 : 28, lineHeight: d2 ? 1.1 : 1 }}>{d2 ? d.getDate() + '.–' + d2.getDate() + '.' : d.getDate() + '.'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>{MON[d.getMonth()]}</span>
        <span style={{ fontSize: 12, color: '#5A5F66' }}>{d2 ? DOW[d.getDay()].slice(0, 2) + '–' + DOW[d2.getDay()].slice(0, 2) : DOW[d.getDay()]}</span>
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span className={'surf s-' + r.surface}>{SURFLAB[r.surface] || r.surface}</span>
          {terr && <span className="tag">{TERRLAB[terr]}</span>}
          {r.series && <span className="tag">Seriál {r.series}</span>}
          {past ? <span className="tag done">✓ Doběhnuto</span> : <span className={r.status === 'oficialni' || r.plat.length > 1 ? 'tag ok' : 'tag est'}>{r.user ? 'Přidáno běžcem – k ověření' : r.status === 'oficialni' ? '✓ Oficiální termín' : r.plat.length > 1 ? '✓ Shoduje se ve ' + r.plat.length + ' termínovkách' : 'Termín z agregátoru – k ověření'}</span>}
        </div>
        <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 600 }}>{r.name}</h3>
        <p style={{ margin: 0, fontSize: 14, color: '#4A4F56', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Icon d={<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>} />
          <a className="plink" href={'https://www.google.com/maps/search/?api=1&query=' + ll} target="_blank" rel="noopener">{placeFull}</a>, {regionLabel(r.region)} · {km <= 5 ? 'kousek od vás' : '≈ ' + km + ' km od vás'}
        </p>
        <p className="times">
          <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
          <span>{r.start ? 'Start ' + r.start : 'Čas startu zatím nezveřejněn'}</span>
          {r.kids && <span className="kids">Dětské závody</span>}
          {r.fee && <span style={{ color: '#4A4F56' }}>· Startovné {r.fee}</span>}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {r.tracks.map((t, i) => <span key={i} className="trk"><b>{fmtKm(t[0])} km</b>{t[1] !== null ? ' · ↑ ' + t[1] + ' m' : ''}</span>)}
          {r.flags.map((f) => <span key={f} className="trk">{f}</span>)}
          {trackNote && <span style={{ fontSize: 12.5, color: '#5A5F66' }}>{trackNote}</span>}
        </div>
        {past ? (
          <div className="acts">
            <div className="agrp">
              <span className="alab">Výsledky</span>
              {rl ? <a className="act hot" href={rl.url} target="_blank" rel="noopener">{rl.label}<small>{rl.host}</small></a> : <span className="none">Odkaz na výsledky zatím nemáme</span>}
              {r.resReady === false && <span className="none">pořadatel je možná ještě nenahrál</span>}
            </div>
          </div>
        ) : (<>
        <div className="acts">
          <div className="agrp">
            <span className="alab">Závod online</span>
            {lk.reg && <a className="act hot" href={lk.reg[1]} target="_blank" rel="noopener">Přihláška<small>{lk.reg[0]}</small></a>}
            {lk.start && <a className="act" href={lk.start[1]} target="_blank" rel="noopener">Startovka<small>{lk.start[0]}</small></a>}
            {lk.res && <a className="act" href={lk.res[1]} target="_blank" rel="noopener">Minulé ročníky<small>výsledky</small></a>}
            {lk.prop && <a className="act" href={lk.prop[1]} target="_blank" rel="noopener">Propozice<small>soubor</small></a>}
            {!lk.reg && !lk.start && !lk.res && <span className="none">Přihlášky a výsledky zatím nenapojené</span>}
          </div>
        </div>
        <div className="acts">
          <div className="agrp">
            <span className="alab">Navigovat</span>
            <a className="act" href={'https://mapy.cz/fnc/v1/route?mapset=traffic&end=' + r.lon + ',' + r.lat} target="_blank" rel="noopener">Mapy.cz</a>
            <a className="act" href={'https://www.google.com/maps/dir/?api=1&destination=' + ll} target="_blank" rel="noopener">Google</a>
            <a className="act" href={'https://waze.com/ul?ll=' + ll + '&navigate=yes'} target="_blank" rel="noopener">Waze</a>
          </div>
          <div className="agrp">
            <span className="alab">Do kalendáře</span>
            <a className="act" href={gcal} target="_blank" rel="noopener">Google</a>
            <button className="act" onClick={() => downloadIcs([r], r.id + '.ics', r.name)}>Apple / Outlook</button>
          </div>
          <span style={{ fontSize: 13, color: '#5A5F66' }}>{travel}</span>
        </div>
        </>)}
      </div>
      <div className="cside" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 170 }}>
        {past && rl ? <a className="btn" href={rl.url} target="_blank" rel="noopener">Výsledky</a> : <a className="btn" href={r.web} target="_blank" rel="noopener">{r.webOwn ? 'Web závodu' : 'Detail závodu'}</a>}
        {past && rl && <a className="srcl" href={r.web} target="_blank" rel="noopener">{r.webOwn ? 'Web závodu' : 'Detail závodu'}</a>}
        {!r.webOwn && <span className="srcl" style={{ textAlign: 'right' }}>web pořadatele zatím nemáme</span>}
        <button className={saved ? 'ghost saved' : 'ghost'} aria-pressed={saved} onClick={onSave} style={{ minHeight: 36, fontSize: 13 }}>{saved ? '♥ V mém kalendáři' : '♡ Uložit závod'}</button>
        <span className="srcl">Zdroj termínu:</span>
        {r.src.map((x) => <a key={x[1]} className="srcl" href={x[1]} target="_blank" rel="noopener">{x[0]}</a>)}
      </div>
    </article>
  )
}
