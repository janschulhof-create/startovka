// @ts-nocheck
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const KEY = import.meta.env.VITE_MAPY_API_KEY as string | undefined
const MON = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Skutečná mapa: Mapy.cz (s API klíčem) nebo OpenStreetMap jako záloha. */
export default function MapView({ races, home, height, onOpen }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([49.8, 15.5], 7)
    if (KEY) {
      L.tileLayer('https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=' + KEY, {
        minZoom: 0, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank" rel="noopener">&copy; Seznam.cz a.s. a další</a>',
      }).addTo(m)
      const Logo = L.Control.extend({ options: { position: 'bottomleft' }, onAdd: () => { const a = L.DomUtil.create('a'); a.href = 'https://mapy.cz/'; a.target = '_blank'; a.innerHTML = '<img src="https://api.mapy.cz/img/api/logo.svg" alt="Mapy.cz" style="width:100px">'; return a } })
      new Logo().addTo(m)
    } else {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(m)
    }
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const m = map.current; if (!m) return
    const g = layer.current; g.clearLayers()
    const pts = []
    // seskupení závodů na stejném místě do jedné značky
    const byPlace = new Map()
    races.forEach((r) => { const k = r.lat.toFixed(3) + ',' + r.lon.toFixed(3); if (!byPlace.has(k)) byPlace.set(k, []); byPlace.get(k).push(r) })
    byPlace.forEach((list) => {
      const r0 = list[0]
      const mk = L.circleMarker([r0.lat, r0.lon], { radius: list.length > 1 ? 9 : 7, color: '#FFFFFF', weight: 2, fillColor: '#C2410C', fillOpacity: 0.95 })
      const html = '<div class="mpop">' + list.slice(0, 6).map((r) => { const d = new Date(r.from + 'T12:00:00'); return '<div class="mpi"><b>' + d.getDate() + '. ' + MON[d.getMonth()] + '</b> <a href="#" data-id="' + esc(r.id) + '">' + esc(r.name) + '</a><br><span>' + esc(r.place) + (r.tracks.length ? ' · ' + r.tracks.map((t) => String(t[0]).replace('.', ',')).join(' / ') + ' km' : '') + '</span></div>' }).join('') + (list.length > 6 ? '<div class="mpi"><span>+ ' + (list.length - 6) + ' dalších</span></div>' : '') + '</div>'
      mk.bindPopup(html, { maxWidth: 260 })
      mk.on('popupopen', (e) => { e.popup.getElement().querySelectorAll('a[data-id]').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); onOpen && onOpen(a.getAttribute('data-id')) })) })
      mk.addTo(g); pts.push([r0.lat, r0.lon])
    })
    L.circleMarker([home.lat, home.lon], { radius: 8, color: '#FFFFFF', weight: 3, fillColor: '#15171A', fillOpacity: 1 }).bindTooltip('Start: ' + home.name).addTo(g)
    pts.push([home.lat, home.lon])
    if (pts.length > 1) m.fitBounds(pts, { padding: [30, 30], maxZoom: 12 })
    else m.setView([home.lat, home.lon], 9)
  }, [races, home])

  return <div ref={el} style={{ height, borderRadius: 14, border: '1px solid #E2E0D8', overflow: 'hidden', zIndex: 0 }} />
}
