// @ts-nocheck
import { regionLabel } from '../data/races'

const pad = (n) => (n < 10 ? '0' : '') + n
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const ymd = (iso) => iso.replace(/-/g, '')
function nextDay(iso) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) }

function vevent(r) {
  const where = r.place + (r.venue ? ' – ' + r.venue : '') + ', ' + regionLabel(r.region)
  const lines = ['BEGIN:VEVENT', 'UID:' + r.id + '@startovka', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z']
  if (r.start && !r.to) {
    const [h, m] = r.start.split(':').map((x) => parseInt(x, 10))
    lines.push('DTSTART;TZID=Europe/Prague:' + ymd(r.from) + 'T' + pad(h) + pad(m) + '00')
    lines.push('DTEND;TZID=Europe/Prague:' + ymd(r.from) + 'T' + pad(Math.min(h + 3, 23)) + pad(m) + '00')
  } else {
    lines.push('DTSTART;VALUE=DATE:' + ymd(r.from))
    lines.push('DTEND;VALUE=DATE:' + nextDay(r.to || r.from))
  }
  const tracks = r.tracks.map((t) => String(t[0]).replace('.', ',') + ' km').join(', ')
  const desc = [tracks && 'Tratě: ' + tracks, r.links?.reg && 'Přihláška: ' + r.links.reg[1], r.web && 'Web: ' + r.web].filter(Boolean).join('\n')
  lines.push('SUMMARY:' + esc(r.name), 'LOCATION:' + esc(where), 'GEO:' + r.lat + ';' + r.lon, 'DESCRIPTION:' + esc(desc))
  if (r.web) lines.push('URL:' + r.web)
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function buildIcs(races, calName = 'Startovka') {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Startovka//CZ', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + esc(calName), ...races.map(vevent), 'END:VCALENDAR'].join('\r\n')
}

export function downloadIcs(races, fileName, calName) {
  const blob = new Blob([buildIcs(races, calName)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
